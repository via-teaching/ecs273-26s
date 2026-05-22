import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

const margin = { left: 50, right: 185, top: 15, bottom: 48 };

const SECTOR_COLORS = [
  "#9656a2",
  "#369acc",
  "#95cf92",
  "#ecb623",
  "#f4895f",
  "#de324c",
  "#6c584c",
];

export function TSNEScatter({ stock, onStockSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

useEffect(() => {
  fetch("http://localhost:8000/tsne/")
    .then((res) => res.json())
    .then((json) => {
      const parsed = json.map((d) => ({
        ticker: d.Stock,
        x: d.x,
        y: d.y,
        sector: d.sector,
      }));
      setData(parsed);
    });
}, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) drawChart(svgRef.current, data, stock, onStockSelect, width, height);
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) drawChart(svgRef.current, data, stock, onStockSelect, width, height);

    return () => resizeObserver.disconnect();
  }, [data, stock, onStockSelect]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, selectedStock, onStockSelect, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const sectors = [...new Set(data.map(d => d.sector))];
  const colorScale = d3.scaleOrdinal().domain(sectors).range(SECTOR_COLORS);
  const xPad = (d3.max(data, d => d.x) - d3.min(data, d => d.x)) * 0.12;
  const yPad = (d3.max(data, d => d.y) - d3.min(data, d => d.y)) * 0.12;

  const xScale = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.x) - xPad, d3.max(data, d => d.x) + xPad])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.y) - yPad, d3.max(data, d => d.y) + yPad])
    .range([height - margin.bottom, margin.top]);

  // Clip path
  const clipId = "tsne-clip";
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  // Zoom setup — rect goes BEFORE chartArea so circles sit on top and receive events
  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 20])
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on("zoom", (event) => {
      const newXScale = event.transform.rescaleX(xScale);
      const newYScale = event.transform.rescaleY(yScale);

      xAxisGroup.call(d3.axisBottom(newXScale).ticks(5));
      yAxisGroup.call(d3.axisLeft(newYScale).ticks(5));

      chartArea
        .selectAll("circle.dot, circle.hit")
        .attr("cx", d => newXScale(d.x))
        .attr("cy", d => newYScale(d.y));

      chartArea
        .selectAll("text.dot-label")
        .attr("x", d => newXScale(d.x) + 22)
        .attr("y", d => newYScale(d.y) + 4);
    });

  svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "transparent")
    .style("cursor", "grab")
    .call(zoom);

  // Chart area on top of zoom rect so circles receive mouse events
  const chartArea = svg.append("g").attr("clip-path", `url(#${clipId})`);

  // Visible dots
  chartArea
    .selectAll("circle.dot")
    .data(data)
    .join("circle")
    .attr("class", d => `dot dot-${d.ticker}`)
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", d => d.ticker === selectedStock ? 13 : 5)
    .attr("fill", d => colorScale(d.sector))
    .attr("stroke", "none")
    .attr("opacity", d => d.ticker === selectedStock ? 1 : 0.75)
    .attr("pointer-events", "none");

  // Invisible hit-area circles — larger radius so hovering near a dot registers
  chartArea
    .selectAll("circle.hit")
    .data(data)
    .join("circle")
    .attr("class", d => `hit hit-${d.ticker}`)
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", 18)
    .attr("fill", "transparent")
    .attr("stroke", "none")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      if (d.ticker !== selectedStock) {
        chartArea.select(`.dot-${d.ticker}`).attr("r", 13).attr("opacity", 1);
        chartArea
          .append("text")
          .attr("class", "hover-label")
          .attr("x", +d3.select(this).attr("cx") + 22)
          .attr("y", +d3.select(this).attr("cy") + 4)
          .attr("font-size", "0.72rem")
          .attr("font-weight", "bold")
          .text(d.ticker);
      }
    })
    .on("mouseout", function(event, d) {
      if (d.ticker !== selectedStock) {
        chartArea.select(`.dot-${d.ticker}`).attr("r", 5).attr("opacity", 0.75);
        chartArea.selectAll("text.hover-label").remove();
      }
    })
    .on("click", (event, d) => {
      if (onStockSelect) onStockSelect(d.ticker);
    });

  // Label for selected stock only
  chartArea
    .selectAll("text.dot-label")
    .data(data.filter(d => d.ticker === selectedStock))
    .join("text")
    .attr("class", "dot-label")
    .attr("x", d => xScale(d.x) + 22)
    .attr("y", d => yScale(d.y) + 4)
    .attr("font-size", "0.72rem")
    .attr("font-weight", "bold")
    .text(d => d.ticker);

  // X axis
  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(5));

  // Y axis
  const yAxisGroup = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(5));

  // Axis labels
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${margin.left - 38},${
        margin.top + (height - margin.top - margin.bottom) / 2
      }) rotate(-90)`
    )
    .attr("text-anchor", "middle")
    .attr("font-size", "0.72rem")

    .text("t-SNE 2");

  svg
    .append("text")
    .attr(
      "transform",
      `translate(${margin.left + (width - margin.left - margin.right) / 2},${height - 4})`
    )
    .attr("text-anchor", "middle")
    .attr("font-size", "0.72rem")

    .text("t-SNE 1");

  // Legend
  const legendSectors = [...new Set(data.map(d => d.sector))];
  const legendX = width - margin.right + 14;
  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${legendX},${margin.top + 4})`);

  legendSectors.forEach((sector, i) => {
    const row = legendGroup.append("g").attr("transform", `translate(0,${i * 22})`);
    row
      .append("circle")
      .attr("cx", 6).attr("cy", 8)
      .attr("r", 5)
      .attr("fill", colorScale(sector));
    row
      .append("text")
      .attr("x", 16).attr("y", 12)
      .attr("font-size", "0.76rem")
      .text(sector);
});

}
