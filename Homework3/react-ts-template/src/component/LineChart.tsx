import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface StockRow {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
}

const LINES: { key: keyof Omit<StockRow, "Date">; color: string }[] = [
  { key: "Open", color: "#34d399" },
  { key: "High", color: "#60a5fa" },
  { key: "Low", color: "#f87171" },
  { key: "Close", color: "#fbbf24" },
];

const MARGIN = { top: 16, right: 20, bottom: 36, left: 58 };

export default function LineChart({ stock }: { stock: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<StockRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);

    d3.csv(`/data/stockdata/${stock}.csv`, (raw) => ({
      Date: d3.timeParse("%Y-%m-%d")(raw.Date ?? "") as Date,
      Open: +raw.Open!,
      High: +raw.High!,
      Low: +raw.Low!,
      Close: +raw.Close!,
    }))
      .then((rows) => {
        setData(
          rows.filter(
            (r) =>
              r.Date instanceof Date &&
              !isNaN(r.Date.getTime()) &&
              !isNaN(r.Open) &&
              !isNaN(r.High) &&
              !isNaN(r.Low) &&
              !isNaN(r.Close)
          )
        );
      })
      .catch(() => setError(`Could not load /data/stockdata/${stock}.csv`));
  }, [stock]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;
    const innerW = W - MARGIN.left - MARGIN.right;
    const innerH = H - MARGIN.top - MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H);

    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "line-clip")
      .append("rect")
      .attr("width", innerW)
      .attr("height", innerH);

    const g = svg
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const xExtent = d3.extent(data, (d) => d.Date) as [Date, Date];
    const yMin = d3.min(data, (d) => d.Low)! * 0.98;
    const yMax = d3.max(data, (d) => d.High)! * 1.02;

    const x0 = d3.scaleTime().domain(xExtent).range([0, innerW]);
    const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]);

    const xAxisG = g
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerH})`);

    const yAxisG = g.append("g").attr("class", "y-axis");

    const styleAxis = (
      sel: d3.Selection<SVGGElement, unknown, null, undefined>
    ) => {
      sel.selectAll("line, path").attr("stroke", "#d1d5db");
      sel
        .selectAll("text")
        .attr("fill", "#374151")
        .style("font-size", "10px")
        .style("font-family", "monospace");
    };

    const drawAxes = (xScale: d3.ScaleTime<number, number>) => {
      xAxisG.call(d3.axisBottom(xScale).ticks(6).tickSizeOuter(0));

      yAxisG.call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSizeOuter(0)
          .tickFormat((v) => `$${d3.format(",.0f")(v as number)}`)
      );

      styleAxis(xAxisG as any);
      styleAxis(yAxisG as any);
    };

    drawAxes(x0);

    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-dasharray", "3,3");

    const linesG = g.append("g").attr("clip-path", "url(#line-clip)");

    const lineGen = (
      key: keyof Omit<StockRow, "Date">,
      xScale: d3.ScaleTime<number, number>
    ) =>
      d3
        .line<StockRow>()
        .x((d) => xScale(d.Date))
        .y((d) => y(d[key]))
        .curve(d3.curveMonotoneX)(data)!;

    LINES.forEach(({ key, color }) => {
      linesG
        .append("path")
        .attr("class", `line-${key}`)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", lineGen(key, x0));
    });

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 30)
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .text("Date");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -44)
      .attr("fill", "#374151")
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .text("Price (USD)");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [W, H],
      ])
      .extent([
        [MARGIN.left, 0],
        [W - MARGIN.right, H],
      ])
      .filter((event) => event.type === "wheel" || event.type === "mousedown")
      .on("zoom", (event) => {
        const t = event.transform;
        const xNew = t.rescaleX(x0);

        drawAxes(xNew);

        LINES.forEach(({ key }) => {
          linesG.select(`.line-${key}`).attr("d", lineGen(key, xNew));
        });
      });

    svg.call(zoom as any);

    const tooltip = d3.select(container).select<HTMLDivElement>(".lc-tooltip");
    const bisect = d3.bisector<StockRow, Date>((d) => d.Date).left;

    const overlay = g
      .append("rect")
      .attr("class", "overlay")
      .attr("width", innerW)
      .attr("height", innerH)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    const vLine = g
      .append("line")
      .attr("stroke", "#6b7280")
      .attr("stroke-dasharray", "4,2")
      .attr("y1", 0)
      .attr("y2", innerH)
      .attr("opacity", 0);

    overlay
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event);

        const t = d3.zoomTransform(svgRef.current!);
        const xNew = t.rescaleX(x0);
        const xDate = xNew.invert(mx);

        const idx = bisect(data, xDate, 1);
        const d = data[Math.min(idx, data.length - 1)];

        if (!d) return;

        const xPos = xNew(d.Date);

        vLine.attr("x1", xPos).attr("x2", xPos).attr("opacity", 1);

        tooltip
          .style("opacity", 1)
          .style("left", `${xPos + MARGIN.left + 10}px`)
          .style("top", `${MARGIN.top + 4}px`)
          .html(`
            <div style="color:#111827;font-size:12px;margin-bottom:4px;">
              ${d3.timeFormat("%b %d, %Y")(d.Date)}
            </div>
            <div style="color:#059669">O: $${d.Open.toFixed(2)}</div>
            <div style="color:#2563eb">H: $${d.High.toFixed(2)}</div>
            <div style="color:#dc2626">L: $${d.Low.toFixed(2)}</div>
            <div style="color:#d97706">C: $${d.Close.toFixed(2)}</div>
          `);
      })
      .on("mouseleave", () => {
        vLine.attr("opacity", 0);
        tooltip.style("opacity", 0);
      });
  }, [data]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white">
      <div className="absolute top-2 right-4 flex flex-col gap-1 z-10 bg-white/80 px-2 py-1 rounded border border-gray-200 shadow-sm">
        {LINES.map(({ key, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="w-5 h-0.5 inline-block"
              style={{ background: color }}
            />
            <span className="text-xs font-medium" style={{ color }}>
              {key}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-600 text-center px-4">
          {error}
          <br />
          <span className="text-gray-600">
            Place CSV files in public/data/stockdata/
          </span>
        </div>
      )}

      {data.length === 0 && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
          Loading {stock}…
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />

      <div
        className="lc-tooltip pointer-events-none absolute bg-white border border-gray-300
                   rounded px-2 py-1.5 text-xs opacity-0 z-20 transition-opacity
                   shadow text-black"
        style={{ minWidth: 110 }}
      />
    </div>
  );
}