const stockFiles = import.meta.glob("../../data/stockdata/*.csv");

export default function RenderOptions() {
    const tickers = Object.keys(stockFiles)
      .map((path) => path.split("/").pop().replace(".csv", ""))
      .sort();

    return tickers.map((ticker) => (
      <option key={ticker} value={ticker}>
        {ticker}
      </option>
    ));
  }
