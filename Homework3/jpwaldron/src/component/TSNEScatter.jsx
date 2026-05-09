import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";

const margin = { left: 50, right: 120, top: 20, bottom: 50 };

export function TSNEScatter({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    d3.csv("/data/tsne.csv").then(data => {
      const resizeObserver = new ResizeObserver(
        debounce(entries => {
          for (const entry of entries) {
            if (entry.target !== containerRef.current) continue;
            const { width, height } = entry.contentRect;
            if (width && height) drawChart(svgRef.current, data, ticker, width, height);
          }
        }, 100)
      );
      resizeObserver.observe(containerRef.current);
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width && height) drawChart(svgRef.current, data, ticker, width, height);
      return () => resizeObserver.disconnect();
    });
  }, [ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, selectedTicker, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const sectors = [...new Set(data.map(d => d.sector))];
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(sectors);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.x)).nice()
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => +d.y)).nice()
    .range([innerHeight, 0]);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // clip path
  svg.append("defs").append("clipPath")
    .attr("id", "scatter-clip")
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const chartArea = g.append("g").attr("clip-path", "url(#scatter-clip)");

  // axes
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale));

  const yAxis = g.append("g")
    .call(d3.axisLeft(yScale));

  // axis labels
  g.append("text")
    .attr("transform", `translate(${innerWidth / 2},${innerHeight + 40})`)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("t-SNE 1");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40).attr("x", -innerHeight / 2)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("t-SNE 2");

  // points
  const circles = chartArea.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(+d.x))
    .attr("cy", d => yScale(+d.y))
    .attr("r", d => d.ticker === selectedTicker ? 10 : 5)
    .attr("fill", d => colorScale(d.sector))
    .attr("stroke", d => d.ticker === selectedTicker ? "black" : "none")
    .attr("stroke-width", 2)
    .attr("opacity", 0.8);

  // label for selected stock
  chartArea.selectAll("text.label")
    .data(data.filter(d => d.ticker === selectedTicker))
    .join("text")
    .attr("class", "label")
    .attr("x", d => xScale(+d.x) + 12)
    .attr("y", d => yScale(+d.y) + 4)
    .style("font-size", ".75rem")
    .style("font-weight", "bold")
    .text(d => d.ticker);

  // legend
  const legend = g.append("g")
    .attr("transform", `translate(${innerWidth + 10}, 0)`);

  sectors.forEach((sector, i) => {
    legend.append("rect")
      .attr("x", 0).attr("y", i * 20)
      .attr("width", 12).attr("height", 12)
      .attr("fill", colorScale(sector));
    legend.append("text")
      .attr("x", 16).attr("y", i * 20 + 10)
      .style("font-size", ".7rem")
      .text(sector);
  });

  // zoom
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);
      const newY = event.transform.rescaleY(yScale);
      xAxis.call(d3.axisBottom(newX));
      yAxis.call(d3.axisLeft(newY));
      circles
        .attr("cx", d => newX(+d.x))
        .attr("cy", d => newY(+d.y));
      chartArea.selectAll("text.label")
        .attr("x", d => newX(+d.x) + 12)
        .attr("y", d => newY(+d.y) + 4);
    });

  svg.call(zoom);
}