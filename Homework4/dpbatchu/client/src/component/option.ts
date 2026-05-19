// Sector → color mapping (used by TSNEScatter legend)
export const STOCK_SECTORS: Record<string, string> = {
  AAPL: "Information_Technology",
  MSFT: "Information_Technology",
  NVDA: "Information_Technology",
  GOOG: "Information_Technology",
  GOOGL: "Information_Technology",
  META: "Information_Technology",
  JPM:  "Financials",
  BAC:  "Financials",
  GS:   "Financials",
  JNJ:  "Healthcare",
  PFE:  "Healthcare",
  UNH:  "Healthcare",
  XOM:  "Energy",
  CVX:  "Energy",
  HAL:  "Energy",
  CAT:  "Industrials",
  MMM:  "Industrials",
  DAL:  "Industrials",
  MCD:  "Consumer_Discretionary",
  NKE:  "Consumer_Discretionary",
  KO:   "Consumer_Staples",
};

export const SECTOR_COLORS: string[] = [
  "#00d4ff", "#a78bfa", "#22c55e", "#ff6b35",
  "#f59e0b", "#ec4899", "#14b8a6", "#6366f1",
];

// Known sectors in a stable order for the legend
export const SECTORS: string[] = [
  "Information_Technology",
  "Financials",
  "Healthcare",
  "Energy",
  "Industrials",
  "Consumer_Discretionary",
  "Consumer_Staples",
];
