import { useEffect, useState } from 'react';
import LineChart from './component/LineChart';
import NewsList from './component/NewsList';
import TSNEScatter from './component/TSNEScatter';
import { stockOptions as fallbackOptions } from './component/options';
import { loadStockOptions } from './data/loaders';
import type { StockOption } from './types';

function App() {
  const [stockOptions, setStockOptions] = useState<StockOption[]>(fallbackOptions);
  const [selectedTicker, setSelectedTicker] = useState(fallbackOptions[0].ticker);

  useEffect(() => {
    let cancelled = false;
    loadStockOptions().then((options) => {
      if (cancelled || options.length === 0) return;
      setStockOptions(options);
      setSelectedTicker((current) =>
        options.some((opt) => opt.ticker === current) ? current : options[0].ticker,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedStock = stockOptions.find((stock) => stock.ticker === selectedTicker);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ECS 273 Homework 4</p>
          <h1>Full-Stack Stock Explorer</h1>
          <p className="hero-copy">
            Select a stock to update the price overview, t-SNE position, and related news.
            Data is served by the FastAPI + MongoDB backend.
          </p>
        </div>
        <label className="stock-select">
          <span>Stock selector</span>
          <select value={selectedTicker} onChange={(event) => setSelectedTicker(event.target.value)}>
            {stockOptions.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker} - {stock.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="dashboard" aria-label={`Visualizations for ${selectedTicker}`}>
        <div className="left-column">
          <section className="panel line-panel">
            <LineChart selectedTicker={selectedTicker} selectedName={selectedStock?.name ?? selectedTicker} />
          </section>
          <section className="panel scatter-panel">
            <TSNEScatter selectedTicker={selectedTicker} />
          </section>
        </div>
        <section className="panel news-panel">
          <NewsList selectedTicker={selectedTicker} selectedName={selectedStock?.name ?? selectedTicker} />
        </section>
      </section>
    </main>
  );
}

export default App;
