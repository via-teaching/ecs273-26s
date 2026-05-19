

import { LineChart } from "./component/lineChart";    
import RenderOptions from "./component/options";
import { TSNEScatter } from "./component/scatterPlot";
import { NewsList } from "./component/newsList";
// A "extends" B means A inherits the properties and methods from B.


export default function App() {
  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row align-center">
        <h2 className="text-left text-2xl">Homework 4</h2>
        <label htmlFor="bar-select" className="mx-2">Select a category:
          <select id = 'bar-select' className="bg-white text-black p-2 rounded mx-2">
              <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full">
        <div className="flex flex-col w-2/3">

          <div className="h-1/4 p-2">
            <h3 className="text-left text-xl">Stock Overview Line Chart</h3>
            <div className="border-2 border-gray-300 rounded-xl">
              <LineChart />
            </div>
          </div>
          <div className="h-3/4 p-2">
            <h3 className="text-left text-xl h-[2rem]"> T-SNE Scatter Plot</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <TSNEScatter />
            </div>
          </div>
          
        </div>
        <div className="w-1/3 h-full p-2">
            <h3 className="text-left text-xl h-[2rem]">List of News</h3>
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)]">
              <NewsList />
            </div>
          </div>

        </div>
      </div>
    
  );
}
