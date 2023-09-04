import React, { useState, useEffect } from "react";

function NextVideoButton({ nextVideoUrl, onClick }) {
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    // URL이 유효한지 확인하는 함수
    const checkUrl = async (url) => {
      try {
        const response = await fetch(url, {
          method: "HEAD", // body는 필요하지 않으므로 HEAD 요청을 보냅니다.
        });
        return response.ok; // 응답 상태가 200-299인 경우 true를 반환합니다.
      } catch (error) {
        return false;
      }
    };

    checkUrl(nextVideoUrl).then((isValid) => setIsDisabled(!isValid));
  }, [nextVideoUrl]); // nextVideoUrl이 변경될 때마다 검사를 수행합니다.

  return (
    <button disabled={isDisabled} onClick={onClick}>
      {">"}
    </button>
  );
}

export default NextVideoButton;
