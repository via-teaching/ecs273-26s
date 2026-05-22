import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { debounce } from "lodash";

const margin = { left: 55, right: 20, top: 10, bottom: 50 };

export function LineChart({ ticker }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const dataRef = useRef([]);

  useEffect(() => {
    if (!ticker) return;
    fetch(`/stock/${ticker}`).then(r => r.json()).then((json) => { const raw = json.stock_series; 
      const data = raw.map((d) => ({
        date: new Date(d.date),
        open: +d.Open,
        high: +d.High,
        low: +d.Low,
        close: +d.Close,
      }));
      dataRef.current = data;
      if (containerRef.current && svgRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width && height) drawChart(svgRef.current, data, width, height, ticker);
      }
    });
  }, [ticker]);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;
    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect;
          if (width && height && dataRef.current.length)
            drawChart(svgRef.current, dataRef.current, width, height, ticker);
        }
      }, 100)
    );
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [ticker]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <svg ref={svgRef} width="100%" height="100%"></svg>
    </div>
  );
}

function drawChart(svgElement, data, width, height, ticker) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  d3.select(svgElement.parentNode).selectAll(".line-tooltip").remove();

  svg.attr("width", width).attr("height", height);

  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  // ── Clip path ─────────────────────────────────────────────────────────────
  svg.append("defs").append("clipPath").attr("id", "line-clip")
    .append("rect").attr("width", innerW).attr("height", innerH);

  // ── Scales ────────────────────────────────────────────────────────────────
  const xScale = d3.scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([0, innerW]);

  const allValues = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
  const yScale = d3.scaleLinear()
    .domain([d3.min(allValues) * 0.98, d3.max(allValues) * 1.02])
    .range([innerH, 0]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // ── Grid ──────────────────────────────────────────────────────────────────
  g.append("g").attr("class", "grid")
    .call(d3.axisLeft(yScale).tickSize(-innerW).tickFormat(""))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll("line").attr("stroke", "#e5e7eb").attr("stroke-dasharray", "3,3"));

  // ── Axes ──────────────────────────────────────────────────────────────────
  const xAxisG = g.append("g").attr("class", "x-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(xScale).ticks(8))
    .call((g) => g.selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end"));

  g.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale).ticks(6));

  g.append("text")
    .attr("transform", `translate(${innerW / 2},${innerH + 45})`)
    .style("text-anchor", "middle").style("font-size", "12px").text("Date");

  g.append("text")
    .attr("transform", "rotate(-90)").attr("x", -innerH / 2).attr("y", -45)
    .style("text-anchor", "middle").style("font-size", "12px").text("Price (USD)");

  // ── Lines (inside clip) ───────────────────────────────────────────────────
  const lines = [
    { key: "open",  color: "#3b82f6", label: "Open"  },
    { key: "high",  color: "#22c55e", label: "High"  },
    { key: "low",   color: "#ef4444", label: "Low"   },
    { key: "close", color: "#f97316", label: "Close" },
  ];

  const linesG = g.append("g").attr("clip-path", "url(#line-clip)");

  lines.forEach(({ key, color }) => {
    linesG.append("path")
      .datum(data)
      .attr("id", `lc-${key}`)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d[key]))
        .defined((d) => !isNaN(d[key]))(data));
  });

  // ── Legend ────────────────────────────────────────────────────────────────
  const legend = svg.append("g").attr("transform", `translate(${margin.left + 10},${margin.top})`);
  lines.forEach(({ color, label }, i) => {
    const lg = legend.append("g").attr("transform", `translate(${i * 80},0)`);
    lg.append("line").attr("x1", 0).attr("x2", 20).attr("y1", 6).attr("y2", 6)
      .attr("stroke", color).attr("stroke-width", 2);
    lg.append("text").attr("x", 25).attr("y", 10).style("font-size", "11px").text(label);
  });

  // ── Tooltip ───────────────────────────────────────────────────────────────
  const bisectDate = d3.bisector((d) => d.date).left;
  const fmt = d3.format(".2f");
  const dateFmt = d3.timeFormat("%b %d, %Y");

  const crosshair = linesG.append("line")
    .attr("y1", 0).attr("y2", innerH)
    .attr("stroke", "#94a3b8").attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3")
    .style("display", "none");

  const tooltip = d3.select(svgElement.parentNode)
    .append("div")
    .attr("class", "line-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("background", "rgba(15,23,42,0.9)")
    .style("color", "#f1f5f9")
    .style("border-radius", "8px")
    .style("padding", "8px 12px")
    .style("font-size", "12px")
    .style("line-height", "1.9")
    .style("box-shadow", "0 4px 16px rgba(0,0,0,0.3)")
    .style("min-width", "160px")
    .style("z-index", "10");

  const dots = lines.map(({ color }) =>
    linesG.append("circle").attr("r", 4)
      .attr("fill", color).attr("stroke", "#fff").attr("stroke-width", 1.5)
      .style("display", "none")
  );

  let currentXScale = xScale;

  // Invisible overlay for mouse
  g.append("rect")
    .attr("width", innerW).attr("height", innerH)
    .attr("fill", "none").attr("pointer-events", "all")
    .on("mousemove", function (event) {
      const [mx] = d3.pointer(event);
      const x0 = currentXScale.invert(mx);
      const i  = bisectDate(data, x0, 1);
      const d0 = data[i - 1], d1 = data[i];
      if (!d0) return;
      const d = !d1 || (x0 - d0.date) < (d1.date - x0) ? d0 : d1;
      const cx = currentXScale(d.date);

      crosshair.style("display", null).attr("x1", cx).attr("x2", cx);
      lines.forEach(({ key }, idx) => {
        dots[idx].style("display", null).attr("cx", cx).attr("cy", yScale(d[key]));
      });

      const parentRect = svgElement.parentNode.getBoundingClientRect();
      const relX = event.clientX - parentRect.left;
      const relY = event.clientY - parentRect.top;
      const flipLeft = relX + 180 > parentRect.width;
      const tooltipHeight = 140;
      const flipUp = relY + 10 + tooltipHeight > parentRect.height;

      tooltip.style("display", "block")
        .style("left", flipLeft ? `${relX - 175}px` : `${relX + 16}px`)
        .style("top", flipUp ? `${relY - tooltipHeight - 10}px` : `${relY - 10}px`)
        .html(`
          <div style="font-weight:700;margin-bottom:4px;border-bottom:1px solid #334155;padding-bottom:4px;color:#94a3b8">${dateFmt(d.date)}</div>
          <div><span style="color:#3b82f6">●</span>&nbsp;Open &nbsp;&nbsp;<b>$${fmt(d.open)}</b></div>
          <div><span style="color:#22c55e">●</span>&nbsp;High &nbsp;&nbsp;<b>$${fmt(d.high)}</b></div>
          <div><span style="color:#ef4444">●</span>&nbsp;Low &nbsp;&nbsp;&nbsp;<b>$${fmt(d.low)}</b></div>
          <div><span style="color:#f97316">●</span>&nbsp;Close &nbsp;<b>$${fmt(d.close)}</b></div>
        `);
    })
    .on("mouseleave", () => {
      crosshair.style("display", "none");
      tooltip.style("display", "none");
      dots.forEach((dot) => dot.style("display", "none"));
    });

  // ── Zoom (horizontal, mouse-wheel + drag) ─────────────────────────────────
  const zoom = d3.zoom()
    .scaleExtent([0.5, 20])
    .extent([[0, 0], [innerW, innerH]])
    .translateExtent([[-innerW * 5, -Infinity], [innerW * 6, Infinity]])
    .on("zoom", (event) => {
      currentXScale = event.transform.rescaleX(xScale);
      xAxisG.call(d3.axisBottom(currentXScale).ticks(8))
        .selectAll("text").attr("transform", "rotate(-35)").style("text-anchor", "end");

      lines.forEach(({ key }) => {
        linesG.select(`#lc-${key}`)
          .attr("d", d3.line()
            .x((d) => currentXScale(d.date))
            .y((d) => yScale(d[key]))
            .defined((d) => !isNaN(d[key]))(data));
      });

      tooltip.style("display", "none");
      crosshair.style("display", "none");
      dots.forEach((dot) => dot.style("display", "none"));
    });

  svg.call(zoom);
}