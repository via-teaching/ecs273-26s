import { useState } from "react";
import RenderOptions from "./component/options";
import {StockLineChart} from "./component/StockLineChart";
import {TsnePlot} from "./component/TsnePlot";
import {NewsList} from "./component/NewsList";

function App() {
  const [selectedStock, setSelectedStock] = useState("AAPL");

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100">
      <header className="bg-zinc-500 text-white p-1 px-3 flex flex-row items-center shadow-sm">
        <h2 className="text-left text-lg font-bold mr-6">HW3</h2>
        <div className="flex items-center text-sm">
          <label htmlFor="bar-select" className="mx-2">Stock:</label>
          <select
            id="bar-select"
            className="bg-white text-black p-0.5 rounded border border-zinc-400 outline-none"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            <RenderOptions />
          </select>
        </div>
      </header>
      
      {/* Main Container - Added p-1 and gap-1 */}
      <div className="flex flex-row flex-1 w-full overflow-hidden p-1 gap-1">
        
        {/* Left Column (Charts) */}
        <div className="flex flex-col w-2/3 h-full">
          
          <div className="h-1/2 p-1 flex flex-col overflow-hidden">
            <h3 className="text-left text-sm font-bold text-zinc-600 ml-1">
              Stock Overview: {selectedStock}
            </h3>
            <div className="flex-1 border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <StockLineChart selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-1/2 p-1 flex flex-col overflow-hidden">
            <h3 className="text-left text-sm font-bold text-zinc-600 ml-1">
              T-SNE Analysis
            </h3>
            <div className="flex-1 border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
              <TsnePlot selectedStock={selectedStock} />
            </div>
          </div>
        </div>

        <div className="w-1/3 h-full p-1 flex flex-col overflow-hidden">
          <h3 className="text-left text-sm font-bold text-zinc-600 ml-1">
            News Feed: {selectedStock}
          </h3>
          <div className="flex-1 border border-gray-300 rounded-lg bg-white overflow-y-auto shadow-sm">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;