import lineChartD3 from './lineChartD3.js';

d3.csv('investments.csv', d3.autoType).then((data) => {
  console.log('This is line chart', data);
  let investments = data;
  console.log('investments', investments);
  const regions = {};

  investments.forEach((el) => {
    //   investments.forEach((el, i) => {

    const cpRegion = el['company_region'];
    if (!cpRegion) return;

    let funded = el['raised_amount_usd'];
    if (isNaN(funded)) {
      if (funded) {
        funded = parseFloat(funded.split(',').join(''));
      } else {
        funded = 0;
      }
    }

    const year = el['funded_year'];
    if (year === 2014) {
      if (regions[cpRegion]) {
        regions[cpRegion] += funded;
      } else {
        regions[cpRegion] = funded;
      }
    }
  });

  const keys = Object.keys(regions);
  keys.sort((a, b) => regions[b] - regions[a]);

  let values = keys.map((e) => {
    return [e, regions[e]];
  });

  console.log('REGIONS', regions);

  values = values.slice(0, 5);

  const lineD3 = lineChartD3('.line-container');
  lineD3.update(data, keys.slice(0, 5));
});
