import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

const margin = { left: 60, right: 90, top: 40, bottom: 60 };

async function loadTsneData() {
  return d3.csv("../../data/tsne.csv", (d) => ({
    dim1: +d.dim1,
    dim2: +d.dim2,
    ticker: d.ticker,
    category: d.category,
  }));
}

export function ScatterPlot() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);
  const [selectedTicker, setSelectedTicker] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const tsneData = await loadTsneData();
      setData(tsneData);
    };
    loadData();

    const select = d3.select("#bar-select");
    const updateSelection = () => setSelectedTicker(select.node()?.value || "");
    
    select.on("change.scatter", updateSelection);
    updateSelection();

    return () => select.on("change.scatter", null);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || !data.length) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            drawScatterPlot(svgRef.current, data, width, height, selectedTicker);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    drawScatterPlot(svgRef.current, data, width, height, selectedTicker);

    return () => resizeObserver.disconnect();
  }, [data, selectedTicker]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function drawScatterPlot(svgElement, data, width, height, selectedTicker) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.dim1))
    .range([margin.left, width - margin.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.dim2))
    .range([height - margin.bottom, margin.top])
    .nice();

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain([...new Set(data.map(d => d.category))]);

  svg.append("defs").append("clipPath")
    .attr("id", "scatter-clip")
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const chart = svg.append("g").attr("clip-path", "url(#scatter-clip)");

  const xAxis = d3.axisBottom(xScale).ticks(width / 100);
  const yAxis = d3.axisLeft(yScale).ticks(height / 80);

  const gx = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis);

  const gy = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis);

  svg.append("text")
    .attr("x", (width - margin.right + margin.left) / 2)
    .attr("y", height - 15)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("t-SNE Dimension 1");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("t-SNE Dimension 2");

  const dots = chart.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScale(d.dim1))
    .attr("cy", d => yScale(d.dim2))
    .attr("r", d => d.ticker === selectedTicker ? 10 : 4) 
    .attr("fill", d => colorScale(d.category))
    .attr("stroke", d => d.ticker === selectedTicker ? "#000" : "#fff")
    .attr("stroke-width", d => d.ticker === selectedTicker ? 2 : 0.05)
    .sort((a, b) => (a.ticker === selectedTicker) ? 1 : -1);

  if (selectedTicker) {
    svg.append("text")
      .attr("x", margin.left + 15)
      .attr("y", margin.top + 25)
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .style("fill", "#333")
      .text(`Selected: ${selectedTicker}`);
  }

  const categories = colorScale.domain();
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

  categories.forEach((cat, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
    g.append("rect").attr("width", 10).attr("height", 10).attr("fill", colorScale(cat));
    g.append("text")
      .attr("x", 15).attr("y", 10)
      .text(cat).style("font-size", "11px").attr("alignment-baseline", "middle");
  });

  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);
      const newY = event.transform.rescaleY(yScale);

      gx.call(xAxis.scale(newX));
      gy.call(yAxis.scale(newY));

      dots.attr("cx", d => newX(d.dim1)).attr("cy", d => newY(d.dim2));
    });

  svg.call(zoom);
}