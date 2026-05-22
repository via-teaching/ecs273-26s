import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const margin = { left: 60, right: 20, top: 20, bottom: 60 };

async function loadStockData(ticker) {
  const response = await fetch(`http://localhost:8000/stock/${ticker}`);
  const json = await response.json();

  return json.stock_series.map((d) => ({
    date: new Date(d.date),
    open: +d.Open,
    high: +d.High,
    low: +d.Low,
    close: +d.Close,
  }));
}

export function LineChart({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!ticker) return;

    const load = async () => {
      const stockData = await loadStockData(ticker);
      setData(stockData);
    };

    load();
  }, [ticker]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    if (!data.length) return;

    const svg = svgRef.current;

    const draw = () => {
      const { width, height } =
        containerRef.current.getBoundingClientRect();

      drawLineChart(svg, data, width, height);
    };

    draw();

    const resizeObserver = new ResizeObserver(() => {
      draw();
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full border-2 border-gray-300 rounded-xl"
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block" }}
      />
    </div>
  );
}

function drawLineChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const keys = ["open", "high", "low", "close"];
  const colors = {
    open: "#22c55e",
    high: "#ef4444",
    low: "#f97316",
    close: "#4682b4",
  };

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear().range([
    height - margin.bottom,
    margin.top,
  ]);

  const initialYMin = d3.min(data, (d) =>
    Math.min(d.open, d.high, d.low, d.close)
  );
  const initialYMax = d3.max(data, (d) =>
    Math.max(d.open, d.high, d.low, d.close)
  );

  yScale.domain([initialYMin, initialYMax]).nice();

  const lineGenerator = (key, x, y) =>
    d3
      .line()
      .x((d) => x(d.date))
      .y((d) => y(d[key]));

  keys.forEach((key) => {
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors[key])
      .attr("stroke-width", 2)
      .attr("d", lineGenerator(key, xScale, yScale));
  });

  svg
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("r", 2)
    .attr("fill", colors.close)
    .attr("cx", (d) => xScale(d.date))
    .attr("cy", (d) => yScale(d.close));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(width / 100));

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5));

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Date");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Stock Price (USD)");
}