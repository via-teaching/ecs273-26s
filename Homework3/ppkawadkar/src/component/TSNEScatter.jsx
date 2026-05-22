import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

function parseRow(d) {
  const x = +(d.x ?? d.tsne_1);
  const y = +(d.y ?? d.tsne_2);
  const sector = (d.sector ?? d.category ?? "Unknown").trim();
  const ticker = (d.ticker ?? "").trim();
  if (!ticker || Number.isNaN(x) || Number.isNaN(y)) return null;
  return { ticker, x, y, sector };
}

function marginsForWidth(containerW) {
  if (containerW < 360) return { top: 36, right: 8, bottom: 40, left: 36 };
  if (containerW < 520) return { top: 40, right: 12, bottom: 44, left: 42 };
  return { top: 44, right: 14, bottom: 46, left: 48 };
}

// Coordinated muted palette (CSV uses full sector names; Staples → Consumer slot).
const sectorColors = {
  Technology: "#7C6FA6",
  "Information Technology": "#7C6FA6",
  Finance: "#C9823A",
  Healthcare: "#5A9A6A",
  Energy: "#4F8FA8",
  Industrials: "#8A7BB8",
  Consumer: "#C96F5A",
  Staples: "#C96F5A",
};

function sectorColor(sector) {
  return sectorColors[sector] ?? "#6B7280";
}

export default function TSNEScatter({ selectedStock }) {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);
  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);

    d3
      .csv("/data/tsne.csv", parseRow)
      .then((data) => {
        if (cancelled) return;
        const clean = (data ?? []).filter(Boolean);
        if (clean.length === 0) {
          setLoadError(true);
          setRows(null);
          return;
        }
        setRows(clean);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
          setRows(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setBox({
        width: Math.max(0, Math.floor(width)),
        height: Math.max(0, Math.floor(height)),
      });
    });
    ro.observe(el);
    setBox({
      width: Math.floor(el.clientWidth),
      height: Math.floor(el.clientHeight),
    });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !rows?.length || box.width < 72) return;

    d3.select(mount).selectAll("*").remove();

    const width = box.width;
    const margin = marginsForWidth(width);
    const innerW = width - margin.left - margin.right;
    if (innerW < 40) return;

    const sectors = [...new Set(rows.map((d) => d.sector))].sort(d3.ascending);
    const legendCols = innerW < 300 ? 2 : 3;
    const legendRows = Math.ceil(sectors.length / legendCols);
    const chartTop = margin.top + legendRows * 14 + 6;

    const shellH = Math.max(box.height, 240);
    const innerH = Math.max(150, shellH - chartTop - margin.bottom);
    const height = chartTop + innerH + margin.bottom;
    if (innerH < 40) return;

    const xExtent = d3.extent(rows, (d) => d.x);
    const yExtent = d3.extent(rows, (d) => d.y);
    const xPad = (xExtent[1] - xExtent[0]) * 0.08 || 1;
    const yPad = (yExtent[1] - yExtent[0]) * 0.08 || 1;

    const xBase = d3
      .scaleLinear()
      .domain([xExtent[0] - xPad, xExtent[1] + xPad])
      .range([0, innerW]);

    const yBase = d3
      .scaleLinear()
      .domain([yExtent[0] - yPad, yExtent[1] + yPad])
      .range([innerH, 0]);

    const clipId = `tsne-clip-${width}-${innerH}`;

    const svg = d3
      .select(mount)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "block max-h-full w-full max-w-full")
      .attr("role", "img")
      .attr("aria-label", "t-SNE scatter of stocks");

    svg.append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", innerW).attr("height", innerH);

    const legend = svg.append("g").attr("transform", `translate(${margin.left}, 4)`);
    const colW = Math.min(138, Math.max(76, innerW / legendCols));
    sectors.forEach((sec, i) => {
      const col = i % legendCols;
      const row = Math.floor(i / legendCols);
      const g = legend.append("g").attr("transform", `translate(${col * colW}, ${row * 14})`);
      g.append("rect").attr("width", 8).attr("height", 8).attr("rx", 2).attr("fill", sectorColor(sec));
      g.append("text").attr("x", 11).attr("y", 8).attr("font-size", 9).attr("fill", "#475569").text(sec);
    });

    const chart = svg.append("g").attr("transform", `translate(${margin.left},${chartTop})`);

    const clipped = chart.append("g").attr("clip-path", `url(#${clipId})`);

    const dots = clipped
      .append("g")
      .selectAll("circle")
      .data(rows)
      .join("circle")
      .attr("fill", (d) => sectorColor(d.sector))
      .attr("opacity", 0.95)
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("pointer-events", "none");

    const xAxisG = chart.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = chart.append("g");
    const labelG = chart.append("g").attr("pointer-events", "none");

    function draw(transform) {
      const xz = transform.rescaleX(xBase);
      const yz = transform.rescaleY(yBase);

      xAxisG.call(d3.axisBottom(xz).ticks(5));
      xAxisG.selectAll("text").attr("fill", "#64748b").attr("font-size", 9);
      xAxisG.selectAll("path,line").attr("stroke", "#94a3b8");

      yAxisG.call(d3.axisLeft(yz).ticks(5));
      yAxisG.selectAll("text").attr("fill", "#64748b").attr("font-size", 9);
      yAxisG.selectAll("path,line").attr("stroke", "#94a3b8");

      dots
        .attr("cx", (d) => xz(d.x))
        .attr("cy", (d) => yz(d.y))
        .attr("r", (d) => (d.ticker === selectedStock ? 9.5 : 5))
        .attr("stroke", (d) => (d.ticker === selectedStock ? "#1e293b" : "#fff"))
        .attr("stroke-width", (d) => (d.ticker === selectedStock ? 2.25 : 0.5));

      const picked = rows.find((d) => d.ticker === selectedStock);
      labelG.selectAll("*").remove();
      if (picked) {
        labelG
          .append("text")
          .attr("x", xz(picked.x) + 8)
          .attr("y", yz(picked.y) - 7)
          .attr("font-size", 11)
          .attr("font-weight", 600)
          .attr("fill", "#1e293b")
          .text(picked.ticker);
      }
    }

    chart
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .style("cursor", "grab");

    const zoom = d3
      .zoom()
      .scaleExtent([0.35, 12])
      .translateExtent([
        [0, 0],
        [innerW, innerH],
      ])
      .extent([
        [0, 0],
        [innerW, innerH],
      ])
      .on("zoom", (e) => draw(e.transform));

    chart.call(zoom);
    draw(d3.zoomIdentity);

    svg
      .append("text")
      .attr("x", margin.left + innerW / 2)
      .attr("y", height - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#64748b")
      .text("t-SNE 1");

    svg
      .append("text")
      .attr("transform", `translate(11, ${chartTop + innerH / 2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#64748b")
      .text("t-SNE 2");

    return () => {
      d3.select(mount).selectAll("*").remove();
    };
  }, [rows, selectedStock, box.width, box.height]);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      {loadError && <p className="text-sm text-amber-800">t-SNE data could not be loaded.</p>}
      <div
        ref={wrapRef}
        className="h-[280px] w-full min-h-[220px] min-w-0 overflow-hidden sm:h-[300px] lg:h-[300px] xl:h-[320px]"
      >
        <div ref={mountRef} className="h-full w-full overflow-hidden" />
      </div>
    </div>
  );
}
