// The 20 stocks from Homework 1 (exact tickers from your data files)
export const STOCKS: string[] = [
  "AAPL",  // Information Technology
  "MSFT",  // Information Technology
  "NVDA",  // Information Technology
  "GOOG",  // Information Technology
  "META",  // Information Technology
  "JPM",   // Financials
  "BAC",   // Financials
  "GS",    // Financials
  "JNJ",   // Healthcare
  "PFE",   // Healthcare
  "UNH",   // Healthcare
  "XOM",   // Energy
  "CVX",   // Energy
  "HAL",   // Energy
  "CAT",   // Industrials
  "MMM",   // Industrials
  "DAL",   // Industrials
  "MCD",   // Consumer Discretionary
  "NKE",   // Consumer Discretionary
  "KO",    // Consumer Staples
];

// Sector mapping — matches HW2 vis.py ticker_dict exactly
export const STOCK_SECTORS: Record<string, string> = {
  AAPL: "Information_Technology",
  MSFT: "Information_Technology",
  NVDA: "Information_Technology",
  GOOG: "Information_Technology",
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

export const SECTORS = [...new Set(Object.values(STOCK_SECTORS))];
