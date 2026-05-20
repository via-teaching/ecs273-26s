import { JSX, useEffect, useState } from "react";
import { API_BASE_URL } from "../config";
import { Bar } from "../types";

// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
    category: string;
}

async function fetchStockList(): Promise<string[]> {
    try {
        const stock_list_response = await fetch(`${API_BASE_URL}stock_list/`);
        const { tickers = [] }: { tickers: string[] } = await stock_list_response.json();
        if (!tickers || tickers.length === 0) {
            throw new Error("No stocks found in stock list");
        }

        return tickers;
    } catch (error) {
        console.error("Error fetching stock list:", error);
        return [];
    }
}

export default function RenderOptions(): JSX.Element {
  const [bars, setBars] = useState<CategoricalBar[]>([]);

  useEffect(() => {
    fetchStockList().then((tickers) => {
        const fetchedBars: CategoricalBar[] = tickers.map((ticker, index) => ({
            category: ticker,
            value: index
        })).sort((a, b) => a.category.localeCompare(b.category));
        
        setBars(fetchedBars);
    }).catch((error) => {
        console.error("Error loading stock list:", error);
    });
  }, []);

  return (
    <>
      {bars.map((bar, index) => (
        <option key={index} value={bar.category}>
          {bar.category}
        </option>
      ))}
    </>
  );
}