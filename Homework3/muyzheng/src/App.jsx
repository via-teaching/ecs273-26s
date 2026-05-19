import { useState } from "react";
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";

const TICKERS = [
  "XOM","CVX","HAL",
  "MMM","CAT","DAL",
  "MCD","NKE","KO",
  "JNJ","PFE","UNH",
  "JPM","GS","BAC",
  "AAPL","MSFT","NVDA","GOOGL","META",
];

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-50">
      <header className="bg-zinc-800 text-white px-6 py-3 flex flex-row items-center gap-6 shrink-0">
        <h1 className="text-xl font-semibold tracking-wide">Stock Market Dashboard</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          Select Stock:
          <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="bg-zinc-700 text-white border border-zinc-500 rounded px-2 py-1 text-sm"
          >
            {TICKERS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex flex-row flex-1 overflow-hidden">
        <div className="flex flex-col w-2/3 overflow-hidden">
          <div className="h-1/3 p-3">
            <div className="border border-zinc-200 rounded-xl h-full bg-white shadow-sm overflow-hidden">
              <LineChart stock={selectedStock} />
            </div>
          </div>
          <div className="h-2/3 p-3 pt-0">
            <div className="border border-zinc-200 rounded-xl h-full bg-white shadow-sm overflow-hidden">
              <TSNEScatter selectedStock={selectedStock} onSelect={setSelectedStock} />
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-3 pl-0">
          <div className="border border-zinc-200 rounded-xl h-full bg-white shadow-sm overflow-hidden">
            <NewsList stock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
