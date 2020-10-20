const fetched = {};
const defaults = {'start':'2017-6-1', 'end':'2017-7-1'};

function getQuery(symbol,start,end) {
  if (start === undefined) {
    console.log('defaulting start date');
    start = defaults['start'];
  }
  if (end === undefined) {
    console.log('defaulting end date');
    end = defaults['end'];
  }
  return `${symbol}.json?&start_date=${start}&end_date=${end}`;
}

async function getData(symbol,start,end,nextFn) {
  let query = getQuery(symbol, start, end);
  let url = `https://www.quandl.com/api/v3/datasets/WIKI/${query}&api_key=${codes['quandl']}&order=asc&exclude_headers=true&collapse=daily`;

  if (query in fetched) {
    if(typeof(nextFn) === 'function') {
      return nextFn(fetched[query]);
    }
    else {
      return fetched[query];
    }
  }
  else {
    try {
      let res = await fetch(url);
      let data = await res.json({});

      console.log(url, data.dataset);

      if(data) {
        fetched[query] = data.dataset;
        if(typeof(nextFn) === 'function') {
          return nextFn(data.dataset);
        }
        else {
          return data.dataset;
        }
      }
    }
    catch (e) {
      console.log(`data fetch for ${symbol} failed: ${e}`);
    }
  }
}
