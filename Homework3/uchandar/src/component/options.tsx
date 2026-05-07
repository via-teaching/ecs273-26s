import { STOCKS } from "../stocks";

export default function RenderOptions() {
  return STOCKS.map(t => <option key={t} value={t}>{t}</option>);
}
