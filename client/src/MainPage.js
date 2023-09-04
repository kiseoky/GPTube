import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingPage from "./LoadingPage";

const MainPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [videoUuid, setVideoUuid] = useState(null);
  const [selectedTts, setSelectedTts] = useState("");
  const [ttsList, setTtsList] = useState([]);

  const url = "http://127.0.0.1:8000";

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/tts-info`)
      .then((res) => res.json())
      .then((data) => {
        setTtsList(data);
        setSelectedTts(data[0].id);
      });
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${url}/make`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword, tts_id: selectedTts }),
      });
      const data = await response.json();
      setVideoUuid(data);
      navigate(`/result/${data}`);
    } catch (error) {
      // handle error
    }
    setIsLoading(false);
  };

  const handleSelect = (e) => {
    setSelectedTts(e.target.value);
  };

  return isLoading ? (
    <LoadingPage />
  ) : (
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
      <img
        src="logo.jpeg"
        alt="Logo"
        style={{ maxWidth: "80%", maxHeight: "80%", marginBottom: "2rem" }}
      />
      <div style={{ display: "flex", alignItems: "center", width: "70%" }}>
        <select onChange={handleSelect} value={selectedTts}>
          {ttsList.map((item, i) => (
            <option value={item.id} key={i}>
              {item.text}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="주제 입력"
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            padding: "0.5rem",
            borderRadius: "24px",
            border: `1px solid #ccc`,
            outline: `none`,
            backgroundColor: `#fff`,
            boxShadow: `inset -1px -1px #ddd`,
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            backgroundColor: "#0078d4",
            color: "#fff",
            border: "none",
            padding: "0.5rem",
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: `inset -1px -1px #005a9e`,
          }}
        >
          🔍
        </button>
      </div>
    </div>
  );
};

export default MainPage;
