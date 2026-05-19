import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fetchPrices } from "../api";

interface Props {
  stock: string;
}

interface StockRow {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

const SERIES = [
  { key: "Close", color: "#00d4ff" },
  { key: "Open",  color: "#a78bfa" },
  { key: "High",  color: "#22c55e" },
  { key: "Low",   color: "#ef4444" },
] as const;

/** Pick an appropriate time format based on the visible span (in ms). */
function adaptiveFormat(spanMs: number): (d: Date) => string {
  const days = spanMs / 86_400_000;
  if (days > 365) return d3.timeFormat("%b '%y");   // Jul '24
  if (days > 60)  return d3.timeFormat("%b %d");    // Jul 10
  return d3.timeFormat("%b %d, %Y");                // Jul 10, 2024
}

export default function LineChart({ stock }: Props) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPrices(stock)
      .then((payload) => {
        if (cancelled) return;

        const data: StockRow[] = payload.records
          .map((r) => ({
            Date:  new Date(r.date + "T00:00:00"),
            Open:  r.open,
            High:  r.high,
            Low:   r.low,
            Close: r.close,
          }))
          .filter((r) => !isNaN(r.Date.getTime()) && r.Close > 0)
          .sort((a, b) => a.Date.getTime() - b.Date.getTime());

        if (data.length === 0) {
          setError("No valid price data returned from API.");
          setLoading(false);
          return;
        }
        draw(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load price data.");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [stock]);

  function draw(data: StockRow[]) {
    const wrapper = wrapperRef.current;
    const svg     = svgRef.current;
    if (!wrapper || !svg) return;

    d3.select(svg).selectAll("*").remove();

    const totalW  = wrapper.clientWidth;
    const totalH  = wrapper.clientHeight;
    const margin  = { top: 20, right: 20, bottom: 48, left: 64 };
    const visibleW = totalW - margin.left - margin.right;
    const H        = totalH - margin.top  - margin.bottom;
    const fullW    = Math.max(visibleW, data.length * 3);

    const root = d3.select(svg).attr("width", totalW).attr("height", totalH);

    root.append("defs").append("clipPath").attr("id", "clip-line")
      .append("rect").attr("width", visibleW).attr("height", H);

    const g = root.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xFull = d3.scaleTime()
      .domain(d3.extent(data, (d) => d.Date) as [Date, Date])
      .range([0, fullW]);

    const allVals = data.flatMap((d) => [d.Open, d.High, d.Low, d.Close]);
    const yMin = d3.min(allVals) as number;
    const yMax = d3.max(allVals) as number;
    const yPad = (yMax - yMin) * 0.05;

    const y = d3.scaleLinear()
      .domain([yMin - yPad, yMax + yPad])
      .range([H, 0]);

    // Zoom (horizontal only)
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .translateExtent([[0, 0], [fullW + margin.left, totalH]])
      .extent([[0, 0], [visibleW, H]])
      .on("zoom", zoomed);

    d3.select(svg).call(zoom);

    // Grid
    const gridG = g.append("g").attr("class", "grid-y");
    const drawGrid = () => {
      gridG.selectAll("line")
        .data(y.ticks(6))
        .join("line")
        .attr("x1", 0).attr("x2", visibleW)
        .attr("y1", (d) => y(d)).attr("y2", (d) => y(d))
        .attr("stroke", "#252a34").attr("stroke-dasharray", "3,3");
    };
    drawGrid();

    // Axes
    const xAxisG = g.append("g").attr("class", "axis-x").attr("transform", `translate(0,${H})`);
    const yAxisG = g.append("g").attr("class", "axis-y");

    const styleAxis = (sel: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      sel.selectAll("path,line").attr("stroke", "#252a34");
      sel.selectAll("text").attr("fill", "#6b7280").attr("font-size", "11px")
        .attr("font-family", "'IBM Plex Mono', monospace");
    };

    const renderXAxis = (xScale: d3.ScaleTime<number, number>) => {
      const [t0, t1] = xScale.domain();
      const spanMs   = t1.getTime() - t0.getTime();
      const fmt      = adaptiveFormat(spanMs);
      xAxisG.call(d3.axisBottom(xScale).ticks(8).tickFormat((d) => fmt(d as Date)));
      styleAxis(xAxisG);
    };

    const renderYAxis = () => {
      yAxisG.call(d3.axisLeft(y).ticks(6).tickFormat((d) => `$${d3.format(",.0f")(d as number)}`));
      styleAxis(yAxisG);
    };

    renderXAxis(xFull);
    renderYAxis();

    // Axis labels
    g.append("text").attr("x", visibleW / 2).attr("y", H + 40)
      .attr("text-anchor", "middle").attr("fill", "#6b7280").attr("font-size", "11px")
      .attr("font-family", "'IBM Plex Mono',monospace").text("Date");

    g.append("text").attr("transform", "rotate(-90)").attr("x", -H / 2).attr("y", -52)
      .attr("text-anchor", "middle").attr("fill", "#6b7280").attr("font-size", "11px")
      .attr("font-family", "'IBM Plex Mono',monospace").text("Price (USD)");

    // Lines
    const linesG = g.append("g").attr("clip-path", "url(#clip-line)");

    const lineGen = (key: keyof Omit<StockRow, "Date">, xScale: d3.ScaleTime<number, number>) =>
      d3.line<StockRow>()
        .x((d) => xScale(d.Date))
        .y((d) => y(d[key]))
        .curve(d3.curveMonotoneX);

    const paths: Record<string, SVGPathElement> = {};
    SERIES.forEach(({ key, color }) => {
      paths[key] = linesG.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", key === "Close" ? 2 : 1.2)
        .attr("opacity", key === "Close" ? 1 : 0.65)
        .attr("d", lineGen(key as keyof Omit<StockRow, "Date">, xFull))
        .node()!;
    });

    // Tooltip
    const tooltip  = d3.select(wrapper).select<HTMLDivElement>(".lc-tooltip");
    const focusG   = linesG.append("g").attr("display", "none");
    focusG.append("line").attr("class", "focus-line")
      .attr("y1", 0).attr("y2", H)
      .attr("stroke", "#ffffff22").attr("stroke-width", 1).attr("stroke-dasharray", "4,4");

    const focusDot = focusG.append("circle")
      .attr("r", 4).attr("fill", "#00d4ff").attr("stroke", "#0a0c10").attr("stroke-width", 2);

    const overlay = linesG.append("rect")
      .attr("width", visibleW).attr("height", H)
      .attr("fill", "none").attr("pointer-events", "all");

    let currentXScale = xFull;

    overlay.on("mousemove", function (event) {
      const [mx] = d3.pointer(event, this);
      const bisect = d3.bisector((d: StockRow) => d.Date).left;
      const x0  = currentXScale.invert(mx);
      const idx = bisect(data, x0, 1);
      const d0  = data[idx - 1];
      const d1  = data[idx] ?? d0;
      const d   = x0.getTime() - d0?.Date.getTime() > d1?.Date.getTime() - x0.getTime() ? d1 : d0;
      if (!d) return;
      const cx = currentXScale(d.Date);
      focusG.attr("display", null);
      focusG.select(".focus-line").attr("x1", cx).attr("x2", cx);
      focusDot.attr("cx", cx).attr("cy", y(d.Close));
      tooltip
        .style("display", "block")
        .style("left", `${Math.min(cx + margin.left + 12, totalW - 160)}px`)
        .style("top",  `${y(d.Close) + margin.top - 20}px`)
        .html(`
          <div class="tt-date">${d3.timeFormat("%b %d, %Y")(d.Date)}</div>
          <div class="tt-row"><span style="color:#00d4ff">Close</span> $${d.Close.toFixed(2)}</div>
          <div class="tt-row"><span style="color:#a78bfa">Open</span>  $${d.Open.toFixed(2)}</div>
          <div class="tt-row"><span style="color:#22c55e">High</span>  $${d.High.toFixed(2)}</div>
          <div class="tt-row"><span style="color:#ef4444">Low</span>   $${d.Low.toFixed(2)}</div>
        `);
    })
    .on("mouseleave", () => {
      focusG.attr("display", "none");
      tooltip.style("display", "none");
    });

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
      const xNew = event.transform.rescaleX(xFull);
      currentXScale = xNew;
      SERIES.forEach(({ key }) => {
        d3.select(paths[key]).attr("d", lineGen(key as keyof Omit<StockRow, "Date">, xNew)(data) ?? "");
      });
      renderXAxis(xNew);   // adaptive format re-computed on every zoom
      drawGrid();
    }

    // Legend
    const legendG = root.append("g").attr("transform", `translate(${margin.left + 8},${margin.top + 8})`);
    SERIES.forEach(({ key, color }, i) => {
      const lg = legendG.append("g").attr("transform", `translate(${i * 90},0)`);
      lg.append("line").attr("x1", 0).attr("x2", 16).attr("y1", 6).attr("y2", 6)
        .attr("stroke", color).attr("stroke-width", key === "Close" ? 2.5 : 1.5);
      lg.append("text").attr("x", 20).attr("y", 10)
        .attr("fill", color).attr("font-size", "11px")
        .attr("font-family", "'IBM Plex Mono',monospace").text(key);
    });
  }

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
          color: "#6b7280", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
        }}>
          Loading {stock}…
        </div>
      )}
      {error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
          color: "#ef4444", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12,
        }}>
          <span>⚠ {error}</span>
          <span style={{ color: "#6b7280", fontSize: 11 }}>
            Check that the backend is running and {stock} is imported.
          </span>
        </div>
      )}
      <svg
        ref={svgRef}
        style={{
          display: error ? "none" : "block",
          width: "100%", height: "100%",
          visibility: loading ? "hidden" : "visible",
        }}
      />
      <div className="lc-tooltip" style={{ display: "none" }} />
      <style>{`
        .lc-tooltip {
          position: absolute;
          background: #111318ee;
          border: 1px solid #252a34;
          border-radius: 4px;
          padding: 8px 10px;
          pointer-events: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #e8eaf0;
          white-space: nowrap;
          z-index: 10;
        }
        .lc-tooltip .tt-date { color: #9ca3af; margin-bottom: 4px; font-size: 10px; }
        .lc-tooltip .tt-row  { line-height: 1.6; }
      `}</style>
    </div>
  );
}
