export default function StockOptions({ stockList }) {
  return stockList.map(t => (
    <option key={t} value={t}>{t}</option>
  ));
}
