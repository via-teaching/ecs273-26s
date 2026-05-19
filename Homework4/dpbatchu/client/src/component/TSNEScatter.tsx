import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchTSNE, type TSNERow } from "../api";
import { SECTORS, SECTOR_COLORS, STOCK_SECTORS } from "./option";

interface Props {
  selectedStock: string;
  onSelectStock: (s: string) => void;
}

const colorScale = d3.scaleOrdinal<string>().domain(SECTORS).range(SECTOR_COLORS);

export default function TSNEScatter({ selectedStock, onSelectStock }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchTSNE()
      .then((rows) => {
        if (cancelled) return;
        const data: TSNERow[] = rows
          .map((r) => ({
            ...r,
            // Prefer sector from API; fall back to option.ts mapping
            sector: r.sector || STOCK_SECTORS[r.ticker.toUpperCase()] || "Other",
          }))
          .filter((r) => r.ticker && !isNaN(r.x) && !isNaN(r.y));

        if (data.length === 0) {
          setError("No valid t-SNE data returned from API.");
          setLoading(false);
          return;
        }
        draw(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load t-SNE data.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);  // only load once — selection highlight handled below

  // Re-highlight selected stock without full redraw
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll<SVGCircleElement, TSNERow>(".tsne-dot")
      .attr("r",            (d) => d.ticker === selectedStock ? 10 : 6)
      .attr("stroke-width", (d) => d.ticker === selectedStock ? 2 : 0.5)
      .attr("stroke",       (d) => d.ticker === selectedStock ? "#ffffff" : "#00000055")
      .attr("opacity",      (d) => d.ticker === selectedStock ? 1 : 0.75);

    svg.selectAll<SVGTextElement, TSNERow>(".tsne-label")
      .attr("display", (d) => d.ticker === selectedStock ? null : "none");
  }, [selectedStock]);

  function draw(data: TSNERow[]) {
    const wrapper = wrapperRef.current;
    const svg     = svgRef.current;
    if (!wrapper || !svg) return;

    d3.select(svg).selectAll("*").remove();

    const W = wrapper.clientWidth;
    const H = wrapper.clientHeight;
    const margin = { top: 16, right: 16, bottom: 44, left: 54 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top  - margin.bottom;

    const root = d3.select(svg).attr("width", W).attr("height", H);

    root.append("defs").append("clipPath").attr("id", "clip-tsne")
      .append("rect").attr("width", innerW).attr("height", innerH);

    const g = root.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xExt = d3.extent(data, (d) => d.x) as [number, number];
    const yExt = d3.extent(data, (d) => d.y) as [number, number];
    const xPad = (xExt[1] - xExt[0]) * 0.12;
    const yPad = (yExt[1] - yExt[0]) * 0.12;

    const xBase = d3.scaleLinear().domain([xExt[0] - xPad, xExt[1] + xPad]).range([0, innerW]);
    const yBase = d3.scaleLinear().domain([yExt[0] - yPad, yExt[1] + yPad]).range([innerH, 0]);

    // Grid
    const gridG = g.append("g");
    const drawGrid = (xs: d3.ScaleLinear<number,number>, ys: d3.ScaleLinear<number,number>) => {
      gridG.selectAll("*").remove();
      gridG.selectAll(".gy").data(ys.ticks(5)).join("line")
        .attr("class","gy").attr("x1",0).attr("x2",innerW)
        .attr("y1",(d)=>ys(d)).attr("y2",(d)=>ys(d))
        .attr("stroke","#252a34").attr("stroke-dasharray","3,3");
      gridG.selectAll(".gx").data(xs.ticks(5)).join("line")
        .attr("class","gx").attr("y1",0).attr("y2",innerH)
        .attr("x1",(d)=>xs(d)).attr("x2",(d)=>xs(d))
        .attr("stroke","#252a34").attr("stroke-dasharray","3,3");
    };
    drawGrid(xBase, yBase);

    // Axes
    const xAxisG = g.append("g").attr("transform", `translate(0,${innerH})`);
    const yAxisG = g.append("g");

    const styleAxis = (sel: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      sel.selectAll("path,line").attr("stroke","#252a34");
      sel.selectAll("text").attr("fill","#6b7280").attr("font-size","10px")
        .attr("font-family","'IBM Plex Mono',monospace");
    };

    const renderAxes = (xs: d3.ScaleLinear<number,number>, ys: d3.ScaleLinear<number,number>) => {
      xAxisG.call(d3.axisBottom(xs).ticks(5).tickFormat(d3.format(".1f")));
      yAxisG.call(d3.axisLeft(ys).ticks(5).tickFormat(d3.format(".1f")));
      styleAxis(xAxisG); styleAxis(yAxisG);
    };
    renderAxes(xBase, yBase);

    g.append("text").attr("x",innerW/2).attr("y",innerH+36)
      .attr("text-anchor","middle").attr("fill","#6b7280").attr("font-size","11px")
      .attr("font-family","'IBM Plex Mono',monospace").text("t-SNE 1");
    g.append("text").attr("transform","rotate(-90)").attr("x",-innerH/2).attr("y",-42)
      .attr("text-anchor","middle").attr("fill","#6b7280").attr("font-size","11px")
      .attr("font-family","'IBM Plex Mono',monospace").text("t-SNE 2");

    // Points
    const dotsG = g.append("g").attr("clip-path","url(#clip-tsne)");
    const tooltip = d3.select(wrapper).select<HTMLDivElement>(".tsne-tooltip");

    const renderDots = (xs: d3.ScaleLinear<number,number>, ys: d3.ScaleLinear<number,number>) => {
      dotsG.selectAll<SVGCircleElement, TSNERow>(".tsne-dot")
        .data(data, (d) => d.ticker)
        .join("circle")
        .attr("class","tsne-dot")
        .attr("cx", (d) => xs(d.x))
        .attr("cy", (d) => ys(d.y))
        .attr("r",  (d) => d.ticker === selectedStock ? 10 : 6)
        .attr("fill",         (d) => colorScale(d.sector))
        .attr("stroke",       (d) => d.ticker === selectedStock ? "#ffffff" : "#00000055")
        .attr("stroke-width", (d) => d.ticker === selectedStock ? 2 : 0.5)
        .attr("opacity",      (d) => d.ticker === selectedStock ? 1 : 0.75)
        .style("cursor","pointer")
        .on("mouseover", function(_, d) {
          d3.select(this).attr("r",10).attr("stroke","#ffffff").attr("stroke-width",2);
          tooltip.style("display","block").html(`
            <div class="tt-ticker">${d.ticker}</div>
            <div class="tt-sector">${d.sector}</div>
            <div class="tt-coords">(${d.x.toFixed(2)}, ${d.y.toFixed(2)})</div>
          `);
        })
        .on("mousemove", function(event) {
          const [mx,my] = d3.pointer(event, wrapper);
          tooltip.style("left",`${mx+12}px`).style("top",`${my-10}px`);
        })
        .on("mouseleave", function(_, d) {
          d3.select(this)
            .attr("r",  d.ticker === selectedStock ? 10 : 6)
            .attr("stroke",       d.ticker === selectedStock ? "#ffffff" : "#00000055")
            .attr("stroke-width", d.ticker === selectedStock ? 2 : 0.5);
          tooltip.style("display","none");
        })
        .on("click", (_, d) => onSelectStock(d.ticker));

      dotsG.selectAll<SVGTextElement, TSNERow>(".tsne-label")
        .data(data, (d) => d.ticker)
        .join("text")
        .attr("class","tsne-label")
        .attr("x", (d) => xs(d.x) + 12)
        .attr("y", (d) => ys(d.y) + 4)
        .attr("display", (d) => d.ticker === selectedStock ? null : "none")
        .attr("fill","#e8eaf0").attr("font-size","11px")
        .attr("font-family","'IBM Plex Mono',monospace")
        .attr("font-weight","700")
        .text((d) => d.ticker);
    };

    renderDots(xBase, yBase);

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 12])
      .on("zoom", (event) => {
        const t    = event.transform;
        const xNew = t.rescaleX(xBase);
        const yNew = t.rescaleY(yBase);
        renderDots(xNew, yNew);
        renderAxes(xNew, yNew);
        drawGrid(xNew, yNew);
      });

    d3.select(svg).call(zoom);

    // Legend
    const legW = 175, legItemH = 18;
    const legH = SECTORS.length * legItemH + 16;
    const legX = W - legW - 8;
    const legY = margin.top + 8;

    const legG = root.append("g").attr("transform", `translate(${legX},${legY})`);
    legG.append("rect").attr("width",legW).attr("height",legH)
      .attr("fill","#111318cc").attr("rx",4).attr("stroke","#252a34");

    SECTORS.forEach((sector, i) => {
      const row = legG.append("g").attr("transform", `translate(8,${8 + i * legItemH})`);
      row.append("circle").attr("cx",6).attr("cy",7).attr("r",5).attr("fill",colorScale(sector));
      row.append("text").attr("x",16).attr("y",11)
        .attr("fill","#9ca3af").attr("font-size","10px")
        .attr("font-family","'IBM Plex Mono',monospace")
        .text(sector);
    });
  }

  return (
    <div ref={wrapperRef} style={{ width:"100%", height:"100%", position:"relative" }}>
      {loading && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", color:"#6b7280", fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
          Loading t-SNE…
        </div>
      )}
      {error && (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:8,
          color:"#ef4444", fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
          <span>⚠ {error}</span>
          <span style={{ color:"#6b7280", fontSize:11 }}>Check backend and run import_data.py</span>
        </div>
      )}
      <svg
        ref={svgRef}
        style={{
          display: error ? "none" : "block",
          width:"100%", height:"100%",
          visibility: loading ? "hidden" : "visible",
        }}
      />
      <div className="tsne-tooltip" style={{ display:"none" }} />
      <style>{`
        .tsne-tooltip {
          position: absolute;
          background: #111318ee;
          border: 1px solid #252a34;
          border-radius: 4px;
          padding: 8px 10px;
          pointer-events: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #e8eaf0;
          z-index: 10;
        }
        .tsne-tooltip .tt-ticker { font-size:13px; font-weight:700; color:#00d4ff; }
        .tsne-tooltip .tt-sector { color:#9ca3af; margin:2px 0; }
        .tsne-tooltip .tt-coords { color:#6b7280; font-size:10px; }
      `}</style>
    </div>
  );
}
