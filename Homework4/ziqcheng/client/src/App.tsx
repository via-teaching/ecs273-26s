import RenderOptions from "./component/options";
import { useEffect, useState } from "react";
import NewsList from "./component/NewsList";
import LineChart from "./component/LineChart";
import TsneScatter from "./component/TsneScatter";

export default function App() {
  const [stockList, setStockList] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [priceData, setPriceData] = useState<any[]>([]);
  const [newsData, setNewsData] = useState<any[]>([]);
  const [tsneData, setTsneData] = useState<any[]>([]);

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/stocks")
    .then((res) => res.json())
    .then((data) => {
      console.log("stock list response:", data);

      const stocks = data.stocks ?? [];
      setStockList(stocks);

      if (stocks.length > 0) {
        setSelectedStock(stocks[0]);
      }
    })
    .catch((err) => {
      console.error("Failed to fetch stock list:", err);
    });

  fetch("http://127.0.0.1:8000/api/tsne")
    .then((res) => res.json())
    .then((data) => {
      console.log("tsne response:", data);
      setTsneData(data.data ?? []);
    })
    .catch((err) => console.error("Failed to fetch tsne:", err));
}, []);

useEffect(() => {
  if (!selectedStock) return;

  fetch(`http://127.0.0.1:8000/api/stocks/${selectedStock}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("price response:", data);
      setPriceData(data.records ?? []);
    })
    .catch((err) => console.error("Failed to fetch price data:", err));

  fetch(`http://127.0.0.1:8000/api/news/${selectedStock}`)
    .then((res) => res.json())
    .then((data) => {
      console.log("news response:", data);
      setNewsData(data.news ?? []);
    })
    .catch((err) => console.error("Failed to fetch news data:", err));
}, [selectedStock]);





  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>

        <label htmlFor="bar-select" className="mx-2">
          Select a stock:
        </label>

        <select
          id="bar-select"
          className="bg-white text-black p-2 rounded mx-2"
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          <RenderOptions stockList={stockList} />
        </select>
      </header>

      <div className="p-2">
        <p>Selected stock: {selectedStock}</p>
        <p>Number of stocks loaded: {stockList.length}</p>
      </div>

<div className="p-3 grid grid-cols-3 gap-4 h-[calc(100vh-90px)]">
  {/* Left side: View 1 and View 2 */}
  <div className="col-span-2 grid grid-rows-[280px_1fr] gap-4 min-h-0">
    {/* View 1 */}
    <div className="min-h-0">
      <h3 className="text-left text-xl mb-2">View 1 Stock Line Chart</h3>
      <div className="border-2 border-gray-300 rounded-xl h-[240px] overflow-hidden bg-slate-100">
        <LineChart data={priceData} selectedStock={selectedStock} />
      </div>
    </div>

    {/* View 2 */}
    <div className="min-h-0">
      <h3 className="text-left text-xl mb-2">View 2 t-SNE Scatter Plot</h3>
      <div className="border-2 border-gray-300 rounded-xl h-full overflow-hidden bg-slate-100">
        <TsneScatter data={tsneData} selectedStock={selectedStock} />
      </div>
    </div>
  </div>

  {/* Right side: View 3 */}
  <div className="min-h-0">
    <h3 className="text-left text-xl mb-2">View 3 News List</h3>
    <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2.5rem)] overflow-hidden bg-slate-100">
      <NewsList data={newsData} selectedStock={selectedStock} />
    </div>
  </div>
</div>
    </div>
  );
}