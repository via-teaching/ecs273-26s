import RenderOptions from "./component/options";
// import { BarChart } from "./component/example"; i commented this example cause i cleaned up the files (deleted demo json and exampple)
import { LineChart } from './component/LineChart';
import { TSNEScatter } from './component/TSNEScatter';
import { NewsList } from './component/NewsList';
import { useState } from 'react';
function App() {
  const [selectedStock, setSelectedStock] = useState('AAPL');
  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a category:
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
              View 1 to be replaced by the view title
            </h3>
            <div className="border-2 border-gray-300 rounded-xl">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">
              View 2 to be replaced by the view title
            </h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">
            View 3 to be replaced by the view title
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
