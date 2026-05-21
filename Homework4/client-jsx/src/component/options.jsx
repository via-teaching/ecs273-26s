// Replace the contents of options.jsx
export default function RenderOptions({ stockList }) {
  // If stockList hasn't loaded yet, show a placeholder instead of crashing
  if (!stockList || stockList.length === 0) {
    return <option disabled>Loading...</option>;
  }

  return stockList.map((name, index) => (
    <option key={index} value={name}>
      {name}
    </option>
  ));
}
