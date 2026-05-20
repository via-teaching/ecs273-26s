import { useEffect, useState } from "react";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";
import RenderOptions from "./component/options";
import { Ticker } from "./types";

const API = "http://localhost:8000";

export default function App() {
  const [stockList, setStockList] = useState<string[]>([]);
  const [selected, setSelected] = useState<Ticker>("");

  useEffect(() => {
    fetch(`${API}/stock_list`)
      .then(res => res.json())
      .then(data => {
        setStockList(data.tickers);
        setSelected(data.tickers[0]);
      });
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="stock-select" className="mx-2">Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selected}
            onChange={(e) => setSelected(e.target.value as Ticker)}
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 1: Stock Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              {selected && <LineChart ticker={selected} />}
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 2: T-SNE Projection</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              {selected && <TSNEScatter selected={selected} onSelect={setSelected} />}
            </div>
          </div>

        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-[2rem]">View 3: News — {selected}</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-hidden">
            {selected && <NewsList ticker={selected} />}
          </div>
        </div>
      </div>
    </div>
  );
}
