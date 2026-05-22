import { useEffect, useState } from "react";

import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");

  useEffect(() => {
    fetch(`${API_BASE}/stocks`)
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.stocks);
        if (data.stocks.length > 0) {
          setSelectedStock(data.stocks[0]);
        }
      })
      .catch((err) => console.error("Error fetching stocks:", err));
  }, []);

  if (!selectedStock) {
    return <div style={{ padding: "20px" }}>Loading stock dashboard...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Stock Visual Analytics Dashboard</h1>

      <select
        value={selectedStock}
        onChange={(e) => setSelectedStock(e.target.value)}
      >
        {stocks.map((stock) => (
          <option key={stock} value={stock}>
            {stock}
          </option>
        ))}
      </select>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div>
          <h2>View 1: Stock Line Chart</h2>
          <LineChart selectedStock={selectedStock} />

          <h2 style={{ marginTop: "40px" }}>View 2: t-SNE Scatter Plot</h2>
          <TSNEScatter
            selectedStock={selectedStock}
            setSelectedStock={setSelectedStock}
          />
        </div>

        <div>
          <h2>View 3: News</h2>
          <NewsList selectedStock={selectedStock} />
        </div>
      </div>
    </div>
  );
}