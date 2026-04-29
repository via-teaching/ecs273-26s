import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";


const margin = { left: 40, right: 130, top: 20, bottom: 60 };

// the 4 series we want to draw, each with 1 color
const SERIES = [
  { key: "Open",  color: "#4e79a7" },
  { key: "High",  color: "#59a14f" },
  { key: "Low",   color: "#e15759" },
  { key: "Close", color: "#f28e2b" },
];
  
export function LineChart({ stock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

   // Effect 1: load CSV whenever the selected stock changes
  useEffect(() => {
    if (!stock) return;
    d3.csv(`/data/stockdata/${stock}.csv`, (row) => ({
      date:  new Date(row.Date),
      Open:  +row.Open,
      High:  +row.High,
      Low:   +row.Low,
      Close: +row.Close,
    })).then(setData);
  }, [stock]);  // ← re-runs every time `stock` prop changes

  // Effect 2: draw the chart whenever `data` changes
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || data.length === 0) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    drawChart(svgRef.current, data, width, height);
  }, [data]);  // ← re-runs every time new data is loaded

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgEl, data, width, height) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove(); // wipe previous render

  const innerW = width  - margin.left - margin.right;
  const innerH = height - margin.top  - margin.bottom;

  // --- Scales ---
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))  // min → max date
    .range([0, innerW]);

  const yMin = d3.min(data, d => d.Low);
  const yMax = d3.max(data, d => d.High);
  const yPad = (yMax - yMin) * 0.1;  // 10% padding above and below

  const yScale = d3.scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .nice()
    .range([innerH, 0]);

  // --- Clip path (lines won't draw outside the box when zooming) ---
  svg.append("defs").append("clipPath")
    .attr("id", "chart-clip")
    .append("rect")
    .attr("width", innerW)
    .attr("height", innerH);

  // --- Main group shifted by margin ---
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // --- X axis ---
  const xAxisG = g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(8));

  // --- Y axis ---
  g.append("g").call(d3.axisLeft(yScale));

  // --- Axis labels ---
  g.append("text")
    .attr("transform", `translate(${innerW / 2},${innerH + 50})`)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Date");

  g.append("text")
    .attr("transform", `translate(-45,${innerH / 2}) rotate(-90)`)
    .attr("text-anchor", "middle")
    .style("font-size", "13px")
    .text("Price (USD)");

  // --- Lines ---
  const linesG = g.append("g").attr("clip-path", "url(#chart-clip)");

  SERIES.forEach(({ key, color }) => {
    linesG.append("path")
      .datum(data)
      .attr("class", `line-${key}`)   // class lets zoom re-select it later
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d[key]))       // d[key] is d.Open, d.High, etc.
      );
  });

  // --- Legend ---
  const legend = g.append("g")
    .attr("transform", `translate(${innerW + 15}, 0)`);

  SERIES.forEach(({ key, color }, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 24})`);
    row.append("line")
      .attr("x2", 18).attr("stroke", color).attr("stroke-width", 2.5);
    row.append("text")
      .attr("x", 24).attr("dy", "0.35em")
      .style("font-size", "12px")
      .text(key);
  });

  // --- Zoom + pan ---
  const zoom = d3.zoom()
    .scaleExtent([1, 20])                          // 1x to 20x zoom
    .translateExtent([[0, 0], [innerW, innerH]])   // can't pan past data edges
    .extent([[0, 0], [innerW, innerH]])
    .on("zoom", (event) => {
      const zx = event.transform.rescaleX(xScale); // new x scale after zoom

      xAxisG.call(d3.axisBottom(zx).ticks(8));    // update x axis ticks

      SERIES.forEach(({ key }) => {
        linesG.select(`.line-${key}`)              // re-select each line by class
          .attr("d", d3.line()
            .x(d => zx(d.date))                   // use zoomed x scale
            .y(d => yScale(d[key]))
            (data)
          );
      });
    });

  // Invisible rect on top to capture mouse events
  g.append("rect")
    .attr("width", innerW)
    .attr("height", innerH)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .call(zoom);
}

