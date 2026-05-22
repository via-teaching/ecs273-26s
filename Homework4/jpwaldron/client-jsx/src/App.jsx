import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { TSNEScatter } from "./component/TSNEScatter";
import NewsList from "./component/NewsList";
import { useEffect, useState } from "react";

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState("AAPL");

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((data) => setStockList(data.tickers));
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a stock:
          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-1/4 p-2">
            <h3 className="text-left text-xl">Stock Price</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart ticker={selectedStock} />
            </div>
          </div>
          <div className="h-3/4 p-2">
            <h3 className="text-left text-xl h-[2rem]">t-SNE Scatter</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter ticker={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-[2rem]">News</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
            <NewsList ticker={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}