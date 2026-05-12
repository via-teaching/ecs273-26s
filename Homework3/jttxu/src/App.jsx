import RenderOptions from "./component/options";
// import { BarChart } from "./component/example";
import { useState } from "react";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

function App() {
  // by default: ""
  const [selectedStock, setSelectStock] = useState("")

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a stock:
          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectStock(e.target.value)}
          >
            {/* add a disabled default option */}
            <option value="" disabled>
              ---Select a stock---
            </option>
            <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          {/* View 1: top left */}
          <div className="h-1/4 pt-2 px-2 pb-1 flex flex-col">
            <h3 className="text-left text-lg">
              Stock overview line chart: {selectedStock}
            </h3>
            <div className="border-2 border-gray-300 rounded-xl w-full flex-1 overflow-hidden relative flex justify-center items-center">
              {selectedStock === "" ? (
                <p className="text-gray-500">Please select a stock from the menu above to view the chart.</p>
              ) : (
                <LineChart selectedStock={selectedStock} />
              )}
            </div>
          </div>
          {/* View 2: bottom left */}
          <div className="h-3/4 pt-1 px-2 pb-2">
            <h3 className="text-left text-lg">
              t-SNE scatter plot for the selected 20 stocks:
            </h3>
            <div className="border-2 border-gray-300 rounded-xl w-full h-[calc(100%_-_2rem)] relative overflow-hidden">
              {/* <p className="text-center text-gray-500 mt-20">Empty View 2</p> */}
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        {/* View 3: Right */}
        <div className="w-1/3 h-full p-2 flex flex-col">
          <h3 className="text-left text-lg">
            Latest news{selectedStock ? ` - ${selectedStock}:` : ":"}
          </h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)] overflow-hidden">
              <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
