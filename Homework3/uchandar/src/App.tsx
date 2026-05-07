import { useState } from "react";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import RenderOptions from "./component/options";
import { stocks, Ticker } from "./stocks";

export default function App() {
  const [selected, setSelected] = useState<Ticker>(stocks[0]);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>
        <label htmlFor="stock-select" className="mx-2">Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selected}
            onChange={(e) => setSelected(e.target.value as Ticker)}
          >
            <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 1: Stock Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart ticker={selected} />
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">View 2: T-SNE Projection</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter selected={selected} />
            </div>
          </div>

        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-[2rem]">View 3: News</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
            <p className="text-center text-gray-500 mt-20">
              Empty View 3 — selected: {selected}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
