import { useEffect, useState } from "react";

export default function RenderOptions() {
  const [tickers, setTickers] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((data) => {
        const list: string[] = data.tickers ?? [];
        setTickers(list);

        setTimeout(() => {
          const select = document.getElementById("bar-select") as HTMLSelectElement;
          if (select) {
            select.value = list[0];
            select.dispatchEvent(new Event("change"));
          }
        }, 100);  
      });
  }, []);

  return (
    <>
      {tickers.map((ticker) => (
        <option key={ticker} value={ticker}>
          {ticker}
        </option>
      ))}
    </>
  );
}