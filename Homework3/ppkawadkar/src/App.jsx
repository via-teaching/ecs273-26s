import { useState } from "react";
import LineChart from "./component/LineChart.jsx";
import NewsList from "./component/NewsList.jsx";
import StockSelector from "./component/StockSelector.jsx";
import TSNEScatter from "./component/TSNEScatter.jsx";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-slate-100 text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-800 sm:text-xl">Stock dashboard</h1>
            <p className="text-[11px] text-slate-500 sm:text-xs">ECS 273 · Homework 3</p>
          </div>
          <StockSelector selectedStock={selectedStock} onStockChange={setSelectedStock} />
        </div>
      </header>

      <main className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-1 gap-6 overflow-y-auto p-4 sm:p-5 lg:grid-cols-3 lg:items-stretch lg:gap-6">
        <div className="flex min-h-0 min-w-0 flex-col gap-6 lg:col-span-2">
          <section className="min-w-0 space-y-1.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Price over time</h2>
            <LineChart selectedStock={selectedStock} />
          </section>
          <section className="min-w-0 space-y-1.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">t-SNE embedding</h2>
            <TSNEScatter selectedStock={selectedStock} />
          </section>
        </div>

        <aside className="flex min-h-0 min-w-0 flex-col gap-1.5 lg:col-span-1 lg:min-h-0">
          <h2 className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Headlines</h2>
          <div className="min-h-[240px] min-w-0 flex-1 lg:min-h-0">
            <NewsList selectedStock={selectedStock} />
          </div>
        </aside>
      </main>

      <footer className="shrink-0 border-t border-slate-200 bg-white py-2 text-center text-[10px] text-slate-500">
        <p className="mx-auto max-w-3xl px-4 leading-relaxed">
          Prasannadatta Kawadkar · ppkawadkar@ucdavis.edu · UCD ID: 924167184
        </p>
      </footer>
    </div>
  );
}

export default App;
