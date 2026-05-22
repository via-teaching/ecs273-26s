import { useState } from "react";
import RenderOptions from "./component/options";
import LineChart from "./component/LineChart";
import TSNEScatter from "./component/TSNEScatter";
import NewsList from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="view min-h-screen w-full overflow-x-hidden">
      <div className="h-[64px] bg-gray-400 flex items-center px-3 gap-2">
        <h1 className="text-white !text-[28px] font-normal m-0">Homework 4</h1>
        <RenderOptions
          selectedStock={selectedStock}
          setSelectedStock={setSelectedStock}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 p-2 min-h-[calc(100vh-64px)]">
        <div className="flex flex-col gap-3 min-w-0">
          <div>
            <h2 className="text-[22px] font-normal mb-1">
              Stock Overview Line Chart
            </h2>
            <div className="border border-slate-300 rounded-xl p-1 overflow-x-auto">
              <LineChart selectedStock={selectedStock} />
            </div>
          </div>
          <div>
            <h2 className="text-[22px] font-normal mb-1">
              T-SNE Scatter Plot
            </h2>
            <div className="border border-slate-300 rounded-xl p-1 overflow-x-auto">
              <TSNEScatter
                selectedStock={selectedStock}
                setSelectedStock={setSelectedStock}
              />
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="text-[22px] font-normal mb-1">News List</h2>
          <div className="border border-slate-300 rounded-xl p-2 h-[calc(100vh-115px)] overflow-y-auto overflow-x-hidden">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;