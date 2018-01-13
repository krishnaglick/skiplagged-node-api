
const flightScanner = require('../');

const flightOptions = {
  from: 'my-departure-city',
  to: 'my-destination-city',
  departureDate: 'YYYY-MM-DD',
  resultsCount: 'Number of desired results', // 0 -> Infinity
  partialTrips: 'Exit flight early' //true or false
};

flightScanner(flightOptions).then(console.log).catch(console.error);
