import { useState } from "react";
import RenderOptions from "./component/options";
import { BarChart } from "./component/example";
import { TSNEScatterPlot } from "./component/TSNEScatterPlot";
import { NewsList } from "./component/NewsList";
function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

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
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">
              Stock Overview Line Chart
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-full overflow-x-auto">
              <BarChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">
              t-SNE Scatter Plot
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatterPlot selectedStock={selectedStock} />
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">
            List of News
          </h3>

          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)]">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;