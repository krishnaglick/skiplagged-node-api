
const airports = require('airport-codes');
const moment = require('moment-timezone');

const get = require('./asyncGet');

const host = 'skiplagged.com';

module.exports = async function(flightInfo) {
  flightInfo.resultsCount = flightInfo.resultsCount > -1 ? flightInfo.resultsCount : 1;
  flightInfo.partialTrips = flightInfo.partialTrips || false;
  flightInfo.flightTime = flightInfo.flightTime || 0;
  flightInfo.beforeOrAfter = flightInfo.beforeOrAfter || null; //BEFORE || AFTER
  const { from, to, departureDate, sort = 'cost' } = flightInfo;

  const flightUrl = `/api/search.php?from=${from}&to=${to}&depart=${departureDate}&sort=${sort}`;

  const { resultsCount, partialTrips, flightTime, beforeOrAfter } = flightInfo;

  let timeCheck = false;

  if(flightTime !== 0 && !isNaN(flightTime) && flightTime % 1 === 0 && flightTime <= 24) {
    timeCheck = beforeOrAfter === 'BEFORE' ? 1 : beforeOrAfter === 'AFTER' ? 2 : timeCheck;
  }

  const flightData = JSON.parse(await get({ host, path: flightUrl }));
  let counter = 0;
  const flights = flightData.depart.map((flight) => {
    if(++counter > resultsCount)
      return;

    const [priceHolder,,flight_key_long,key] = flight;
    const [price] = priceHolder;

    const currentFlight = {
      price: '$' + (price / 100).toFixed(2),
      price_pennies: flight[0][0],
      duration: parseDurationInt(flightData.flights[key][1]),
      duration_seconds: flightData.flights[key][1],
      departure_time: '',
      arrival_time: '',
      legs: [],
      flight_key: key,
      flight_key_long
    };

    for(let i = 0; i < flightData.flights[key][0].length; i++) {
      const departure_zone = airports.findWhere({ iata: flightData.flights[key][0][i][1] }).get('tz');
      if(i === (flightData.flights[key][0].length - 1) && partialTrips !== true) {
        return;
      }
      if(timeCheck !== false && i === 0) {
        const departure_moment = moment.tz(flightData.flights[key][0][i][2], departure_zone);
        const flight_time_moment = moment.tz(flightInfo.departure_date+'T'+flightInfo.flight_time, departure_zone);
        const difference = departure_moment.diff(flight_time_moment, 'minutes');

        if(timeCheck === 1 && difference > 0) {
          return;
        }
        else if(timeCheck === 2 && difference < 0){
          return;
        }
      }

      const arrival_zone = airports.findWhere({ iata: flightData.flights[key][0][i][3] }).get('tz');
      const duration_seconds = findTimestampDifference(flightData.flights[key][0][i][2], flightData.flights[key][0][i][4]);
      const duration_formatted = parseDurationInt(duration_seconds);
      const airline = flightData.airlines[flightData.flights[key][0][i][0].substring(0, 2)];
      const [flight_number] = flightData.flights[key][0][i];
      const departing_from = airports.findWhere({ iata: flightData.flights[key][0][i][1] }).get('name') + ', ' + flightData.flights[key][0][i][1] + ', ' + airports.findWhere({ iata: flightData.flights[key][0][i][1] }).get('city') + ', ' + airports.findWhere({ iata: flightData.flights[key][0][i][1] }).get('country');
      const arriving_at = airports.findWhere({ iata: flightData.flights[key][0][i][3] }).get('name') + ', ' + flightData.flights[key][0][i][3] + ', ' + airports.findWhere({ iata: flightData.flights[key][0][i][3] }).get('city') + ', ' + airports.findWhere({ iata: flightData.flights[key][0][i][3] }).get('country');
      const departure_time = moment.tz(flightData.flights[key][0][i][2], departure_zone).format('dddd, MMMM Do YYYY, hh:mma');
      const [,,departure_time_formatted] = flightData.flights[key][0][i];
      const arrival_time = moment.tz(flightData.flights[key][0][i][4], arrival_zone).format('dddd, MMMM Do YYYY, hh:mma');
      const [,,,,arrival_time_formatted] = flightData.flights[key][0][i];
      const current_leg = { airline: airline, flight_number: flight_number, duration: duration_formatted, duration_seconds: duration_seconds, departing_from: departing_from, departure_time: departure_time, departure_time_formatted: departure_time_formatted, arriving_at: arriving_at, arrival_time: arrival_time, arrival_time_formatted: arrival_time_formatted };

      if(i === 0) {
        currentFlight.departure_time = departure_time;
      }
      else if(i === flightData.flights[key][0].length - 1) {
        currentFlight.arrival_time = arrival_time;
      }

      currentFlight.legs.push(current_leg);
    }

    return currentFlight;
  }).filter(f => f);

  return flights;
};

function parseDurationInt(duration) {
  const minutes = Math.round(duration / 60);
  let duration_string = '';

  let minutes_string = minutes !== 0 ? (minutes + ' Minute' + (minutes > 1 ? 's' : '')) : '';

  if(minutes >= 60) {
    const minutes_r = minutes % 60;
    const hours = (minutes - minutes_r) / 60;

    let hours_string = hours !== 0 ? (hours + ' Hour' + (hours > 1 ? 's ' : ' ')) : '';

    minutes_string = (minutes - hours * 60) !== 0 ? ((minutes - hours * 60) + ' Minute' + ((minutes - hours * 60) > 1 ? 's' : '')) : '';

    if(hours >= 24) {
      const hours_r = hours % 24;
      const days = (hours - hours_r) / 24;

      hours_string = (hours - days * 24) !== 0 ? ((hours - days * 24) + ' Hour' + ((hours - days * 24) > 1 ? 's ' : ' ')) : '';

      duration_string = days + ' Day' + (days > 1 ? 's ' : ' ') + hours_string + minutes_string;
    }
    else {
      duration_string = hours_string + minutes_string;
    }
  }
  else {
    duration_string = minutes_string;
  }

  return duration_string;
}

function findTimestampDifference(start_timestamp, end_timestamp) {
  const moment = require('moment-timezone');
  const zone = `America/New_York`;

  const start_timestamp_zoned = moment(moment.tz(start_timestamp, zone).format());
  const end_timestamp_zoned = moment(moment.tz(end_timestamp, zone).format());

  const difference = end_timestamp_zoned.diff(start_timestamp_zoned, 'seconds');

  return difference;
}
