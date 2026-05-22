import { useEffect, useState } from "react";
import { fetchStocks } from "../api.js";

export default function StockSelector({ selectedStock, onStockChange, onStocksLoaded }) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const list = await fetchStocks();
        if (cancelled) return;
        setStocks(list);
        console.log("Loaded stocks:", list.length);
        onStocksLoaded?.(list);
      } catch {
        if (!cancelled) {
          setStocks([]);
          setError("Could not load data from backend.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load tickers once on mount
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    console.log("Selected stock:", v);
    onStockChange(v);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="stock-select" className="text-sm font-medium text-slate-700">
        Stock
      </label>
      <select
        id="stock-select"
        value={selectedStock}
        onChange={handleChange}
        disabled={loading || stocks.length === 0}
        className="min-w-[10rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:ring-2 disabled:opacity-60"
      >
        {loading && <option value="">Loading stocks...</option>}
        {!loading &&
          stocks.map((ticker) => (
            <option key={ticker} value={ticker}>
              {ticker}
            </option>
          ))}
      </select>
      {error && <p className="text-xs text-amber-800">{error}</p>}
    </div>
  );
}
