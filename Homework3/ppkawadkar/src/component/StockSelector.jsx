// Dropdown to pick which stock drives the homework views.
const TICKERS = [
  "XOM",
  "CVX",
  "HAL",
  "MMM",
  "CAT",
  "DAL",
  "MCD",
  "NKE",
  "KO",
  "JNJ",
  "PFE",
  "UNH",
  "JPM",
  "GS",
  "BAC",
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "META",
];

export default function StockSelector({ selectedStock, onStockChange }) {
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
        className="min-w-[10rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-slate-400 focus:ring-2"
      >
        {TICKERS.map((ticker) => (
          <option key={ticker} value={ticker}>
            {ticker}
          </option>
        ))}
      </select>
    </div>
  );
}
