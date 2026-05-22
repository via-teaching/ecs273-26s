import RenderOptions from "./component/options";
import StockLineChart from "./component/stock_overview_line_chart";
import TSNEPlot from "./component/t-sne_scatter_plot";
import NewsList from "./component/news_list";
import { useState } from "react";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");
  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>
        <label htmlFor="bar-select" className="mx-2">
          Select a category:
          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-[calc(100vh-60px)] w-full overflow-hidden">
        <div className="flex flex-col w-2/3 h-full overflow-hidden">
          <div className="h-1/2 p-2 flex flex-col">
            <h3 className="text-left text-xl">Stock Overview Line Chart</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)] overflow-hidden">
              <StockLineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-1/2 p-2 flex flex-col">
            <h3 className="text-left text-xl h-8">T-SNE Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)] overflow-hidden">
              <TSNEPlot selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2 overflow-hidden flex flex-col">
          <h3 className="text-left text-xl h-8">News List</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)] overflow-y-auto">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
