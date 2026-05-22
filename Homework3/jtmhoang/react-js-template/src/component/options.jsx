import Data from "../../data/stocks.json";

export default function RenderOptions() {
    const bars = Data.stocks;
    return bars.map((bar, index) => (
      <option key={index} value={bar.ticker}>
        {bar.ticker}
      </option>
    ));
  }
