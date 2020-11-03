export default function BarChart(container) {
  // initialization
  // 1. Create a SVG with the margin convention
  const margin = {
    top: 20,
    right: 50,
    bottom: 20,
    left: 50,
  };
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const group = svg
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // 2. Define scales using scaleTime() and scaleLinear()
  // Only specify ranges. Domains will be set in the 'update' function
  const xScale = d3.scaleBand().range([0, width]).paddingInner(0.1);
  const yScale = d3.scaleLinear().range([height, 0]);
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const xAxis = d3.axisBottom().scale(xScale);
  let xAxisGroup = group.append('g').attr('class', 'x-axis axis');

  const yAxis = d3.axisLeft().scale(yScale);
  let yAxisGroup = group.append('g').attr('class', 'y-axis axis');

  let yLabel = d3
    .select('g')
    .append('text')
    .text('Funding Rounds')
    .attr('class', 'axis-label')
    .attr('x', -40)
    .attr('y', -8)
    .style('font', '12px times')
    .style('font-family', 'sans-serif');

  const listeners = {
    originalYear: null,
  };

  function on(key, value) {
    listeners[key] = value;
  }

  function get(key) {
    return listeners[key];
  }

  let _data;
  let _type;
  let slide = d3
    .sliderHorizontal()
    .min(2005)
    .max(2014)
    .default(2014)
    .tickFormat(d3.format('d'))
    .step(1)
    .width(800)
    .height(100)
    .displayValue(true)
    .on('onchange', function (val) {
      d3.select('p#slider-value').text('Year: ' + val);
      listeners.originalYear = val;
      update(_data, _type, listeners.originalYear);
    });

  d3.select('#slider')
    .append('svg')
    .attr('width', 1000)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(100,10)')
    .call(slide);

  function update(data, type, years = listeners.originalYear) {
    _data = data;
    _type = type;
    const dataObj = {};
    const tenYears = {};
    let column;
    if (type === 'regions') {
      column = 'company_region';
    } else if (type === 'countries') {
      column = 'company_country_code';
    } else {
      column = 'company_market';
    }
    data.forEach((el) => {
      const cpColumn = el[column];
      if (!cpColumn) return;
      const year = el['funded_year'];
      if (years === year) {
        if (dataObj[cpColumn]) {
          dataObj[cpColumn]++;
        } else {
          dataObj[cpColumn] = 1;
        }
      }
      if (year === years - 10) {
        if (tenYears[cpColumn]) {
          tenYears[cpColumn]++;
        } else {
          tenYears[cpColumn] = 1;
        }
      }
    });
    let keys = Object.keys(dataObj);
    keys.sort((a, b) => dataObj[b] - dataObj[a]);
    let values = keys.map((e) => {
      return [e, dataObj[e]];
    });

    // top 10
    let sliced_keys = keys.slice(0, 10);
    let sliced_values = values.slice(0, 10);

    let array_values = sliced_keys.map((e) => {
      return [
        e,
        [
          dataObj[e],
          tenYears[e],
          parseInt(((dataObj[e] - tenYears[e]) / tenYears[e]) * 100),
        ],
      ];
    });

    // scales
    xScale.domain(sliced_keys);
    yScale.domain([0, array_values[0][1][0]]);
    colorScale.domain(keys);

    xAxisGroup
      .attr('transform', 'translate(0,' + height + ')')
      .transition()
      .duration(500)
      .attr('text-weight', 'bold')
      .call(xAxis);
    yAxisGroup.transition().duration(500).call(yAxis);

    let bars = group.selectAll('rect').data(array_values, (d) => {
      return d[0];
    });

    bars
      .enter()
      .append('rect')
      .attr('y', height)
      .merge(bars)
      .on('mouseenter', (event, d) => {
        const pos = d3.pointer(event, window);
        d3.select('.tooltip')
          .style('display', 'inline-block')
          .style('top', pos[1] + 'px')
          .style('left', pos[0] + 'px')
          .html(
            d[0] +
              '<br>' +
              'Rounds in ' +
              years +
              ': ' +
              d[1][0] +
              '<br>Rounds 10 yrs ago: ' +
              d[1][1] +
              '<br> Percent Change: ' +
              d[1][2] +
              '%'
          );
      })
      .on('mouseleave', (event, d) => {
        d3.select('.tooltip').style('display', 'none');
      })
      .transition()
      .duration(1000)
      .attr('x', (d) => xScale(d[0]))
      .attr('y', (d) => yScale(d[1][0]))
      .attr('width', (d) => xScale.bandwidth())
      .attr('height', (d) => height - yScale(d[1][0]))
      .attr('fill', 'steelblue');

    bars.exit().remove();
  }
  return {
    update,
    on,
    get,
  };
}
