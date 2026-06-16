import { tickerList } from "../types";

export default function RenderOptions() {
  return tickerList.map((ticker, index) => (
    <option key={index}>
      {ticker}
    </option>
  ));
}