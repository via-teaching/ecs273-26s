import { useMemo, useState } from "react";

import { LineChart } from "./component/LineChart";
import { NewsList } from "./component/NewsList";
import RenderOptions from "./component/options";
import { TSNEScatter } from "./component/TSNEScatter";
import { STOCK_TICKERS } from "./data";

export default function App() {
  const tickers = useMemo(() => STOCK_TICKERS, []);
  const [selectedTicker, setSelectedTicker] = useState(tickers[0] ?? "");

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex flex-wrap items-center gap-3 bg-slate-700 p-3 text-white">
        <h2 className="text-left text-2xl font-semibold">Homework 3 Stock Dashboard</h2>
        <label htmlFor="stock-select" className="flex items-center gap-2 text-sm font-medium">
          <span>Select a stock:</span>
          <select
            id="stock-select"
            className="rounded bg-white p-2 text-black"
            value={selectedTicker}
            onChange={(event) => setSelectedTicker(event.target.value)}
          >
            <RenderOptions tickers={tickers} />
          </select>
        </label>
      </header>
      <div className="flex h-full w-full flex-row">
        <div className="flex w-2/3 flex-col">
          <div className="h-1/2 p-2">
            <h3 className="h-[2rem] text-left text-xl font-semibold">View 1: Stock Overview Line Chart</h3>
            <div className="h-[calc(100%_-_2rem)] rounded-xl border-2 border-gray-300 bg-slate-50">
              <LineChart ticker={selectedTicker} />
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="h-[2rem] text-left text-xl font-semibold">View 2: T-SNE Scatter Plot</h3>
            <div className="h-[calc(100%_-_2rem)] rounded-xl border-2 border-gray-300 bg-slate-50">
              <TSNEScatter selectedTicker={selectedTicker} />
            </div>
          </div>
        </div>
        <div className="h-full w-1/3 p-2">
          <h3 className="h-[2rem] text-left text-xl font-semibold">View 3: Stock News</h3>
          <div className="h-[calc(100%_-_2rem)] rounded-xl border-2 border-gray-300 bg-slate-50">
            <NewsList ticker={selectedTicker} />
          </div>
        </div>
      </div>
    </div>
  );
}
