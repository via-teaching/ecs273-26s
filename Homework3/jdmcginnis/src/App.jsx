import RenderOptions from "./component/options";
import LineChart from "./component/LineChart_ViewOne";
import { useState } from "react";
import ScatterPlot from "./component/ScatterPlot.jsx";
import StockNews from "./component/StockNews.jsx";

function App() {

  // Holds the selected ticker
  const [selectedTicker, setSelectedTicker] = useState(null);  // fix 2

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 3</h2>

        {/*Ticker Selection Drop-Down Menu!*/}
        <label htmlFor="ticker-select" className="mx-2">
          Select a ticker:
          <select
            id="ticker-select"
            className="bg-white text-black p-2 rounded mx-2"
            onChange = {(e) => setSelectedTicker(e.target.value)}
          >

            <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl">
              {selectedTicker ? `Stock Price Overview - ${selectedTicker}` : "Stock Overview"}
            </h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)]">
              <LineChart ticker = {selectedTicker}/>
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-xl h-8">
              {"T-SNE Scatter Plot"}
            </h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)]">
              <ScatterPlot selectedTicker = {selectedTicker}/>
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-xl h-8">
            {selectedTicker ? `Very Interesting Stonk News:  ${selectedTicker}` : "Stock News"}
          </h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%-2rem)]">
            <StockNews selectedTicker = {selectedTicker}/>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
