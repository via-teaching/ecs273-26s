export const STOCKS = [
  "AAPL",
  "BAC",
  "CAT",
  "CVX",
  "DAL",
  "GOOGL",
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
  return STOCKS.map((stock) => (
    <option key={stock} value={stock}>
      {stock}
    </option>
  ));
}
