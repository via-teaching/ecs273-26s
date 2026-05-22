import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import Papa from "papaparse";

const csvModules = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?raw",
  import: "default",
});

const margin = { left: 55, right: 105, top: 15, bottom: 48 };
const SERIES = ["Open", "High", "Low", "Close"];
const COLORS = ["#e8820c", "#27ae60", "#e63946", "#4a90d9"];

export function LineChart({ stock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!stock) return;
    const key = `../../data/stockdata/${stock}.csv`;
    if (!csvModules[key]) return;
    csvModules[key]().then((text) => {
      const result = Papa.parse(text, { header: true, skipEmptyLines: true });
      const parsed = result.data
        .map((d) => ({
          date: new Date(d.Date),
          Open: +d.Open,
          High: +d.High,
          Low: +d.Low,
          Close: +d.Close,
        }))
        .filter((d) => !isNaN(d.date.getTime()));
      setData(parsed);
    });
  }, [stock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) drawChart(svgRef.current, data, width, height);
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) drawChart(svgRef.current, data, width, height);

    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const allValues = data
    .flatMap((d) => SERIES.map((s) => d[s]))
    .filter((v) => !isNaN(v));
  const yMin = d3.min(allValues);
  const yMax = d3.max(allValues);
  const yPad = (yMax - yMin) * 0.05;

  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([height - margin.bottom, margin.top]);

  // Clip path so lines don't bleed outside chart area
  const clipId = "line-chart-clip";
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const chartArea = svg.append("g").attr("clip-path", `url(#${clipId})`);

  // Draw one path per series
  SERIES.forEach((series, i) => {
    const lineFn = d3
      .line()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d[series]))
      .defined((d) => !isNaN(d[series]));

    chartArea
      .append("path")
      .datum(data)
      .attr("class", `line-${series}`)
      .attr("fill", "none")
      .attr("stroke", COLORS[i])
      .attr("stroke-width", 1.5)
      .attr("d", lineFn);
  });

  // X axis
  const xAxisGroup = svg
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(6)
        .tickFormat(d3.timeFormat("%b '%y"))
    );

  // Y axis
  const yAxisGroup = svg
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale).ticks(5));

  // Y axis label
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

    .text("Price (USD)");

  // X axis label
  svg
    .append("text")
    .attr(
      "transform",
      `translate(${margin.left + (width - margin.left - margin.right) / 2},${
        height - 4
      })`
    )
    .attr("text-anchor", "middle")
    .attr("font-size", "0.72rem")

    .text("Date");

  // Legend (inside top-right of chart area)
  const legendX = width - margin.right + 8;
  const legendGroup = svg.append("g").attr("transform", `translate(${legendX},${margin.top + 4})`);

  SERIES.forEach((series, i) => {
    const row = legendGroup.append("g").attr("transform", `translate(0,${i * 18})`);
    row
      .append("line")
      .attr("x1", 0)
      .attr("x2", 14)
      .attr("y1", 7)
      .attr("y2", 7)
      .attr("stroke", COLORS[i])
      .attr("stroke-width", 2);
    row
      .append("text")
      .attr("x", 18)
      .attr("y", 11)
      .attr("font-size", "0.72rem")
      .text(series);
  });

  // Zoom — horizontal zoom with y-axis rescaling to visible window
  const zoom = d3
    .zoom()
    .scaleExtent([1, 30])
    .translateExtent([
      [margin.left, -Infinity],
      [width - margin.right, Infinity],
    ])
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on("zoom", (event) => {
      const newXScale = event.transform.rescaleX(xScale);

      // Use invert on the pixel boundaries to get the visible date range
      const x0 = newXScale.invert(margin.left);
      const x1 = newXScale.invert(width - margin.right);

      // Refit y to only the data visible in the current x window
      const visible = data.filter((d) => d.date >= x0 && d.date <= x1);
      if (visible.length > 0) {
        const visVals = visible
          .flatMap((d) => SERIES.map((s) => d[s]))
          .filter((v) => !isNaN(v));
        const vMin = d3.min(visVals);
        const vMax = d3.max(visVals);
        const pad = (vMax - vMin) * 0.05;
        yScale.domain([vMin - pad, vMax + pad]);
        yAxisGroup.call(d3.axisLeft(yScale).ticks(5));
      }

      xAxisGroup.call(
        d3.axisBottom(newXScale).ticks(6).tickFormat(d3.timeFormat("%b '%y"))
      );

      SERIES.forEach((series) => {
        const updatedLine = d3
          .line()
          .x((d) => newXScale(d.date))
          .y((d) => yScale(d[series]))
          .defined((d) => !isNaN(d[series]));

        chartArea.select(`.line-${series}`).attr("d", updatedLine(data));
      });
    });

  // Transparent overlay rect to capture mouse events for zoom/pan
  svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .style("cursor", "grab")
    .call(zoom);
}
