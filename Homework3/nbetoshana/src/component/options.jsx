export const stockOptions = [
  'AAPL', 'BAC', 'CAT', 'CVX', 'DAL',
  'GOOGL', 'GS', 'HAL', 'JNJ', 'JPM',
  'KO', 'MCD', 'META', 'MMM', 'MSFT',
  'NKE', 'NVDA', 'PFE', 'UNH', 'XOM'
];

export default function RenderOptions() {
  return stockOptions.map((stock, index) => (
    <option key={index} value={stock}>
      {stock}
    </option>
  ));
}