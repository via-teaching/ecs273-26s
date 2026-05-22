import RenderOptions from "./component/options";
import { LineChart } from "./component/LineChart";
import { NewsList } from "./component/NewsList";
import { TSNEScatter } from "./component/TSNEScatter";
function App() {
  return (
    <div className="flex flex-col h-full w-full bg-slate-100">
      <header className="bg-slate-800 text-white p-2 flex flex-row align-center gap-4 shadow-md">
        <h2 className="text-left text-2xl font-semibold tracking-wide">Homework 3 Stock Analysis</h2>
        <label htmlFor="bar-select" className="flex items-center gap-2 text-slate-200">
          Select a stock:
          <select
            id="bar-select"
            className="bg-slate-100 text-slate-800 p-1.5 rounded border border-slate-300 mx-2"
          >
            <RenderOptions />
          </select>
        </label>
      </header>
      <div className="flex flex-row h-full w-full overflow-hidden">
        <div className="flex flex-col w-2/3">
          <div className="h-1/2 p-2">
            <h3 className="text-left text-base font-medium text-slate-600 h-8">
              Line chart of the selected stock's Open, High, Low, and Close prices over time
            </h3>
            <div className="border border-slate-300 rounded-xl bg-white shadow-sm h-[calc(100%_-_2rem)]">
              <LineChart />
            </div>
          </div>
          <div className="h-1/2 p-2">
            <h3 className="text-left text-base font-medium text-slate-600 h-8">
              t-SNE scatterplot of the each stock's daily Open, High, Low, and Close prices
            </h3>
            <div className="border border-slate-300 rounded-xl bg-white shadow-sm h-[calc(100%_-_2rem)]">
              <TSNEScatter />
            </div>
          </div>
        </div>
        <div className="w-1/3 h-full p-2">
          <h3 className="text-left text-base font-medium text-slate-600 h-8">
            News articles related to the selected stock
          </h3>
          <div className="border border-slate-300 rounded-xl bg-white shadow-sm h-[calc(100%-2rem)]">
            <NewsList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
