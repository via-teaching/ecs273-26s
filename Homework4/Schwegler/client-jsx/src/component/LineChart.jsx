import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function LineChart({ selectedStock }) {
  const ref = useRef();

  useEffect(() => {
    if (!selectedStock) return;
    d3.select(ref.current).selectAll("*").remove();
    fetch(`http://localhost:8000/stock/${selectedStock}`)
      .then((res) => res.json())
      .then((json) => {
        const data = json.stock_series;

        data.forEach((d) => {
          d.Date = new Date(d.date);
          d.Open = +d.Open;
          d.High = +d.High;
          d.Low = +d.Low;
          d.Close = +d.Close;
        });

        const margin = { top: 30, right: 120, bottom: 65, left: 60 };
        const width = 760;
        const height = 315;
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;
        const svg = d3
          .select(ref.current)
          .append("svg")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("width", "100%")
          .attr("height", height);

        const chart = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleTime()
          .domain(d3.extent(data, (d) => d.Date))
          .range([0, innerWidth]);

        const y = d3
          .scaleLinear()
          .domain([
            d3.min(data, (d) => d.Low),
            d3.max(data, (d) => d.High),
          ])
          .nice()
          .range([innerHeight, 0]);

        const xAxis = chart
          .append("g")
          .attr("transform", `translate(0,${innerHeight})`);

        function formatXAxis(scale) {
          const visibleDomain = scale.domain();
          const visibleDays =
            (visibleDomain[1] - visibleDomain[0]) / (1000 * 60 * 60 * 24);

          let tickCount = 6;
          let tickFormat = d3.timeFormat("%b %d");

          if (visibleDays > 365) {
            tickCount = 6;
            tickFormat = d3.timeFormat("%b %Y");
          } else if (visibleDays > 120) {
            tickCount = 7;
            tickFormat = d3.timeFormat("%b %d");
          } else if (visibleDays > 30) {
            tickCount = 6;
            tickFormat = d3.timeFormat("%b %d");
          } else {
            tickCount = 5;
            tickFormat = d3.timeFormat("%m/%d");
          }

          xAxis
            .call(d3.axisBottom(scale).ticks(tickCount).tickFormat(tickFormat))
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-35)")
            .attr("dx", "-0.5em")
            .attr("dy", "0.3em")
            .style("font-size", "11px");

          xAxis.selectAll(".tick text").each(function (_, i) {
            if (visibleDays < 20 && i % 2 !== 0) {
              d3.select(this).style("display", "none");
            } else {
              d3.select(this).style("display", null);
            }
          });
        }

        formatXAxis(x);

        chart.append("g").call(d3.axisLeft(y));

        chart
          .append("text")
          .attr("x", innerWidth / 2)
          .attr("y", innerHeight + 58)
          .attr("text-anchor", "middle")
          .text("Date");

        chart
          .append("text")
          .attr("transform", "rotate(-90)")
          .attr("x", -innerHeight / 2)
          .attr("y", -45)
          .attr("text-anchor", "middle")
          .text("Price");

        const keys = ["Open", "High", "Low", "Close"];
        const color = d3
          .scaleOrdinal()
          .domain(keys)
          .range(["#2563eb", "#16a34a", "#dc2626", "#9333ea"]);

        const line = d3
          .line()
          .x((d) => x(d.Date))
          .y((d) => y(d.value));

        const clipId = `clip-${selectedStock}`;

        svg
          .append("defs")
          .append("clipPath")
          .attr("id", clipId)
          .append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight);

        const linesGroup = chart
          .append("g")
          .attr("clip-path", `url(#${clipId})`);

        keys.forEach((key) => {
          const lineData = data.map((d) => ({
            Date: d.Date,
            value: d[key],
          }));

          linesGroup
            .append("path")
            .datum(lineData)
            .attr("fill", "none")
            .attr("stroke", color(key))
            .attr("stroke-width", 2)
            .attr("d", line);
        });

        const legend = svg
          .append("g")
          .attr("transform", `translate(${width - 100},${margin.top})`);

        keys.forEach((key, i) => {
          legend
            .append("rect")
            .attr("x", 0)
            .attr("y", i * 22)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color(key));

          legend
            .append("text")
            .attr("x", 18)
            .attr("y", i * 22 + 10)
            .attr("font-size", 12)
            .text(key);
        });

        const zoom = d3
          .zoom()
          .scaleExtent([1, 20])
          .translateExtent([
            [0, 0],
            [innerWidth, innerHeight],
          ])
          .extent([
            [0, 0],
            [innerWidth, innerHeight],
          ])
          .on("zoom", (event) => {
            const newX = event.transform.rescaleX(x);

            formatXAxis(newX);

            const zoomedLine = d3
              .line()
              .x((d) => newX(d.Date))
              .y((d) => y(d.value));

            linesGroup.selectAll("path").attr("d", zoomedLine);
          });

        chart
          .append("rect")
          .attr("width", innerWidth)
          .attr("height", innerHeight)
          .attr("fill", "none")
          .attr("pointer-events", "all")
          .call(zoom);
      });
  }, [selectedStock]);

  return (
    <div className="overflow-x-auto border rounded">
      <div ref={ref}></div>
    </div>
  );
}