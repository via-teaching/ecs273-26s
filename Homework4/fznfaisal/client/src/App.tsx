import { useMemo, useState } from "react";

import { LineChart } from "./component/LineChart";
import { NewsList } from "./component/NewsList";
import RenderOptions from "./component/options";
import { TSNEScatter } from "./component/TSNEScatter";
import { STOCK_TICKERS } from "./data";

export default function App() {
  const tickers = useMemo(() => STOCK_TICKERS, []);
  const [selectedTicker, setSelectedTicker] = useState(tickers[0] ?? "");

  return (
    <div className="flex min-h-screen w-full flex-col px-4 py-4 text-slate-100 lg:px-5">
      <header className="glass-panel mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] px-5 py-4 text-white">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">Visual Analytics</p>
          <h2 className="text-left text-2xl font-semibold tracking-tight lg:text-3xl">Stock Intelligence Dashboard</h2>
          <p className="mt-1 text-sm text-slate-200/80">Interactive price history, sector embedding, and live-linked news.</p>
        </div>
        <label htmlFor="stock-select" className="glass-subtle flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-100">
          <span className="whitespace-nowrap text-slate-200">Selected ticker</span>
          <select
            id="stock-select"
            className="glass-select min-w-32 rounded-xl px-3 py-2 text-sm font-semibold"
            value={selectedTicker}
            onChange={(event) => setSelectedTicker(event.target.value)}
          >
            <RenderOptions tickers={tickers} />
          </select>
        </label>
      </header>
      <div className="flex w-full flex-col gap-4 xl:h-[calc(100vh-10.5rem)] xl:max-h-[54rem] xl:flex-row">
        <div className="flex min-h-0 w-full flex-col gap-4 xl:w-2/3">
          <div className="flex min-h-[24rem] flex-1 flex-col">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <h3 className="text-left text-xl font-semibold tracking-tight text-white">View 1: Stock Overview</h3>
                <p className="text-sm text-slate-300">Compare price movements across time.</p>
              </div>
              <span className="glass-subtle rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100">
                {selectedTicker}
              </span>
            </div>
            <div className="glass-panel min-h-0 flex-1 rounded-[1.5rem] p-3 text-slate-800">
              <LineChart ticker={selectedTicker} />
            </div>
          </div>
          <div className="flex min-h-[24rem] flex-1 flex-col">
            <div className="mb-3 px-1">
              <h3 className="text-left text-xl font-semibold tracking-tight text-white">View 2: T-SNE Scatter Plot</h3>
              <p className="text-sm text-slate-300">Explore how each stock clusters.</p>
            </div>
            <div className="glass-panel min-h-0 flex-1 rounded-[1.5rem] p-3 text-slate-800">
              <TSNEScatter selectedTicker={selectedTicker} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[32rem] w-full flex-col xl:min-h-0 xl:w-1/3">
          <div className="mb-3 px-1">
            <h3 className="text-left text-xl font-semibold tracking-tight text-white">View 3: Stock News</h3>
            <p className="text-sm text-slate-300">Open headlines and article summaries for the active ticker.</p>
          </div>
          <div className="glass-panel min-h-0 flex-1 rounded-[1.5rem] p-3 text-slate-900">
            <NewsList ticker={selectedTicker} />
          </div>
        </div>
      </div>
    </div>
  );
}
