import { useEffect, useState } from "react";
import { fetchStockList } from "../api";

export const DEFAULT_STOCK = "AAPL";

export default function RenderOptions({ value, onChange }) {
  const [tickers, setTickers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchStockList()
      .then((data) => {
        if (cancelled) return;
        const list = [...(data.tickers ?? [])].sort();
        setTickers(list);
        setError(null);
        if (list.length && !list.includes(value)) {
          onChange(list[0]);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [value, onChange]);

  if (error) {
    return <option value={value}>{value} (API offline)</option>;
  }

  if (!tickers.length) {
    return <option value={value}>{value}</option>;
  }

  return tickers.map((symbol) => (
    <option key={symbol} value={symbol}>
      {symbol}
    </option>
  ));
}
