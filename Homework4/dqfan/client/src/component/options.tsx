export default function RenderOptions({ stockList }: { stockList: string[] }) {
  return stockList.map((stock) => (
    <option key={stock} value={stock}>
      {stock}
    </option>
  ));
}
