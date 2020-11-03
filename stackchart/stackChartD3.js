import dataProcessor from './stackProcessor.js';

export default function stackChartD3(container) {
  ///////// Initialization //////////
  // Create a SVG with the margin convention
  const margin = { top: 20, right: 200, bottom: 20, left: 100 };
  const width = 1000 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const group = svg
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Define scales using scaleTime() and scaleLinear()
  // Only specify ranges. Domains will be set in the 'update' function
  const xScale = d3.scaleTime().range([0, width]);
  const yScale = d3.scaleLinear().range([height, 0]);
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  // Create axes containers
  const xAxis = d3.axisBottom().scale(xScale).ticks(10);
  let xAxisGroup = group.append('g').attr('class', 'x-axis axis');

  const yAxis = d3
    .axisLeft()
    .scale(yScale)
    .tickFormat(function (d) {
      return d / 1000000000 + ' Billion';
    });
  let yAxisGroup = group.append('g').attr('class', 'y-axis axis');

  // Create a category label (tooltip)
  group
    .append('text')
    .attr('class', 'y-axis-label')
    .attr('x', 7)
    .attr('y', 15)
    .attr('font-size', '10px')
    .text('USD')
    .style('text-anchor', 'start');

  //////// Clip Path /////////////
  group
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  ////// on Function //////
  const listeners = { originalKey: null };

  function on(key, value) {
    listeners[key] = value;
  }

  //////// BRUSH ///////////
  const brush = d3
    .brushX()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on('end', brushed);

  group.append('g').attr('class', 'brush').call(brush);

  function brushed(event) {
    if (!event || !event.sourceEvent) return null;
    if (event.selection) {
      const inverted = event.selection.map(xScale.invert);
      xDomain = inverted;
      update(_data, _keys, _category);
    } else {
      xDomain = [new Date(2004, 11), new Date(2014, 1)];
      update(_data, _keys, _category);
    }
  }

  let _data;
  let _category;
  let xDomain;
  let _keys;

  function update(data, keys, category) {
    if (xDomain) {
      group.select('.brush').call(brush.move, null);
    }
    _data = data;
    _category = category;
    _keys = keys;
    // Process data into D3 stack format
    const stackProcessedData = dataProcessor.stackProcessing(
      data,
      keys,
      category
    );

    // Create stack layout (Ascending order)
    const stack = d3
      .stack()
      .keys(keys)
      .value((datum, key) => {
        if (isNaN(datum[key])) {
          return 0;
        }
        return datum[key];
      })
      .order(d3.stackOrderAscending)
      .offset(d3.stackOffsetNone);

    // Call layout
    const series = stack(stackProcessedData);
    const max = d3.max(series, (d) => d3.max(d, (a) => a[1]));

    // Set domain for xScale, yScale and colorScale
    xScale.domain(xDomain ? xDomain : [new Date(2004, 11), new Date(2014, 1)]);
    yScale.domain([0, max]);
    colorScale.domain(listeners.originalKey);

    const area = d3
      .area()
      .x((d) => xScale(new Date(d.data.time)))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]));

    const areas = group.selectAll('.area').data(series, (d) => d.key);

    areas
      .enter()
      .append('path')
      .style('clip-path', 'url(#clip)')
      .attr('class', (d) => {
        const replaced = d.key.replace(/\s+/g, '-');
        return 'area ' + replaced;
      })
      .attr('d', area)
      .merge(areas)
      .attr('fill', (d) => colorScale(d.key))
      .on('click', (e, d) => {
        if (keys.length === 1) {
          update(data, listeners.originalKey, category);
        } else {
          update(data, [d.key], category);
        }
      })
      .transition()
      .duration(1000)
      .attr('d', area);

    areas.exit().remove();

    // Update axes
    xAxisGroup
      .attr('transform', 'translate(0,' + height + ')')
      .transition()
      .duration(1000)
      .call(xAxis);
    yAxisGroup.transition().duration(1000).call(yAxis);

    //////////////
    /// Legend ///
    //////////////

    const highlight = function (d) {
      group.selectAll('.area').style('opacity', 0.2);
      const replaced = d.replace(/\s+/g, '-');
      group.select('.' + replaced).style('opacity', 1);
    };

    const noHighlight = function () {
      group.selectAll('.area').style('opacity', 1);
    };

    const rectSize = 30;
    const legendX = width + 30;
    const legendY = height - keys.length * 40;

    const rects = group.selectAll('.legend').data(keys, (d) => d);

    rects
      .enter()
      .append('rect')
      .attr('class', 'legend')
      .attr('x', legendX)
      .attr('y', height)
      .attr('width', rectSize)
      .attr('height', rectSize)
      .style('fill', (d) => colorScale(d))
      .merge(rects)
      .on('mouseover', (e, d) => {
        highlight(d);
      })
      .on('mouseleave', noHighlight)
      .on('click', (e, d) => {
        if (keys.length === 1) {
          update(data, listeners.originalKey, category);
        } else {
          update(data, [d], category);
        }
      })
      .transition()
      .duration(1000)
      .attr('x', legendX)
      .attr('y', (d, i) => legendY + i * (rectSize + 5))
      .attr('width', rectSize)
      .attr('height', rectSize)
      .style('fill', (d) => colorScale(d));

    rects.exit().remove();

    const labels = group.selectAll('.labels').data(keys, (d) => d);

    labels
      .enter()
      .append('text')
      .attr('class', 'labels')
      .attr('x', legendX + rectSize * 1.2)
      .attr('y', (d, i) => height)
      .style('fill', (d) => colorScale(d))
      .text((d) => d)
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle')
      .merge(labels)
      .transition()
      .duration(1000)
      .attr('x', legendX + rectSize * 1.2)
      .attr('y', (d, i) => legendY + i * (rectSize + 5) + rectSize / 2)
      .style('fill', (d) => colorScale(d));

    labels.exit().remove();
  }

  return {
    update,
    on,
  };
}
