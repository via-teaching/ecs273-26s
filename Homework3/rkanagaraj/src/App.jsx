import { useState } from 'react';
import StockOptions from './component/options';
import LineChart from './component/LineChart';
import TSNEScatter from './component/TSNEScatter';
import NewsList from './component/NewsList';

const DEFAULT_STOCK = 'AAPL';

export default function App() {
  const [selectedStock, setSelectedStock] = useState(DEFAULT_STOCK);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-700 text-white px-4 py-2 flex flex-row items-center gap-4 shrink-0">
        <h2 className="text-xl font-bold">Homework 3 — Stock Dashboard</h2>
        <label htmlFor="stock-select" className="flex items-center gap-2 text-sm">
          Select stock:
          <select
            id="stock-select"
            value={selectedStock}
            onChange={e => setSelectedStock(e.target.value)}
            className="bg-white text-black px-2 py-1 rounded text-sm"
          >
            <StockOptions />
          </select>
        </label>
      </header>

      <div className="flex flex-row flex-1 min-h-0">
        {/* Left column: View 1 (top) + View 2 (bottom) */}
        <div className="flex flex-col w-2/3 h-full min-h-0">

          {/* View 1 — Line Chart */}
          <div className="h-1/3 p-2 min-h-0 flex flex-col">
            <h3 className="text-base font-semibold shrink-0">
              View 1: Stock Overview — {selectedStock}
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 min-h-0 overflow-hidden">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          {/* View 2 — t-SNE Scatter */}
          <div className="h-2/3 p-2 min-h-0 flex flex-col">
            <h3 className="text-base font-semibold shrink-0">
              View 2: t-SNE Projection (click a dot to select stock)
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 min-h-0 overflow-hidden">
              <TSNEScatter
                selectedStock={selectedStock}
                onSelectStock={setSelectedStock}
              />
            </div>
          </div>

        </div>

        {/* Right column: View 3 — News */}
        <div className="w-1/3 h-full p-2 min-h-0 flex flex-col">
          <h3 className="text-base font-semibold shrink-0">
            View 3: News — {selectedStock}
          </h3>
          <div className="border-2 border-gray-300 rounded-xl flex-1 min-h-0 overflow-hidden">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>

      </div>
    </div>
  );
}
