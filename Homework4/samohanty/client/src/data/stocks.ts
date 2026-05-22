/**
 * Human-readable sector labels.
 *
 * In HW3 this file also exported STOCK_TICKERS and SECTOR_OF. In HW4 those
 * come from the backend (/api/stocks). We only need the display labels here.
 */

export const SECTOR_LABEL: Record<string, string> = {
  Energy: 'Energy',
  Industrials: 'Industrials',
  Consumer_Discretionary: 'Consumer Discretionary',
  Consumer_Staples: 'Consumer Staples',
  Healthcare: 'Healthcare',
  Financials: 'Financials',
  Information_Technology: 'Information Technology',
};
