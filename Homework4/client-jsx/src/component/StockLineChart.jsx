import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from 'lodash';

const margin = { left: 100, right: 120, top: 40, bottom: 80 };
const CONFIG = [
  { k: "Open", c: "#4dafb6" }, { k: "High", c: "#62f085" },
  { k: "Low", c: "#fc052e" }, { k: "Close", c: "#4d68ff" }
];

export function StockLineChart({ selectedStock }) {
  const [data, setData] = useState([]);
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    fetch(`http://localhost:8000/stock/${selectedStock}`)
      .then(res => res.json())
      .then(resData => setData(resData.stock_series.map(d => ({
        Date: new Date(d.Date),
        Open: d.Open,
        High: d.High,
        Low: d.Low,
        Close: d.Close
      }))));
  }, [selectedStock]);
  
  useEffect(() => {
    if (!containerRef.current || isEmpty(data)) return;

    const redraw = () => {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width && height) drawChart(svgRef.current, data, width, height);
    };

    const obs = new ResizeObserver(debounce(redraw, 100));
    obs.observe(containerRef.current);
    redraw(); 

    return () => obs.disconnect();
  }, [data]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}

function drawChart(svgElement, data, width, height) {
  const svg = d3.select(svgElement);
  svg.selectAll('*').remove();

  const iw = width - margin.left - margin.right;
  const ih = height - margin.top - margin.bottom;

  const x = d3.scaleTime().domain(d3.extent(data, d => d.Date)).range([0, iw]);
  const y = d3.scaleLinear().domain([d3.min(data, d => d.Low) * 0.98, d3.max(data, d => d.High) * 1.02]).range([ih, 0]);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
  

  const chartArea = g.append("svg")
    .attr("width", iw)
    .attr("height", ih);

  const xAxis = d3.axisBottom(x), yAxis = d3.axisLeft(y);

  const updateAxisFormatting = (scale, axis, availableWidth) => {
    const [start, end] = scale.domain();
    const diffDays = (end - start) / (1000 * 60 * 60 * 24);

    axis.ticks(Math.max(2, Math.floor(availableWidth / 90)));

    if (diffDays <= 90) {
      axis.tickFormat(d3.timeFormat("%b %d")); 
    } else if (diffDays <= 365 * 2) {
      axis.tickFormat(d3.timeFormat("%b %Y")); 
    } else {
      axis.tickFormat(d3.timeFormat("%Y"));    
    }
  };

  updateAxisFormatting(x, xAxis, iw);

  const gx = g.append('g').attr('transform', `translate(0,${ih})`).call(xAxis);
  const gy = g.append('g').call(yAxis);

  g.append("text")
    .attr("x", iw / 2).attr("y", ih + 40)
    .attr("text-anchor", "middle").style("font-weight", "bold").text("Date");

  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -70)
    .attr("x", -ih / 2)
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Price (USD)");

  const lineGen = (k, sc) => d3.line().x(d => sc(d.Date)).y(d => y(d[k]));
    
  const paths = CONFIG.map(conf => 
    chartArea.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", conf.c)
      .attr("stroke-width", 2)
      .attr("d", lineGen(conf.k, x))
  );

  const legend = svg.append("g").attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
  CONFIG.forEach((conf, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 25})`);
    row.append("rect").attr("width", 15).attr("height", 15).attr("fill", conf.c);
    row.append("text").attr("x", 22).attr("y", 12).style("font-size", "14px").text(conf.k);
  });

  svg.call(d3.zoom().scaleExtent([1, 20]).on("zoom", (e) => {
    const nx = e.transform.rescaleX(x);
    updateAxisFormatting(nx, xAxis, iw);
    gx.call(xAxis.scale(nx));
    paths.forEach((p, i) => p.attr("d", lineGen(CONFIG[i].k, nx)));
  }));
}