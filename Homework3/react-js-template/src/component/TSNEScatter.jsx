import * as d3 from "d3";
import { useEffect, useRef } from "react";

const margin = {
  top: 20,
  right: 30,
  bottom: 50,
  left: 60,
};

export default function TSNEScatter({ selectedStock }) {

  const svgRef = useRef();

  useEffect(() => {

    d3.csv("/data/tsne.csv").then((data) => {

      // Parse numeric values
      data.forEach((d) => {
        d.x = +d.x;
        d.y = +d.y;
      });

      drawScatter(data);
    });

  }, [selectedStock]);

  function drawScatter(data) {

    const svg = d3.select(svgRef.current);

    svg.selectAll("*").remove();

    const width = 700;
    const height = 250;

    svg
      .attr("width", width)
      .attr("height", height);

    // X scale
    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.x))
      .nice()
      .range([margin.left, width - margin.right - 80]);

    // Y scale
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.y))
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Sector colors
    const colorScale = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.sector))])
      .range(d3.schemeCategory10);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("t-SNE Dimension 1");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("t-SNE Dimension 2");

    // Points
    svg.append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", d => d.ticker === selectedStock ? 10 : 6)
      .attr("fill", d => colorScale(d.sector))
      .attr("stroke", d => d.ticker === selectedStock ? "black" : "none")
      .attr("stroke-width", 2)
      .attr("opacity", 0.85);

    // Labels for selected stock only
    svg.append("g")
      .selectAll("text.stock-label")
      .data(data.filter(d => d.ticker === selectedStock))
      .join("text")
      .attr("class", "stock-label")
      .attr("x", d => xScale(d.x) + 12)
      .attr("y", d => yScale(d.y) + 4)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.ticker);

    // Legend
    const sectors = [...new Set(data.map(d => d.sector))];

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 90}, 25)`);

    sectors.forEach((sector, i) => {

      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      row.append("circle")
        .attr("r", 6)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", colorScale(sector));

      row.append("text")
        .attr("x", 12)
        .attr("y", 4)
        .style("font-size", "11px")
        .text(sector);
    });
  }

  return (
    <div className="flex justify-start items-start h-full pl-2 pt-2 overflow-hidden">
      <svg ref={svgRef}></svg>
    </div>
  );
}