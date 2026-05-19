type RenderOptionsProps = {
  stockList?: string[];
};

export default function RenderOptions({ stockList = [] }: RenderOptionsProps) {
  return (
    <>
      {stockList.map((ticker) => (
        <option key={ticker} value={ticker}>
          {ticker}
        </option>
      ))}
    </>
  );
}