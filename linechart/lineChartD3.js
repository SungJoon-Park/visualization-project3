export default function lineChartD3(container, fundTypes) {
  ///////// Initialization //////////
  // Create a SVG with the margin convention
  const margin = { top: 20, right: 225, bottom: 20, left: 175 };
  const width = 1100 - margin.left - margin.right;
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
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(fundTypes);

  // Create axes containers
  const xAxis = d3.axisBottom().scale(xScale).ticks(10);
  let xAxisGroup = group.append('g').attr('class', 'x-axis axis');

  const yAxis = d3.axisLeft().scale(yScale);
  let yAxisGroup = group.append('g').attr('class', 'y-axis axis');

  //////// Clip Path /////////////
  group
    .append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  function update(data, keys) {
    // Remove previous graphs for updae
    d3.selectAll('path').remove();
    d3.selectAll('circle').remove();

    // Set domain for xScale, yScale and colorScale
    xScale.domain([new Date(2004, 11), new Date(2014, 1)]);
    yScale.domain([0, d3.max(data, (d) => d.venture)]);

    const lines = keys.map((key) => {
      return d3
        .line()
        .defined((d) => !isNaN(d[key]))
        .x((d) => xScale(d.date))
        .y((d) => yScale(d[key]));
    });

    const paths = lines.map((line, i) => {
      return group
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', colorScale(keys[i]))
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);
    });

    paths.forEach((path, i) => {
      const totalLength = path.node().getTotalLength();

      path
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    });

    // Update axes
    xAxisGroup
      .attr('transform', 'translate(0,' + height + ')')
      .transition()
      .duration(1000)
      .call(xAxis);
    yAxisGroup.transition().duration(1000).call(yAxis);

    let focus = null;

    ////// Circles /////
    const circles = keys.map((key) => {
      return group
        .selectAll('data-circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'data-circle')
        .attr('r', (d) => {
          if (!d.date || !d[key]) return 0;
          return 7;
        })
        .attr('cx', (d) => {
          if (d.date === undefined || d.date === null) return 0;
          return xScale(d.date);
        })
        .attr('cy', (d) => {
          if (d[key] === undefined || d[key] === null) return 0;
          return yScale(d[key]);
        })
        .attr('fill', colorScale(key))
        .on('mouseenter', (e, d) => {
          //// Tooltip ////
          focus = group
            .append('g')
            .attr('class', 'g-focus')
            .style('display', 'none');

          focus
            .append('rect')
            .attr('class', 'g-tooltip')
            .attr('width', 200)
            .attr('height', 50)
            .attr('x', 10)
            .attr('y', -22)
            .attr('rx', 4)
            .attr('ry', 4);

          focus
            .append('text')
            .attr('class', 'g-tooltip-company')
            .attr('x', 18)
            .attr('y', -2);

          focus.append('text').attr('x', 18).attr('y', 18);

          focus
            .append('text')
            .attr('class', 'g-tooltip-count')
            .attr('x', 18)
            .attr('y', 18);

          const value = d[key];
          let upperCased = key.split('_').join(' ');
          upperCased = upperCased.charAt(0).toUpperCase() + upperCased.slice(1);
          focus.attr(
            'transform',
            'translate(' + xScale(d.date) + ',' + yScale(d[key]) + ')'
          );
          focus.select('.g-tooltip').attr('width', upperCased.length * 8 + 90);
          focus.style('display', null);
          focus.select('.g-tooltip-company').text('Company: ' + upperCased);
          focus.select('.g-tooltip-count').text('Count: ' + value);
        })
        .on('mouseleave', () => {
          if (focus !== null) {
            d3.select('.g-focus').remove();
          }
        });
    });
  }

  return {
    update,
  };
}
