import * as d3 from "d3";
import { useEffect, useRef, useState } from "react";

function parseRow(d) {
  const date = new Date(d.Date);
  const row = {
    Date: date,
    Open: +d.Open,
    High: +d.High,
    Low: +d.Low,
    Close: +d.Close,
  };
  if (Number.isNaN(date.getTime()) || Number.isNaN(row.Open)) return null;
  return row;
}

export function yStripWidth(containerW) {
  if (containerW < 380) return 50;
  if (containerW < 520) return 54;
  return 58;
}

const series = [
  { key: "Open", label: "Open", color: "#3B82A0" },
  { key: "High", label: "High", color: "#4B9A63" },
  { key: "Low", label: "Low", color: "#D9773A" },
  { key: "Close", label: "Close", color: "#7C6FA6" },
];

export default function LineChart({ selectedStock }) {
  const outerRef = useRef(null);
  const yMountRef = useRef(null);
  const scrollRef = useRef(null);
  const plotMountRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [layout, setLayout] = useState({ outerW: 0, plotViewportW: 0 });

  useEffect(() => {
    const outer = outerRef.current;
    const scroll = scrollRef.current;
    if (!outer) return;

    const measure = () => {
      const ow = Math.floor(outer.clientWidth);
      const sw = scroll ? Math.floor(scroll.clientWidth) : Math.max(120, ow - yStripWidth(ow));
      setLayout({ outerW: ow, plotViewportW: Math.max(80, sw) });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    if (scroll) ro.observe(scroll);
    measure();
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const yMount = yMountRef.current;
    const plotMount = plotMountRef.current;
    if (!yMount || !plotMount || layout.plotViewportW < 1) return;

    let cancelled = false;

    async function loadAndDraw() {
      setLoadError(false);

      d3.select(yMount).selectAll("*").remove();
      d3.select(plotMount).selectAll("*").remove();

      const url = `/data/stockdata/${selectedStock}.csv`;
      let data;
      try {
        data = await d3.csv(url, parseRow);
      } catch {
        if (!cancelled) setLoadError(true);
        return;
      }

      if (cancelled) return;
      if (!data || data.length === 0) {
        setLoadError(true);
        return;
      }

      data.sort((a, b) => a.Date - b.Date);
      console.log(`Line chart ${selectedStock}: ${data.length} rows`);

      const yw = yStripWidth(layout.outerW || layout.plotViewportW);
      // Bottom space for x ticks only — "Date" label sits in fixed HTML below the scroll strip.
      const marginPlot = { top: 8, right: 12, bottom: 30, left: 0 };
      const marginY = { top: 8, bottom: 30 };

      const plotViewportW = layout.plotViewportW;
      const plotInnerW = Math.max(plotViewportW - marginPlot.left - marginPlot.right, 80);
      const innerWidth = Math.max(plotInnerW, Math.min(data.length * 2.5, 6000));
      const innerHeight = Math.max(200, Math.round(Math.min(plotInnerW * 0.4, 300)));

      const yMin = d3.min(data, (d) => Math.min(d.Open, d.High, d.Low, d.Close));
      const yMax = d3.max(data, (d) => Math.max(d.Open, d.High, d.Low, d.Close));
      const yPad = (yMax - yMin) * 0.05 || 1;

      const xBase = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.Date))
        .range([0, innerWidth]);

      const y = d3
        .scaleLinear()
        .domain([yMin - yPad, yMax + yPad])
        .nice()
        .range([innerHeight, 0]);

      const plotSvgW = marginPlot.left + innerWidth + marginPlot.right;
      const totalH = marginPlot.top + innerHeight + marginPlot.bottom;
      const ySvgW = yw;

      const clipId = `plot-clip-${selectedStock.replace(/[^a-zA-Z0-9]/g, "-") || "x"}`;

      const ySvg = d3
        .select(yMount)
        .append("svg")
        .attr("width", ySvgW)
        .attr("height", totalH)
        .attr("class", "block shrink-0 text-slate-600");

      const yChart = ySvg.append("g").attr("transform", `translate(${ySvgW},${marginY.top})`);

      const yAxisG = yChart.append("g");
      yAxisG.call(d3.axisLeft(y).ticks(6));
      yAxisG.selectAll("text").attr("fill", "#64748b").attr("font-size", 10);
      yAxisG.selectAll("path,line").attr("stroke", "#94a3b8");

      ySvg
        .append("text")
        .attr("transform", `translate(10, ${marginY.top + innerHeight / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("font-size", 10)
        .attr("fill", "#64748b")
        .text("Price");

      const plotSvg = d3
        .select(plotMount)
        .append("svg")
        .attr("width", plotSvgW)
        .attr("height", totalH)
        .attr("class", "max-w-none text-slate-600");

      plotSvg.append("defs").append("clipPath").attr("id", clipId).append("rect").attr("width", innerWidth).attr("height", innerHeight);

      const plotG = plotSvg.append("g").attr("transform", `translate(${marginPlot.left},${marginPlot.top})`);

      const clipped = plotG.append("g").attr("clip-path", `url(#${clipId})`);

      const paths = {};
      for (const s of series) {
        const gen = d3
          .line()
          .x((d) => xBase(d.Date))
          .y((d) => y(d[s.key]))
          .defined((d) => !Number.isNaN(d[s.key]));
        paths[s.key] = clipped
          .append("path")
          .datum(data)
          .attr("fill", "none")
          .attr("stroke", s.color)
          .attr("stroke-width", 2)
          .attr("pointer-events", "none")
          .attr("d", gen);
      }

      const xAxisG = plotG.append("g").attr("class", "x-axis").attr("transform", `translate(0,${innerHeight})`);

      const xFormat = d3.timeFormat("%b %d, %Y");

      function drawWithXScale(xz) {
        xAxisG
          .call(d3.axisBottom(xz).ticks(Math.min(10, Math.max(4, Math.floor(innerWidth / 72)))).tickFormat(xFormat))
          .selectAll("text")
          .attr("transform", "rotate(-28)")
          .style("text-anchor", "end")
          .attr("fill", "#64748b")
          .attr("font-size", 9);

        xAxisG.selectAll("path,line").attr("stroke", "#94a3b8");

        for (const ser of series) {
          const gen = d3
            .line()
            .x((d) => xz(d.Date))
            .y((d) => y(d[ser.key]))
            .defined((d) => !Number.isNaN(d[ser.key]));
          paths[ser.key].attr("d", gen);
        }
      }

      drawWithXScale(xBase);

      plotG
        .append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .style("cursor", "grab");

      const zoom = d3
        .zoom()
        .scaleExtent([1, 24])
        .translateExtent([
          [0, 0],
          [innerWidth, innerHeight],
        ])
        .extent([
          [0, 0],
          [innerWidth, innerHeight],
        ])
        .on("zoom", (event) => {
          const xz = event.transform.rescaleX(xBase);
          drawWithXScale(xz);
        });

      plotG.call(zoom);
    }

    loadAndDraw();

    return () => {
      cancelled = true;
      d3.select(yMount).selectAll("*").remove();
      d3.select(plotMount).selectAll("*").remove();
    };
  }, [selectedStock, layout.outerW, layout.plotViewportW]);

  const yw = yStripWidth(layout.outerW || layout.plotViewportW || 400);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
      {loadError && <p className="text-sm text-amber-800">Stock data could not be loaded.</p>}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div ref={outerRef} className="flex w-full min-w-0 items-stretch gap-0">
        <div ref={yMountRef} className="shrink-0 bg-white" />

        <div
          ref={scrollRef}
          className="line-chart-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div ref={plotMountRef} className="min-h-[220px] min-w-0 sm:min-h-[240px]" />
        </div>
      </div>

      {/* Fixed “Date” label — stays centered under the scrollable plot, not inside the wide SVG. */}
      <div className="flex w-full min-w-0 items-center gap-0 pt-0.5">
        <div className="shrink-0 bg-white" style={{ width: yw }} aria-hidden />
        <p className="min-w-0 flex-1 text-center text-[10px] font-medium tracking-wide text-slate-500">Date</p>
      </div>
    </div>
  );
}
