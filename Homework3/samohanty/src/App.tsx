import { useState } from 'react';
import StockOption from './component/option';
import LineChart from './component/LineChart';
import TSNEScatter from './component/TSNEScatter';
import NewsList from './component/NewsList';

export default function App() {
  const [selected, setSelected] = useState<string>('AAPL');
  
  const [expandCounter, setExpandCounter] = useState<number>(0);

  const handleSelect = (ticker: string) => {
    setSelected(ticker);
    setExpandCounter((n) => n + 1);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header bar */}
      <header className="bg-slate-900 text-slate-100 px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <span className="text-emerald-300 text-sm font-bold">$</span>
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">Stock Explorer</div>
            <div className="text-xs text-slate-400">D3 Visualizations · ECS 273 HW3</div>
          </div>
        </div>
        <StockOption value={selected} onChange={handleSelect} />
      </header>

      {/* Main grid: 2 columns. Left column has line chart on top, t-SNE on bottom.
          Right column is the news list. */}
      <main className="flex-1 min-h-0 p-4 grid grid-cols-12 gap-4">
        {/* View 1: Line chart (top-left) */}
        <section className="col-span-12 lg:col-span-7 row-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">
            View 1 · Stock Overview
          </h2>
          <div className="flex-1 min-h-0">
            <LineChart ticker={selected} />
          </div>
        </section>

        {/* View 3: News (right, full height) */}
        <section className="col-span-12 lg:col-span-5 lg:row-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">
            View 3 · News Feed
          </h2>
          <div className="flex-1 min-h-0">
            <NewsList ticker={selected} expandTrigger={expandCounter} />
          </div>
        </section>

        {/* View 2: t-SNE (bottom-left) */}
        <section className="col-span-12 lg:col-span-7 bg-white rounded-lg shadow-sm border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <h2 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">
            View 2 · t-SNE Scatter Plot
          </h2>
          <div className="flex-1 min-h-0">
            <TSNEScatter selected={selected} onSelect={handleSelect} />
          </div>
        </section>
      </main>
    </div>
  );
}
