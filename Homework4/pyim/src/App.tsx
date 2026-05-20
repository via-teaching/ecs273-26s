
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import RenderOptions from "./component/options";
import { NewsList } from "./component/NewsList";
import { useState } from "react";
// A "extends" B means A inherits the properties and methods from B.


export default function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  const handleStockChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStock(event.target.value);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>
        <label htmlFor="bar-select" className="mx-2">Select a category:
          <select 
            id="bar-select" 
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={handleStockChange}
          >
              <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-2/5 p-2">
            <h3 className="text-left text-xl">Stock Price</h3>
            <div className="border-2 border-gray-300 rounded-xl">
              <LineChart stock={selectedStock} />
            </div>
          </div>
          <div className="h-3/5 p-2">
            <h3 className="text-left text-xl h-[2rem]">TSNE Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] flex min-h-0 flex-col">
              <TSNEScatter selectedStock={selectedStock}/>
            </div>
          </div>
          
        </div>
        <div className="w-1/3 h-full p-2">
            <h3 className="text-left text-xl h-[2rem]">Latest News</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
                <NewsList stock={selectedStock} /> 
            </div>
          </div>
        
      </div>
    </div>
    
  );
}
