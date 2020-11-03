export default {
  topFive: function (data, category) {
    const obj = {};
    data.forEach((el) => {
      const cpRegion = el[category];
      if (!cpRegion) return;

      const funded = el['raised_amount_usd'];
      const year = el['funded_year'];
      if (year === 2014) {
        if (obj[cpRegion]) {
          obj[cpRegion] += funded;
        } else {
          obj[cpRegion] = funded;
        }
      }
    });

    return obj;
  },

  stackProcessing: function (data, keys, category) {
    // Create object with key: funded_month, value: object with keys
    const obj = {};
    data.forEach((e) => {
      const time = +e['funded_month'];
      const group = e[category];
      if (keys.includes(group)) {
        if (!obj[time]) {
          obj[time] = {};
        }
        if (obj[time][group] !== undefined) {
          obj[time][group] += e['raised_amount_usd'];
        } else {
          obj[time][group] = 0;
        }
      }
    });

    // Add time key to each object
    const objKeys = Object.keys(obj);
    objKeys.forEach((key) => {
      obj[key]['time'] = parseInt(key);
    });

    // create an array for stack layout
    const arr = [];
    objKeys.forEach((key) => {
      arr.push(obj[key]);
    });

    return arr;
  },
};
