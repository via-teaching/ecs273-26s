const STOCKS = [
  'XOM', 'CVX', 'HAL',
  'MMM', 'CAT', 'DAL',
  'MCD', 'NKE', 'KO',
  'JNJ', 'PFE', 'UNH',
  'JPM', 'GS', 'BAC',
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META',
].sort();

export default function RenderOptions() {
  return STOCKS.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}
