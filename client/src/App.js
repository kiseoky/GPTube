import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainPage from "./MainPage";
import ResultPage from "./ResultPage";
import EditorPage from "./EditorPage";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/editor/:id/:index" element={<EditorPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
