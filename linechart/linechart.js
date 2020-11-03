import lineChartD3 from './lineChartD3.js';

d3.csv('csvAssets/rounds-line.csv', d3.autoType).then((data) => {
  ////// Data Processing By Year
  const obj = {};
  data.forEach((element) => {
    const year = element['funded_year'];
    if (!year || year === 2015) return;
    if (obj[year] === undefined) {
      obj[year] = {};
    }
    const fundType = element['funding_round_type'];
    if (!obj[year][fundType]) {
      obj[year][fundType] = 0;
    }
    obj[year][fundType] += 1;
  });

  const keys = Object.keys(obj);

  keys.forEach((el) => {
    const date = new Date(el, 1, 1);
    obj[el]['date'] = date;
  });

  const processedData = keys.map((el) => obj[el]);

  let fundTypes = [
    'venture',
    'angel',
    'seed',
    'private_equity',
    'equity_crowdfunding',
    'debt_financing',
  ];

  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(fundTypes);

  const lineD3 = lineChartD3('.line-chart-container', fundTypes);
  lineD3.update(processedData, fundTypes);

  /// Create labels
  fundTypes.forEach((fundType) => {
    let upperCased = fundType.split('_').join(' ');
    upperCased = upperCased.charAt(0).toUpperCase() + upperCased.slice(1);

    d3.select('#form-container')
      .append('label')
      .attr('for', fundType)
      .attr('class', 'check-label')
      .text(upperCased)
      .style('color', colorScale(fundType))
      .append('input')
      .attr('type', 'checkbox')
      .attr('class', 'checkbox')
      .attr('id', fundType)
      .attr('value', fundType)
      .attr('checked', 'true');
  });

  /// Event Listener
  document.querySelectorAll('.checkbox').forEach((ch) => {
    ch.addEventListener('change', function () {
      if (this.checked) {
        fundTypes.push(this.value);
        lineD3.update(processedData, fundTypes);
      } else {
        fundTypes = fundTypes.filter((e) => e !== this.value);
        lineD3.update(processedData, fundTypes);
      }
    });
  });
});
