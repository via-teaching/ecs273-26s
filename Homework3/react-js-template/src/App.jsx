import { useState } from "react";

import RenderOptions from "./component/options";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex flex-col h-full w-full">

      <header className="bg-zinc-400 text-white p-2 flex flex-row items-center">
        <h2 className="text-2xl mr-4">Homework 3</h2>

        <label htmlFor="stock-select">
          Select Stock:
        </label>

        <select
          id="stock-select"
          className="bg-white text-black p-2 rounded mx-2"
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          <RenderOptions />
        </select>
      </header>

      <div className="flex flex-row h-full w-full">

        <div className="flex flex-col w-2/3">

          <div className="h-1/2 p-2">
            <h3 className="text-xl">
              Stock Overview
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-full">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-xl">
              t-SNE Scatter Plot
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-full">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>

        </div>

        <div className="w-1/3 p-2">
          <h3 className="text-xl">
            News Articles
          </h3>

          <div className="border-2 border-gray-300 rounded-xl h-full overflow-y-scroll">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>

      </div>

    </div>
  );
}

export default App;
