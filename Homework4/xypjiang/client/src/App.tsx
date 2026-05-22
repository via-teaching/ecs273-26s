import RenderOptions from "./component/options";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";
import { useState, useEffect } from "react"; 

export default function App() {
  const [selectedStock, setSelectedStock] = useState<string>("XOM");
  const [stockList, setStockList] = useState<string[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/stock_list')
      .then(res => res.json())
      .then(data => {
        setStockList(data.tickers);
      })
      .catch(err => console.error("Error fetching stock list:", err));
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2> 
        <label htmlFor="bar-select" className="mx-2">Select a stock:
          <select id='bar-select' className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock} onChange={(e) => setSelectedStock(e.target.value)}>
              <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">

          <div className="h-2/4 p-2">
            <h3 className="text-left text-xl">Line Chart for {selectedStock}</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_1rem)]">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-2/4 p-2">
            <h3 className="text-left text-xl h-[2rem]">Tsne Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>
          
        </div>
        <div className="w-1/3 h-full p-2">
            <h3 className="text-left text-xl h-[2rem]">News for {selectedStock}</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-y-auto">
              <NewsList selectedStock={selectedStock} />
            </div>
          </div>
        
      </div>
    </div>
  );
}