import { useState, useEffect } from "react";
import * as d3 from "d3";

export default function RenderOptions() {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    d3.csv("/data/tsne.csv").then(data => {
      setTickers(data.map(d => d.ticker));
    });
  }, []);

  return tickers.map((ticker, index) => (
    <option key={index} value={ticker}>
      {ticker}
    </option>
  ));
}