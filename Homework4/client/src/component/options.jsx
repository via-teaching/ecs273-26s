export default function RenderOptions({ stockList = [] }) {
    return stockList.map((stock) => (
      <option key={stock} value={stock}>
        {stock}
      </option>
    ));
}
