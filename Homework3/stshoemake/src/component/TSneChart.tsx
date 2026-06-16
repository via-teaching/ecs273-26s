import * as d3 from "d3";
import { useEffect, useRef } from "react";
import { isEmpty, debounce } from 'lodash';

import { ComponentSize, Margin, Point } from '../types';

interface TSNEPoint extends Point {
  ticker: string,
  label: Labels,
}

const labelList = ["Information_Technology", "Financials", "Industrials",
  "Energy", "Healthcare", "Consumer_Staples", "Consumer_Discretionary"] as const;
type Labels = typeof labelList[number]

const selectedDataText = "Currently Selected: "
const unselectedDataText = "Nothing Selected";

const dataLocation = "../../data/tsne.csv";

const margin = { left: 40, right: 20, top: 20, bottom: 60 } as Margin;
  
export function TSneChart() {
  let currentData: TSNEPoint[] = [];

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // NOTE: This should always be called after mount, but it'll completely break if this is the case
    if (!containerRef.current || !svgRef.current) return;


    // ----------> Draw: Initial Draw <----------
    d3.csv(dataLocation).then((data: any[]) => {
      currentData = cleanTSNEData(data);

      // We assert at the start of the useEffect that there is a value in current
      const { width, height } = (containerRef.current!).getBoundingClientRect();
      if (width && height) {
        drawPlot(svgRef.current!, currentData, width, height);
      }
    }).catch(error => {
      console.error("Error: ", error);
    });
    


    // ----------> Draw: Every Page Resize <----------
    const resizeObserver = new ResizeObserver(
      debounce((entries: ResizeObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.target !== containerRef.current) continue;
          const { width, height } = entry.contentRect as ComponentSize;
          if (width && height && !isEmpty(currentData)) {
            drawPlot(svgRef.current!, currentData, width, height);
          }
        }
      }, 100)
    );

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className="flex w-full h-full" style={{ width: '100%', height: '100%' }}>
      {/* --- Plot --- */}
      <div className="flex-1 h-full" ref={containerRef}>
        <svg id="tsne-svg" ref={svgRef} width="100%" height="100%"></svg>
      </div>
      <div className="w-[250px] p-4 flex flex-col h-full">
        {/* --- Selected Point Indicator --- */}
        <div id="tsne-select" className="flex-none py-2"> 
          <div className="font-bold"> {unselectedDataText} </div>
          <div style={{visibility: "hidden"}}> - </div>
        </div>
        {/* --- Legend --- */}
        <div className="grid auto-rows-fr h-60 border mb-[20px] bg-slate-100">
          <div className="border font-bold text-center">Legend</div>
          {
          labelList.map((label, index) => (
            <div className="flex items-center" key={index}>
              <div className="h-[35%] w-[20px] m-[4px] border" style={{ backgroundColor: getColorFromLabel(label)}}></div>
              <div className="h-[50%] mb-[8px]"> {label} </div>
            </div>
          ))
          }
        </div>
      </div>
    </div>
  );
}

function drawPlot(svgElement: SVGSVGElement, points: TSNEPoint[], width: number, height: number) {

  const svg = d3.select(svgElement);
  svg.selectAll('*').remove(); // clear previous render

  // At least two points are needed to form the extents
  if(points.length < 2) {
    console.error("Unable to draw TsNE: Data contains less than two points");
    return;
  }


  // ----------> Add Scale Graphics <----------
  // X-Scales
  const xExtents = d3.extent(points.map(point => point.posX)) as [number, number];
  // Make it so that points aren't scratching the left and right edges of the image
  const xExtentsWide = xExtents.map(extent => extent * 1.1);
  const xScale = d3.scaleLinear()
    .domain(xExtentsWide)
    .rangeRound([margin.left, width - margin.right])

  // Y-Scales
  const yExtents = d3.extent(points.map(point => point.posY)) as [number, number];
  // Make it so that points aren't scratching the top and bottom edges of the image
  const yExtentsWide = yExtents.map(extent => extent * 1.1);
  const yScale = d3.scaleLinear()
    .domain(yExtentsWide)
    .range([height - margin.bottom, margin.top])




  // ----------> Calculate Scales <----------
  // xAxis Scaling
  const xAxis = svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
  // yAxis Scaling
  const yAxis = svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale));



  // ----------> Create Point Elements <----------
  const radius = 5;
  const circles = svg.selectAll('circle')
    .data(points)
    .enter()
    .append('circle')
      .attr('cx', p => xScale(p.posX))
      .attr('cy', p => yScale(p.posY))
      .attr('r', radius)
      .style('fill', p => getColorFromLabel(p.label));



  // ----------> Add Zoom Functionality <----------
  const zoomFunction = (event: any) => {
    // Redraw scales
    const xTicks = event.transform.rescaleX(xScale);
    xAxis.call(d3.axisBottom(xTicks));
    const yTicks = event.transform.rescaleY(yScale);
    yAxis.call(d3.axisLeft(yTicks));

    circles.attr('cx', p => xTicks(p.posX));
    circles.attr('cy', p => yTicks(p.posY));
    circles.attr('r', radius * event.transform.k);
  }

  // There's not a lot of data close up, so keep the scale at 3x max
  const zoomAction = d3.zoom()
    .scaleExtent([1, 3])
    .translateExtent([[0, 0], [width, height]]) 
    .on("zoom", zoomFunction);

  svg.call(zoomAction as any);




  // ----------> Add Hover Response Functionality <----------
  // The factor by which to increase/decrease radii when hovered
  const scaleFactor = 2;
  // `mousemove` over `mouseenter` so that it stays enlarged after zoomed
  circles.on('mousemove', (event, point: TSNEPoint) => {
    const circle = d3.select(event.currentTarget);
    // const currentRadius = Number(circle.node().getAttribute('r')); // Old radius, could cause problems when downscaling a zoomed in value
    const currentRadius = d3.zoomTransform(svg.node()!).k * radius;

    circle
      .transition()
      .attr('r', currentRadius * scaleFactor);

    d3.select("#tsne-select :nth-child(1)")
      .text(selectedDataText)
      .style('color', getColorFromLabel(point.label));

    d3.select("#tsne-select :nth-child(2)")
      .text(point.ticker)
      .style('visibility', null);
  });

  circles.on('mouseleave', (event) => {
    const circle = d3.select(event.currentTarget);
    // const currentRadius = Number(circle.node().getAttribute('r')); // Old radius, could cause problems when downscaling a zoomed in value
    const currentRadius = d3.zoomTransform(svg.node()!).k * radius;

    circle
      .transition()
      .attr('r', currentRadius);

    d3.select("#tsne-select :nth-child(1)")
      .text(unselectedDataText)
      .style('color', 'black');

    d3.select("#tsne-select :nth-child(2)")
      .text('-')
      .style('visibility', 'hidden');
  });



  // ----------> Prevent Clipping <----------
  const clipPath = svg.append("defs")
    .append("clipPath")
    .attr("id", "tsne-chart-clip-path")

  // Make sure the clip starts after the y-scale and ends w the svg
  // x/width are most important, it just fails without y/height
  clipPath.append("rect")
    .attr("width", width - margin.right - margin.left)
    .attr("height", height - margin.top - margin.bottom)
    .attr("x", margin.left)
    .attr("y", margin.top);

  // Give the path object a limited non-clipping area
  circles.attr("clip-path", "url(#tsne-chart-clip-path)");


  
  // ----------> Add Labels <----------
  svg.append('text')
    .attr('x', (width / 2))
    .attr('y', height - margin.top)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text("t-SNE Dimension 1");

  // Preprocess positions ahead of time, helps to rotate it about its own center
  const xPos = 12;
  const yPos = (height / 2);
  const rotationText = 'rotate(-90, ' + xPos + ', ' + yPos + ')'
  svg.append('text')
    .attr('x', xPos)
    .attr('y', yPos)
    .attr('transform', rotationText)
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text("t-SNE Dimension 2");
}

function cleanTSNEData(rawData: any[]): TSNEPoint[] {
  return rawData.map((tsneData: any) => {
    return {
      posX: Number(tsneData['X']),
      posY: Number(tsneData['Y']),
      ticker: tsneData['Ticker'],
      label: tsneData['Label']
    }
  });
}

// Color palette generated from Python's matplotlib tab10
// These are the EXACT colors used on the released solution for HW2
function getColorFromLabel(selectedCategory: Labels): string {
  switch (selectedCategory) {
    case 'Information_Technology':
      return '#e377c2';
    case 'Financials':
      return '#d62728';
    case 'Industrials':
      return '#8c564b';
    case 'Energy':
      return '#2ca02c';
    case 'Healthcare':
      return '#9467bd';
    case 'Consumer_Staples':
      return '#ff7f0e';
    case 'Consumer_Discretionary':
      return '#1f77b4';
  }

  // Equivalent to defaulting
  return 'black';
}