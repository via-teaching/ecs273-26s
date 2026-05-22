const stocks = [
  { value: "AAPL", label: "AAPL (Apple Inc.)" },
  { value: "BAC", label: "BAC (Bank of America Corp.)" },
  { value: "CAT", label: "CAT (Caterpillar Inc.)" },
  { value: "CVX", label: "CVX (Chevron Corp.)" },
  { value: "DAL", label: "DAL (Delta Air Lines Inc.)" },
  { value: "GOOGL", label: "GOOGL (Alphabet Inc.)" },
  { value: "GS", label: "GS (Goldman Sachs Group Inc.)" },
  { value: "HAL", label: "HAL (Halliburton Co.)" },
  { value: "JNJ", label: "JNJ (Johnson & Johnson)" },
  { value: "JPM", label: "JPM (JPMorgan Chase & Co.)" },
  { value: "KO", label: "KO (Coca-Cola Co.)" },
  { value: "MCD", label: "MCD (McDonald's Corp.)" },
  { value: "META", label: "META (Meta Platforms Inc.)" },
  { value: "MMM", label: "MMM (3M Co.)" },
  { value: "MSFT", label: "MSFT (Microsoft Corp.)" },
  { value: "NKE", label: "NKE (Nike Inc.)" },
  { value: "NVDA", label: "NVDA (NVIDIA Corp.)" },
  { value: "PFE", label: "PFE (Pfizer Inc.)" },
  { value: "UNH", label: "UNH (UnitedHealth Group Inc.)" },
  { value: "XOM", label: "XOM (Exxon Mobil Corp.)" },
];

export default function RenderOptions() {
  return stocks.map((stock, index) => (
    <option key={index} value={stock.value}>
      {stock.label}
    </option>
  ));
}
