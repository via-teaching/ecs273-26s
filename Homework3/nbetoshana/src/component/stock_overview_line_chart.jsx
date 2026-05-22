import * as d3 from "d3";
import { useEffect, useRef } from "react";

export default function StockLineChart({ selectedStock }) {
  const ref = useRef();

  useEffect(() => {
    if (!selectedStock) return;

    d3.csv(`/data/stockdata/${selectedStock}.csv`).then((data) => {

      // this will convert the CSV strings into proper date/number types
      data.forEach(d => {
        d.Date = new Date(d.Date);
        d.Open = +d.Open;
        d.High = +d.High;
        d.Low = +d.Low;
        d.Close = +d.Close;
      });

      const svg = d3.select(ref.current).select("svg");
      const { width, height } = ref.current.getBoundingClientRect();

      // this will clear the old chart when switching stocks
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 140, bottom: 50, left: 50 };

      svg.attr("viewBox", `0 0 ${width} ${height}`);

      const innerW = width - margin.left - margin.right;
      const innerH = height - margin.top - margin.bottom;

      const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // this will create the time scale for the x-axis
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.Date))
        .range([0, innerW]);

      // this will create the linear scale for stock prices
      const y = d3.scaleLinear()
        .domain([
          d3.min(data, d => d.Low),
          d3.max(data, d => d.High)
        ])
        .range([innerH, 0]);

      // this will define the 4 stock lines we want to draw
      const lines = [
        { key: "Open", color: "steelblue" },
        { key: "High", color: "green" },
        { key: "Low", color: "red" },
        { key: "Close", color: "black" }
      ];

      // this will make sure zooming doesn’t mess up chart boundaries
      g.append("defs")
        .append("clipPath")
        .attr("id", "clip-line")
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

      // this will label the x-axis
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 40)
        .style("text-anchor", "middle")
        .text("Date");

      // this will label the y-axis
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -35)
        .style("text-anchor", "middle")
        .text("Price");

      // this will generate each line based on the selected field
      const lineGen = (key, scaleX, scaleY) =>
        d3.line()
          .x(d => scaleX(d.Date))
          .y(d => scaleY(d[key]));

      const chart = g.append("g")
        .attr("clip-path", "url(#clip-line)");

      // this will actually draw the 4 stock lines
      lines.forEach(l => {
        chart.append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", l.color)
          .attr("stroke-width", 1.5)
          .attr("class", `line-${l.key}`)
          .attr("d", lineGen(l.key, x, y));
      });

      // this will build the legend on the side
      const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, 40)`);

      lines.forEach((l, i) => {
        legend.append("rect")
          .attr("y", i * 18)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", l.color);

        legend.append("text")
          .attr("x", 15)
          .attr("y", i * 18 + 10)
          .text(l.key)
          .style("font-size", "12px");
      });

      // this will handle zooming and updating the lines
      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .extent([[0, 0], [innerW, innerH]])
        .on("zoom", (event) => {

          const zx = event.transform.rescaleX(x);
          const zy = event.transform.rescaleY(y);

          gx.call(d3.axisBottom(zx));
          gy.call(d3.axisLeft(zy));

          lines.forEach(l => {
            chart.select(`.line-${l.key}`)
              .attr("d", lineGen(l.key, zx, zy));
          });
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