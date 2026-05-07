import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from 'lodash';

const margin = { top: 20, right: 130, bottom: 50, left: 60 };

const TICKERS = ['XOM', 'CVX', 'HAL', 'MMM', 'CAT', 'DAL', 'MCD', 'NKE', 'KO', 
               'JNJ', 'PFE', 'UNH', 'JPM', 'GS', 'BAC', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'];

const CATEGORIES = ['Energy', 'Energy', 'Energy', 'Industrial', 'Industrial', 'Industrial', 
    'Consumer', 'Consumer', 'Consumer', 'Healthcare', 'Healthcare', 'Healthcare', 
    'Finance', 'Finance', 'Finance', 'Tech', 'Tech', 'Tech', 'Tech', 'Tech'];

export function TsnePlot({ selectedStock }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    d3.csv("/data/tsne.csv").then(csvData => {
      const formatted = csvData.map((d, i) => ({
        x: +d.tsne_1,
        y: +d.tsne_2,
        ticker: TICKERS[i],
        sector: CATEGORIES[i]
      }));
      setData(formatted);
    });
  }, []); 

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const handleResize = debounce((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        drawPlot(svgRef.current, data, width, height, selectedStock);
      }
    }, 150);

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    drawPlot(svgRef.current, data, width, height, selectedStock);

    return () => observer.disconnect();
  }, [data, selectedStock]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>
    </div>
  );
}

function drawPlot(svgElement, data, width, height, selectedStock) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const iw = width - margin.left - margin.right;
  const ih = height - margin.top - margin.bottom;

  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);
  const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
  const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

  const x = d3.scaleLinear()
    .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
    .range([0, iw]);

  const y = d3.scaleLinear()
    .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
    .range([ih, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const chartArea = g.append("svg")
    .attr("width", iw)
    .attr("height", ih);

  const gx = g.append("g").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x));
  const gy = g.append("g").call(d3.axisLeft(y));

  g.append("text")
    .attr("x", iw / 2).attr("y", ih + 40)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("t-SNE 1");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -ih / 2).attr("y", -45)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("t-SNE 2");

  const points = chartArea.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", d => d.ticker === selectedStock ? 8 : 4)
    .attr("fill", d => color(d.sector))
    .attr("stroke", d => d.ticker === selectedStock ? "#000" : "none")
    .attr("stroke-width", 2)
    .attr("opacity", d => d.ticker === selectedStock ? 1 : 0.6);

  const label = chartArea.selectAll(".ticker-label")
    .data(data.filter(d => d.ticker === selectedStock))
    .join("text")
    .attr("class", "ticker-label")
    .attr("x", d => x(d.x) + 12)
    .attr("y", d => y(d.y) + 4)
    .text(d => d.ticker)
    .style("font-weight", "bold");

  const sectors = [...new Set(CATEGORIES)];
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 15}, ${margin.top})`);

  sectors.forEach((sector, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 25})`);
    row.append("rect").attr("width", 15).attr("height", 15).attr("fill", color(sector));
    row.append("text").attr("x", 22).attr("y", 12).style("font-size", "14px").text(sector);
  });

  const zoom = d3.zoom().on("zoom", (event) => {
    const zx = event.transform.rescaleX(x);
    const zy = event.transform.rescaleY(y);
    gx.call(d3.axisBottom(zx));
    gy.call(d3.axisLeft(zy));
    points.attr("cx", d => zx(d.x)).attr("cy", d => zy(d.y));
    label.attr("x", d => zx(d.x) + 12).attr("y", d => zy(d.y) + 4);
  });

  svg.call(zoom);
}