export default function RenderOptions({ stockList }) {
  return stockList.map((name, index) => (
    <option key={index} value={name}>
      {name}
    </option>
  ));
}
