import { useState, useEffect } from 'react';
import RenderOptions from './component/options';
import { LineChart } from './component/LineChart';
import { TSNEScatter } from './component/TSNEScatter';
import { NewsList } from './component/NewsList';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');

  useEffect(() => {
    fetch(`${API_BASE}/stock_list`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tickers && data.tickers.length > 0) {
          setStockList(data.tickers);
          setSelectedStock(data.tickers[0]);
        }
      })
      .catch((err) => console.error('Failed to fetch stock list:', err));
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="stock-select" className="mx-2 flex items-center">
          <span className="mr-1">Select a stock:</span>
          <select
            id="stock-select"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="bg-white text-black p-2 rounded mx-2"
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full overflow-hidden">
        <div className="flex flex-col w-2/3 h-full overflow-hidden">
          <div className="flex flex-col p-2" style={{ height: '45%' }}>
            <h3 className="text-left text-base font-semibold mb-1">
              View 1: Stock Price Overview - {selectedStock}
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="flex flex-col p-2" style={{ height: '55%' }}>
            <h3 className="text-left text-base font-semibold mb-1">
              View 2: t-SNE Stock Embedding
            </h3>
            <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
              <TSNEScatter selectedStock={selectedStock} onStockSelect={setSelectedStock} />
            </div>
          </div>
        </div>

        <div className="flex flex-col w-1/3 h-full p-2 overflow-hidden">
          <h3 className="text-left text-base font-semibold mb-1">
            View 3: News - {selectedStock}
          </h3>
          <div className="border-2 border-gray-300 rounded-xl flex-1 overflow-hidden">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}
