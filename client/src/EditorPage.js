import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";
import NextVideoButton from "./NextVideoButton";
import Mpegts from "mpegts.js";

const EditorPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const index = Number(params.index);
  const video_hosting_url = "http://127.0.0.1:8000/static";
  const [imageKeyword, setImageKeyword] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [selectedTts, setSelectedTts] = useState("");
  const [ttsList, setTtsList] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/subvideo-info?uuid=${id}&index=${index}`)
      .then((res) => res.json())
      .then(({ keyword, selected_tts }) => {
        setImageKeyword(keyword);
        setSelectedTts(selected_tts);
      });
    fetch(`http://127.0.0.1:8000/tts-info`)
      .then((res) => res.json())
      .then((data) => setTtsList(data));

    setImageUrls(["", "", ""]);
    loadVideo(id, index);
  }, [id, index]);
  const handleChange = (e) => {
    setImageKeyword(e.target.value);
  };
  const changeImage = (imageUrl) => {
    if (imageUrl === "") {
      return;
    }
    fetch(`http://127.0.0.1:8000/change-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uuid: id,
        index: index,
        url: imageUrl,
      }),
    }).then(() => loadVideo(id, index));
  };

  const changeTTS = (tts_id) => {
    fetch(`http://127.0.0.1:8000/change-tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uuid: id,
        index: index,
        tts_id: tts_id,
      }),
    }).then(() => loadVideo(id, index));
  };

  const loadVideo = (id, index) => {
    if (Mpegts.getFeatureList().mseLivePlayback && videoRef.current) {
      var player = Mpegts.createPlayer({
        type: "mpegts", // could also be mpegts, m2ts, flv
        isLive: true,
        url: `${video_hosting_url}/${id}/output${index}.ts?t=${new Date()}`,
      });
      player.attachMediaElement(videoRef.current);
      player.load();
    }
  };

  const mergeAllVideo = () => {
    fetch(`http://127.0.0.1:8000/merge-videos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        uuid: id,
      }),
    }).then(() => navigate(`/result/${id}`));
  };
  const generateImages = (imageKeyword) => {
    setSelectedImageUrl("");
    fetch(`http://127.0.0.1:8000/generate-images?keyword=${imageKeyword}`)
      .then((res) => res.json())
      .then((data) => {
        setImageUrls(data);
      });
  };
  const handleSelect = (e) => {
    setSelectedTts(e.target.value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div>{Number(index) + 1}번째 문단</div>
        <video ref={videoRef} controls></video>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <button
            disabled={index <= 0}
            onClick={() => {
              navigate(`/editor/${id}/${index - 1}`);
            }}
          >
            {"<"}
          </button>

          <NextVideoButton
            nextVideoUrl={`${video_hosting_url}/${id}/output${index + 1}.ts`}
            onClick={() => {
              navigate(`/editor/${id}/${index + 1}`);
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        ></div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <button onClick={mergeAllVideo}>적용하여 완성</button>
          <button onClick={() => navigate(`/result/${id}`)}>돌아가기</button>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <input
          type="text"
          value={imageKeyword}
          onChange={handleChange}
          size="30"
        ></input>
        <select onChange={handleSelect} value={selectedTts}>
          {ttsList.map((item, i) => (
            <option value={item.id} key={i}>
              {item.text}
            </option>
          ))}
        </select>
        <button onClick={() => generateImages(imageKeyword)}>
          이미지 재생성
        </button>
        <div class="singleLineImageContainer">
          {imageUrls.map((url) => {
            return (
              <>
                <img
                  alt="ad-img"
                  width={300}
                  src="https://via.placeholder.com/256x256/808080?text=+"
                  style={{
                    display: url === "" ? "block" : "none",
                    border: "1px solid black",
                  }}
                />
                <img
                  src={url}
                  width="256px"
                  onClick={() => {
                    setSelectedImageUrl(url);
                  }}
                  style={{
                    display: url === "" ? "none" : "block",
                    border: "1px solid black",
                  }}
                  alt="GeneratedImage"
                ></img>
              </>
            );
          })}
        </div>
        <button onClick={() => changeImage(selectedImageUrl)}>
          이미지 변경
        </button>
        <button onClick={() => changeTTS(selectedTts)}>TTS 변경</button>
        <button onClick={() => navigate(0)}>되돌리기</button>
      </div>
    </div>
  );
};

export default EditorPage;
