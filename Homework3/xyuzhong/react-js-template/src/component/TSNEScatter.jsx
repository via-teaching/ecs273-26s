import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

const margin = { left: 50, right: 160, top: 20, bottom: 50 };

// One color per sector — d3.schemeTableau10 gives 10 distinct colors
const COLOR_SCALE = d3.scaleOrdinal(d3.schemeTableau10);

export function ScatterPlot({ stock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  // Load tsne.csv once on mount
  useEffect(() => {
    d3.csv("/data/tsne.csv", (row) => ({
      ticker: row.ticker,
      x:      +row.x,
      y:      +row.y,
      sector: row.sector,
    })).then(setData);
  }, []);   // empty [] = runs once only

  // Redraw when data or selected stock changes
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    drawChart(svgRef.current, data, stock, width, height);
  }, [data, stock]);  // re-runs when either changes

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgEl, data, selectedStock, width, height) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // X and Y use scaleLinear (t-SNE coords are plain numbers, not dates)
  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.x)).nice()
    .range([0, innerW]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.y)).nice()
    .range([innerH, 0]);

  // Main group
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Axes
  const xAxisG = g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(6));

  const yAxisG = g.append("g")
    .call(d3.axisLeft(yScale).ticks(6));

  // Axis labels
  g.append("text")
    .attr("transform", `translate(${innerW / 2},${innerH + 42})`)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("t-SNE 1");

  g.append("text")
    .attr("transform", `translate(-38,${innerH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("t-SNE 2");

  //draw the dots + highlight selected stock
  // Clip path so dots don't overflow when zooming
  svg.append("defs").append("clipPath")
    .attr("id", "scatter-clip")
    .append("rect").attr("width", innerW).attr("height", innerH);

  const dotsG = g.append("g").attr("clip-path", "url(#scatter-clip)");

  // Draw one circle per stock
  dotsG.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    // Selected stock = bigger, others = normal
    .attr("r",  d => d.ticker === selectedStock ? 10 : 5)
    .attr("fill",   d => COLOR_SCALE(d.sector))
    // Selected stock = full opacity + black border, others = slightly transparent
    .attr("opacity", d => d.ticker === selectedStock ? 1.0 : 0.7)
    .attr("stroke",  d => d.ticker === selectedStock ? "black" : "none")
    .attr("stroke-width", 2);

  // Label for the selected stock (shown next to its dot)
  const selected = data.find(d => d.ticker === selectedStock);
  if (selected) {
    dotsG.append("text")
      .attr("x", xScale(selected.x) + 13)
      .attr("y", yScale(selected.y) + 4)
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text(selected.ticker);
  }

    // Get unique sectors from the data
  const sectors = [...new Set(data.map(d => d.sector))].sort();

  const legend = g.append("g")
    .attr("transform", `translate(${innerW + 15}, 0)`);

  sectors.forEach((sector, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 22})`);
    row.append("circle")
      .attr("r", 5).attr("cx", 5).attr("cy", 0)
      .attr("fill", COLOR_SCALE(sector));
    row.append("text")
      .attr("x", 14).attr("dy", "0.35em")
      .style("font-size", "11px")
      .text(sector);
  });

    // Zoom behavior (scroll to zoom, drag to pan)
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
      const zx = event.transform.rescaleX(xScale);
      const zy = event.transform.rescaleY(yScale);  // scatter needs Y zoom too

      xAxisG.call(d3.axisBottom(zx).ticks(6));
      yAxisG.call(d3.axisLeft(zy).ticks(6));

      // Move all dots to new positions
      dotsG.selectAll("circle")
        .attr("cx", d => zx(d.x))
        .attr("cy", d => zy(d.y));

      // Move the label too
      dotsG.selectAll("text")
        .attr("x", d => zx(d.x) + 13)
        .attr("y", d => zy(d.y) + 4);
    });

  // Capture events on invisible overlay rect
  g.append("rect")
    .attr("width", innerW).attr("height", innerH)
    .attr("fill", "none").attr("pointer-events", "all")
    .call(zoom);
} 
