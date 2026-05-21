import { useEffect, useState } from "react";

export default function RenderOptions() {
  const [tickers, setTickers] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((json) => setTickers(json.tickers || []))
      .catch((err) => console.error("stock_list failed:", err));
  }, []);

  return (
    <>
      {tickers.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </>
  );
}