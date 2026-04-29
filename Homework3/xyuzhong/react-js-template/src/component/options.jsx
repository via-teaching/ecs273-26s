const STOCKS = [
  "AAPL", "BAC", "CAT", "CVX", "DAL",
  "GOOGL", "GS", "HAL", "JNJ", "JPM",
  "KO", "MCD", "META", "MMM", "MSFT",
  "NKE", "NVDA", "PFE", "UNH", "XOM"
];



export default function RenderOptions() {
    return STOCKS.map((ticker) => (
      <option key={ticker} value={ticker}>
        {ticker}
      </option>
    ));
  }
