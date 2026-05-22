import RenderOptions from "./component/options";
import StockLineChart from "./component/stock_overview_line_chart";
import TSNEPlot from "./component/t-sne_scatter_plot";
import NewsList from "./component/news_list";
import { useEffect, useState } from "react";

export default function App() {
  const [stockList, setStockList] = useState([]);
  const [selectedStock, setSelectedStock] = useState("AAPL");

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
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a category:
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
          <div className="h-[32%] p-2">
            <h3 className="text-left text-xl">Stock Overview Line Chart</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-hidden">
              <StockLineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-[68%] p-2">
            <h3 className="text-left text-xl h-[2rem]">T-SNE Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-hidden">
              <TSNEPlot selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-[2rem]">News List</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-y-auto">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}