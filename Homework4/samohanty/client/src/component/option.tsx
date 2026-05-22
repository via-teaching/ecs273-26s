import { useEffect, useState } from 'react';
import { api } from '../api';
import { SECTOR_LABEL } from '../data/stocks';

type Props = {
  value: string;
  onChange: (ticker: string) => void;
};

export default function StockOption({ value, onChange }: Props) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [sectors, setSectors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Fetch the ticker list from the backend on mount.
  useEffect(() => {
    const controller = new AbortController();
    api.listStocks(controller.signal)
      .then((data) => {
        setTickers(data.tickers);
        setSectors(data.sectors ?? {});
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, []);

  // Group tickers by sector for a nicer dropdown.
  const groups: Record<string, string[]> = {};
  for (const t of tickers) {
    const s = sectors[t] ?? 'Other';
    if (!groups[s]) groups[s] = [];
    groups[s].push(t);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="stock-select" className="text-sm text-slate-200">Stock</label>
      <select
        id="stock-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded px-3 py-1.5"
        disabled={tickers.length === 0}
      >
        {tickers.length === 0 && <option value="">Loading…</option>}
        {Object.entries(groups).map(([sector, ts]) => (
          <optgroup key={sector} label={SECTOR_LABEL[sector] ?? sector}>
            {ts.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && <span className="text-xs text-red-300">API error</span>}
    </div>
  );
}
