import RenderOptions from "./component/options";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

import { useEffect, useState } from "react";

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState("");

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((data) => {
        setStockList(data.tickers);

        if (data.tickers.length > 0) {
          setSelectedStock(data.tickers[0]);
        }
      });
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row items-center">
        <h2 className="text-left text-2xl">Homework 4</h2>

        <label htmlFor="stock-select" className="mx-2">
          Select Stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full">

        {/* LEFT SIDE */}
        <div className="flex flex-col w-2/3">

          {/* LINE CHART */}
          <div className="h-[45%] p-2">
            <h3 className="text-left text-xl">
              Stock Price Time Series
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-visible">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>

          {/* TSNE */}
          <div className="h-[55%] p-2">
            <h3 className="text-left text-xl h-[2rem]">
              t-SNE Stock Similarity Visualization
            </h3>

            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-hidden">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/3 h-full p-2">

          <h3 className="text-left text-xl h-[2rem]">
            News Articles
          </h3>

          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-hidden">
            <NewsList selectedStock={selectedStock} />
          </div>

        </div>

      </div>
    </div>
  );
}
