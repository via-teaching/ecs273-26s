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

export const DEFAULT_STOCK = "AAPL";

export default function RenderOptions() {
  return STOCKS.map((symbol) => (
    <option key={symbol} value={symbol}>
      {symbol}
    </option>
  ));
}
