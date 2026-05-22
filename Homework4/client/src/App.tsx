import { useEffect, useState } from "react";
import StockSelector from "./component/StockSelector";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [stocks, setStocks] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");

  useEffect(() => {
    fetch(`${API_BASE}/stock_list`)
      .then((res) => res.json())
      .then((data) => {
        const tickers = data.tickers ?? [];
        setStocks(tickers);

        if (tickers.length > 0) {
          setSelectedStock(tickers[0]);
        }
      })
      .catch(() => {
        setStocks([]);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col">
      <header className="border-b border-gray-300 px-6 py-3 flex items-center gap-6 bg-gray-100">
        <span className="text-emerald-600 font-bold text-lg tracking-widest uppercase">
          Homework 4
        </span>

        <StockSelector
          stocks={stocks}
          selected={selectedStock}
          onChange={setSelectedStock}
        />
      </header>

      {!selectedStock ? (
        <div className="flex-1 flex items-center justify-center text-gray-600">
          Loading stocks from backend...
        </div>
      ) : (
        <main
          className="flex-1 grid grid-cols-3 grid-rows-2 gap-px bg-gray-300 overflow-hidden"
          style={{ height: "calc(100vh - 52px)" }}
        >
          <div className="col-span-2 bg-white overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-1 border-b border-gray-300">
              <h2 className="text-xs uppercase tracking-widest text-emerald-600">
                View 1 · Stock Overview
              </h2>
              <p className="text-gray-600 text-xs">
                {selectedStock} — Open / High / Low / Close
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              <LineChart stock={selectedStock} />
            </div>
          </div>

          <div className="col-start-3 row-span-2 bg-white overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-1 border-b border-gray-300">
              <h2 className="text-xs uppercase tracking-widest text-emerald-600">
                View 3 · News Feed
              </h2>
              <p className="text-gray-600 text-xs">
                {selectedStock} — latest articles
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              <NewsList stock={selectedStock} />
            </div>
          </div>

          <div className="col-span-2 row-start-2 bg-white overflow-hidden flex flex-col">
            <div className="px-4 pt-3 pb-1 border-b border-gray-300">
              <h2 className="text-xs uppercase tracking-widest text-emerald-600">
                View 2 · t-SNE Scatter
              </h2>
              <p className="text-gray-600 text-xs">
                Stocks by sector · selected: {selectedStock}
              </p>
            </div>

            <div className="flex-1 overflow-hidden">
              <TSNEScatter
                selectedStock={selectedStock}
                onSelectStock={setSelectedStock}
              />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}