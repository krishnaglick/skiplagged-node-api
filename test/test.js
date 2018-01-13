
const assert = require('assert');
const moment = require('moment');
const flightScanner = require('../');

describe('API Tests', () => {

  describe('Required Params', () => {
    it('should throw an error when no `from` param is given', async () => {
      try {
        await flightScanner();
        throw 'Should have thrown an error!';
      }
      catch(err) {
        console.error(err);
        assert.equal(err.toString(), '"from" is a required field!');
      }
    });

    it('should throw an error when no `to` param is given', async () => {
      try {
        await flightScanner({ from: 'MCO' });
        throw 'Should have thrown an error!';
      }
      catch(err) {
        console.error(err);
        assert.equal(err.toString(), '"to" is a required field!');
      }
    });

    it('should throw an error when no `departureDate` param is given', async () => {
      try {
        await flightScanner({ from: 'MCO', to: 'TYO' });
        throw 'Should have thrown an error!';
      }
      catch(err) {
        console.error(err);
        assert.equal(err.toString(), '"departureDate" is a required field!');
      }
    });
  });

  describe('Happy Path', () => {
    it('should run with required params provided', async () => {
      const flights = await flightScanner({ from: 'MCO', to: 'TYO', departureDate: moment().add(7, 'days').format('YYYY-MM-DD') });
      assert.equal(flights.length, 1);
    });

    it('should return two results when asked', async () => {
      const flights = await flightScanner({ from: 'MCO', to: 'TYO', departureDate: moment().add(7, 'days').format('YYYY-MM-DD'), resultsCount: 2 });
      assert.equal(flights.length, 2);
    });

    it('should return different results when partialTrips is on', async () => {
      const resultsCount = 3;
      const partialFlights = await flightScanner({ from: 'MCO', to: 'TYO', departureDate: moment().add(7, 'days').format('YYYY-MM-DD'), resultsCount });
      const flights = await flightScanner({ from: 'MCO', to: 'TYO', departureDate: moment().add(7, 'days').format('YYYY-MM-DD'), resultsCount, partialTrips: true });
      assert.equal(partialFlights.length, resultsCount);
      assert.equal(flights.length, resultsCount);
      const partialFlightKeys = partialFlights.map(f => f.flight_key);
      const flightKeys = flights.map(f => f.flight_key);
      assert.notStrictEqual(flightKeys, partialFlightKeys);
    });

    it('should provide a different price when a return date is specified', async () => {
      const [oneWayFlight] = await flightScanner({
        from: 'MCO',
        to: 'TYO',
        departureDate: moment().add(7, 'days').format('YYYY-MM-DD')
      });
      const [roundTripFlight] = await flightScanner({
        from: 'MCO',
        to: 'TYO',
        departureDate: moment().add(7, 'days').format('YYYY-MM-DD'),
        returnDate: moment().add(14, 'days').format('YYYY-MM-DD')
      });
      assert.notEqual(oneWayFlight.price, roundTripFlight.price);
    });
  });
});
