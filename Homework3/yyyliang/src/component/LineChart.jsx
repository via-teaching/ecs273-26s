import { useEffect, useRef } from "react";
import * as d3 from "d3";

// Vite eager-glob: read all stock CSVs as raw strings at build time.

const stockFiles = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Build a lookup table: { 'AAPL': [{date, open, high, low, close}, ...], ... }
const STOCK_DATA = {};
for (const path in stockFiles) {

  const ticker = path.split("/").pop().replace(".csv", "");
  const text = stockFiles[path];

  // Parse CSV: first line is header, rest are data rows
  const rows = d3.csvParse(text, (d) => ({
    date: new Date(d.Date),
    open: +d.Open,
    high: +d.High,
    low: +d.Low,
    close: +d.Close,
  }));
  // Sort by date ascending 
  rows.sort((a, b) => a.date - b.date);
  STOCK_DATA[ticker] = rows;
}

// Color for each line series
const SERIES = [
  { key: "open",  label: "Open",  color: "#1f77b4" },
  { key: "high",  label: "High",  color: "#2ca02c" },
  { key: "low",   label: "Low",   color: "#d62728" },
  { key: "close", label: "Close", color: "#9467bd" },
];

export default function LineChart({ ticker }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const data = STOCK_DATA[ticker];
    if (!data || data.length === 0) return;

    // Get container size for responsiveness
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 80, bottom: 30, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Clear previous render
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ----- Scales -----
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, innerW]);

    const yMin = d3.min(data, (d) => d.low);
    const yMax = d3.max(data, (d) => d.high);
    const yScale = d3.scaleLinear()
      .domain([yMin * 0.98, yMax * 1.02])  // small padding above/below
      .range([innerH, 0]);

    // ----- Axes -----
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    const xAxisG = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);

    g.append("g").call(yAxis);

    // X-axis label
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Date");


    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Price ($)");

    // ----- Clip path so lines don't escape when zoomed -----
    svg.append("defs").append("clipPath")
      .attr("id", "line-clip")
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH);

    const linesG = g.append("g").attr("clip-path", "url(#line-clip)");

    // ----- Draw the four lines -----
    const lineGenerators = {};
    const linePaths = {};
    SERIES.forEach((s) => {
      const lineGen = d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d[s.key]));
      lineGenerators[s.key] = lineGen;

      linePaths[s.key] = linesG.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 1.5)
        .attr("d", lineGen);
    });

    // ----- Legend (top-right) -----
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
    SERIES.forEach((s, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 18})`);
      row.append("line")
        .attr("x1", 0).attr("x2", 16)
        .attr("y1", 6).attr("y2", 6)
        .attr("stroke", s.color)
        .attr("stroke-width", 2);
      row.append("text")
        .attr("x", 20).attr("y", 9)
        .attr("font-size", "11px")
        .text(s.label);
    });

    // ----- Zoom & pan (horizontal only) -----
    const zoom = d3.zoom()
      .scaleExtent([1, 20])               // zoom in up to 20x
      .translateExtent([[0, 0], [innerW, innerH]])
      .extent([[0, 0], [innerW, innerH]])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        // Update x-axis
        xAxisG.call(d3.axisBottom(newXScale).ticks(8));
        // Update each line with new x-scale
        SERIES.forEach((s) => {
          const newLineGen = d3.line()
            .x((d) => newXScale(d.date))
            .y((d) => yScale(d[s.key]));
          linePaths[s.key].attr("d", newLineGen);
        });
      });

    svg.call(zoom);
  }, [ticker]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}