import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

export default function LineChart({ selectedStock }) {
  const svgRef = useRef();
  const wrapperRef = useRef();

  useEffect(() => {
    if (!selectedStock) return;

    let ignore = false;

    // 1. get container size
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    const margin = { top: 20, right: 120, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 2. read in data
    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((data) => {
      // check whether it should be ignore
      if (ignore) return;
      
      // set svg size
      const svg = d3.select(svgRef.current);
      // clean old drawing
      svg.selectAll("*").remove();

      // 2. create the drawing group
      const g = svg
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight);

      // 3. parse data
      const parseDate = d3.timeParse("%Y-%m-%d"); 
      data.forEach((d) => {
        d.Date = parseDate(d.Date) || new Date(d.Date);
        d.Open = +d.Open;
        d.High = +d.High;
        d.Low = +d.Low;
        d.Close = +d.Close;
      });

      // 4. set up scales
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.Date))
        .range([0, innerWidth]);

      const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close));
      const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close));

      const yScale = d3
        .scaleLinear()
        .domain([yMin * 0.95, yMax * 1.05])
        .range([innerHeight, 0]);

      // 5. draw axes
      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

      const yAxis = g.append("g").call(d3.axisLeft(yScale));

      // add x label
      g.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 35)
        .text("Date")
        .style("font-size", "14px")
        .style("fill", "#666");

      // add y label
      g.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -30)
        .text("Price (USD)")
        .style("font-size", "14px")
        .style("fill", "#666");

      // 6. draw lines
      const metrics = [
        { name: "Open", color: "steelblue" },
        { name: "High", color: "green" },
        { name: "Low", color: "red" },
        { name: "Close", color: "orange" },
      ];

      const lineGroup = g.append("g").attr("clip-path", "url(#clip)");

      const lines = {};
      metrics.forEach((metric) => {
        const lineGenerator = d3
          .line()
          .x((d) => xScale(d.Date))
          .y((d) => yScale(d[metric.name]));

        lines[metric.name] = lineGroup
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", metric.color)
          .attr("stroke-width", 1.5)
          .attr("d", lineGenerator);
      });

      // 7. legend
      const legend = svg
        .append("g")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

      metrics.forEach((metric, i) => {
        const legendRow = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        legendRow
          .append("rect")
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", metric.color);
        legendRow
          .append("text")
          .attr("x", 20)
          .attr("y", 10)
          .attr("text-anchor", "start")
          .style("font-size", "12px")
          .text(metric.name);
      });

      // 8. zooming & panning
      const zoom = d3
        .zoom()
        .scaleExtent([1, 10])
        .translateExtent([[0, 0], [innerWidth, innerHeight]])
        .extent([[0, 0], [innerWidth, innerHeight]])
        .on("zoom", (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          xAxis.call(d3.axisBottom(newXScale));
          metrics.forEach((metric) => {
            const newLineGen = d3
              .line()
              .x((d) => newXScale(d.Date))
              .y((d) => yScale(d[metric.name]));
            lines[metric.name].attr("d", newLineGen);
          });
        });

      svg.call(zoom);
    }); 

    return () => {
      ignore = true;
    };

  }, [selectedStock]);

  return (
    <div ref={wrapperRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}