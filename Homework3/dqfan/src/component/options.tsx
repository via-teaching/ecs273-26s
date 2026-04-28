import Data from "../../data/demo.json";

import { Bar } from "../types";

// A "extends" B means A inherits the properties and methods from B.
interface CategoricalBar extends Bar{
    category: string;
}


export default function RenderOptions() {
  const bars: CategoricalBar[] = Data.data;
  return bars.map((bar, index) => (
    <option key={index} value={bar.category}>
      {bar.category}
    </option>
  ));
  }