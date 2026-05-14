import { useState } from "react";
import { LineChart } from "./component/LineChart";
import RenderOptions from "./component/options";
import { TSNEScatter } from "./component/TSNEScatter";
import { NewsList } from "./component/NewsList";
// A "extends" B means A inherits the properties and methods from B.

export default function App() {
    const [selectedTicker, setSelectedTicker] = useState("AAPL");

    return (
        <div className="flex h-full w-full min-h-0 flex-col overflow-hidden">
            <header className="bg-zinc-400 text-white p-2 flex flex-row align-center shrink-0">
                <h2 className="text-left text-2xl">Homework 3</h2>
                <label htmlFor="bar-select" className="mx-2">
                    Select a category:
                    <select
                        id="bar-select"
                        className="bg-white text-black p-2 rounded mx-2"
                        value={selectedTicker}
                        onChange={(event) =>
                            setSelectedTicker(event.target.value)
                        }
                    >
                        <RenderOptions />
                    </select>
                </label>
            </header>
            <div className="flex flex-1 min-h-0 w-full flex-row">
                <div className="flex min-h-0 w-2/3 flex-col">
                    <div className="h-3/8 min-h-0 p-2">
                        <h3 className="text-left text-xl">
                            Stock Overview Line Chart
                        </h3>
                        <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] min-h-0">
                            <LineChart selectedTicker={selectedTicker} />
                        </div>
                    </div>
                    <div className="h-5/8 min-h-0 p-2">
                        <h3 className="text-left text-xl h-[2rem]">
                            t-SNE Scatter Plot
                        </h3>
                        <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] min-h-0">
                            <TSNEScatter selectedTicker={selectedTicker} />
                        </div>
                    </div>
                </div>
                <div className="w-1/3 h-full min-h-0 p-2">
                    <h3 className="text-left text-xl h-[2rem]">List of News</h3>
                    <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] min-h-0">
                        <NewsList selectedTicker={selectedTicker} />
                    </div>
                </div>
            </div>
        </div>
    );
}
