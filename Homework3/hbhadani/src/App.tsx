import { useState } from "react";
import StockSelector from "./component/StockSelector";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

const STOCKS = [
  "AAPL",
  "BAC",
  "CAT",
  "CVX",
  "DAL",
  "GOOGL",
  "GS",
  "HAL",
  "JNJ",
  "JPM",
  "KO",
  "MCD",
  "META",
  "MMM",
  "MSFT",
  "NKE",
  "NVDA",
  "PFE",
  "UNH",
  "XOM",
];

export default function App() {
  const [selectedStock, setSelectedStock] = useState<string>("CVX");

  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col">
      <header className="border-b border-gray-300 px-6 py-3 flex items-center gap-6 bg-gray-100">
        <span className="text-emerald-600 font-bold text-lg tracking-widest uppercase">
          Homework 3
        </span>

        <StockSelector
          stocks={STOCKS}
          selected={selectedStock}
          onChange={setSelectedStock}
        />
      </header>

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
    </div>
  );
}