const csvFiles = import.meta.glob("../../data/stockdata/*.csv");
const stocks = Object.keys(csvFiles).map(path => path.split("/").pop().replace(".csv", ""));

export default function RenderOptions() {
    return stocks.map((ticker, index) => (
      <option key={index} value={ticker}>
        {ticker}
      </option>
    ));
  }
