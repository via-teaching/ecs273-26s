import { useState } from "react";
import RenderOptions, { DEFAULT_STOCK } from "./component/options";
import { StockLineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCK);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a stock:
          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions value={selectedStock} onChange={setSelectedStock} />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full min-h-0">
        <div className="flex flex-col w-2/3 min-h-0">
          <div className="min-h-[280px] h-[42%] shrink-0 p-2 flex flex-col">
            <h3 className="text-left text-xl shrink-0">
            Stock Overview Line Chart
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 min-h-0 flex flex-col overflow-hidden">
              <StockLineChart symbol={selectedStock} />
            </div>
          </div>
          <div className="flex flex-1 min-h-0 flex-col p-2">
            <h3 className="text-left text-xl h-8 shrink-0">
            T-SNE Scatter Plot
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 min-h-0 h-[calc(100%_-_2rem)] overflow-hidden flex flex-col">
              <TSNEScatter selectedTicker={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2 min-h-0">
          <h3 className="text-left text-xl h-8">
          List of News
          </h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] min-h-0">
            <NewsList ticker={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
