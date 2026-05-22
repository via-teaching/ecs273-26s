export default function RenderOptions({ stockList }) {

  return stockList.map((ticker, index) => (
    <option key={index} value={ticker}>
      {ticker}
    </option>
  ));
}