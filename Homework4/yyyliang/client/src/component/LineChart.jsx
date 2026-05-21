import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const SERIES = [
  { key: "open",  label: "Open",  color: "#1f77b4" },
  { key: "high",  label: "High",  color: "#2ca02c" },
  { key: "low",   label: "Low",   color: "#d62728" },
  { key: "close", label: "Close", color: "#9467bd" },
];

export default function LineChart({ ticker }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState([]);

  // Fetch stock data from the backend whenever ticker changes
  useEffect(() => {
    let cancelled = false;
    fetch(`http://127.0.0.1:8000/stock/${ticker}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        // API returns: { name, stock_series: [{date, Open, High, Low, Close}, ...] }
        // Adapt to the lowercase field names the chart code expects.
        const rows = json.stock_series.map((d) => ({
          date: new Date(d.date),
          open: +d.Open,
          high: +d.High,
          low: +d.Low,
          close: +d.Close,
        }));
        rows.sort((a, b) => a.date - b.date);
        setData(rows);
      })
      .catch((err) => {
        console.error("Failed to fetch stock data:", err);
        if (!cancelled) setData([]);
      });
    return () => { cancelled = true; };
  }, [ticker]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const margin = { top: 20, right: 80, bottom: 30, left: 50 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, (d) => d.date))
      .range([0, innerW]);

    const yMin = d3.min(data, (d) => d.low);
    const yMax = d3.max(data, (d) => d.high);
    const yScale = d3.scaleLinear()
      .domain([yMin * 0.98, yMax * 1.02])
      .range([innerH, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    const xAxisG = g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(xAxis);

    g.append("g").call(yAxis);

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Date");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text("Price ($)");

    svg.append("defs").append("clipPath")
      .attr("id", "line-clip")
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH);

    const linesG = g.append("g").attr("clip-path", "url(#line-clip)");

    const linePaths = {};
    SERIES.forEach((s) => {
      const lineGen = d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d[s.key]));

      linePaths[s.key] = linesG.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", s.color)
        .attr("stroke-width", 1.5)
        .attr("d", lineGen);
    });

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
    SERIES.forEach((s, i) => {
      const row = legend.append("g")
        .attr("transform", `translate(0, ${i * 18})`);
      row.append("line")
        .attr("x1", 0).attr("x2", 16)
        .attr("y1", 6).attr("y2", 6)
        .attr("stroke", s.color)
        .attr("stroke-width", 2);
      row.append("text")
        .attr("x", 20).attr("y", 9)
        .attr("font-size", "11px")
        .text(s.label);
    });

    // Zoom & pan (horizontal only)
    const zoom = d3.zoom()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [innerW, innerH]])
      .extent([[0, 0], [innerW, innerH]])
      .on("zoom", (event) => {
        const newXScale = event.transform.rescaleX(xScale);
        xAxisG.call(d3.axisBottom(newXScale).ticks(8));
        SERIES.forEach((s) => {
          const newLineGen = d3.line()
            .x((d) => newXScale(d.date))
            .y((d) => yScale(d[s.key]));
          linePaths[s.key].attr("d", newLineGen);
        });
      });

    svg.call(zoom);
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef}></svg>
    </div>
  );
}