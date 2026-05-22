const stocks = [
  "AAPL", "BAC", "CAT", "CVX", "DAL", "GOOGL", "GS", "HAL", "JNJ", "JPM", "KO", "MCD", "META", "MMM", "MSFT", "NKE", "NVDA", "PFE", "UNH", "XOM"
];

export default function RenderOptions({ selectedStock, setSelectedStock }) {
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