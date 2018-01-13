
const airports = require('airport-codes');
const moment = require('moment-timezone');

const get = require('./asyncGet');

const host = 'skiplagged.com';

module.exports = async function(flightInfo = {}) {
  flightInfo.resultsCount = flightInfo.resultsCount > -1 ? flightInfo.resultsCount || Infinity : 1; //Number of results to display, Skiplagged has their own limit
  flightInfo.partialTrips = flightInfo.partialTrips || false; //Example: Orlando -> San Fran -> Tokyo (Actual Stop) -> Hong Kong

  flightInfo.sort = flightInfo.sort || 'cost'; //cost || duration || path
  const { from, to, departureDate, returnDate, sort = 'cost' } = flightInfo;
  if(!from) {
    throw '"from" is a required field!';
  }
  if(!to) {
    throw '"to" is a required field!';
  }
  if(!departureDate) {
    throw '"departureDate" is a required field!';
  }

  const flightUrl = `/api/search.php?from=${from}&to=${to}&depart=${departureDate}&sort=${sort}${returnDate ? `&return=${returnDate}` : ''}`;
  const { attributes: { city: toCityName } } = airports.findWhere({ iata: to });

  const { resultsCount, partialTrips } = flightInfo;

  const flightData = JSON.parse(await get({ host, path: flightUrl }));
  const flights = [];
  flightData.depart.forEach((flight, count) => {
    if(count >= resultsCount && flights.length >= resultsCount)
      return;
    const [priceArray, , flight_key_long, key] = flight;
    const [pricePennies] = priceArray;

    const flightKey = flightData.flights[key];
    const [legs,flightDurationSeconds] = flightKey;

    const currentFlight = {
      price: '$' + (pricePennies / 100).toFixed(2),
      price_pennies: pricePennies,
      duration: parseDurationInt(flightDurationSeconds),
      durationSeconds: flightDurationSeconds,
      departureTime: '',
      arrivalTime: '',
      legs: [],
      flight_key: key,
      flight_key_long
    };

    for(let i = 0; i < legs.length; i++) {
      const [flightCode, departAirport, departeDatetime, arriveAirport, arriveDatetime] = legs[i];
      const departureZone = airports.findWhere({ iata: departAirport }).get('tz');

      const { attributes: { city: arriveCityName } } = airports.findWhere({ iata: arriveAirport });
      if(arriveCityName !== toCityName && partialTrips === true && i === legs.length - 1) {
        return;
      }

      const arrivalZone = airports.findWhere({ iata: arriveAirport }).get('tz');
      const durationSeconds = findTimestampDifference(departeDatetime, arriveDatetime);
      const duration = parseDurationInt(durationSeconds);
      const airline = flightData.airlines[flightCode.substring(0, 2)];
      const departingFrom = airports.findWhere({ iata: departAirport }).get('name') + ', ' + departAirport + ', ' + airports.findWhere({ iata: departAirport }).get('city') + ', ' + airports.findWhere({ iata: departAirport }).get('country');
      const arrivingAt = airports.findWhere({ iata: arriveAirport }).get('name') + ', ' + arriveAirport + ', ' + airports.findWhere({ iata: arriveAirport }).get('city') + ', ' + airports.findWhere({ iata: arriveAirport }).get('country');
      const departureTime = moment.tz(legs[i][2], departureZone).format('dddd, MMMM Do YYYY, hh:mma');
      const arrivalTime = moment.tz(arriveDatetime, arrivalZone).format('dddd, MMMM Do YYYY, hh:mma');
      const current_leg = {
        airline,
        flightCode,
        duration,
        durationSeconds,
        departingFrom,
        departureTime,
        arrivingAt,
        arrivalTime
      };

      if(i === 0) {
        currentFlight.departureTime = departureTime;
      }
      else if(i === legs.length - 1) {
        currentFlight.arrivalTime = arrivalTime;
      }

      currentFlight.legs.push(current_leg);
    }

    flights.push(currentFlight);
  });

  return flights;
};

function parseDurationInt(duration) {
  const minutes = Math.round(duration / 60);
  let durationString = '';

  let minutesString = minutes !== 0 ? (minutes + ' Minute' + (minutes > 1 ? 's' : '')) : '';

  if(minutes >= 60) {
    const minutesR = minutes % 60;
    const hours = (minutes - minutesR) / 60;

    let hoursString = hours !== 0 ? (hours + ' Hour' + (hours > 1 ? 's ' : ' ')) : '';

    minutesString = (minutes - hours * 60) !== 0 ? ((minutes - hours * 60) + ' Minute' + ((minutes - hours * 60) > 1 ? 's' : '')) : '';

    if(hours >= 24) {
      const hoursR = hours % 24;
      const days = (hours - hoursR) / 24;

      hoursString = (hours - days * 24) !== 0 ? ((hours - days * 24) + ' Hour' + ((hours - days * 24) > 1 ? 's ' : ' ')) : '';

      durationString = days + ' Day' + (days > 1 ? 's ' : ' ') + hoursString + minutesString;
    }
    else {
      durationString = hoursString + minutesString;
    }
  }
  else {
    durationString = minutesString;
  }

  return durationString;
}

function findTimestampDifference(startTimestamp, endTimestamp) {
  const moment = require('moment-timezone');
  const zone = `America/New_York`;

  const startTimestampZoned = moment(moment.tz(startTimestamp, zone).format());
  const endTimestampZoned = moment(moment.tz(endTimestamp, zone).format());

  const difference = endTimestampZoned.diff(startTimestampZoned, 'seconds');

  return difference;
}
