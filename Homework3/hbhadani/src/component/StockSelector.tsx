interface Props {
  stocks: string[];
  selected: string;
  onChange: (s: string) => void;
}

export default function StockSelector({ stocks, selected, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-700 uppercase tracking-widest">
        Ticker
      </label>

      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-gray-400 text-black text-sm px-3 py-1.5 rounded
                   focus:outline-none focus:border-emerald-600 cursor-pointer
                   hover:border-gray-600 transition-colors"
      >
        {stocks.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}