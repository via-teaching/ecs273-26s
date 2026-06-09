import * as d3 from "d3";
import { useEffect, useRef } from "react";

const margin = {
  top: 20,
  right: 90,
  bottom: 60,
  left: 60,
};

export default function LineChart({ selectedStock }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!selectedStock) return;

    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((data) => {

      // Parse data
      data.forEach((d) => {
        d.Date = new Date(d.Date);

        d.Open = +d.Open;
        d.High = +d.High;
        d.Low = +d.Low;
        d.Close = +d.Close;
      });

      drawChart(data);
    });

  }, [selectedStock]);

  function drawChart(data) {

    const svg = d3.select(svgRef.current);

    // Clear previous render
    svg.selectAll("*").remove();

    // Smaller overall chart size
    const width = 800;
    const height = 300;

    svg
      .attr("width", width)
      .attr("height", height);

    // Clip path (prevents lines overflowing past axes)
    svg.append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // X scale
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([margin.left, width - margin.right]);

    // Y scale
    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.Low),
        d3.max(data, d => d.High)
      ])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // X axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(d3.timeMonth.every(3))
      .tickFormat(d3.timeFormat("%-m/%y"));

    // Y axis
    const yAxis = d3.axisLeft(yScale);

    // Draw X axis
    const xAxisGroup = svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis);

    // Smaller rotated labels
    xAxisGroup.selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end")
      .style("font-size", "10px");

    // Draw Y axis
    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis);

    // Axis labels
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Date");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Price");

    // Colors
    const colors = {
      Open: "blue",
      High: "green",
      Low: "red",
      Close: "orange",
    };

    // Group for clipped chart lines
    const chartGroup = svg.append("g")
      .attr("clip-path", "url(#clip)");

    // Draw lines
    ["Open", "High", "Low", "Close"].forEach((key) => {

      const line = d3.line()
        .x(d => xScale(d.Date))
        .y(d => yScale(d[key]));

      chartGroup.append("path")
        .datum(data)
        .attr("class", `line-${key}`)
        .attr("fill", "none")
        .attr("stroke", colors[key])
        .attr("stroke-width", 2)
        .attr("d", line);
    });

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 50}, 25)`);

    Object.entries(colors).forEach(([key, color], i) => {

      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 18})`);

      row.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", color);

      row.append("text")
        .attr("x", 16)
        .attr("y", 9)
        .style("font-size", "11px")
        .text(key);
    });

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

    svg.call(zoom);

    // Zoom function
    function zoomed(event) {

      const newX = event.transform.rescaleX(xScale);

      // Update x-axis
      xAxisGroup.call(
        d3.axisBottom(newX)
          .ticks(d3.timeMonth.every(1))
          .tickFormat(d3.timeFormat("%-m/%y"))
      );

      // Reapply styling after redraw
      xAxisGroup.selectAll("text")
        .attr("transform", "rotate(-25)")
        .style("text-anchor", "end")
        .style("font-size", "10px");

      // Update lines
      ["Open", "High", "Low", "Close"].forEach((key) => {

        const line = d3.line()
          .x(d => newX(d.Date))
          .y(d => yScale(d[key]));

        svg.select(`.line-${key}`)
          .attr("d", line(data));
      });
    }
  }

  return (
    <div className="flex justify-start items-start h-full pl-2 pt-2">
      <svg ref={svgRef}></svg>
    </div>
  );
}