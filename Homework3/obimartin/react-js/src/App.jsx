import { useState } from "react";
import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-[#6c584c] text-white p-2 flex flex-row align-center">
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
          <div className="h-1/4 p-2">
            <h3 className="text-left text-xl h-8">
              Stock Overview — {selectedStock}
            </h3>
            <div className="border-2 border-[#6c584c] rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart stock={selectedStock} />
            </div>
          </div>
          <div className="h-3/4 p-2">
            <h3 className="text-left text-xl h-8">
              t-SNE Stock Clusters
            </h3>
            <div className="border-2 border-[#6c584c] rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter stock={selectedStock} onStockSelect={setSelectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">
            News — {selectedStock}
          </h3>
          <div className="border-2 border-[#6c584c] rounded-xl h-[calc(100%-2rem)]">
            <NewsList stock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
