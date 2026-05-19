const csvModules = import.meta.glob("../../data/stockdata/*.csv", { eager: false });

const TICKERS = Object.keys(csvModules)
  .map((path) => path.replace("../../data/stockdata/", "").replace(".csv", ""))
  .sort();

export default function RenderOptions() {
  return (
    <>
      {TICKERS.map((ticker) => (
        <option key={ticker} value={ticker}>
          {ticker}
        </option>
      ))}
    </>
  );
}