import { useState } from "react";
import RenderOptions from "./component/options";
import {StockLineChart} from "./component/StockLineChart";
import {TsnePlot} from "./component/TsnePlot";
import {NewsList} from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">

        <h2 className="text-left text-2xl font-bold mr-6">Homework 3</h2>
        <div className="flex items-center">
          <label htmlFor="bar-select" className="mx-2">Select a stock:</label>
          <select
            id="bar-select"
            className="bg-white text-black p-1 rounded mx-2 border border-zinc-500"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </div>
      </header>
      
      <div className="flex flex-row h-full w-full">
        
        <div className="flex flex-col w-2/3">
          
          <div className="h-1/2 p-3 flex flex-col">
            <h3 className="text-left text-xl">
              Stock Overview: {selectedStock}
            </h3>
            <div className="flex-1 border-2 border-gray-300 rounded-xl bg-white overflow-hidden">
              <StockLineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-1/2 p-3 flex flex-col">
            <h3 className="text-left text-lg font-semibold mb-1">
              T-SNE Cluster Analysis
            </h3>
            <div className="flex-1 border-2 border-gray-300 rounded-xl bg-white overflow-hidden">
              <TsnePlot selectedStock={selectedStock} />
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-3 flex flex-col">
          <h3 className="text-left text-lg font-semibold mb-1">
            News Feed: {selectedStock}
          </h3>
          <div className="flex-1 border-2 border-gray-300 rounded-xl bg-white overflow-y-auto">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;