import * as d3 from "d3";
import { useEffect, useRef } from "react";

const margin = { top: 24, right: 160, bottom: 48, left: 56 };
const tickers = [
  "AAPL",
  "BAC",
  "CAT",
  "CVX",
  "DAL",
  "GOOG",
  "GS",
  "HAL",
  "JNJ",
  "JPM",
  "KO",
  "MCD",
  "META",
  "MMM",
  "MSFT",
  "NKE",
  "NVDA",
  "PFE",
  "UNH",
  "XOM",
];

const sectorByTicker = {
  AAPL: "Information Tech / Comm Svc",
  GOOG: "Information Tech / Comm Svc",
  META: "Information Tech / Comm Svc",
  MSFT: "Information Tech / Comm Svc",
  NVDA: "Information Tech / Comm Svc",
  BAC: "Financials",
  GS: "Financials",
  JPM: "Financials",
  CVX: "Energy",
  HAL: "Energy",
  XOM: "Energy",
  JNJ: "Healthcare",
  PFE: "Healthcare",
  UNH: "Healthcare",
  KO: "Consumer Discretionary/Staples",
  MCD: "Consumer Discretionary/Staples",
  NKE: "Consumer Discretionary/Staples",
  CAT: "Industrials",
  DAL: "Industrials",
  MMM: "Industrials",
};

export function TSNEScatter({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function draw() {
      if (!containerRef.current || !svgRef.current) return;

      const rows = await d3.csv("/data/tsne.csv", d3.autoType);
      if (cancelled) return;

      const data = rows.map((d, i) => {
        const ticker = d.ticker || d.Ticker || d.stock || d.Stock || tickers[i];
        return {
          ticker,
          x: d.tsne_1 ?? d.x ?? d.X ?? d.tsne_x ?? d.TSNE1,
          y: d.tsne_2 ?? d.y ?? d.Y ?? d.tsne_y ?? d.TSNE2,
          sector:
            d.sector ||
            d.Sector ||
            d.category ||
            d.Category ||
            sectorByTicker[ticker] ||
            "Other",
        };
      });

      const { width, height } = containerRef.current.getBoundingClientRect();
      drawChart(svgRef.current, data, width, height, selectedStock);
    }

    draw();

    const resizeObserver = new ResizeObserver(draw);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [selectedStock]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgElement, data, width, height, selectedStock) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (!data.length || !width || !height) return;

  const sectors = d3.sort(d3.union(data.map((d) => d.sector)));
  const color = d3.scaleOrdinal(sectors, d3.schemeTableau10);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.x))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.y))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("t-SNE 1");

  svg
    .append("text")
    .attr("x", -height / 2)
    .attr("y", 16)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("t-SNE 2");

  const plot = svg.append("g");

  const points = plot
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("fill", (d) => color(d.sector))
    .attr("stroke", (d) => (d.ticker === selectedStock ? "black" : "white"))
    .attr("stroke-width", (d) => (d.ticker === selectedStock ? 2.5 : 1));

  const labels = plot
    .selectAll("text")
    .data(data.filter((d) => d.ticker === selectedStock))
    .join("text")
    .attr("font-weight", "bold")
    .attr("font-size", 13)
    .text((d) => d.ticker);

  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right + 4}, ${margin.top})`);

  let yOffset = 0;
  legend
    .selectAll("g")
    .data(sectors)
    .join("g")
    .each(function (sector) {
      const item = d3.select(this);
      item.attr("transform", `translate(0, ${yOffset})`);
      item.append("circle").attr("r", 5).attr("fill", color(sector));

      const text = item
        .append("text")
        .attr("x", 12)
        .attr("font-size", 12);

      const parts = sector.split(/\s*\/\s*/);

      parts.forEach((part, index) => {
        text
          .append("tspan")
          .attr("x", 12)
          .attr("dy", index === 0 ? "0.32em" : "1.2em")
          .text(part + (index < parts.length - 1 ? "/" : ""));
      });

      yOffset += parts.length * 16 + 8;
    });

  function render(nextX, nextY) {
    xAxis.call(d3.axisBottom(nextX));
    yAxis.call(d3.axisLeft(nextY));

    points
      .attr("cx", (d) => nextX(d.x))
      .attr("cy", (d) => nextY(d.y))
      .attr("r", (d) => (d.ticker === selectedStock ? 8 : 5));

    labels
      .attr("x", (d) => nextX(d.x) + 10)
      .attr("y", (d) => nextY(d.y) - 10);
  }

  render(x, y);

  svg.call(
    d3
      .zoom()
      .scaleExtent([1, 20])
      .on("zoom", (event) => {
        render(event.transform.rescaleX(x), event.transform.rescaleY(y));
      })
  );
}
