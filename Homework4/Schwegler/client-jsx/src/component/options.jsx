import { useEffect, useState } from "react";

export default function RenderOptions({ selectedStock, setSelectedStock }) {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((data) => {
        setStocks(data.tickers);

        if (!selectedStock && data.tickers.length > 0) {
          setSelectedStock(data.tickers[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching stock list:", err);
      });
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ color: "white" }}>Select a stock:</span>

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
    </div>
  );
}