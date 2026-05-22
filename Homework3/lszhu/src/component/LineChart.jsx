import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { isEmpty, debounce } from 'lodash';

const csvModules = import.meta.glob(
    '../../data/stockdata/*.csv',
    { query: '?raw', import: 'default', eager: true }
);

const FIELDS = ['Open', 'High', 'Low', 'Close'];

const COLORS = {
    Open:  '#2166ac',
    High:  '#4dac26',
    Low:   '#d6604d',
    Close: '#8073ac',
};

const margin = { left: 60, right: 25, top: 45, bottom: 100 };

function getTicker() {
    const select = document.getElementById('bar-select');
    if (!select) return 'AAPL';
    return select.value.split(' ')[0];
}

function loadData(ticker) {
    const filePath = '../../data/stockdata/' + ticker + '.csv';
    const csvText  = csvModules[filePath];
    if (!csvText) return [];

    return d3.csvParse(csvText, function(row) {
        return {
            date:  new Date(row.Date),
            Open:  +row.Open,
            High:  +row.High,
            Low:   +row.Low,
            Close: +row.Close,
        };
    });
}

export function LineChart() {
    const containerRef = useRef(null);
    const svgRef = useRef(null);

    useEffect(function() {
        if (!containerRef.current || !svgRef.current) return;

        // debounce prevents the chart from redrawing too many times during resize
        const resizeObserver = new ResizeObserver(
            debounce(function(entries) {
                for (const entry of entries) {
                    if (entry.target !== containerRef.current) continue;
                    const width  = entry.contentRect.width;
                    const height = entry.contentRect.height;
                    const ticker = getTicker();
                    const data   = loadData(ticker);
                    if (width && height && !isEmpty(data)) {
                        drawChart(svgRef.current, data, width, height, ticker);
                    }
                }
            }, 100)
        );

        resizeObserver.observe(containerRef.current);

        const rect   = containerRef.current.getBoundingClientRect();
        const ticker = getTicker();
        const data   = loadData(ticker);
        if (rect.width && rect.height) {
            drawChart(svgRef.current, data, rect.width, rect.height, ticker);
        }

        return function() { resizeObserver.disconnect(); };
    }, []);

    return (
        <div className='chart-container d-flex' ref={containerRef} style={{ width: '100%', height: '100%' }}>
            <svg id='line-svg' ref={svgRef} width='100%' height='100%'></svg>
        </div>
    );
}

function drawChart(svgElement, data, width, height, ticker) {

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const plotWidth  = width  - margin.left - margin.right;
    const plotHeight = height - margin.top  - margin.bottom;
    if (plotWidth <= 0 || plotHeight <= 0) return;

    const xScale = d3.scaleTime()
        .domain(d3.extent(data, function(row) { return row.date; }))
        .range([0, plotWidth]);

    const allPrices = [];
    for (const row of data) {
        for (const field of FIELDS) {
            allPrices.push(row[field]);
        }
    }

    // range is reversed: plotHeight = bottom of screen, 0 = top
    const yScale = d3.scaleLinear()
        .domain([d3.min(allPrices) * 0.98, d3.max(allPrices) * 1.02])
        .nice()
        .range([plotHeight, 0]);

    // clip path hides lines that go outside the plot area during zoom/pan
    const clipPath = svg.append('defs').append('clipPath').attr('id', 'lc-clip');
    clipPath.append('rect').attr('width', plotWidth).attr('height', plotHeight);

    const mainGroup = svg.append('g');
    mainGroup.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // invisible rect so mouse/zoom events fire over empty space in the plot
    mainGroup.append('rect')
        .attr('class', 'overlay')
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

    const linesGroup = mainGroup.append('g');
    linesGroup.attr('clip-path', 'url(#lc-clip)');

    const paths = {};
    for (const field of FIELDS) {
        const lineGenerator = d3.line()
            .x(function(row) { return xScale(row.date); })
            .y(function(row) { return yScale(row[field]); });

        paths[field] = linesGroup.append('path')
            .attr('fill', 'none')
            .attr('stroke', COLORS[field])
            .attr('stroke-width', 1.5)
            .attr('d', lineGenerator(data));
    }

    const xAxisGroup = mainGroup.append('g');
    xAxisGroup.attr('transform', 'translate(0, ' + plotHeight + ')');
    xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));
    xAxisGroup.selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end');

    const yAxisGroup = mainGroup.append('g');
    yAxisGroup.call(
        d3.axisLeft(yScale).tickFormat(function(price) { return '$' + price.toFixed(0); })
    );

    svg.append('g')
        .attr('transform', 'translate(10, ' + (margin.top + plotHeight / 2) + ') rotate(-90)')
        .append('text').text('Price (USD)').style('font-size', '.8rem');

    svg.append('g')
        .attr('transform', 'translate(' + (margin.left + plotWidth / 2) + ', ' + (height - 55) + ')')
        .append('text').text('Date').style('font-size', '.8rem').style('text-anchor', 'middle');

    svg.append('g')
        .append('text')
        .attr('transform', 'translate(' + (margin.left + plotWidth / 2) + ', 20)')
        .style('text-anchor', 'middle')
        .style('font-size', '.9rem')
        .style('font-weight', 'bold')
        .text(ticker + ' — Open / High / Low / Close');

    const legendStartX = margin.left + (plotWidth - FIELDS.length * 75) / 2;
    const legendGroup  = svg.append('g');
    legendGroup.attr('transform', 'translate(' + legendStartX + ', ' + (height - 28) + ')');

    for (let index = 0; index < FIELDS.length; index++) {
        const field = FIELDS[index];
        const row   = legendGroup.append('g');
        row.attr('transform', 'translate(' + (index * 75) + ', 0)');
        row.append('line')
            .attr('x1', 0).attr('x2', 18).attr('y1', 0).attr('y2', 0)
            .attr('stroke', COLORS[field]).attr('stroke-width', 2.5);
        row.append('text')
            .attr('x', 23).attr('y', 4).style('font-size', '.72rem').text(field);
    }

    // bisector snaps the crosshair to the nearest data point by date
    const bisect = d3.bisector(function(dataPoint) { return dataPoint.date; }).center;

    const crosshairLine = linesGroup.append('line')
        .attr('y1', 0).attr('y2', plotHeight)
        .attr('stroke', '#888').attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,3')
        .style('display', 'none');

    const xLabelGroup = mainGroup.append('g').style('display', 'none');
    const xLabelRect  = xLabelGroup.append('rect')
        .attr('y', plotHeight + 2).attr('height', 16).attr('rx', 3).attr('fill', '#555');
    const xLabelText  = xLabelGroup.append('text')
        .attr('y', plotHeight + 13)
        .style('text-anchor', 'middle').style('font-size', '.65rem').style('fill', 'white');

    const tooltipGroup    = svg.append('g').style('display', 'none');
    const tooltipRect     = tooltipGroup.append('rect')
        .attr('rx', 4).attr('fill', 'white').attr('stroke', '#ccc').attr('stroke-width', 1);
    const tooltipDateText = tooltipGroup.append('text')
        .attr('x', 8).attr('y', 14).style('font-size', '.7rem').style('font-weight', 'bold');

    const tooltipFieldTexts = [];
    for (let index = 0; index < FIELDS.length; index++) {
        const field = FIELDS[index];
        const row   = tooltipGroup.append('g');
        row.attr('transform', 'translate(8, ' + (26 + index * 15) + ')');
        row.append('circle').attr('cx', 4).attr('cy', -4).attr('r', 4).attr('fill', COLORS[field]);
        tooltipFieldTexts.push(
            row.append('text').attr('x', 13).style('font-size', '.7rem').style('fill', COLORS[field])
        );
    }

    mainGroup.select('.overlay')
        .on('mousemove', function(event) {
            const mousePosition = d3.pointer(event);
            const mouseX        = mousePosition[0];
            const mouseY        = mousePosition[1];
            const nearestIndex  = bisect(data, currentXScale.invert(mouseX));

            if (nearestIndex < 0 || nearestIndex >= data.length) return;
            const nearestPoint = data[nearestIndex];
            const closestX     = currentXScale(nearestPoint.date);

            crosshairLine.style('display', null).attr('x1', closestX).attr('x2', closestX);

            const dateLabel = d3.timeFormat('%b %d')(nearestPoint.date);
            const pillWidth = dateLabel.length * 6 + 10;
            xLabelGroup.style('display', null);
            xLabelRect.attr('x', closestX - pillWidth / 2).attr('width', pillWidth);
            xLabelText.attr('x', closestX).text(dateLabel);

            tooltipDateText.text(d3.timeFormat('%Y-%m-%d')(nearestPoint.date));
            for (let index = 0; index < FIELDS.length; index++) {
                const field = FIELDS[index];
                tooltipFieldTexts[index].text(field + ':  $' + nearestPoint[field].toFixed(2));
            }

            const tooltipWidth  = 125;
            const tooltipHeight = 22 + FIELDS.length * 15 + 6;
            tooltipRect.attr('width', tooltipWidth).attr('height', tooltipHeight);

            // flip tooltip left if it would overflow the right edge
            let tooltipX = margin.left + closestX + 14;
            let tooltipY = margin.top + mouseY - tooltipHeight / 2;
            if (tooltipX + tooltipWidth > width - margin.right) {
                tooltipX = margin.left + closestX - tooltipWidth - 14;
            }
            if (tooltipY < margin.top) { tooltipY = margin.top; }
            if (tooltipY + tooltipHeight > height - margin.bottom) {
                tooltipY = height - margin.bottom - tooltipHeight;
            }

            tooltipGroup.style('display', null);
            tooltipGroup.attr('transform', 'translate(' + tooltipX + ', ' + tooltipY + ')');
        })
        .on('mouseleave', function() {
            crosshairLine.style('display', 'none');
            xLabelGroup.style('display', 'none');
            tooltipGroup.style('display', 'none');
        });

    // kept outside zoom handler so the mousemove listener always sees the latest scale
    let currentXScale = xScale;

    const zoom = d3.zoom()
        .scaleExtent([1, 40])
        .translateExtent([[0, 0], [plotWidth, plotHeight]])
        .on('zoom', function(event) {
            currentXScale = event.transform.rescaleX(xScale);

            // recompute y domain from visible points only so the axis floats as you zoom
            const [xMin, xMax] = currentXScale.domain();
            const visiblePrices = [];
            for (const row of data) {
                if (row.date >= xMin && row.date <= xMax) {
                    for (const field of FIELDS) {
                        visiblePrices.push(row[field]);
                    }
                }
            }
            if (visiblePrices.length > 0) {
                yScale.domain([d3.min(visiblePrices) * 0.98, d3.max(visiblePrices) * 1.02]).nice();
                yAxisGroup.call(d3.axisLeft(yScale).tickFormat(function(price) { return '$' + price.toFixed(0); }));
            }

            xAxisGroup.call(d3.axisBottom(currentXScale).tickFormat(d3.timeFormat('%b %d')));
            xAxisGroup.selectAll('text').attr('transform', 'rotate(-45)').style('text-anchor', 'end');

            for (const field of FIELDS) {
                const lineGenerator = d3.line()
                    .x(function(row) { return currentXScale(row.date); })
                    .y(function(row) { return yScale(row[field]); });
                paths[field].attr('d', lineGenerator(data));
            }
        });

    mainGroup.call(zoom);
    mainGroup.on('dblclick.zoom', function() {
        mainGroup.transition().duration(300).call(zoom.transform, d3.zoomIdentity);
    });

    // d3.on() replaces the previous listener, so switching stocks never stacks up handlers
    const stockSelect = d3.select('#bar-select');
    stockSelect.on('change', function(event) {
        const newTicker = event.target.value.split(' ')[0];
        const newData   = loadData(newTicker);
        const svgRect   = svgElement.getBoundingClientRect();
        if (svgRect.width && svgRect.height && !isEmpty(newData)) {
            drawChart(svgElement, newData, svgRect.width, svgRect.height, newTicker);
        }
    });
}
