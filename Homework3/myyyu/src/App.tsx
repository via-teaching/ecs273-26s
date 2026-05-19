import { useState } from 'react';
import LineChart from './component/LineChart';
import NewsList from './component/NewsList';
import TSNEScatter from './component/TSNEScatter';
import { stockOptions } from './component/options';

function App() {
  const [selectedTicker, setSelectedTicker] = useState(stockOptions[0].ticker);
  const selectedStock = stockOptions.find((stock) => stock.ticker === selectedTicker);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">ECS 273 Homework 3</p>
          <h1>D3 Interactive Stock Explorer</h1>
          <p className="hero-copy">
            Select a stock to update the price overview, t-SNE position, and related news.
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
