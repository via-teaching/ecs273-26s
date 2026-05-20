import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { NewsList } from "./component/NewsList";
import { TSNEScatter } from "./component/TSNEScatter";
import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  // Add states for keeping data from API
  const [stockList, setStockList] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [tsneData, setTsneData] = useState([]);

  // Get stock_list and s-sne
  useEffect(() => {
    // stock_list
    fetch(`${API_URL}/stock_list`)
      .then((res) => res.json())
      .then((data) => setStockList(data.tickers))
      .catch((err) => console.error("Failed to fetch stock list:", err));

    // t-SNE
    fetch(`${API_URL}/tsne/`)
      .then((res) => res.json())
      .then((data) => setTsneData(data))
      .catch((err) => console.error("Failed to fetch t-SNE data:", err));
  }, []); 

  
  // Get selected stock data and news
  useEffect(() => {
    if (!selectedStock) return; 

    // stock data
    fetch(`${API_URL}/stock/${selectedStock}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          console.error(data.detail); // msg from API
          setStockData(null);
        } else {
          setStockData(data);
        }
      })
      .catch((err) => console.error("Failed to fetch stock data:", err));

    // news
    fetch(`${API_URL}/stocknews/${selectedStock}`)
      .then((res) => res.json())
      .then((data) => setNewsData(data))
      .catch((err) => console.error("Failed to fetch news data:", err));
  }, [selectedStock]); 

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row items-center">
        <h2 className="text-left text-2xl">Stock Dashboard</h2>
        <label htmlFor="bar-select" className="mx-2 my-auto">
          Select a stock:
          <select
            id="bar-select"
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
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">Stock price history</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <LineChart data={stockData} selectedStock={selectedStock} />
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">t-SNE stock map</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter data={tsneData} selectedStock={selectedStock} />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">News</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-y-auto">
            <NewsList articles={newsData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
