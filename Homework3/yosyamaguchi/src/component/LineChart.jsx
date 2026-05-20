import * as d3 from "d3";
import { useEffect, useRef } from "react";

const margin = { top: 24, right: 110, bottom: 88, left: 72 };
const series = [
  { key: "Open", color: "#2563eb" },
  { key: "High", color: "#16a34a" },
  { key: "Low", color: "#dc2626" },
  { key: "Close", color: "#9333ea" },
];

export function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAndDraw() {
      if (!containerRef.current || !svgRef.current) return;

      const data = await d3.csv(`/data/stockdata/${selectedStock}.csv`, (d) => ({
        Date: new Date(d.Date.replace(" ", "T")),
        Open: +d.Open,
        High: +d.High,
        Low: +d.Low,
        Close: +d.Close,
      }));
      if (cancelled) return;

      const { width, height } = containerRef.current.getBoundingClientRect();
      drawChart(svgRef.current, data, width, height, selectedStock);
    }

    loadAndDraw();

    const resizeObserver = new ResizeObserver(loadAndDraw);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [selectedStock]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-x-auto overflow-y-hidden"
    >
      <svg ref={svgRef} height="100%" />
    </div>
  );
}

function drawChart(svgElement, data, visibleWidth, visibleHeight, selectedStock) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (!data.length || !visibleWidth || !visibleHeight) return;

  const width = visibleWidth;
  const height = visibleHeight;
  svg.attr("width", width).attr("height", height);

  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.Date))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(data.flatMap((d) => series.map((s) => d[s.key]))))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`);

  const yAxis = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(y));

  yAxis
    .append("text")
    .attr("x", -height / 2)
    .attr("y", -52)
    .attr("transform", "rotate(-90)")
    .attr("fill", "black")
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Price");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 24)
    .attr("text-anchor", "middle")
    .attr("font-size", 14)
    .text("Date");

  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", 15)
    .attr("font-weight", "bold")
    .text(`${selectedStock} OHLC`);

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "line-chart-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const lineGroup = svg.append("g").attr("clip-path", "url(#line-chart-clip)");

  const paths = lineGroup
    .selectAll("path")
    .data(series)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", (d) => d.color)
    .attr("stroke-width", 1.8);
  const line = d3.line();

  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - margin.right + 18}, ${margin.top})`);

  legend
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("transform", (_, i) => `translate(0, ${i * 22})`)
    .each(function (d) {
      const item = d3.select(this);
      item
        .append("line")
        .attr("x2", 18)
        .attr("stroke", d.color)
        .attr("stroke-width", 2);
      item.append("text").attr("x", 24).attr("dy", "0.32em").text(d.key);
    });

  function render(nextX) {
    xAxis.call(d3.axisBottom(nextX).ticks(6));
    xAxis
      .selectAll("text")
      .attr("transform", "rotate(-25)")
      .style("text-anchor", "end");
    paths.attr("d", (s) =>
      line.x((d) => nextX(d.Date)).y((d) => y(d[s.key]))(data)
    );
  }

  render(x);

  svg.call(
    d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([
        [margin.left, 0],
        [width - margin.right, height],
      ])
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("zoom", (event) => render(event.transform.rescaleX(x)))
  );
}
