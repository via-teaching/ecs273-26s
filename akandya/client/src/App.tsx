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
    return <div style={{ padding: "12px" }}>Loading stock dashboard...</div>;
  }

  return (
    <div className="app-shell">
      <div className="app-header card">
        <h1 className="app-title">Stock Visual Analytics Dashboard</h1>
        <select
          className="select-input"
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          {stocks.map((stock) => (
            <option key={stock} value={stock}>
              {stock}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          flex: 1,
          minHeight: 0,
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
          <div className="card" style={{ flex: 1, minHeight: 0 }}>
            <h2 className="panel-heading">View 1: Stock Line Chart</h2>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="card" style={{ flex: 1, minHeight: 0 }}>
            <h2 className="panel-heading">View 2: t-SNE Scatter Plot</h2>
            <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
              <TSNEScatter
                selectedStock={selectedStock}
                setSelectedStock={setSelectedStock}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ minHeight: 0 }}>
          <h2 className="panel-heading">View 3: News</h2>
          <NewsList selectedStock={selectedStock} />
        </div>
      </div>
    </div>
  );
}
