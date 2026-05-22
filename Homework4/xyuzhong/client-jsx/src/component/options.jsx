export default function RenderOptions({ stocks }) {
  return stocks.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}
