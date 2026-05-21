import { useState } from "react";
import RenderOptions from "./component/options";
import LineChart from "./component/LineChart";          
import NewsList from "./component/NewsList";
// import { BarChart } from "./component/example";  
import ScatterPlot from "./component/ScatterPlot";

function App() {
  
  const [selectedStock, setSelectedStock] = useState("AAPL");

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
          <div className="h-1/2 p-2 flex flex-col">
            <h3 className="text-left text-xl h-8">
              View 1: {selectedStock} OHLC Prices
            </h3>
          <div className="border-2 border-gray-300 rounded-xl flex-1">
            <LineChart ticker={selectedStock} />
          </div>
        </div>
          <div className="h-1/2 p-2 flex flex-col">
            <h3 className="text-left text-xl h-8">
              View 2: t-SNE of Stock Embeddings
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1">
              <ScatterPlot ticker={selectedStock} onSelect={setSelectedStock} /></div>
            </div>
          </div>
        <div className="w-1/3 h-full p-2 flex flex-col">
          <h3 className="text-left text-xl h-8">
            View 3: News for {selectedStock}
          </h3>
          <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
            <NewsList ticker={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;