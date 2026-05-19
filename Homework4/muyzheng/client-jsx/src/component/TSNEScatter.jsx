import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";
import { debounce } from "lodash";

const API_BASE = "http://localhost:8002";

const margin = { left: 60, right: 160, top: 20, bottom: 50 };

const SECTOR_COLOR = {
  "Energy":     "#f94144",
  "Industrial": "#f8961e",
  "Consumer":   "#f9c74f",
  "Healthcare": "#90be6d",
  "Finance":    "#43aa8b",
  "Tech":       "#577590",
};

export function TSNEScatter({ selectedStock, onSelect }) {
  const wrapperRef = useRef(null);
  const svgRef = useRef(null);
  const [tsneData, setTsneData] = useState([]);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/tsne`)
      .then((r) => r.json())
      .then((raw) =>
        setTsneData(
          raw.map((d) => ({
            ticker: d.Stock,
            x: d.x,
            y: d.y,
            sector: d.sector,
          }))
        )
      )
      .catch((err) => console.error("TSNEScatter fetch error:", err));
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver(
      debounce((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width && height) setDims({ width, height });
      }, 80)
    );
    ro.observe(wrapperRef.current);
    const { width, height } = wrapperRef.current.getBoundingClientRect();
    if (width && height) setDims({ width, height });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!tsneData.length || !dims.width || !dims.height || !svgRef.current) return;

    const { width, height } = dims;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain(d3.extent(tsneData, (d) => d.x)).nice()
      .range([0, innerW]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(tsneData, (d) => d.y)).nice()
      .range([innerH, 0]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const defs = svg.append("defs");
    const clip = defs.append("clipPath").attr("id", "tsne-clip");
    clip.append("rect").attr("width", innerW).attr("height", innerH);

    const root = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const pointsGroup = root.append("g").attr("clip-path", "url(#tsne-clip)");
    const xAxisG = root.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = root.append("g");

    xAxisG.call(d3.axisBottom(xScale).ticks(5));
    yAxisG.call(d3.axisLeft(yScale).ticks(5));

    root.append("text")
      .attr("x", innerW / 2).attr("y", innerH + margin.bottom - 4)
      .attr("text-anchor", "middle").style("font-size", "11px").text("t-SNE Dimension 1");

    root.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2).attr("y", -margin.left + 14)
      .attr("text-anchor", "middle").style("font-size", "11px").text("t-SNE Dimension 2");

    const drawPoints = (xS, yS) => {
      pointsGroup.selectAll(".tsne-point").remove();
      pointsGroup.selectAll(".tsne-label").remove();

      pointsGroup.selectAll(".tsne-point")
        .data(tsneData)
        .join("circle")
        .attr("class", "tsne-point")
        .attr("cx", (d) => xS(d.x))
        .attr("cy", (d) => yS(d.y))
        .attr("r", (d) => (d.ticker === selectedStock ? 14 : 6))
        .attr("fill", (d) => SECTOR_COLOR[d.sector] || "#999")
        .attr("stroke", (d) => (d.ticker === selectedStock ? "#111" : "white"))
        .attr("stroke-width", (d) => (d.ticker === selectedStock ? 2.5 : 1))
        .style("cursor", "pointer")
        .on("click", (_, d) => onSelect(d.ticker));

      tsneData
        .filter((d) => d.ticker === selectedStock)
        .forEach((d) => {
          pointsGroup.append("text")
            .attr("class", "tsne-label")
            .attr("x", xS(d.x) + 17)
            .attr("y", yS(d.y) + 4)
            .style("font-size", "12px")
            .style("font-weight", "600")
            .style("fill", "#111")
            .text(d.ticker);
        });
    };

    drawPoints(xScale, yScale);

    const zoom = d3.zoom()
      .scaleExtent([0.5, 15])
      .on("zoom", (event) => {
        const newX = event.transform.rescaleX(xScale);
        const newY = event.transform.rescaleY(yScale);
        xAxisG.call(d3.axisBottom(newX).ticks(5));
        yAxisG.call(d3.axisLeft(newY).ticks(5));
        drawPoints(newX, newY);
      });

    svg.call(zoom);

    const sectors = Object.keys(SECTOR_COLOR);
    const legendG = root.append("g").attr("transform", `translate(${innerW + 10},10)`);
    legendG.append("rect")
      .attr("x", -6).attr("y", -6)
      .attr("width", 148).attr("height", sectors.length * 20 + 12)
      .attr("fill", "white").attr("opacity", 0.9).attr("rx", 5)
      .attr("stroke", "#e5e7eb");
    sectors.forEach((sector, i) => {
      const g = legendG.append("g").attr("transform", `translate(0,${i * 20})`);
      g.append("rect").attr("width", 12).attr("height", 12).attr("fill", SECTOR_COLOR[sector]).attr("rx", 2);
      g.append("text").attr("x", 18).attr("y", 10).style("font-size", "11px").text(sector);
    });
  }, [tsneData, dims, selectedStock, onSelect]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="px-4 pt-3 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-700">t-SNE Projection</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Click a point to select · scroll to zoom</p>
      </div>
      <div ref={wrapperRef} style={{ flex: 1, minHeight: 0 }}>
        <svg ref={svgRef} style={{ display: "block" }} />
      </div>
    </div>
  );
}
