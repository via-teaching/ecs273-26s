export default function RenderOptions({ stockList }) {
  if (!stockList || stockList.length === 0) {
    return <option>Loading...</option>;
  }
  return stockList.map((stock) => (
    <option key={stock} value={stock}>
      {stock}
    </option>
  ));
}
