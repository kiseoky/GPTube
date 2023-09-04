import React from "react";
import { useParams } from "react-router";
import { useNavigate } from "react-router-dom";

const ResultPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const video_hosting_url = "http://127.0.0.1:8000/static";

  return (
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
      <video
        src={`${video_hosting_url}/${id}/result.mp4`}
        controls
        style={{ maxWidth: "80%", maxHeight: "80%" }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <button
          onClick={() => {
            navigate(`/editor/${id}/0`);
          }}
        >
          비디오 수정
        </button>
        <button>다운로드</button>
      </div>
    </div>
  );
};

export default ResultPage;
