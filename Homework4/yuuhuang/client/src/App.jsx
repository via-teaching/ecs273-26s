import { useState, useEffect } from "react";
import { LineChart }   from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList }    from "./component/NewsList";

const S = {
  root: {
    display: "flex", flexDirection: "column",
    height: "100%", width: "100%", background: "#f1f5f9",
  },
  header: {
    display: "flex", flexDirection: "row", alignItems: "center",
    gap: "16px", padding: "8px 20px", flexShrink: 0,
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
    color: "white",
  },
  divider: { width: "1px", height: "28px", background: "#334155" },
  select: {
    background: "#1e293b", color: "white",
    border: "1px solid #334155", borderRadius: "6px",
    padding: "4px 10px", fontSize: "13px", cursor: "pointer",
  },
  badge: {
    background: "#2563eb", color: "white",
    fontSize: "12px", fontWeight: 700,
    padding: "2px 10px", borderRadius: "999px",
  },
  body: {
    display: "flex", flexDirection: "row",
    flex: "1 1 0", overflow: "hidden",
    padding: "12px", gap: "12px",
    minHeight: 0,
  },
  leftCol: {
    display: "flex", flexDirection: "column",
    flex: "1 1 0", gap: "12px", minWidth: 0,
  },
  card: {
    display: "flex", flexDirection: "column",
    flex: "1 1 0", minHeight: 0,
    background: "white", borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex", flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    padding: "7px 16px", flexShrink: 0,
    borderBottom: "1px solid #f1f5f9",
  },
  cardBody: { flex: "1 1 0", minHeight: 0 },
  newsCol: {
    width: "33%", flexShrink: 0,
    display: "flex", flexDirection: "column",
    background: "white", borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
};

export default function App() {
  const [ticker,  setTicker]  = useState("AAPL");
  const [tickers, setTickers] = useState([]);

  useEffect(() => {
    fetch("/stock_list")
      .then((r) => r.json())
      .then((d) => setTickers(d.tickers))
      .catch(() => {});
  }, []);

  return (
    <div style={S.root}>

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
          <span style={{ fontSize: "15px", fontWeight: 700 }}>Stock Analytics</span>
          <span style={{ fontSize: "11px", color: "#64748b" }}>ECS 273 · Homework 4</span>
        </div>

        <div style={S.divider} />

        <label htmlFor="stock-select" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
          Ticker
          <select id="stock-select" value={ticker} onChange={(e) => setTicker(e.target.value)} style={S.select}>
            {tickers.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <span style={S.badge}>{ticker}</span>
      </header>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* Left column: two charts stacked */}
        <div style={S.leftCol}>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>Price History</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>{ticker}</span>
              </div>
              <span style={{ fontSize: "10px", color: "#cbd5e1" }}>Open · High · Low · Close</span>
            </div>
            <div style={S.cardBody}>
              <LineChart ticker={ticker} />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>t-SNE Projection</span>
              <span style={{ fontSize: "10px", color: "#cbd5e1" }}>scroll to zoom · click a point to select</span>
            </div>
            <div style={S.cardBody}>
              <TSNEScatter ticker={ticker} onSelect={setTicker} />
            </div>
          </div>
        </div>

        {/* Right column: news */}
        <div style={S.newsCol}>
          <NewsList ticker={ticker} />
        </div>

      </div>
    </div>
  );
}
