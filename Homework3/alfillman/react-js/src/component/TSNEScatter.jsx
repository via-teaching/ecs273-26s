import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { isEmpty, debounce } from "lodash";

import tsneUrl from "../../data/tsne.csv?url";

const margin = { left: 50, right: 140, top: 30, bottom: 50 };

export function TSNEScatter({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [data, setData] = useState([]);

  // Load tsne.csv once
  useEffect(() => {
    d3.csv(tsneUrl, (row) => {
      const clean = {};
      for (const k in row) clean[k.replace(/^\ufeff/, "").trim()] = row[k];
      return {
        ticker: clean.ticker,
        x: +clean.x,
        y: +clean.y,
        sector: clean.sector,
      };
    })
      .then((rows) => setData(rows.filter((d) => d.ticker)))
      .catch((err) => console.error("tsne.csv load failed:", err));
  }, []);

  // Redraw when data, selected ticker, or size changes
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || isEmpty(data)) return;

    const ro = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height) draw(svgRef.current, data, width, height, ticker);
        }
      }, 100)
    );
    ro.observe(containerRef.current);

    const { width, height } = containerRef.current.getBoundingClientRect();
    if (width && height) draw(svgRef.current, data, width, height, ticker);

    return () => ro.disconnect();
  }, [data, ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg ref={svgRef} width="100%" height="100%" />
    </div>
  );
}

function draw(svgEl, data, width, height, selected) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();

  const sectors = [...new Set(data.map((d) => d.sector))];
  const color = d3.scaleOrdinal().domain(sectors).range(d3.schemeTableau10);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.x)).nice()
    .range([margin.left, width - margin.right]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.y)).nice()
    .range([height - margin.bottom, margin.top]);

  // clip
  svg.append("defs").append("clipPath").attr("id", "tsne-clip")
    .append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  // axes
  const xAxisG = svg.append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));
  const yAxisG = svg.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));

  svg.append("text")
    .attr("transform", `translate(${width / 2}, ${height - 10})`)
    .style("text-anchor", "middle").style("font-size", ".8rem")
    .text("t-SNE 1");
  svg.append("text")
    .attr("transform", `translate(15, ${height / 2}) rotate(-90)`)
    .style("text-anchor", "middle").style("font-size", ".8rem")
    .text("t-SNE 2");

  // points (clipped so they don't escape on zoom)
  const pointsG = svg.append("g").attr("clip-path", "url(#tsne-clip)");

  const dots = pointsG.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", (d) => (d.ticker === selected ? 9 : 4))
    .attr("fill", (d) => color(d.sector))
    .attr("stroke", (d) => (d.ticker === selected ? "#000" : "none"))
    .attr("stroke-width", 1.5);

  // label for the selected ticker
  const labels = pointsG.selectAll("text.point-label")
    .data(data.filter((d) => d.ticker === selected))
    .join("text")
    .attr("class", "point-label")
    .attr("x", (d) => xScale(d.x) + 12)
    .attr("y", (d) => yScale(d.y) + 4)
    .style("font-size", ".75rem").style("font-weight", "bold")
    .text((d) => d.ticker);

  // legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);
  sectors.forEach((s, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
    row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(s));
    row.append("text").attr("x", 18).attr("y", 10).style("font-size", ".75rem").text(s);
  });

  // zoom (both axes)
  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
    .on("zoom", (event) => {
      const zx = event.transform.rescaleX(xScale);
      const zy = event.transform.rescaleY(yScale);
      xAxisG.call(d3.axisBottom(zx));
      yAxisG.call(d3.axisLeft(zy));
      dots.attr("cx", (d) => zx(d.x)).attr("cy", (d) => zy(d.y));
      labels.attr("x", (d) => zx(d.x) + 12).attr("y", (d) => zy(d.y) + 4);
    });

  svg.append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("fill", "none").attr("pointer-events", "all")
    .call(zoom);
}