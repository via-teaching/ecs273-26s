import { useEffect, useState } from "react";
import { BarChart } from "./component/example";
import { TSNEScatterPlot } from "./component/TSNEScatterPlot";
import { NewsList } from "./component/NewsList";

const API_BASE = "http://127.0.0.1:8000";

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/stock_list`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch stock list");
        }
        return res.json();
      })
      .then((data) => {
        const tickers = data.tickers || [];
        setStockList(tickers);

        if (tickers.length > 0) {
          setSelectedStock(tickers[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching stock list:", err);
      });
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>

        <label htmlFor="stock-select" className="mx-2">
          Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            {stockList.map((ticker) => (
              <option key={ticker} value={ticker}>
                {ticker}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">
              Stock Overview Line Chart
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-full overflow-x-auto">
              {selectedStock && (
                <BarChart
                  selectedStock={selectedStock}
                  apiBase={API_BASE}
                />
              )}
            </div>
          </div>

          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">
              t-SNE Scatter Plot
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              {selectedStock && (
                <TSNEScatterPlot
                  selectedStock={selectedStock}
                  apiBase={API_BASE}
                />
              )}
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">
            List of News
          </h3>

          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)]">
            {selectedStock && (
              <NewsList
                selectedStock={selectedStock}
                apiBase={API_BASE}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}