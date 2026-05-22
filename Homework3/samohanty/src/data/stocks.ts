// List of 20 stock tickers used across this assignment.

export const STOCK_TICKERS: string[] = [
  'XOM', 'CVX', 'HAL',           // Energy
  'MMM', 'CAT', 'DAL',           // Industrials
  'MCD', 'NKE',                  // Consumer Discretionary
  'KO',                          // Consumer Staples
  'JNJ', 'PFE', 'UNH',           // Healthcare
  'JPM', 'BAC', 'GS',            // Financials
  'AAPL', 'MSFT', 'NVDA', 'GOOG', 'META', // Information Technology
];

export const SECTOR_OF: Record<string, string> = {
  XOM: 'Energy', CVX: 'Energy', HAL: 'Energy',
  MMM: 'Industrials', CAT: 'Industrials', DAL: 'Industrials',
  MCD: 'Consumer_Discretionary', NKE: 'Consumer_Discretionary',
  KO: 'Consumer_Staples',
  JNJ: 'Healthcare', PFE: 'Healthcare', UNH: 'Healthcare',
  JPM: 'Financials', BAC: 'Financials', GS: 'Financials',
  AAPL: 'Information_Technology', MSFT: 'Information_Technology',
  NVDA: 'Information_Technology', GOOG: 'Information_Technology',
  META: 'Information_Technology',
};

export const SECTOR_LABEL: Record<string, string> = {
  Energy: 'Energy',
  Industrials: 'Industrials',
  Consumer_Discretionary: 'Consumer Discretionary',
  Consumer_Staples: 'Consumer Staples',
  Healthcare: 'Healthcare',
  Financials: 'Financials',
  Information_Technology: 'Information Technology',
};
