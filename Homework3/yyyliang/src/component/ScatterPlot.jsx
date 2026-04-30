import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

// Eager-load tsne.csv at build time as a raw string
import tsneRaw from "../../data/tsne.csv?raw";

// Parse CSV once at module load
const TSNE_DATA = d3.csvParse(tsneRaw, (d) => ({
  ticker: d.ticker,
  x: +d.x,
  y: +d.y,
  sector: d.sector,
}));

// Get all unique sectors and assign each a color from d3's category scheme
const SECTORS = Array.from(new Set(TSNE_DATA.map((d) => d.sector))).sort();
const colorScale = d3.scaleOrdinal()
  .domain(SECTORS)
  .range(d3.schemeCategory10);

export default function ScatterPlot({ ticker, onSelect }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredTicker, setHoveredTicker] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // Clear previous
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ----- Scales (with a little padding around the data extent) -----
    const xExtent = d3.extent(TSNE_DATA, (d) => d.x);
    const yExtent = d3.extent(TSNE_DATA, (d) => d.y);
    const xPad = (xExtent[1] - xExtent[0]) * 0.1;
    const yPad = (yExtent[1] - yExtent[0]) * 0.1;

    const xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPad, xExtent[1] + xPad])
      .range([0, innerW]);
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .range([innerH, 0]);   // flip so larger y goes up

    // ----- Axes -----
    const xAxisG = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(6));
    const yAxisG = g.append("g")
      .call(d3.axisLeft(yScale).ticks(6));

    // Axis labels
    g.append("text")
      .attr("x", innerW / 2).attr("y", innerH + 35)
      .attr("text-anchor", "middle").attr("font-size", "12px")
      .text("t-SNE dim 1");
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2).attr("y", -35)
      .attr("text-anchor", "middle").attr("font-size", "12px")
      .text("t-SNE dim 2");

    // ----- Clip path so points don't escape when zoomed -----
    svg.append("defs").append("clipPath")
      .attr("id", "scatter-clip")
      .append("rect")
      .attr("width", innerW).attr("height", innerH);

    const pointsG = g.append("g").attr("clip-path", "url(#scatter-clip)");

    // ----- Draw points -----
    const points = pointsG.selectAll("circle")
      .data(TSNE_DATA)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => d.ticker === ticker ? 10 : 6)
      .attr("fill", (d) => colorScale(d.sector))
      .attr("stroke", (d) => d.ticker === ticker ? "black" : "white")
      .attr("stroke-width", (d) => d.ticker === ticker ? 2 : 1)
      .style("cursor", "pointer")
      .on("mouseenter", (event, d) => setHoveredTicker(d.ticker))
      .on("mouseleave", () => setHoveredTicker(null))
      .on("click", (event, d) => {
        if (onSelect) onSelect(d.ticker);
      });

    // ----- Labels: always show selected ticker; show hovered too -----
    const labels = pointsG.selectAll("text.point-label")
      .data(TSNE_DATA)
      .enter()
      .append("text")
      .attr("class", "point-label")
      .attr("x", (d) => xScale(d.x) + 10)
      .attr("y", (d) => yScale(d.y) + 4)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .attr("opacity", (d) =>
        (d.ticker === ticker || d.ticker === hoveredTicker) ? 1 : 0
      )
      .text((d) => d.ticker);

    // ----- Legend (top-right) -----
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
    SECTORS.forEach((s, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 18})`);
      row.append("circle")
        .attr("cx", 6).attr("cy", 6).attr("r", 5)
        .attr("fill", colorScale(s));
      row.append("text")
        .attr("x", 16).attr("y", 9)
        .attr("font-size", "11px")
        .text(s);
    });

    // ----- Zoom & pan -----
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(xScale);
        const newY = event.transform.rescaleY(yScale);
        xAxisG.call(d3.axisBottom(newX).ticks(6));
        yAxisG.call(d3.axisLeft(newY).ticks(6));
        points
          .attr("cx", (d) => newX(d.x))
          .attr("cy", (d) => newY(d.y));
        labels
          .attr("x", (d) => newX(d.x) + 10)
          .attr("y", (d) => newY(d.y) + 4);
      });

    svg.call(zoom);
  }, [ticker, hoveredTicker]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}