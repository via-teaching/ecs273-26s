import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";

const margin = { left: 50, right: 30, top: 15, bottom: 50 };

const SECTOR_COLORS = {
  Energy:      "#f97316",
  Industrials: "#8b5cf6",
  Consumer:    "#ec4899",
  Healthcare:  "#22c55e",
  Financials:  "#3b82f6",
  Technology:  "#ef4444",
};

export function TSNEScatter({ ticker, onSelect }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const dataRef = useRef([]);

  // Create tooltip once, attached to document body so it never leaks into other views
  useEffect(() => {
    const tip = document.createElement("div");
    tip.style.cssText = `
      position: fixed;
      pointer-events: none;
      display: none;
      background: rgba(15,23,42,0.92);
      color: #f1f5f9;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 12px;
      line-height: 1.6;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
    `;
    document.body.appendChild(tip);
    tooltipRef.current = tip;
    return () => document.body.removeChild(tip);
  }, []);

  useEffect(() => {
    fetch("/tsne/").then(r => r.json()).then((json) => { const raw = json.data.map(d => ({ticker: d.Stock, x: d.x, y: d.y, sector: d.sector}));
      dataRef.current = raw.map((d) => ({
        ticker: d.ticker,
        x: +d.x,
        y: +d.y,
        sector: d.sector,
      }));
      if (containerRef.current && svgRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width && height)
          drawChart(svgRef.current, dataRef.current, width, height, ticker, onSelect, tooltipRef.current);
      }
    });
  }, []);

  useEffect(() => {
    if (dataRef.current.length && svgRef.current && containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width && height)
        drawChart(svgRef.current, dataRef.current, width, height, ticker, onSelect, tooltipRef.current);
    }
  }, [ticker]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height && dataRef.current.length)
            drawChart(svgRef.current, dataRef.current, width, height, ticker, onSelect, tooltipRef.current);
        }
      }, 100)
    );
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [ticker]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* SVG takes all remaining height */}
      <div ref={containerRef} style={{ flex: "1 1 0", minHeight: 0 }}>
        <svg ref={svgRef} width="100%" height="100%"></svg>
      </div>

      {/* Legend row rendered as HTML below the chart */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "6px 14px",
        padding: "6px 16px 8px",
        borderTop: "1px solid #f1f5f9",
        flexShrink: 0,
      }}>
        {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
          <span key={sector} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "#475569" }}>{sector}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function drawChart(svgElement, data, width, height, selectedTicker, onSelect, tooltip) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  svg.attr("width", width).attr("height", height);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const xScale = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.x)).nice()
    .range([0, innerW]);

  const yScale = d3.scaleLinear()
    .domain(d3.extent(data, (d) => d.y)).nice()
    .range([innerH, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("defs").append("clipPath").attr("id", "tsne-clip")
    .append("rect").attr("width", innerW).attr("height", innerH);

  // ── Grid ──────────────────────────────────────────────────────────────────
  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(""))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

  // ── Axes ──────────────────────────────────────────────────────────────────
  const xAxis = g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(6));
  const yAxis = g.append("g").attr("class", "y-axis")
    .call(d3.axisLeft(yScale).ticks(6));

  g.append("text").attr("x", innerW / 2).attr("y", innerH + 42)
    .style("text-anchor", "middle").style("font-size", "12px").text("t-SNE Dimension 1");
  g.append("text").attr("transform", "rotate(-90)").attr("x", -innerH / 2).attr("y", -40)
    .style("text-anchor", "middle").style("font-size", "12px").text("t-SNE Dimension 2");

  // ── Points (clipped to plot area) ─────────────────────────────────────────
  const pointsG = g.append("g").attr("clip-path", "url(#tsne-clip)");

  pointsG.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", (d) => d.ticker === selectedTicker ? 10 : 6)
    .attr("fill", (d) => SECTOR_COLORS[d.sector] || "#6b7280")
    .attr("stroke", (d) => d.ticker === selectedTicker ? "#111" : "#fff")
    .attr("stroke-width", (d) => d.ticker === selectedTicker ? 2.5 : 1)
    .attr("opacity", (d) => d.ticker === selectedTicker ? 1 : 0.75)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", d.ticker === selectedTicker ? 12 : 9).attr("opacity", 1);
      tooltip.style.display = "block";
      tooltip.innerHTML = `<b>${d.ticker}</b><br/><span style="color:#94a3b8">${d.sector}</span>`;
    })
    .on("mousemove", function (event) {
      tooltip.style.left = `${event.clientX + 14}px`;
      tooltip.style.top  = `${event.clientY - 10}px`;
    })
    .on("mouseout", function (event, d) {
      d3.select(this)
        .attr("r", d.ticker === selectedTicker ? 10 : 6)
        .attr("opacity", d.ticker === selectedTicker ? 1 : 0.75);
      tooltip.style.display = "none";
    })
    .on("click", function (event, d) {
      event.stopPropagation();
      tooltip.style.display = "none";
      if (onSelect) onSelect(d.ticker);
    });

  // ── Labels (NOT clipped — must render outside plot area into right margin) ─
  const labelsG = g.append("g");

  labelsG.selectAll("text.label")
    .data(data)
    .join("text")
    .attr("class", "label")
    .attr("x", (d) => xScale(d.x) + 12)
    .attr("y", (d) => yScale(d.y) + 4)
    .style("font-size", (d) => d.ticker === selectedTicker ? "13px" : "10px")
    .style("font-weight", (d) => d.ticker === selectedTicker ? "700" : "400")
    .style("fill", (d) => d.ticker === selectedTicker ? "#111" : "#555")
    .style("pointer-events", "none")
    .text((d) => d.ticker);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .extent([[0, 0], [innerW, innerH]])
    .on("zoom", (event) => {
      const newX = event.transform.rescaleX(xScale);
      const newY = event.transform.rescaleY(yScale);
      xAxis.call(d3.axisBottom(newX).ticks(6));
      yAxis.call(d3.axisLeft(newY).ticks(6));
      pointsG.selectAll("circle")
        .attr("cx", (d) => newX(d.x))
        .attr("cy", (d) => newY(d.y));
      labelsG.selectAll("text.label")
        .attr("x", (d) => newX(d.x) + 12)
        .attr("y", (d) => newY(d.y) + 4);
      tooltip.style.display = "none";
    });

  svg.call(zoom);
}