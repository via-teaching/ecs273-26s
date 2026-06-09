import * as d3 from "d3";
import { useEffect, useRef } from "react";

const margin = {
  top: 20,
  right: 120,
  bottom: 50,
  left: 60,
};

export default function TSNEScatter({ selectedStock }) {
  const svgRef = useRef();

  useEffect(() => {
    fetch("http://localhost:8000/tsne")
      .then((res) => res.json())
      .then((data) => {
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

    const width = 760;
    const height = 300;

    svg.attr("width", width).attr("height", height);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d.x))
      .nice()
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, (d) => d.y))
      .nice()
      .range([height - margin.bottom, margin.top]);

    const sectors = [...new Set(data.map((d) => d.sector))];

    const colorScale = d3.scaleOrdinal()
      .domain(sectors)
      .range(d3.schemeCategory10);

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    svg.append("text")
      .attr("x", width / 2 - 60)
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

    svg.append("g")
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", (d) => d.Stock === selectedStock ? 10 : 6)
      .attr("fill", (d) => colorScale(d.sector))
      .attr("stroke", (d) => d.Stock === selectedStock ? "black" : "none")
      .attr("stroke-width", 2)
      .attr("opacity", 0.85);

    svg.append("g")
      .selectAll("text.stock-label")
      .data(data.filter((d) => d.Stock === selectedStock))
      .join("text")
      .attr("class", "stock-label")
      .attr("x", (d) => xScale(d.x) + 12)
      .attr("y", (d) => yScale(d.y) + 4)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text((d) => d.Stock);

    const legend = svg.append("g")
      .attr("transform", `translate(${width - 105}, 25)`);

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