import { STOCKS } from "./stocks";

export default function RenderOptions() {
  return STOCKS.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}