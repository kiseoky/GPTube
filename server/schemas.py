
from pydantic import BaseModel


class SubVideo(BaseModel):
    pass


class SubVideoCreate(SubVideo):
    pass


class SubVideo(SubVideo):
    id: int
    index: int
    keyword: str
    script: str
    full_video_id: str
    tts_id: int

    class Config:
        orm_mode = True


class TTSInfo(BaseModel):
    id: int
    voice_code: str
    api: str
    text: str


class VideoBase(BaseModel):
    pass


class VideoCreate(VideoBase):
    pass


class Video(VideoBase):
    id: str
    keyword: str
    script = str
    sub_videos: list[SubVideo] = []

    class Config:
        orm_mode = True
