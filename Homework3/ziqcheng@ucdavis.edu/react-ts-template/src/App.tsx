import { useState } from "react";
import RenderOptions, { STOCK_OPTIONS } from "./component/options";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

export default function App() {
  const [selectedStock, setSelectedStock] = useState<string>(STOCK_OPTIONS[0]);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>

        <label htmlFor="stock-select" className="mx-2">
          Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">View 1: Stock Price Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart ticker={selectedStock} />
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-[2rem]">
              View 2: t-SNE Stock Scatter Plot
            </h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter selectedTicker={selectedStock} />
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-[2rem]">View 3: Stock News</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-y-auto">
            <NewsList ticker={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}