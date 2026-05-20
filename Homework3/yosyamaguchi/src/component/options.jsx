const stocks = [
  "AAPL",
  "BAC",
  "CAT",
  "CVX",
  "DAL",
  "GOOG",
  "GS",
  "HAL",
  "JNJ",
  "JPM",
  "KO",
  "MCD",
  "META",
  "MMM",
  "MSFT",
  "NKE",
  "NVDA",
  "PFE",
  "UNH",
  "XOM",
];

export default function RenderOptions() {
  return stocks.map((stock) => (
    <option key={stock} value={stock}>
      {stock}
    </option>
  ));
}
