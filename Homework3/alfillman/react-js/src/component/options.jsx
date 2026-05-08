import Data from "../../data/demo.json";

export default function RenderOptions() {
    const tickers = ["NVDA", "AAPL", "XOM", "CVS", "HAL", "CAT", "DAL", "MCD",
                     "NKE", "KO", "JNJ", "PFE", "UNH", "GS", "BAC", "MSFT",
                     "GOOGL", "META"];
    return tickers.map((ticker, index) => (
      <option key={index} value={ticker}>
        {ticker}
      </option>
    ));
  }
