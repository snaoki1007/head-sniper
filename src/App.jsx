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
    const csvPath = `${import.meta.env.BASE_URL}toda_light_with_payout.csv`;

    fetch(csvPath)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`CSV取得失敗: ${res.status}`);
        }
        return res.text();
      })
      .then((csv) => {
        const result = Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
        });

        console.log("CSV Rows:", result.data.length);
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