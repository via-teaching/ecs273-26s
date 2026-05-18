import { useEffect, useState } from "react";

import { LineChart } from "./component/LineChart";
import { NewsList } from "./component/NewsList";
import RenderOptions from "./component/options";
import { TSNEScatter } from "./component/TSNEScatter";
import { fetchNewsItems, fetchStockSeries, fetchStockTickers, fetchTSNEPoints } from "./data";
import { NewsItem, StockPriceRow, TSNEPoint } from "./types";

export default function App() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("");
  const [stockSeries, setStockSeries] = useState<StockPriceRow[]>([]);
  const [tsnePoints, setTSNEPoints] = useState<TSNEPoint[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoading(true);
        const [tickerList, points] = await Promise.all([fetchStockTickers(), fetchTSNEPoints()]);
        setTickers(tickerList);
        setSelectedTicker(tickerList[0] ?? "");
        setTSNEPoints(points);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedTicker) {
      setStockSeries([]);
      setNewsItems([]);
      return;
    }

    async function loadTickerData() {
      try {
        const [series, news] = await Promise.all([fetchStockSeries(selectedTicker), fetchNewsItems(selectedTicker)]);
        setStockSeries(series);
        setNewsItems(news);
        setErrorMessage(null);
      } catch (error) {
        setStockSeries([]);
        setNewsItems([]);
        setErrorMessage(error instanceof Error ? error.message : `Unable to load ${selectedTicker}.`);
      }
    }

    void loadTickerData();
  }, [selectedTicker]);

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
            disabled={!tickers.length}
            value={selectedTicker}
            onChange={(event) => setSelectedTicker(event.target.value)}
          >
            <RenderOptions tickers={tickers} />
          </select>
        </label>
      </header>
      {isLoading ? (
        <div className="glass-panel mb-4 rounded-2xl px-4 py-3 text-sm text-slate-100">Loading dashboard data...</div>
      ) : null}
      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-300/40 bg-red-500/15 px-4 py-3 text-sm text-red-100">{errorMessage}</div>
      ) : null}
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
              <LineChart series={stockSeries} />
            </div>
          </div>
          <div className="flex min-h-[24rem] flex-1 flex-col">
            <div className="mb-3 px-1">
              <h3 className="text-left text-xl font-semibold tracking-tight text-white">View 2: T-SNE Scatter Plot</h3>
              <p className="text-sm text-slate-300">Explore how each stock clusters.</p>
            </div>
            <div className="glass-panel min-h-0 flex-1 rounded-[1.5rem] p-3 text-slate-800">
              <TSNEScatter selectedTicker={selectedTicker} points={tsnePoints} />
            </div>
          </div>
        </div>
        <div className="flex min-h-[32rem] w-full flex-col xl:min-h-0 xl:w-1/3">
          <div className="mb-3 px-1">
            <h3 className="text-left text-xl font-semibold tracking-tight text-white">View 3: Stock News</h3>
            <p className="text-sm text-slate-300">Open headlines and article summaries for the active ticker.</p>
          </div>
          <div className="glass-panel min-h-0 flex-1 rounded-[1.5rem] p-3 text-slate-900">
            <NewsList ticker={selectedTicker} items={newsItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
