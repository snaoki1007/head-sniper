import { useEffect, useState } from "react";
import Papa from "papaparse";
import Predict from "./pages/Predict";
import Ranking from "./pages/Ranking";
import "./App.css";
import "./styles/predict.css";
import "./styles/ranking.css";

function App() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState("predict");

  useEffect(() => {
    fetch("/toda_light_with_payout.csv")
      .then((res) => res.text())
      .then((csv) => {
        const result = Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
        });

        setData(result.data);
      })
      .catch((err) => {
        console.error("CSV読み込みエラー:", err);
      });
  }, []);

  return (
    <>
      <nav className="bottom-nav">
        <button
          className={page === "predict" ? "active" : ""}
          onClick={() => setPage("predict")}
        >
          🎯 予想
        </button>

        <button
          className={page === "ranking" ? "active" : ""}
          onClick={() => setPage("ranking")}
        >
          📊 出目
        </button>
      </nav>

      {page === "predict" && <Predict data={data} />}
      {page === "ranking" && <Ranking data={data} />}
    </>
  );
}

export default App;