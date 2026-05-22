import { stocks } from "../stocks";

export default function RenderOptions() {
  return stocks.map(t => <option key={t} value={t}>{t}</option>);
}
