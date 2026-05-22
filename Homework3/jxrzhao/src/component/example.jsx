import * as d3 from "d3";
import { debounce, isEmpty } from "lodash";
import { useEffect, useRef, useState } from "react";

const stockFiles = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
});

const margin = { left: 56, right: 112, top: 20, bottom: 44 };
const seriesKeys = ["Open", "High", "Low", "Close"];
const seriesColors = {
  Open: "#2563eb",
  High: "#16a34a",
  Low: "#dc2626",
  Close: "#9333ea",
};

export function StockLineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    let isCurrent = true;
    const loadStock = stockFiles[`../../data/stockdata/${selectedStock}.csv`];

    if (!loadStock) {
      setStockData([]);
      return;
    }

    loadStock().then((csvText) => {
      if (!isCurrent) return;

      const parsedData = d3
        .csvParse(csvText, (row) => ({
          date: d3.timeParse("%Y-%m-%d")(row.Date),
          Open: Number(row.Open),
          High: Number(row.High),
          Low: Number(row.Low),
          Close: Number(row.Close),
        }))
        .filter(
          (row) =>
            row.date &&
            seriesKeys.every((key) => Number.isFinite(row[key]))
        );

      setStockData(parsedData);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedStock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(stockData)) return;

    const redraw = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width && height) {
        drawChart(svgRef.current, stockData, selectedStock, width, height);
      }
    };

    redraw();

    const resizeObserver = new ResizeObserver(debounce(redraw, 100));
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [stockData, selectedStock]);

  return (
    <div
      className="chart-container d-flex"
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
    >
      <svg id="stock-line-svg" ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, stockData, selectedStock, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const innerWidth = Math.max(1, width - margin.left - margin.right);
  const innerHeight = Math.max(1, height - margin.top - margin.bottom);
  const dateExtent = d3.extent(stockData, (d) => d.date);
  const valueExtent = d3.extent(stockData.flatMap((d) => seriesKeys.map((key) => d[key])));

  const xScale = d3
    .scaleTime()
    .domain(dateExtent)
    .range([margin.left, margin.left + innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(valueExtent)
    .nice()
    .range([margin.top + innerHeight, margin.top]);

  const line = d3
    .line()
    .defined((d) => d.date)
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.value));

  svg
    .append("g")
    .attr("transform", `translate(0, ${margin.top + innerHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickSizeOuter(0));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format("$.2f")))
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("stroke", "#e5e7eb")
    .attr("stroke-opacity", 0.9)
    .call((g) =>
      g
        .selectAll("line")
        .data(yScale.ticks(5))
        .join("line")
        .attr("x1", margin.left)
        .attr("x2", margin.left + innerWidth)
        .attr("y1", (d) => yScale(d))
        .attr("y2", (d) => yScale(d))
    );

  for (const key of seriesKeys) {
    svg
      .append("path")
      .datum(stockData.map((d) => ({ date: d.date, value: d[key] })))
      .attr("fill", "none")
      .attr("stroke", seriesColors[key])
      .attr("stroke-width", 2)
      .attr("d", line);
  }

  const legend = svg
    .append("g")
    .attr("transform", `translate(${margin.left + innerWidth + 18}, ${margin.top})`);

  legend
    .selectAll("g")
    .data(seriesKeys)
    .join("g")
    .attr("transform", (_, index) => `translate(0, ${index * 22})`)
    .call((g) => {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", 18)
        .attr("y1", 7)
        .attr("y2", 7)
        .attr("stroke", (key) => seriesColors[key])
        .attr("stroke-width", 3);

      g.append("text")
        .attr("x", 26)
        .attr("y", 11)
        .attr("fill", "#111827")
        .style("font-size", "0.75rem")
        .text((key) => key);
    });

  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 6)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "0.75rem")
    .text("Date");

  svg
    .append("text")
    .attr("transform", `translate(14, ${margin.top + innerHeight / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("fill", "#111827")
    .style("font-size", "0.75rem")
    .text(`${selectedStock} Price`);
}
