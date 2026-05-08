
import { useState } from "react";

import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";
import { stocks } from "./component/options";

export default function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

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

          <h2 style={{ marginTop: "40px" }}>
            View 2: t-SNE Scatter Plot
          </h2>

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