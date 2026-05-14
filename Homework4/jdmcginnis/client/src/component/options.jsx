
import {useEffect, useState} from "react";


export default function RenderOptions() {

    const [tickers, setTickers] = useState([]);

useEffect(() => {
    fetch(`http://localhost:8000/stock_list`)
        .then(res => res.json())
        .then(data => {
            setTickers(data.tickers);
        })
}, []);

    return tickers.map((ticker, index) => (
          <option key = {index} value = {ticker}>
              {ticker}
          </option>
      ));
}