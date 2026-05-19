const STOCK_OPTIONS = [
        "NVDA",
        "AAPL",
        "MSFT",
        "GOOGL",
        "AMZN",
        "META",
        "TSLA",
        "JPM",
        "JNJ",
        "WMT",
        "PG",
        "XOM",
        "CVX",
        "KO",
        "PEP",
        "HD",
        "BAC",
        "PFE",
        "NFLX",
        "DIS",
];

export default function RenderOptions() {
  return STOCK_OPTIONS.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}

export { STOCK_OPTIONS };