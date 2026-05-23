import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from 'lodash';

const margin = { left: 72, right: 24, top: 34, bottom: 52 };
const API_BASE = "http://localhost:8000";

export function LineChart({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedStock) return;
    
    setLoading(true);
    fetch(`${API_BASE}/stock/${selectedStock}`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        const parsed = data.stock_series.map(d => ({
          date: new Date(d.date),
          open: +d.Open,
          high: +d.High,
          low: +d.Low,
          close: +d.Close,
          volume: +d.Volume
        }));
        setStockData(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading stock data:", err);
        setStockData([]);
        setLoading(false);
      });
  }, [selectedStock]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(stockData)) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height && !isEmpty(stockData)) {
            drawChart(svgRef.current, stockData, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) {
      drawChart(svgRef.current, stockData, width, height);
    }

    return () => resizeObserver.disconnect();
  }, [stockData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading stock data...</p>
      </div>
    );
  }

  return (
    <div className="chart-container" ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg id="line-chart-svg" ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  // const metrics = [
  //   { key: 'open', label: 'Open', color: '#0099c8' },
  //   { key: 'high', label: 'High', color: '#2ca02c' },
  //   { key: 'low', label: 'Low', color: '#ff7f0e' },
  //   { key: 'close', label: 'Close', color: '#9467bd' }
  // ];

  const metrics = [
    { key: 'open', label: 'Open', color: '#06b6d4' },
    { key: 'high', label: 'High', color: '#65a30d' },
    { key: 'low', label: 'Low', color: '#f97316' },
    { key: 'close', label: 'Close', color: '#6366f1' }
  ];

  // const metrics = [
  //   { key: 'open', label: 'Open', color: '#2563eb' },
  //   { key: 'high', label: 'High', color: '#059669' },
  //   { key: 'low', label: 'Low', color: '#ea580c' },
  //   { key: 'close', label: 'Close', color: '#7e22ce' }
  // ];

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right]);

  const yExtent = [
    d3.min(data, d => d.low),
    d3.max(data, d => d.high)
  ];
  const yPadding = Math.max((yExtent[1] - yExtent[0]) * 0.12, yExtent[1] * 0.002);

  const yScale = d3.scaleLinear()
    .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
    .range([height - margin.bottom, margin.top]);

  svg.append("defs")
    .append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const zoom = d3.zoom()
    .scaleExtent([1, 25])
    .translateExtent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("zoom", zoomed);

  const chartGroup = svg.append("g")
    .attr("clip-path", "url(#clip)");

  svg.append("rect")
    .attr("class", "zoom-rect")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .style("fill", "none")
    .style("pointer-events", "all")
    .style("cursor", "grab")
    .call(zoom);

  const xTickFormat = d3.timeFormat("%b %d, %Y");
  const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(xTickFormat);
  const yAxis = d3.axisLeft(yScale).ticks(10);

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  styleXAxisTicks(xAxisGroup);

  const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  svg.append("g")
    .attr("transform", `translate(24, ${height / 2}) rotate(-90)`)
    .append("text")
    .text("Price ($)")
    .style("font-size", "0.8rem")
    .style("fill", "#333");

  svg.append("text")
    .attr("x", margin.left + 10)
    .attr("y", margin.top + 14)
    .text("Drag or scroll to zoom")
    .style("font-size", "0.7rem")
    .style("fill", "#666")
    .style("pointer-events", "none");

  svg.append("g")
    .attr("transform", `translate(${width / 2}, ${height - 10})`)
    .append("text")
    .text("Date")
    .style("font-size", "0.8rem")
    .style("fill", "#333");

  metrics.forEach(metric => {
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d[metric.key]));

    chartGroup.append("path")
      .datum(data)
      .attr("class", `line-${metric.key}`)
      .attr("fill", "none")
      .attr("stroke", metric.color)
      .attr("stroke-width", 1.9)
      .attr("opacity", 0.9)
      .attr("stroke-dasharray", metric.key === 'high' || metric.key === 'low' ? "4 3" : "none")
      .attr("d", line);
  });

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${Math.max(margin.left, width - 310)}, 10)`);

  metrics.forEach((metric, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(${i * 72}, 0)`);

    legendRow.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", metric.color);

    legendRow.append("text")
      .attr("x", 17)
      .attr("y", 10)
      .text(metric.label)
      .style("font-size", "0.75rem")
      .style("fill", "#333");
  });

  function zoomed(event) {
    const newXScale = event.transform.rescaleX(xScale);
    const newYScale = event.transform.rescaleY(yScale);

    xAxisGroup.call(xAxis.scale(newXScale));
    styleXAxisTicks(xAxisGroup);
    yAxisGroup.call(yAxis.scale(newYScale));

    metrics.forEach(metric => {
      const line = d3.line()
        .x(d => newXScale(d.date))
        .y(d => newYScale(d[metric.key]));

      chartGroup.select(`.line-${metric.key}`)
        .attr("d", line);
    });
  }

  function styleXAxisTicks(axisGroup) {
    axisGroup.selectAll("text")
      .attr("transform", "rotate(-20)")
      .style("text-anchor", "end")
      .attr("dx", "-0.6em")
      .attr("dy", "0.2em");
  }
}
