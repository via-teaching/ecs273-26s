import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from 'lodash';

const margin = { left: 72, right: 30, top: 30, bottom: 60 };
const API_BASE = "http://localhost:8000";

export function TSNEScatter({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tsneData, setTsneData] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/tsne/`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const parsed = data.map(d => ({
          x: +d.x,
          y: +d.y,
          ticker: d.Stock,
          sector: d.Sector || "Unknown"
        }));
        setTsneData(parsed);
      })
      .catch(err => console.error("Error loading t-SNE data:", err));
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(tsneData)) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height && !isEmpty(tsneData)) {
            drawChart(svgRef.current, tsneData, width, height, selectedStock);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) {
      drawChart(svgRef.current, tsneData, width, height, selectedStock);
    }

    return () => resizeObserver.disconnect();
  }, [tsneData, selectedStock]);

  return (
    <div className="chart-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg id="tsne-svg" ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, width, height, selectedStock) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const sectors = [...new Set(data.map(d => d.sector))];
  const colorScale = d3.scaleOrdinal()
    .domain(sectors)
    .range(d3.schemeCategory10);

  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);

  const xScale = d3.scaleLinear()
    .domain([xExtent[0] - 10, xExtent[1] + 10])
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - 10, yExtent[1] + 10])
    .range([height - margin.bottom, margin.top]);

  svg.append("defs")
    .append("clipPath")
    .attr("id", "tsne-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("zoom", zoomed);

  svg.append("rect")
    .attr("class", "zoom-rect")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .style("fill", "none")
    .style("pointer-events", "all")
    .style("cursor", "grab")
    .call(zoom);

  const chartGroup = svg.append("g")
    .attr("class", "chart-group")
    .attr("clip-path", "url(#tsne-clip)");

  const tooltip = svg.append("g")
    .attr("class", "scatter-tooltip")
    .style("display", "none")
    .style("pointer-events", "none");

  tooltip.append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "rgba(255, 255, 255, 0.95)")
    .attr("stroke", "#9ca3af")
    .attr("stroke-width", 1);

  const tooltipTicker = tooltip.append("text")
    .attr("x", 8)
    .attr("y", 16)
    .style("font-size", "0.75rem")
    .style("font-weight", "bold")
    .style("fill", "#111827");

  const tooltipSector = tooltip.append("text")
    .attr("x", 8)
    .attr("y", 31)
    .style("font-size", "0.7rem")
    .style("fill", "#4b5563");

  const xAxis = d3.axisBottom(xScale).ticks(10);
  const yAxis = d3.axisLeft(yScale).ticks(10);

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  svg.append("g")
    .attr("transform", `translate(24, ${height / 2}) rotate(-90)`)
    .append("text")
    .text("t-SNE Dimension 2")
    .style("font-size", "0.8rem")
    .style("fill", "#333");

  svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height - 10})`)
    .append("text")
    .text("t-SNE Dimension 1")
    .style("font-size", "0.8rem")
    .style("fill", "#333");

  svg.append("text")
    .attr("x", margin.left + 10)
    .attr("y", margin.top + 14)
    .text("Drag or scroll to zoom. Hover points for details")
    .style("font-size", "0.7rem")
    .style("fill", "#666")
    .style("pointer-events", "none");

  const circles = chartGroup.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.x))
    .attr("cy", d => yScale(d.y))
    .attr("r", d => d.ticker === selectedStock ? 8 : 6)
    .attr("fill", d => colorScale(d.sector))
    .attr("opacity", d => d.ticker === selectedStock ? 1 : 0.7)
    .attr("stroke", d => d.ticker === selectedStock ? "#000" : "none")
    .attr("stroke-width", d => d.ticker === selectedStock ? 2 : 0)
    .style("cursor", "pointer")
    .on("mouseenter", function (event, d) {
      d3.select(this)
        .attr("opacity", 1)
        .attr("stroke", "#111827")
        .attr("stroke-width", 2);

      tooltipTicker.text(d.ticker);
      tooltipSector.text(d.sector);

      const textWidth = Math.max(
        tooltipTicker.node().getComputedTextLength(),
        tooltipSector.node().getComputedTextLength()
      );
      tooltip.select("rect")
        .attr("width", textWidth + 16)
        .attr("height", 40);

      tooltip.style("display", null);
      moveTooltip(event);
    })
    .on("mousemove", moveTooltip)
    .on("mouseleave", function (event, d) {
      d3.select(this)
        .attr("opacity", d.ticker === selectedStock ? 1 : 0.7)
        .attr("stroke", d.ticker === selectedStock ? "#000" : "none")
        .attr("stroke-width", d.ticker === selectedStock ? 2 : 0);

      tooltip.style("display", "none");
    });

  let selectedLabel = null;
  let selectedData = null;
  if (selectedStock) {
    selectedData = data.find(d => d.ticker === selectedStock);
    if (selectedData) {
      selectedLabel = chartGroup.append("text")
        .attr("x", xScale(selectedData.x))
        .attr("y", yScale(selectedData.y) - 15)
        .attr("text-anchor", "middle")
        .text(selectedData.ticker)
        .style("font-size", "0.75rem")
        .style("font-weight", "bold")
        .style("fill", "#333");
    }
  }

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 120}, ${margin.top})`);

  sectors.forEach((sector, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorScale(sector));

    legendRow.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(sector)
      .style("font-size", "0.75rem")
      .style("fill", "#333");
  });

  function moveTooltip(event) {
    const tooltipWidth = Number(tooltip.select("rect").attr("width"));
    const tooltipHeight = Number(tooltip.select("rect").attr("height"));
    const [pointerX, pointerY] = d3.pointer(event, svgElement);
    const x = Math.min(pointerX + 12, width - tooltipWidth - 8);
    const y = Math.max(pointerY - tooltipHeight - 12, 8);

    tooltip.attr("transform", `translate(${x}, ${y})`);
  }

  function zoomed(event) {
    const newXScale = event.transform.rescaleX(xScale);
    const newYScale = event.transform.rescaleY(yScale);

    xAxisGroup.call(xAxis.scale(newXScale));
    yAxisGroup.call(yAxis.scale(newYScale));

    circles
      .attr("cx", d => newXScale(d.x))
      .attr("cy", d => newYScale(d.y));

    if (selectedLabel && selectedData) {
      selectedLabel
        .attr("x", newXScale(selectedData.x))
        .attr("y", newYScale(selectedData.y) - 15);
    }
  }
}
