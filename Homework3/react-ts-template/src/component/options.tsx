import { STOCK_TICKERS } from "../data";

interface RenderOptionsProps {
  tickers?: string[];
}

export default function RenderOptions({ tickers }: RenderOptionsProps) {
  const optionTickers = tickers ?? STOCK_TICKERS;

  return optionTickers.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}