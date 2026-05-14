const tickers = ['AAPL', 'BAC', 'CAT', 'CVX', 'DAL', 'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM', 'KO', 'MCD', 'META', 'MMM', 'MSFT', 'NKE', 'NVDA', 'PFE', 'UNH', 'XOM'];

export default function RenderOptions() {
  return tickers.map((ticker, index) => (
    <option key={index} value={ticker}>
      {ticker}
    </option>
  ));
}
