import subprocess
from uuid import uuid4

import openai
import requests
import os
import urllib.request
import ssl
import models
import re

from config import settings

os.environ["IMAGEIO_FFMPEG_EXE"] = "/opt/homebrew/bin/ffmpeg"
ssl._create_default_https_context = ssl._create_unverified_context

from moviepy.audio.AudioClip import CompositeAudioClip
from moviepy.audio.io.AudioFileClip import AudioFileClip
from moviepy.video.VideoClip import ImageClip, TextClip
from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip
from moviepy.video.tools.subtitles import SubtitlesClip
from moviepy.config import change_settings


change_settings(
    {"IMAGEMAGICK_BINARY": "/opt/homebrew/Cellar/imagemagick/7.1.1-15/bin/convert"}
)


openai.api_key = settings.OPENAI_API_KEY


def create_chat_completion(system, message):
    chat_completion = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": message},
        ],
    )
    return chat_completion.choices[0].message.content


def create_image(keywords, uuid, idx, n=1, size="256x256"):
    image_resp = openai.Image.create(
        prompt=f"{keywords}, high quality, simple background", n=n, size=size
    )

    img_data = requests.get(image_resp.data[0].url).content
    file_name = f"static/{uuid}/img{idx}.png"
    with open(file_name, "wb") as handler:
        handler.write(img_data)

    return file_name


def create_image_keyword(message):
    keywords = create_chat_completion(
        "Please recommend three short keywords in English to draw background image that expresses message in dall-e. "
        "separated by ',' and please no numbering, only keywords and please don't contain any other words",
        message,
    )

    return keywords


def create_speech_from_text(message, file_name, voice_code):
    client_id = settings.TTS_CLIENT_ID
    client_secret = settings.TTS_CLIENT_SECRET

    encrypted_text = urllib.parse.quote(message)
    data = f"speaker={voice_code}&volume=0&speed=0&pitch=0&format=mp3&text={encrypted_text}"
    url = "https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts"

    request = urllib.request.Request(url)
    request.add_header("X-NCP-APIGW-API-KEY-ID", client_id)
    request.add_header("X-NCP-APIGW-API-KEY", client_secret)

    response = urllib.request.urlopen(request, data=data.encode("utf-8"))
    res_code = response.getcode()

    if res_code != 200:
        raise Exception("TTS Error Code:" + res_code)

    response_body = response.read()
    with open(file_name, "wb") as out:
        out.write(response_body)

    return file_name


def add_static_image_to_audio(messages, image_path, audio_paths, output_path):
    audio_clips = [AudioFileClip(audio_path) for audio_path in audio_paths]
    summed_durations = [0] + [audio_clip.duration for audio_clip in audio_clips]

    for i in range(1, len(summed_durations)):
        summed_durations[i] += summed_durations[i - 1]

    image_clip = ImageClip(image_path)
    audio_clip = CompositeAudioClip(
        [
            audio_clip.set_start(start)
            for audio_clip, start in zip(audio_clips, summed_durations)
        ]
    )
    video_clip = image_clip.set_audio(audio_clip)

    generator = lambda txt: TextClip(
        txt,
        font="NanumGothic",
        fontsize=15,
        color="white",
        bg_color="black",
        stroke_width=3,
        method="caption",
        kerning=-2,
        interline=-1,
        align="south",
        size=(video_clip.size[0], 70),
    )

    subs = [
        ((summed_durations[i], summed_durations[i + 1]), messages[i])
        for i in range(len(audio_clips))
    ]
    subtitles = SubtitlesClip(subs, generator)

    video_clip = CompositeVideoClip(
        [video_clip, subtitles.set_pos(("center", "bottom"))]
    )

    video_clip.duration = audio_clip.duration

    video_clip.write_videofile(output_path, fps=30, codec="libx264", audio_codec="aac")


def split_string(s):
    sentences = re.split("([.!?])", s)
    sentences = ["".join(i) for i in zip(sentences[::2], sentences[1::2])]
    sentences = [sentence.rstrip() for sentence in sentences]

    return sentences


def concat_videos(input_video_path_list, output_video_path: str):
    concat_string = "|".join(input_video_path_list)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            f"concat:{concat_string}",
            "-r",
            "30",
            "-fps_mode",
            "cfr",
            "-c",
            "copy",
            output_video_path,
        ]
    )

    return output_video_path


def composite_videos(uuid, n: int):
    file_names = [f"static/{uuid}/output{idx}.ts" for idx in range(n)]
    concat_videos(file_names, f"static/{uuid}/result.mp4")


def make_video(keywords, tts_id, db):
    voice_code = (
        db.query(models.TTSInfo).filter(models.TTSInfo.id == tts_id).first().voice_code
    )
    print("making start")

    m = create_chat_completion(
        system="한국어 대본을 작성해줘. 각 단계의 이름은 쓰지마. Make a 200-character script in YouTube Shorts video style for "
        "Korean scripts. Write in the introduction, development, turn, and conclusion structure, "
        "and separate each step by '\n'. Separate each sentence with '.'.",
        message=keywords,
    )
    print(m)

    uuid = uuid4()
    db_video = models.Video(id=str(uuid), keyword=keywords, script=m)
    db.add(db_video)
    db.commit()
    db.refresh(db_video)
    os.makedirs(f"static/{uuid}")

    paragraphs = [p for p in m.split("\n") if p != ""]

    for idx, paragraph in enumerate(paragraphs):
        messages = split_string(paragraph)
        image_keywords = create_image_keyword(paragraph)
        print(image_keywords)
        add_static_image_to_audio(
            messages,
            create_image(image_keywords, uuid, idx),
            [
                create_speech_from_text(
                    m, f"static/{uuid}/{idx}-output{i}.mp3", voice_code
                )
                for i, m in enumerate(messages)
            ],
            f"static/{uuid}/output{idx}.ts",
        )
        db_sub_video = models.SubVideo(
            script=paragraph, keyword=image_keywords, full_video_id=str(uuid), index=idx
        )
        db.add(db_sub_video)
        db.commit()
        db.refresh(db_sub_video)

    composite_videos(uuid, len(paragraphs))

    return uuid


def get_tts_infos(db):
    return db.query(models.TTSInfo).all()
