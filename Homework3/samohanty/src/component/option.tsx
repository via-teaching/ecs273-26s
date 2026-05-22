import { STOCK_TICKERS, SECTOR_OF, SECTOR_LABEL } from '../data/stocks';

type Props = {
  value: string;
  onChange: (ticker: string) => void;
};

// Group tickers by sector for a tidier dropdown.
const groupedTickers = (() => {
  const groups: Record<string, string[]> = {};
  for (const t of STOCK_TICKERS) {
    const s = SECTOR_OF[t] ?? 'Other';
    if (!groups[s]) groups[s] = [];
    groups[s].push(t);
  }
  return groups;
})();

export default function StockOption({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="stock-select"
        className="text-sm font-medium text-slate-200 tracking-wide uppercase"
      >
        Ticker
      </label>
      <select
        id="stock-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-100 text-sm
                   rounded-md px-3 py-1.5 focus:outline-none focus:ring-2
                   focus:ring-emerald-500 focus:border-emerald-500 min-w-[180px]"
      >
        {Object.entries(groupedTickers).map(([sector, tickers]) => (
          <optgroup key={sector} label={SECTOR_LABEL[sector] ?? sector}>
            {tickers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
