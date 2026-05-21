import { useState, useEffect } from "react";

export default function RenderOptions() {
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stock_list")
      .then((res) => res.json())
      .then((json) => {
        const sorted = [...json.tickers].sort();
        setTickers(sorted);
      })
      .catch((err) => console.error("Failed to fetch stock list:", err));
  }, []);

  return tickers.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}