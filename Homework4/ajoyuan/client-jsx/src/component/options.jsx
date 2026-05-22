export default function RenderOptions({ stockList }) {
  if (!stockList || stockList.length === 0) {
    return <option disabled>Loading...</option>;
  }

  return stockList.map((name, index) => (
    <option key={index} value={name}>
      {name}
    </option>
  ));
}
