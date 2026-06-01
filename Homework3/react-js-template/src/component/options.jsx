const stocks = [
  "AAPL", "MSFT", "GOOGL", "CAT", "META",
  "UNH", "NVDA", "JPM", "BAC", "NKE",
  "XOM", "CVX", "PFE", "JNJ", "MMM",
  "KO", "MCD", "HAL", "GS", "DAL"
];

export default function RenderOptions() {
  return stocks.map((stock) => (
    <option key={stock} value={stock}>
      {stock}
    </option>
  ));
}
