import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from "lodash";

import { ComponentSize, Margin } from "../types";

// define the data structure for t-SNE rows
interface TSNERow {
  ticker: string;
  x: number;
  y: number;
  sector: string;
}

const margin = { left: 60, right: 120, top: 20, bottom: 60 } as Margin;

// color for each sector
const SECTOR_COLORS: Record<string, string> = {
  "Energy":      "red",
  "Industrials": "orange",
  "Consumer":    "green",
  "Healthcare":  "blue",
  "Financials":  "purple",
  "Info Tech":   "teal",
};

export function TSNEScatter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [rows, setRows] = useState<TSNERow[]>([]);

  // fetch all t-SNE data from backend on mount
  useEffect(() => {
    fetch("http://localhost:8000/tsne")
      .then((res) => res.json())
      .then((data: any[]) => {
        const parsed: TSNERow[] = data.map((d) => ({
          ticker: d.Stock,
          x:      d.x,
          y:      d.y,
          sector: d.sector,
        }));
        setRows(parsed);
      });
  }, []);

  // listen to dropdown changes to highlight selected stock
  useEffect(() => {
    const redraw = () => {
      if (!containerRef.current || !svgRef.current || isEmpty(rows)) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width && height) drawChart(svgRef.current!, rows, width, height);
    };

    d3.select("#bar-select").on("change.tsne", redraw);
    return () => { d3.select("#bar-select").on("change.tsne", null); };
  }, [rows]);

  // redraw on container resize
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height && !isEmpty(rows)) {
            drawChart(svgRef.current!, rows, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height && !isEmpty(rows)) {
      drawChart(svgRef.current!, rows, width, height);
    }

    return () => resizeObserver.disconnect();
  }, [rows]);

  return (
    <div className="chart-container d-flex" ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg id="tsne-svg" ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(
  svgElement: SVGSVGElement,
  rows: TSNERow[],
  width: number,
  height: number,
  overrideSelected?: string
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove(); // clear previous redenred content

  // inner width and height of the chart area 
  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // get the currently selected stock from the dropdown, or use the selected stock
  const selectedStock = overrideSelected
    ?? (d3.select("#bar-select").node() as HTMLSelectElement)?.value
    ?? "";

  // clip path
  svg.append("defs")
    .append("clipPath")
    .attr("id", "tsne-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width",  innerW)
    .attr("height", innerH);
  
  // compute the scales based on data extents
  const xExtent = d3.extent(rows, (d) => d.x) as [number, number];
  const yExtent = d3.extent(rows, (d) => d.y) as [number, number];

  // create scales for x and y axes/
  const xScale = d3.scaleLinear()
    .domain([xExtent[0] - 5, xExtent[1] + 5])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - 5, yExtent[1] + 5])
    .range([height - margin.bottom, margin.top]);

  // draw x and y axes
  const xAxisG = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5));

  const yAxisG = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5));

  // Y axis label
  svg.append("g")
    .attr("transform", `translate(18, ${height / 2}) rotate(-90)`)
    .append("text")
    .text("t-SNE 2")
    .style("font-size", ".8rem");

  // X axis label
  svg.append("g")
    .attr("transform", `translate(${width / 2 - margin.left}, ${height - margin.top - 5})`)
    .append("text")
    .text("t-SNE 1")
    .style("font-size", ".8rem");

  // title
  svg.append("g")
    .append("text")
    .attr("transform", `translate(${width / 2}, ${height - margin.top + 5})`)
    .attr("dy", "0.5rem")
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("t-SNE of Stock Latent Representations");

  // group for points, clipped to chart area
  const pointsG = svg.append("g").attr("clip-path", "url(#tsne-clip)");

  // draw non-selected points first, selected on top
  const sorted = [...rows].sort((a, b) =>
    a.ticker === selectedStock ? 1 : b.ticker === selectedStock ? -1 : 0
  );

  // draw points
  sorted.forEach((d) => {
    const isSelected = d.ticker === selectedStock;
    const color = SECTOR_COLORS[d.sector] ?? "#999";

    pointsG.append("circle")
      .attr("cx", xScale(d.x))
      .attr("cy", yScale(d.y))
      .attr("r", isSelected ? 10 : 6)
      .attr("fill", color)
      .attr("stroke", isSelected ? "black" : "white")
      .attr("stroke-width", isSelected ? 2 : 0.5)
      .attr("opacity", isSelected ? 1 : 0.75)
      .attr("cursor", "pointer")
      .on("click", () => {
        // Only redraw scatter plot with clicked ticker
        const { width, height } = (svgElement.parentElement as HTMLElement).getBoundingClientRect();
        drawChart(svgElement, rows, width, height, d.ticker);
      });

    // show ticker label if this point is selected
    if (isSelected) {
      pointsG.append("text")
        .attr("x", xScale(d.x) + 12)
        .attr("y", yScale(d.y) + 4)
        .style("font-size", ".85rem")
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .text(d.ticker);
    }
  });

  // legend
  const sectors = Object.keys(SECTOR_COLORS);
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

  sectors.forEach((sector, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 22})`);
    row.append("circle")
      .attr("cx", 7).attr("cy", 7)
      .attr("r", 6)
      .attr("fill", SECTOR_COLORS[sector]);
    row.append("text")
      .attr("x", 18).attr("y", 11)
      .style("font-size", ".8rem")
      .text(sector);
  });

  // zooming and panning
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 20])
    .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      const newX = event.transform.rescaleX(xScale);
      const newY = event.transform.rescaleY(yScale);

      xAxisG.call(d3.axisBottom(newX).ticks(5));
      yAxisG.call(d3.axisLeft(newY).ticks(5));

      pointsG.selectAll("circle")
        .data(sorted)
        .attr("cx", (d) => newX(d.x))
        .attr("cy", (d) => newY(d.y));

      pointsG.selectAll("text")
        .data(sorted.filter((d) => d.ticker === selectedStock))
        .attr("x", (d) => newX(d.x) + 12)
        .attr("y", (d) => newY(d.y) + 4);
    });

  (d3.select(svgElement) as any).call(zoom);
}