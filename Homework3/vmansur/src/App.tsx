
import { useEffect, useState } from "react";

import LineChart from "./component/LineChart";
import NewsList from "./component/NewsList";
import { DatasetSummary, getDatasetSummary, getNewsDateRangeByTicker } from "./component/dataLoader";
import RenderOptions from "./component/options";
import { STOCKS } from "./component/stocks";
import TSNEScatter from "./component/TSNEScatter";


export default function App() {
  const [selectedStock, setSelectedStock] = useState<string>(STOCKS[0]);
  const [alignNewsWindow, setAlignNewsWindow] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [summary, setSummary] = useState<DatasetSummary | null>(null);

  useEffect(() => {
    let isActive = true;
    getDatasetSummary().then((nextSummary) => {
      if (isActive) {
        setSummary(nextSummary);
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  const selectedNewsRange = getNewsDateRangeByTicker(selectedStock);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <header className="bg-gradient-to-r from-slate-800 via-indigo-800 to-violet-800 px-3 py-2 text-white shadow-lg">
        <div className="flex flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-left text-xl font-semibold leading-tight">Homework 3: D3 Stock Dashboard</h2>
          <p className="text-[11px] text-slate-100/90">
            Exploratory visualization for learning. Not investment advice.
          </p>
        </div>
          <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            className="rounded-md border border-indigo-200 bg-white/10 px-2 py-1 text-xs text-white"
          >
            {showAdvanced ? "Hide Advanced" : "Advanced"}
          </button>
            <label htmlFor="stock-select" className="mx-2 text-sm">
            <span className="mr-2">Select stock:</span>
            <select
              id="stock-select"
                className="mx-2 rounded-lg border border-slate-200 bg-white p-1.5 text-sm text-slate-900 shadow-sm"
              value={selectedStock}
              onChange={(event) => setSelectedStock(event.target.value)}
            >
              <RenderOptions />
            </select>
          </label>
        </div>
        </div>
      </header>
      {showAdvanced && (
        <div className="bg-indigo-50 border-b border-indigo-100 px-3 py-2 text-xs text-slate-700">
          <label htmlFor="align-news-window" className="block font-medium text-slate-800">
            <input
              id="align-news-window"
              type="checkbox"
              className="mr-1 align-middle accent-indigo-600"
              checked={alignNewsWindow}
              onChange={(event) => setAlignNewsWindow(event.target.checked)}
            />
            Show only dates with news (optional)
          </label>
          <p className="mt-1">
            Filters the line chart to the selected ticker&apos;s news window. Use ON for news-focused comparison;
            keep OFF for full historical trend.
          </p>
        </div>
      )}
      <div className="border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700">
        {summary ? (
          <div className="overflow-x-auto whitespace-nowrap">
            Data integrity: {summary.stockTickerCount} tickers, stocks {summary.stockStart} to {summary.stockEnd}
            ({summary.stockRowsPerTicker} rows/ticker). News {summary.newsStart} to {summary.newsEnd}
            ({summary.newsItemCount} items). Selected {selectedStock} news window:{" "}
            {selectedNewsRange ? `${selectedNewsRange.start} to ${selectedNewsRange.end}` : "N/A"}.
          </div>
        ) : (
          <span>Loading data integrity summary...</span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-row">
        <div className="flex min-h-0 w-2/3 flex-col">
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <h3 className="text-left text-lg font-semibold text-slate-800">View 1: Stock Overview Line Chart</h3>
            <div className="min-h-0 flex-1 rounded-xl border border-indigo-100 bg-white shadow-md">
              <LineChart
                selectedStock={selectedStock}
                newsDateRange={selectedNewsRange}
                alignToNewsWindow={alignNewsWindow}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <h3 className="text-left text-lg font-semibold text-slate-800">View 2: t-SNE Scatter Plot</h3>
            <div className="min-h-0 flex-1 rounded-xl border border-sky-100 bg-white shadow-md">
              <TSNEScatter selectedStock={selectedStock} onSelectStock={setSelectedStock} />
            </div>
          </div>
        </div>
        <div className="flex min-h-0 w-1/3 flex-col p-2">
          <h3 className="text-left text-lg font-semibold text-slate-800">View 3: Recent News</h3>
          <div className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 shadow-md">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}
