
const flightScanner = require('../');

const flightOptions = {
  from: 'my-departure-city',
  to: 'my-destination-city',
  departureDate: 'YYYY-MM-DD',
  resultsCount: 'Number of desired results', // 0 -> Infinity
  partialTrips: 'Exit flight early' //true or false
};

(async () => {
  try {
    const flights = await flightScanner(flightOptions);
    console.log(flights);
  }
  catch(err) {
    console.error(err);
  }
})();

