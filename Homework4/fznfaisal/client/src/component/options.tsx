interface RenderOptionsProps {
  tickers: string[];
}

export default function RenderOptions({ tickers }: RenderOptionsProps) {
  return tickers.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}