import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { ScatterPlot } from "./component/ScatterPlot";
import { NewsList } from "./component/NewsList";
import { useEffect, useState } from "react";

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState("AAPL");

  useEffect(() => {
    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((data) => setStockList(data.tickers));
  }, []);

  return (
    <div className="flex flex-col h-full w-full">

      {/* HEADER */}
      <header className="bg-zinc-400 text-white p-2 flex flex-row items-center">
        <h2 className="text-left text-2xl">Homework 4</h2>

        <label htmlFor="bar-select" className="mx-2 flex items-center">
          Select a category:

          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
          >
            <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3 h-full">
          <div className="h-[40%] p-2 flex flex-col">
            <h3 className="text-left text-xl shrink-0">
              Stock Price Overview
            </h3>

            <div className="flex-1 border-2 border-gray-300 rounded-xl min-h-0">
              <LineChart ticker={selectedTicker} />
            </div>
          </div>
          <div className="h-[60%] p-2 flex flex-col">
            <h3 className="text-left text-xl shrink-0">
              t-SNE Visualization
            </h3>

            <div className="flex-1 border-2 border-gray-300 rounded-xl min-h-0">
              <ScatterPlot ticker={selectedTicker} />
            </div>
          </div>

        </div>
        <div className="w-1/3 h-full p-2 flex flex-col">

          <h3 className="text-left text-xl shrink-0">
            News Feed
          </h3>

          <div className="flex-1 border-2 border-gray-300 rounded-xl min-h-0">
            <NewsList ticker={selectedTicker} />
          </div>

        </div>

      </div>
    </div>
  );
}