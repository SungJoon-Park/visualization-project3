import BarChart from './barchartD3.js';

d3.csv('csvAssets/rounds.csv', d3.autoType).then((data) => {
  let type = 'regions';
  let base_year = 2014;

  const barchart = BarChart('.bar-chart-container');

  barchart.on('originalYear', base_year);
  barchart.update(data, type, base_year);

  d3.select('#group-by').on('change', (e) => {
    type = e.target.value;
    barchart.update(data, type, barchart.get('originalYear'));
  });
});
