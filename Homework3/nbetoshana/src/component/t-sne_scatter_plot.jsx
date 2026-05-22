import * as d3 from "d3";
import { useEffect, useRef } from "react";

export default function TSNEPlot({ selectedStock }) {
  const ref = useRef();

  useEffect(() => {

    // this will load the tsne dataset
    d3.csv("/data/tsne.csv").then((data) => {

      // this will convert the string values into numbers so scaling works correctly
      data.forEach(d => {
        d.x = +d.x;
        d.y = +d.y;
      });

      const margin = { top: 20, right: 140, bottom: 60, left: 50 };

      const svg = d3.select(ref.current).select("svg");
      const { width, height } = ref.current.getBoundingClientRect();

      // this will clear the previous chart when re-rendering
      svg.selectAll("*").remove();

      svg.attr("viewBox", `0 0 ${width} ${height}`);

      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // this will create the x and y scales based on the tsne coordinates
      const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .range([0, innerW]);

      const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .range([innerH, 0]);

      // this will assign colors based on sector
      const color = d3.scaleOrdinal()
        .domain(["Tech", "Finance", "Energy", "Healthcare", "Consumer", "Industrial"])
        .range(d3.schemeCategory10);

      // this will prevent zoom from drawing outside chart area
      g.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", innerW)
        .attr("height", innerH);

      // this will draw the x-axis
      const gx = g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(6));

      // this will draw the y-axis
      const gy = g.append("g")
        .call(d3.axisLeft(y));

      // this will add the x-axis label
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 45)
        .style("text-anchor", "middle")
        .text("t-SNE X");

      // this will add the y-axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -35)
        .style("text-anchor", "middle")
        .text("t-SNE Y");

      const points = g.append("g")
        .attr("clip-path", "url(#clip)");

      // this will draw all the scatter points
      points.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", d => d.ticker === selectedStock ? 7 : 4)
        .attr("fill", d => color(d.sector))
        .attr("opacity", 0.8)
        .attr("stroke", d => d.ticker === selectedStock ? "black" : "none");

      // this will add the ticker labels next to each point
      const labels = points.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .text(d => d.ticker)
        .style("font-size", "10px")
        .style("font-weight", d => d.ticker === selectedStock ? "bold" : "normal")
        .style("pointer-events", "none")
        .attr("x", d => x(d.x) + 8)
        .attr("y", d => y(d.y) + 3);

      const sectors = ["Tech", "Finance", "Energy", "Healthcare", "Consumer", "Industrial"];

      const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, 40)`);

      // this will build the legend for sectors
      sectors.forEach((s, i) => {
        legend.append("rect")
          .attr("y", i * 18)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", color(s));

        legend.append("text")
          .attr("x", 15)
          .attr("y", i * 18 + 10)
          .text(s)
          .style("font-size", "12px");
      });

      // this will handle zooming and updating everything
      const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on("zoom", (event) => {

          const zx = event.transform.rescaleX(x);
          const zy = event.transform.rescaleY(y);

          gx.call(d3.axisBottom(zx));
          gy.call(d3.axisLeft(zy));

          points.selectAll("circle")
            .attr("cx", d => zx(d.x))
            .attr("cy", d => zy(d.y));

          labels
            .attr("x", d => zx(d.x) + 8)
            .attr("y", d => zy(d.y) + 3);
        });

      svg.call(zoom);

    });

  }, [selectedStock]);

  return (
    <div ref={ref} style={{ width: "100%", height: "100%" }}>
      <svg width="100%" height="100%"></svg>
    </div>
  );
}