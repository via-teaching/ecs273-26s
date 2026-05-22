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
      <header className="bg-slate-900 text-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="text-base font-semibold">Homework 4 · Stock Explorer (Full-stack)</div>
        <StockOption value={selected} onChange={handleSelect} />
      </header>

      <main className="flex-1 min-h-0 p-4 grid grid-cols-12 lg:grid-rows-2 gap-4">
        <section className="col-span-12 lg:col-span-7 bg-white rounded border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <LineChart ticker={selected} />
        </section>

        <section className="col-span-12 lg:col-span-5 lg:row-span-2 bg-white rounded border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <NewsList ticker={selected} expandTrigger={expandCounter} />
        </section>

        <section className="col-span-12 lg:col-span-7 bg-white rounded border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <TSNEScatter selected={selected} onSelect={handleSelect} />
        </section>
      </main>
    </div>
  );
}
