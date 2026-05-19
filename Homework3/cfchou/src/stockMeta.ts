export type Sector =
  | 'Tech'
  | 'Finance'
  | 'Healthcare'
  | 'Consumer'
  | 'Industrial'
  | 'Energy';

export interface StockInfo {
  symbol: string;
  name: string;
  sector: Sector;
}

export const STOCKS: StockInfo[] = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Tech' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Tech' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Tech' },
  { symbol: 'META', name: 'Meta', sector: 'Tech' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Tech' },

  { symbol: 'JPM', name: 'JPMorgan', sector: 'Finance' },
  { symbol: 'BAC', name: 'Bank of America', sector: 'Finance' },
  { symbol: 'GS', name: 'Goldman Sachs', sector: 'Finance' },

  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Healthcare' },

  { symbol: 'KO', name: 'Coca-Cola', sector: 'Consumer' },
  { symbol: 'NKE', name: 'Nike', sector: 'Consumer' },
  { symbol: 'MCD', name: "McDonald's", sector: 'Consumer' },

  { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrial' },
  { symbol: 'MMM', name: '3M', sector: 'Industrial' },
  { symbol: 'DAL', name: 'Delta Air Lines', sector: 'Industrial' },

  { symbol: 'XOM', name: 'ExxonMobil', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron', sector: 'Energy' },
  { symbol: 'HAL', name: 'Halliburton', sector: 'Energy' },
];

export const SECTORS: Sector[] = [
  'Tech', 'Finance', 'Healthcare', 'Consumer', 'Industrial', 'Energy',
];

export function getStockInfo(symbol: string): StockInfo | undefined {
  return STOCKS.find((s) => s.symbol === symbol);
}
