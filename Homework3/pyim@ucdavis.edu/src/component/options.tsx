import { Bar } from "../types";

const stockData: { data: CategoricalBar[] } = {
  "data": [
      {
          "value": 229.66,
          "category": "AAPL"
      },
      {
          "value": 44.5,
          "category": "BAC"
      },
      {
          "value": 431.22,
          "category": "CAT"
      },
      {
          "value": 150.12,
          "category": "CVX"
      },
      {
          "value": 55.23,
          "category": "DAL"
      },
      {
          "value": 209.61,
          "category": "GOOGL"
      },
      {
          "value": 634.4,
          "category": "GS"
      },
      {
          "value": 27.69,
          "category": "HAL"
      },
      {
          "value": 168.73,
          "category": "JNJ"
      },
      {
          "value": 253.63,
          "category": "JPM"
      },
      {
          "value": 66.75,
          "category": "KO"
      },
      {
          "value": 290.72,
          "category": "MCD"
      },
      {
          "value": 612.17,
          "category": "META"
      },
      {
          "value": 138.12,
          "category": "MMM"
      },
      {
          "value": 439.97,
          "category": "MSFT"
      },
      {
          "value": 70.57,
          "category": "NKE"
      },
      {
          "value": 145.63,
          "category": "NVDA"
      },
      {
          "value": 24.62,
          "category": "PFE"
      },
      {
          "value": 417.78,
          "category": "UNH"
      },
      {
          "value": 114.3,
          "category": "XOM"
      }
  ]
}

// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
    category: string;
}

export default function RenderOptions() {
  const bars: CategoricalBar[] = stockData.data;
  return bars.map((bar, index) => (
    <option key={index} value={bar.category}>
      {bar.category}
    </option>
  ));
}