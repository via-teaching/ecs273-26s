import { useState } from "react";
import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";
import "./index.css";

export default function App() {
  const [ticker, setTicker] = useState("NVDA");

  return (
    <div className="app-container">
      <header className="app-header">
        <label htmlFor="ticker-select">Stock:&nbsp;</label>
        <select
          id="ticker-select"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
        >
          <RenderOptions />
        </select>
      </header>

      <div className="grid">
        <div className="view view-1">
          <LineChart ticker={ticker} />
        </div>
        <div className="view view-2">
          <TSNEScatter ticker={ticker} />
        </div>
        <div className="view view-3">
          <NewsList ticker={ticker} />
        </div>
      </div>
    </div>
  );
}