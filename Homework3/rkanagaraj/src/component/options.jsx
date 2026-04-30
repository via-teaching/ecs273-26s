const TICKERS = [
  'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
  'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
  'KO', 'MCD', 'META', 'MMM', 'MSFT',
  'NKE', 'NVDA', 'PFE', 'UNH', 'XOM',
];

export default function StockOptions() {
  return TICKERS.map(t => (
    <option key={t} value={t}>{t}</option>
  ));
}
