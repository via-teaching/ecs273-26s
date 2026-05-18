import { useEffect, useState } from "react";
import LineChart from "./component/LineChart";
import NewsList from "./component/NewsList";
import TSNEScatter from "./component/TSNEScatter";
import RenderOptions from "./component/options";

export default function App() {
  const [stockList, setStockList] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStockList() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("http://localhost:8000/stock_list");
        if (!response.ok) {
          throw new Error("Failed to load stock list.");
        }

        const data: { tickers: string[] } = await response.json();
        if (cancelled) return;

        setStockList(data.tickers);
        setSelectedStock(data.tickers[0] || "");
      } catch (err) {
        if (!cancelled) {
          setStockList([]);
          setSelectedStock("");
          setError(err instanceof Error ? err.message : "Failed to load stock list.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStockList();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="flex h-full items-center justify-center text-gray-500">Loading application...</div>;
  }

  if (error) {
    return <div className="flex h-full items-center justify-center text-red-500">{error}</div>;
  }

  if (!selectedStock) {
    return <div className="flex h-full items-center justify-center text-gray-500">No stock data found.</div>;
  }

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="stock-select" className="mx-2">Select a stock:
          <select
            id="stock-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(event) => setSelectedStock(event.target.value)}
          >
              <RenderOptions stockList={stockList} />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">

          <div className="h-1/2 min-h-[280px] p-2">
            <h3 className="text-left text-xl h-[2rem]">View 1: Stock Overview Line Chart</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-1/2 min-h-[320px] p-2">
            <h3 className="text-left text-xl h-[2rem]">View 2: T-SNE Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
          </div>
          
        </div>
        <div className="w-1/3 h-full p-2">
            <h3 className="text-left text-xl h-[2rem]">View 3: Stock News</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <NewsList selectedStock={selectedStock} />
            </div>
          </div>
        
      </div>
    </div>
    
  );
}
