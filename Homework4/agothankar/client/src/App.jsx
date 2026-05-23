import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:8000";

function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/stock_list`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Stock list not found. Run the MongoDB import script first.");
        }
        return res.json();
      })
      .then(data => {
        const tickers = data.tickers || [];
        setStockList(tickers);
        setSelectedStock(tickers[0] || "");
        setError("");
      })
      .catch(err => {
        console.error("Error loading stock list:", err);
        setStockList([]);
        setSelectedStock("");
        setError(err.message);
      });
  }, []);

  const handleStockChange = (e) => {
    setSelectedStock(e.target.value);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      <header className="flex flex-row items-center bg-zinc-400 p-2 text-white">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="stock-select" className="mx-2 ml-4">
          Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={handleStockChange}
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>
      {error && (
        <div className="flex flex-1 items-center justify-center p-4 text-gray-500">
          {error}
        </div>
      )}
      {!error && (
      <div className="flex min-h-0 w-full flex-1 flex-row overflow-hidden">
        <div className="flex min-h-0 w-2/3 flex-col">
          <div className="flex min-h-0 basis-[48%] flex-col p-2">
            <h3 className="h-8 shrink-0 text-left text-xl">Stock Overview - {selectedStock}</h3>
            <div className="min-h-0 flex-1 rounded-xl border-2 border-gray-300">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col p-2 pt-0">
            <h3 className="h-8 shrink-0 text-left text-xl">t-SNE Scatter Plot</h3>
            <div className="min-h-0 flex-1 rounded-xl border-2 border-gray-300">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        <div className="flex min-h-0 w-1/3 flex-col p-2">
          <h3 className="h-8 shrink-0 text-left text-xl">News for {selectedStock}</h3>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border-2 border-gray-300">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;
