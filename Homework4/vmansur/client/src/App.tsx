import { useCallback, useEffect, useMemo, useState } from "react";

import LineChart from "./component/StockLineChart";
import NewsList from "./component/StockNewsList";
import TSNEScatter from "./component/TSNEScatter";
import RenderOptions from "./component/options";
import type { NewsItem } from "./types";

export default function App() {
  const [stockList, setStockList] = useState<string[]>([]);
  const [stockListError, setStockListError] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [alignNewsWindow, setAlignNewsWindow] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [currentNews, setCurrentNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    let isActive = true;
    fetch("http://localhost:8000/stock_list")
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
        return res.json() as Promise<{ tickers?: string[] }>;
      })
      .then((data) => {
        if (!isActive) return;
        const tickers = Array.isArray(data?.tickers) ? data.tickers : [];
        setStockList(tickers);
        if (tickers.length > 0) {
          setSelectedStock((prev) => prev || tickers[0]);
        }
      })
      .catch((err) => {
        if (!isActive) return;
        setStockListError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleNewsItems = useCallback((items: NewsItem[]) => {
    setCurrentNews(items);
  }, []);

  const newsDateRange = useMemo(() => {
    if (!currentNews.length) return null;
    const dates = currentNews
      .map((item) => item.date?.slice(0, 10))
      .filter((value): value is string => Boolean(value))
      .sort();
    if (dates.length === 0) return null;
    return { start: dates[0], end: dates[dates.length - 1] };
  }, [currentNews]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <header className="bg-gradient-to-r from-slate-800 via-indigo-800 to-violet-800 px-3 py-2 text-white shadow-lg">
        <div className="flex flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-left text-xl font-semibold leading-tight">
              Homework 4: Full-Stack D3 Stock Dashboard
            </h2>
            <p className="text-[11px] text-slate-100/90">
              Data served by FastAPI + MongoDB. Educational use only - not investment advice.
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
                disabled={stockList.length === 0}
              >
                <RenderOptions stockList={stockList} />
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
            Filters the line chart to the selected ticker&apos;s news window. The news window comes
            from the backend response for the current ticker.
          </p>
        </div>
      )}

      <div className="border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] text-slate-700">
        {stockListError ? (
          <span className="text-red-700">
            Failed to load /stock_list: {stockListError}. Is the backend running on
            <span className="font-mono"> http://localhost:8000</span>?
          </span>
        ) : stockList.length === 0 ? (
          <span>Loading ticker list from API...</span>
        ) : (
          <span>
            {stockList.length} tickers loaded from API. Selected: <strong>{selectedStock || "-"}</strong>
            {newsDateRange ? `; news window ${newsDateRange.start} -> ${newsDateRange.end}` : "; no news range yet"}.
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-row">
        <div className="flex min-h-0 w-2/3 flex-col">
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <h3 className="text-left text-lg font-semibold text-slate-800">
              View 1: Stock Overview Line Chart
            </h3>
            <div className="min-h-0 flex-1 rounded-xl border border-indigo-100 bg-white shadow-md">
              {selectedStock && (
                <LineChart
                  selectedStock={selectedStock}
                  newsDateRange={newsDateRange}
                  alignToNewsWindow={alignNewsWindow}
                />
              )}
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-2">
            <h3 className="text-left text-lg font-semibold text-slate-800">View 2: t-SNE Scatter Plot</h3>
            <div className="min-h-0 flex-1 rounded-xl border border-sky-100 bg-white shadow-md">
              {selectedStock && (
                <TSNEScatter selectedStock={selectedStock} onSelectStock={setSelectedStock} />
              )}
            </div>
          </div>
        </div>
        <div className="flex min-h-0 w-1/3 flex-col p-2">
          <h3 className="text-left text-lg font-semibold text-slate-800">View 3: Recent News</h3>
          <div className="min-h-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 shadow-md">
            {selectedStock && (
              <NewsList selectedStock={selectedStock} onItems={handleNewsItems} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
