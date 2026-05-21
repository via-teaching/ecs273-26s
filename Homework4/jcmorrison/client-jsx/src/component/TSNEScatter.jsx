import * as d3 from "d3";
import { useEffect, useRef } from "react";

// margin around chart area for axes and legend
var MARGIN = { left: 50, right: 140, top: 20, bottom: 45 };

// sector colors matching HW3 TSNEScatter
var SECTOR_COLORS = {
  "Energy": "#e15759",
  "Industrials": "#f28e2b",
  "Consumer": "#59a14f",
  "Healthcare": "#4e79a7",
  "Financials": "#b07aa1",
  "Technology": "#76b7b2",
};

export default function TSNEScatter({ selectedStock, onStockSelect }) {
  var svgRef = useRef(null);
  var dataRef = useRef(null);

  // fetch t-SNE data
  useEffect(function() {
    fetch("http://localhost:8000/tsne/")
      .then(function(res) {
        if (!res.ok) {
          throw new Error("Failed to fetch t-SNE data");
        }
        return res.json();
      })
      .then(function(json) {
        // backend data return
        dataRef.current = json.map(function(d) {
          return {
            ticker: d.Stock,
            x: d.x,
            y: d.y,
            sector: d.sector,
          };
        });
        drawChart(dataRef.current, selectedStock);
      })
      .catch(function() {});
  }, []);

  // redraw when selected stock changes
  useEffect(function() {
    if (dataRef.current) {
      drawChart(dataRef.current, selectedStock);
    }
  }, [selectedStock]);

  function drawChart(data, selected) {
    var svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    var width = svgRef.current.clientWidth;
    var height = svgRef.current.clientHeight;
    var innerW = width - MARGIN.left - MARGIN.right;
    var innerH = height - MARGIN.top - MARGIN.bottom;

    var xScale = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.x; })).nice()
      .range([0, innerW]);

    var yScale = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return d.y; })).nice()
      .range([innerH, 0]);

    // clip path to keep points inside chart area during zoom
    svg.append("defs").append("clipPath").attr("id", "tsne-clip")
      .append("rect").attr("width", innerW).attr("height", innerH);

    var g = svg.append("g")
      .attr("transform", "translate(" + MARGIN.left + "," + MARGIN.top + ")");

    // axes
    var xAxisG = g.append("g")
      .attr("transform", "translate(0," + innerH + ")")
      .call(d3.axisBottom(xScale).ticks(5));

    var yAxisG = g.append("g")
      .call(d3.axisLeft(yScale).ticks(5));

    // axis labels
    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 38)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#555")
      .text("t-SNE Dimension 1");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#555")
      .text("t-SNE Dimension 2");

    // group for points with clipping applied
    var pointsG = g.append("g").attr("clip-path", "url(#tsne-clip)");

    // tooltip div
    var tooltip = d3.select("body").select(".tsne-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select("body").append("div")
        .attr("class", "tsne-tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0,0,0,0.75)")
        .style("color", "#fff")
        .style("padding", "5px 9px")
        .style("border-radius", "6px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("display", "none");
    }

    // draw one circle per stock
    var circles = pointsG.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", function(d) { return xScale(d.x); })
      .attr("cy", function(d) { return yScale(d.y); })
      .attr("r", function(d) { return d.ticker === selected ? 10 : 6; })
      .attr("fill", function(d) { return SECTOR_COLORS[d.sector] || "#888"; })
      .attr("stroke", function(d) { return d.ticker === selected ? "#000" : "white"; })
      .attr("stroke-width", function(d) { return d.ticker === selected ? 2 : 0.8; })
      .attr("opacity", function(d) { return d.ticker === selected ? 1.0 : 0.75; })
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
          .html("<b>" + d.ticker + "</b><br/>" + d.sector)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseleave", function() {
        tooltip.style("display", "none");
      })
      .on("click", function(event, d) {
        if (onStockSelect) {
          onStockSelect(d.ticker);
        }
      });

    // label selected stock
    var labels = pointsG.selectAll("text.stock-label")
      .data(data.filter(function(d) { return d.ticker === selected; }))
      .join("text")
      .attr("class", "stock-label")
      .attr("x", function(d) { return xScale(d.x) + 13; })
      .attr("y", function(d) { return yScale(d.y) + 4; })
      .attr("font-size", 13)
      .attr("font-weight", "bold")
      .attr("fill", "#111")
      .text(function(d) { return d.ticker; });

    // legend
    var sectors = Object.keys(SECTOR_COLORS);
    var legendG = svg.append("g")
      .attr("transform", "translate(" + (MARGIN.left + innerW + 12) + "," + MARGIN.top + ")");

    legendG.append("text")
      .attr("y", -4)
      .attr("font-size", 11)
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Sector");

    for (var si = 0; si < sectors.length; si++) {
      var row = legendG.append("g").attr("transform", "translate(0," + (si * 18 + 4) + ")");
      row.append("circle")
        .attr("cx", 7).attr("cy", 7).attr("r", 6)
        .attr("fill", SECTOR_COLORS[sectors[si]]);
      row.append("text")
        .attr("x", 17).attr("y", 11)
        .attr("font-size", 11)
        .attr("fill", "#333")
        .text(sectors[si]);
    }

    // reset zoom button
    d3.select(svgRef.current.parentNode).selectAll(".reset-zoom-button").remove();
    d3.select(svgRef.current.parentNode)
      .append("button")
      .attr("class", "reset-zoom-button")
      .style("position", "absolute")
      .style("top", "6px")
      .style("right", "150px")
      .style("font-size", "11px")
      .style("padding", "2px 8px")
      .text("Reset zoom")
      .on("click", function() {
        svg.call(zoom.transform, d3.zoomIdentity);
      });

    // zoom behavior applied to full svg
    var zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on("zoom", function(event) {
        var t = event.transform;
        var newX = t.rescaleX(xScale);
        var newY = t.rescaleY(yScale);

        xAxisG.call(d3.axisBottom(newX).ticks(5));
        yAxisG.call(d3.axisLeft(newY).ticks(5));

        circles
          .attr("cx", function(d) { return newX(d.x); })
          .attr("cy", function(d) { return newY(d.y); });

        labels
          .attr("x", function(d) { return newX(d.x) + 13; })
          .attr("y", function(d) { return newY(d.y) + 4; });
      });

    svg.call(zoom);
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
