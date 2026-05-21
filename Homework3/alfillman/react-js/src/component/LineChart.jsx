import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from "lodash";

// Vite glob import — grabs URLs for every CSV in /data/stockdata at build time
const csvUrls = import.meta.glob("../../data/stockdata/*.csv", {
  query: "?url",
  import: "default",
  eager: true,
});

// Build a lookup: { NVDA: "/assets/NVDA-abc123.csv", AAPL: "...", ... }
const urlByTicker = Object.fromEntries(
  Object.entries(csvUrls).map(([path, url]) => {
    const ticker = path.split("/").pop().replace(".csv", "");
    return [ticker, url];
  })
);

const margin = { left: 60, right: 120, top: 30, bottom: 50 };
const SERIES = ["Open", "High", "Low", "Close"];
const COLORS = { Open: "#1f77b4", High: "#2ca02c", Low: "#d62728", Close: "#ff7f0e" };

export function LineChart({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  // 1. Load CSV whenever the ticker changes
// 1. Load CSV whenever the ticker changes
  useEffect(() => {
    const url = urlByTicker[ticker];
    if (!url) {
      console.error(`No CSV found for ${ticker}. Available:`, Object.keys(urlByTicker));
      return;
    }

    d3.csv(url, (row) => {
      // Normalize keys (strips BOM if present, trims whitespace)
      const clean = {};
      for (const k in row) clean[k.replace(/^\ufeff/, "").trim()] = row[k];

      return {
        date: new Date(clean.Date),
        Open: +clean.Open,
        High: +clean.High,
        Low: +clean.Low,
        Close: +clean.Close,
      };
    })
      .then((rows) => {
        const data = rows.filter((d) => !isNaN(d.date));
        data.sort((a, b) => a.date - b.date);
        console.log(`Loaded ${data.length} rows, first:`, data[0]);
        setData(data);
      })
      .catch((err) => console.error("CSV load failed:", err));
  }, [ticker]);
  
  // 2. Redraw on data change or container resize
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(data)) return;

    const ro = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) drawChart(svgRef.current, data, width, height, ticker);
        }
      }, 100)
    );
    ro.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) drawChart(svgRef.current, data, width, height, ticker);

    return () => ro.disconnect();
  }, [data, ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawChart(svgEl, data, width, height, ticker) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  // ----- scales -----
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close));
  const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close));
  const yScale = d3.scaleLinear()
    .domain([yMin * 0.98, yMax * 1.02])
    .range([height - margin.bottom, margin.top]);

  // ----- clip path so lines stay inside chart area when zoomed -----
  svg.append("defs").append("clipPath").attr("id", "chart-clip")
    .append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  // ----- axes -----
  const xAxisG = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));

  svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  // axis labels
  svg.append("text")
    .attr("transform", `translate(${width / 2}, ${height - 10})`)
    .style("text-anchor", "middle").style("font-size", ".8rem")
    .text("Date");

  svg.append("text")
    .attr("transform", `translate(15, ${height / 2}) rotate(-90)`)
    .style("text-anchor", "middle").style("font-size", ".8rem")
    .text("Price (USD)");

  // title
  svg.append("text")
    .attr("x", width / 2).attr("y", margin.top - 10)
    .style("text-anchor", "middle").style("font-weight", "bold")
    .text(`${ticker} — Open / High / Low / Close`);

  // ----- lines (clipped) -----
  const linesG = svg.append("g").attr("clip-path", "url(#chart-clip)");
  const linePaths = {};
  SERIES.forEach((key) => {
    const lineGen = d3.line().x((d) => xScale(d.date)).y((d) => yScale(d[key]));
    linePaths[key] = linesG.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", COLORS[key])
      .attr("stroke-width", 1.5)
      .attr("d", lineGen);
  });

  // ----- legend -----
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
  SERIES.forEach((key, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", COLORS[key]);
    row.append("text").attr("x", 18).attr("y", 10).style("font-size", ".8rem").text(key);
  });

  // ----- horizontal zoom + pan -----
  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[margin.left, 0], [width - margin.right, height]])
    .extent([[margin.left, 0], [width - margin.right, height]])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(newX));
      SERIES.forEach((key) => {
        const lineGen = d3.line().x((d) => newX(d.date)).y((d) => yScale(d[key]));
        linePaths[key].attr("d", lineGen);
      });
    });

  svg.append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .call(zoom);
}