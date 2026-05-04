import { STOCKS } from '../stockMeta';

export default function RenderOptions() {
  return (
    <>
      {STOCKS.map((s) => (
        <option key={s.symbol} value={s.symbol}>
          {s.symbol} — {s.name}
        </option>
      ))}
    </>
  );
}
