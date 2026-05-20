const stocks = [
  'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
  'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
  'KO', 'MCD', 'META', 'MMM', 'MSFT',
  'NKE', 'NVDA', 'PFE', 'UNH', 'XOM'
]

export default function RenderOptions() {
  return stocks.map((s, i) => (
    <option key={i} value={s}>{s}</option>
  ))
}