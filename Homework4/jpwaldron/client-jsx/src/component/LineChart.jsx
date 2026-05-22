import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";

const margin = { left: 50, right: 20, top: 20, bottom: 60 };
const COLORS = { Open: "navy", High: "darkorange", Low: "orangered", Close: "gold" };

export function LineChart({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8000/stock/${ticker}`)
    .then(res => res.json())
    .then(json => {
      const data = json.stock_series.map(d => ({
        date: new Date(d.date),
        Open: d.Open,
        High: d.High,
        Low: d.Low,
        Close: d.Close,
    }));

      const resizeObserver = new ResizeObserver(
        debounce(entries => {
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
    });
  }, [ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // scales
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([
      d3.min(data, d => Math.min(d.Open, d.High, d.Low, d.Close)),
      d3.max(data, d => Math.max(d.Open, d.High, d.Low, d.Close))
    ])
    .range([innerHeight, 0]);

  // clip path for zoom
  svg.append("defs").append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartArea = g.append("g").attr("clip-path", "url(#chart-clip)");

  // axes
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")));

  g.append("g").call(d3.axisLeft(yScale));

  // axis labels
  g.append("text")
    .attr("transform", `translate(${innerWidth / 2},${innerHeight + 45})`)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Date");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2)
    .style("text-anchor", "middle")
    .style("font-size", ".8rem")
    .text("Price (USD)");

  // lines
  const lineGen = key => d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d[key]));

  Object.entries(COLORS).forEach(([key, color]) => {
    chartArea.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", lineGen(key));
  });

  // legend
  const legend = g.append("g")
    .attr("transform", `translate(${innerWidth - 80}, 0)`);

  Object.entries(COLORS).forEach(([key, color], i) => {
    legend.append("rect")
      .attr("x", 0).attr("y", i * 20)
      .attr("width", 12).attr("height", 12)
      .attr("fill", color);
    legend.append("text")
      .attr("x", 16).attr("y", i * 20 + 10)
      .style("font-size", ".75rem")
      .text(key);
  });

  // zoom
  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [innerWidth, innerHeight]])
    .extent([[0, 0], [innerWidth, innerHeight]])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);
      xAxis.call(d3.axisBottom(newX).tickFormat(d3.timeFormat("%b %Y")));
      Object.entries(COLORS).forEach(([key]) => {
        chartArea.selectAll("path")
          .filter((d, i, nodes) => d3.select(nodes[i]).datum() !== undefined)
          .attr("d", lineGen(key));
      });
      // redraw lines with new scale
      chartArea.selectAll("path").each(function(d) {
        if (!d) return;
        const key = Object.keys(COLORS).find(k => 
          d3.select(this).attr("stroke") === COLORS[k]
        );
        if (key) {
          d3.select(this).attr("d", d3.line()
            .x(d => newX(d.date))
            .y(d => yScale(d[key]))(d));
        }
      });
    });

  svg.call(zoom);
}