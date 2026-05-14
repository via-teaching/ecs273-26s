// Replace the existing list in the drop-down menu with the 20 different stocks you queried in Homework 1.
const tickers = [
  "XOM", "CVX", "HAL",
  "MMM", "CAT", "DAL",
  "MCD", "NKE", "KO",
  "JNJ", "PFE", "UNH",
  "JPM", "GS", "BAC",
  "AAPL", "MSFT", "NVDA", "GOOGL", "META",
];

export default function RenderOptions() {
  // keeping this simple since the stock list is fixed for the homework
  return tickers.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}
