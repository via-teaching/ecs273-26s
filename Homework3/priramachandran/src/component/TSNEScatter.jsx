import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import { debounce, isEmpty } from "lodash";
import tsneCsvRaw from "../../data/tsne.csv?raw";

const STOCK_NAMES = {
  AAPL: "Apple Inc.",
  BAC: "Bank of America",
  CAT: "Caterpillar",
  CVX: "Chevron",
  DAL: "Delta Air Lines",
  GOOGL: "Alphabet (Google)",
  GS: "Goldman Sachs",
  HAL: "Halliburton",
  JNJ: "Johnson & Johnson",
  JPM: "JPMorgan Chase",
  KO: "Coca-Cola",
  MCD: "McDonald's",
  META: "Meta Platforms",
  MMM: "3M",
  MSFT: "Microsoft",
  NKE: "Nike",
  NVDA: "NVIDIA",
  PFE: "Pfizer",
  UNH: "UnitedHealth",
  XOM: "Exxon Mobil",
};

const margin = { top: 36, right: 132, bottom: 52, left: 56 };

function parseTsne(raw) {
  return d3.csvParse(raw, (row) => {
    const x = +row.x;
    const y = +row.y;
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    return {
      ticker: String(row.ticker).trim(),
      x,
      y,
      category: String(row.category).trim(),
    };
  }).filter(Boolean);
}

function drawScatter(
  svgElement,
  rows,
  selectedTicker,
  width,
  height
) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();

  if (isEmpty(rows) || width < 60 || height < 60) {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .text("No t-SNE data.");
    return;
  }

  const sectors = [...new Set(rows.map((d) => d.category))].sort();

  const color = d3
    .scaleOrdinal()
    .domain(sectors)
    .range([
      "#2563eb",
      "#16a34a",
      "#dc2626",
      "#ca8a04",
      "#9333ea",
      "#0d9488",
      "#ea580c",
      "#4f46e5",
      "#db2777",
      "#65a30d",
    ]);

  const xPad = (d3.max(rows, (d) => d.x) - d3.min(rows, (d) => d.x)) * 0.08 || 1;
  const yPad = (d3.max(rows, (d) => d.y) - d3.min(rows, (d) => d.y)) * 0.08 || 1;
  const xExt = d3.extent(rows, (d) => d.x);
  const yExt = d3.extent(rows, (d) => d.y);

  const xScale = d3
    .scaleLinear()
    .domain([xExt[0] - xPad, xExt[1] + xPad])
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([yExt[0] - yPad, yExt[1] + yPad])
    .range([height - margin.bottom, margin.top]);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const clipId = "tsne-clip";

  svg.attr("width", width).attr("height", height);

  svg
    .append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "600")
    .attr("fill", "#0f172a")
    .text("Stock embeddings (t-SNE)");

  svg
    .append("defs")
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", innerW)
    .attr("height", innerH);

  const gX = svg.append("g").attr("class", "axis x-axis");
  const gY = svg.append("g").attr("class", "axis y-axis");

  const plot = svg.append("g").attr("clip-path", `url(#${clipId})`);

  const gx = gX.attr("transform", `translate(0,${height - margin.bottom})`);
  const gy = gY.attr("transform", `translate(${margin.left},0)`);

  const dots = plot
    .selectAll("circle")
    .data(rows)
    .join("circle")
    .attr("class", (d) => `dot dot-${d.ticker}`)
    .attr("fill", (d) => color(d.category))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.25)
    .attr("opacity", 0.88);

  const labelG = svg.append("g").attr("class", "selection-label");

  const legend = svg.append("g").attr("class", "legend");
  const lx = width - margin.right + 8;
  let ly = margin.top + 4;
  legend
    .append("text")
    .attr("x", lx)
    .attr("y", ly)
    .style("font-size", "11px")
    .style("font-weight", "600")
    .attr("fill", "#334155")
    .text("Sector");
  ly += 16;
  sectors.forEach((s) => {
    legend
      .append("rect")
      .attr("x", lx)
      .attr("y", ly - 8)
      .attr("width", 12)
      .attr("height", 12)
      .attr("rx", 2)
      .attr("fill", color(s));
    legend
      .append("text")
      .attr("x", lx + 18)
      .attr("y", ly + 2)
      .style("font-size", "10px")
      .attr("fill", "#334155")
      .text(s);
    ly += 18;
  });

  function updatePositions(zx, zy) {
    dots
      .attr("cx", (d) => zx(d.x))
      .attr("cy", (d) => zy(d.y))
      .attr("r", (d) => (d.ticker === selectedTicker ? 10 : 4.5))
      .attr("stroke-width", (d) => (d.ticker === selectedTicker ? 2.25 : 1.25));

    const sel = rows.find((d) => d.ticker === selectedTicker);
    labelG.selectAll("*").remove();
    if (!sel) return;

    const nx = zx(sel.x);
    const ny = zy(sel.y);
    const name = STOCK_NAMES[sel.ticker] || sel.ticker;
    const lines = [name, sel.ticker];

    lines.forEach((line, i) => {
      labelG
        .append("text")
        .attr("x", nx + 12)
        .attr("y", ny - 14 + i * 14)
        .attr("text-anchor", "start")
        .style("font-size", i === 0 ? "12px" : "11px")
        .style("font-weight", i === 0 ? "600" : "400")
        .attr("fill", i === 0 ? "#0f172a" : "#475569")
        .attr("paint-order", "stroke")
        .style("stroke", "#fff")
        .style("stroke-width", 3)
        .text(line);
    });
  }

  gx.call(d3.axisBottom(xScale).ticks(8).tickSizeOuter(0));
  gy.call(d3.axisLeft(yScale).ticks(8).tickSizeOuter(0));

  gx.selectAll("text").style("font-size", "10px");
  gy.selectAll("text").style("font-size", "10px");

  svg
    .append("text")
    .attr("class", "axis-label-x")
    .attr("x", margin.left + innerW / 2)
    .attr("y", height - 10)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("fill", "#334155")
    .text("t-SNE dimension 1");

  svg
    .append("text")
    .attr("class", "axis-label-y")
    .attr(
      "transform",
      `translate(${margin.left * 0.35},${margin.top + innerH / 2}) rotate(-90)`
    )
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .attr("fill", "#334155")
    .text("t-SNE dimension 2");

  updatePositions(xScale, yScale);

  const zoom = d3
    .zoom()
    .scaleExtent([0.4, 12])
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .translateExtent([
      [margin.left - innerW, margin.top - innerH],
      [width - margin.right + innerW, height - margin.bottom + innerH],
    ])
    .on("zoom", (event) => {
      const zx = event.transform.rescaleX(xScale);
      const zy = event.transform.rescaleY(yScale);
      gx.call(d3.axisBottom(zx).ticks(8).tickSizeOuter(0));
      gy.call(d3.axisLeft(zy).ticks(8).tickSizeOuter(0));
      gx.selectAll("text").style("font-size", "10px").attr("transform", null);
      gy.selectAll("text").style("font-size", "10px");
      updatePositions(zx, zy);
    });

  svg.call(zoom);

  svg.on("dblclick.zoom", null);
}

export function TSNEScatter({ selectedTicker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const rows = useMemo(() => parseTsne(tsneCsvRaw), []);

  useEffect(() => {
    const el = containerRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;

    const ro = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== el) continue;
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) drawScatter(svg, rows, selectedTicker, w, h);
        }
      }, 80)
    );

    ro.observe(el);
    const { width: w, height: h } = el.getBoundingClientRect();
    if (w > 0 && h > 0) drawScatter(svg, rows, selectedTicker, w, h);

    return () => ro.disconnect();
  }, [rows, selectedTicker]);

  return (
    <div ref={containerRef} className="h-full w-full min-h-[220px]">
      <svg ref={svgRef} className="block h-full w-full overflow-visible" role="img" aria-label="t-SNE scatter plot of stocks" />
    </div>
  );
}
