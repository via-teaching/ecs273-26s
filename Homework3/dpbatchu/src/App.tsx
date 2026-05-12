import { useState } from "react";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";
import { STOCKS } from "./component/option";

export default function App() {
  const [selectedStock, setSelectedStock] = useState<string>(STOCKS[0]);

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">◈</span>
          <h1 className="header-title">StockVis<span className="header-accent">273</span></h1>
        </div>
        <div className="header-center">
          <label className="selector-label">ACTIVE TICKER</label>
          <div className="select-wrapper">
            <select
              className="stock-selector"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              {STOCKS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="select-arrow">▾</span>
          </div>
        </div>
        <div className="header-right">
          <span className="header-tag">ECS 273 · Spring 2026</span>
        </div>
      </header>

      {/* Main grid */}
      <main className="main-grid">
        {/* View 1: Line Chart — top left */}
        <section className="panel panel-linechart">
          <div className="panel-header">
            <span className="panel-label">01</span>
            <h2 className="panel-title">Price Overview — <span className="stock-name">{selectedStock}</span></h2>
          </div>
          <div className="panel-body">
            <LineChart stock={selectedStock} />
          </div>
        </section>

        {/* View 3: News — right */}
        <section className="panel panel-news">
          <div className="panel-header">
            <span className="panel-label">03</span>
            <h2 className="panel-title">News Feed — <span className="stock-name">{selectedStock}</span></h2>
          </div>
          <div className="panel-body panel-body-scroll">
            <NewsList stock={selectedStock} />
          </div>
        </section>

        {/* View 2: t-SNE — bottom left */}
        <section className="panel panel-tsne">
          <div className="panel-header">
            <span className="panel-label">02</span>
            <h2 className="panel-title">t-SNE Projection — Market Clusters</h2>
          </div>
          <div className="panel-body">
            <TSNEScatter selectedStock={selectedStock} onSelectStock={setSelectedStock} />
          </div>
        </section>
      </main>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0a0c10;
          --surface: #111318;
          --surface2: #181c22;
          --border: #252a34;
          --accent: #00d4ff;
          --accent2: #ff6b35;
          --text: #e8eaf0;
          --text-dim: #6b7280;
          --text-muted: #9ca3af;
          --green: #22c55e;
          --red: #ef4444;
          --font-mono: 'IBM Plex Mono', 'Courier New', monospace;
          --font-sans: 'Syne', 'Trebuchet MS', sans-serif;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--font-sans); }

        .app-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
        }

        /* ── Header ── */
        .app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .header-left { display: flex; align-items: center; gap: 10px; }
        .header-logo { color: var(--accent); font-size: 18px; }
        .header-title {
          font-family: var(--font-sans);
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--text);
        }
        .header-accent { color: var(--accent); }
        .header-center { display: flex; align-items: center; gap: 12px; }
        .selector-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          color: var(--text-dim);
        }
        .select-wrapper { position: relative; }
        .stock-selector {
          appearance: none;
          background: var(--surface2);
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 6px 36px 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          outline: none;
          min-width: 100px;
        }
        .stock-selector:hover { background: #1a2030; }
        .select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--accent);
          pointer-events: none;
          font-size: 12px;
        }
        .header-right {}
        .header-tag {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 0.06em;
        }

        /* ── Grid ── */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          grid-template-rows: 1fr 1fr;
          gap: 1px;
          flex: 1;
          overflow: hidden;
          background: var(--border);
        }
        .panel-linechart { grid-column: 1; grid-row: 1; }
        .panel-tsne      { grid-column: 1; grid-row: 2; }
        .panel-news      { grid-column: 2; grid-row: 1 / span 2; }

        /* ── Panel ── */
        .panel {
          display: flex;
          flex-direction: column;
          background: var(--surface);
          overflow: hidden;
        }
        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .panel-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.1em;
          background: rgba(0,212,255,0.1);
          padding: 2px 6px;
          border-radius: 2px;
        }
        .panel-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }
        .stock-name { color: var(--accent); }
        .panel-body {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .panel-body-scroll {
          overflow-y: auto;
          overflow-x: hidden;
        }
        .panel-body-scroll::-webkit-scrollbar { width: 4px; }
        .panel-body-scroll::-webkit-scrollbar-track { background: var(--surface); }
        .panel-body-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
      `}</style>
    </div>
  );
}
