const STOCK_LABELS = {
  AAPL: "AAPL (Apple Inc.)",
  BAC: "BAC (Bank of America Corp.)",
  CAT: "CAT (Caterpillar Inc.)",
  CVX: "CVX (Chevron Corp.)",
  DAL: "DAL (Delta Air Lines Inc.)",
  GOOGL: "GOOGL (Alphabet Inc.)",
  GS: "GS (Goldman Sachs Group Inc.)",
  HAL: "HAL (Halliburton Co.)",
  JNJ: "JNJ (Johnson & Johnson)",
  JPM: "JPM (JPMorgan Chase & Co.)",
  KO: "KO (Coca-Cola Co.)",
  MCD: "MCD (McDonald's Corp.)",
  META: "META (Meta Platforms Inc.)",
  MMM: "MMM (3M Co.)",
  MSFT: "MSFT (Microsoft Corp.)",
  NKE: "NKE (Nike Inc.)",
  NVDA: "NVDA (NVIDIA Corp.)",
  PFE: "PFE (Pfizer Inc.)",
  UNH: "UNH (UnitedHealth Group Inc.)",
  XOM: "XOM (Exxon Mobil Corp.)",
};

export default function RenderOptions({ tickers }) {
  return tickers.map(function(ticker, index) {
    return (
      <option key={index} value={ticker}>
        {STOCK_LABELS[ticker] || ticker}
      </option>
    );
  });
}
