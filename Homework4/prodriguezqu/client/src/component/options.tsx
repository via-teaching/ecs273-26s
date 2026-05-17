interface RenderOptionsProps {
  stockList: string[];
}

export default function RenderOptions({ stockList }: RenderOptionsProps) {
  // keeping this simple and just mapping over the list fetched from the backend
  return stockList.map((ticker) => (
    <option key={ticker} value={ticker}>
      {ticker}
    </option>
  ));
}
