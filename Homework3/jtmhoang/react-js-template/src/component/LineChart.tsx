import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

const margin = { left: 60, right: 20, top: 20, bottom: 60 };

const DEFAULT_TICKER = "NVDA";

async function loadStockCSV(ticker) {
  return d3.csv(`../../data/stockdata/${ticker}.csv`, (d) => ({
    date: new Date(d.Date),
    open: +d.Open,
    high: +d.High,
    low: +d.Low,
    close: +d.Close,
  }));
}

export function LineChart() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [data, setData] = useState([]);


  useEffect(() => {
    const select = d3.select("#bar-select");

    const loadTicker = async (value) => {
      const csvData = await loadStockCSV(value);
      setData(csvData);
    };

    const handler = (event) => {
      loadTicker(event.target.value);
    };

    select.on("change", handler);

    const defaultTicker =
      select.node()?.value || "AAPL";

    loadTicker(defaultTicker);

    return () => select.on("change", null);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    if (!data.length) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width && height) {
            drawLineChart(svgRef.current, data, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } =
      containerRef.current.getBoundingClientRect();

    drawLineChart(svgRef.current, data, width, height);

    return () => resizeObserver.disconnect();
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%" }}
      className="border-2 border-gray-300 rounded-xl"
    >
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawLineChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const keys = ["open", "high", "low", "close"];
  const colors = {
    open: "#22c55e", 
    high: "#ef4444",
    low: "#f97316",  
    close: "#4682b4", 
  };

  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear().range([
    height - margin.bottom,
    margin.top,
  ]);

  const initialYMin = d3.min(data, (d) => Math.min(d.open, d.high, d.low, d.close));
  const initialYMax = d3.max(data, (d) => Math.max(d.open, d.high, d.low, d.close));
  yScale.domain([initialYMin, initialYMax]).nice();

  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top / 2})`);

  keys.forEach((key, i) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(${i * 80}, 0)`);
    
    legendItem.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", colors[key]);
    
    legendItem.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(key.charAt(0).toUpperCase() + key.slice(1))
      .style("font-size", "12px")
      .attr("alignment-baseline", "middle");
  });

  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const chart = svg.append("g").attr("clip-path", "url(#clip)");

  const lineGenerator = (key, x, y) =>
    d3.line()
      .x((d) => x(d.date))
      .y((d) => y(d[key]));

  const paths = {};
  keys.forEach((key) => {
    paths[key] = chart.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", colors[key])
      .attr("stroke-width", 2)
      .attr("d", lineGenerator(key, xScale, yScale));
  });

  const circles = chart.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("r", 2)
    .attr("fill", colors.close)
    .attr("cx", (d) => xScale(d.date))
    .attr("cy", (d) => yScale(d.close));

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(width / 100)); 

  const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).ticks(5));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Stock Price (USD)");

  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);

      const visibleData = data.filter(d => {
        const xPos = newX(d.date);
        return xPos >= margin.left && xPos <= width - margin.right;
      });

      if (visibleData.length > 0) {
        const yMin = d3.min(visibleData, d => Math.min(d.open, d.high, d.low, d.close));
        const yMax = d3.max(visibleData, d => Math.max(d.open, d.high, d.low, d.close));
        yScale.domain([yMin, yMax]).nice();
      }

      keys.forEach((key) => {
        paths[key].attr("d", lineGenerator(key, newX, yScale));
      });

      circles
        .attr("cx", (d) => newX(d.date))
        .attr("cy", (d) => yScale(d.close));

      xAxisGroup.call(d3.axisBottom(newX).ticks(width / 100));
      yAxisGroup.call(d3.axisLeft(yScale).ticks(5));
    });

  svg.call(zoom);
}