import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function TSNEScatter({ selectedStock, setSelectedStock }) {
  const ref = useRef();

  useEffect(() => {
    if (!selectedStock) return;

    let cancelled = false;

    d3.select(ref.current).selectAll("*").remove();

    fetch("http://localhost:8000/stock_list")
      .then((res) => res.json())
      .then((stockListData) => {
        const tickers = stockListData.tickers;

        return Promise.all(
          tickers.map((ticker) =>
            fetch(`http://localhost:8000/tsne/?stock_name=${ticker}`)
              .then((res) => res.json())
          )
        );
      })
      .then((tsnePoints) => {
        if (cancelled) return;

        d3.select(ref.current).selectAll("*").remove();

        const sectorLookup = {
          XOM: "Energy",
          CVX: "Energy",
          HAL: "Energy",

          MMM: "Industrials",
          CAT: "Industrials",
          DAL: "Industrials",

          MCD: "Consumer",
          NKE: "Consumer",
          KO: "Consumer",

          JNJ: "Healthcare",
          PFE: "Healthcare",
          UNH: "Healthcare",

          JPM: "Financials",
          GS: "Financials",
          BAC: "Financials",

          AAPL: "Technology",
          MSFT: "Technology",
          NVDA: "Technology",
          GOOGL: "Technology",
          META: "Technology",
        };

        const data = tsnePoints
          .filter((d) => d && d.Stock && d.x !== undefined && d.y !== undefined)
          .map((d) => ({
            ticker: d.Stock,
            x: +d.x,
            y: +d.y,
            sector: sectorLookup[d.Stock] || "Unknown",
          }));

        const margin = { top: 30, right: 150, bottom: 50, left: 60 };
        const width = 760;
        const height = 285;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3
          .select(ref.current)
          .append("svg")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%")
          .attr("height", height);

        const chart = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d.x))
          .nice()
          .range([0, innerWidth]);

        const y = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => d.y))
          .nice()
          .range([innerHeight, 0]);

        const sectors = Array.from(new Set(data.map((d) => d.sector)));

        const color = d3
          .scaleOrdinal()
          .domain(sectors)
          .range(d3.schemeTableau10);

        const xAxis = chart
          .append("g")
          .attr("transform", `translate(0,${innerHeight})`)
          .call(d3.axisBottom(x));

        const yAxis = chart.append("g").call(d3.axisLeft(y));

        chart
          .append("text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + 42)
          .attr("text-anchor", "middle")
          .text("t-SNE 1");

        chart
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerHeight / 2)
          .attr("y", -45)
          .attr("text-anchor", "middle")
          .text("t-SNE 2");

        const pointsGroup = chart.append("g");

        const points = pointsGroup
          .selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", (d) => x(d.x))
          .attr("cy", (d) => y(d.y))
          .attr("r", (d) => (d.ticker === selectedStock ? 9 : 5))
          .attr("fill", (d) => color(d.sector))
          .attr("stroke", (d) =>
            d.ticker === selectedStock ? "black" : "white"
          )
          .attr("stroke-width", (d) =>
            d.ticker === selectedStock ? 3 : 1
          )
          .style("cursor", "pointer")
          .on("click", (_, d) => setSelectedStock(d.ticker));

        const labels = pointsGroup
          .selectAll("text.stock-label")
          .data(data.filter((d) => d.ticker === selectedStock))
          .enter()
          .append("text")
          .attr("class", "stock-label")
          .attr("x", (d) => x(d.x) + 10)
          .attr("y", (d) => y(d.y) - 10)
          .attr("font-size", 13)
          .attr("font-weight", "bold")
          .text((d) => d.ticker);

        const legend = svg
          .append("g")
          .attr("transform", `translate(${width - 130},${margin.top})`);

        sectors.forEach((sector, i) => {
          legend
            .append("rect")
            .attr("x", 0)
            .attr("y", i * 22)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(sector));

          legend
            .append("text")
            .attr("x", 18)
            .attr("y", i * 22 + 10)
            .attr("font-size", 12)
            .text(sector);
        });

        const zoom = d3
          .zoom()
          .scaleExtent([1, 15])
          .on("zoom", (event) => {
            const newX = event.transform.rescaleX(x);
            const newY = event.transform.rescaleY(y);

            xAxis.call(d3.axisBottom(newX));
            yAxis.call(d3.axisLeft(newY));

            points
              .attr("cx", (d) => newX(d.x))
              .attr("cy", (d) => newY(d.y));

            labels
              .attr("x", (d) => newX(d.x) + 10)
              .attr("y", (d) => newY(d.y) - 10);
          });

        svg.call(zoom);
      })
      .catch((err) => {
        console.error("Error fetching t-SNE data:", err);
      });

    return () => {
      cancelled = true;
      d3.select(ref.current).selectAll("*").remove();
    };
  }, [selectedStock, setSelectedStock]);

  return <div ref={ref}></div>;
}