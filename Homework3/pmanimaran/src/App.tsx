import { useState } from 'react';
import RenderOptions from './component/options';
import { LineChart } from './component/LineChart';
import { TSNEScatter } from './component/TSNEScatter';
import { NewsList } from './component/NewsList';

export default function App() {
  const [selectedStock, setSelectedStock] = useState('AAPL');

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-700 text-white p-2 flex flex-row items-center gap-4">
        <h2 className="text-left text-2xl font-semibold">Stock Dashboard — HW3</h2>
        <label htmlFor="stock-select" className="flex items-center gap-2 text-sm">
          Select Stock:
          <select
            id="stock-select"
            className="bg-white text-black p-1.5 rounded text-sm"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full overflow-hidden">
        <div className="flex flex-col w-2/3 h-full">

          <div className="h-[35%] p-2 flex flex-col">
            <h3 className="text-base font-medium mb-1">
              Stock Price Overview — {selectedStock}
              <span className="text-xs text-gray-400 ml-2">(scroll to zoom · shift+scroll to pan · dbl-click to reset)</span>
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-[65%] p-2 flex flex-col">
            <h3 className="text-base font-medium mb-1">
              t-SNE Projection of Stock Latent Representations
              <span className="text-xs text-gray-400 ml-2">(scroll to zoom · drag to pan · dbl-click to reset)</span>
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>

        </div>

        <div className="w-1/3 h-full p-2 flex flex-col">
          <h3 className="text-base font-medium mb-1">News — {selectedStock}</h3>
          <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}
