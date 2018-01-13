
skiplagged-node-api
===================
A node.js wrapper for the [Skiplagged](http://skiplagged.com) API


Table of Contents
=================
 * [Installation](#installation)
 * [Variables](#variables)
 * [Usage](#usage)
   * [Cheapest Flight](#cheapest-flight)
   * [Shortest Flight](#shortest-flight)
   * [Least Layovers](#least-layovers)
   * [Hidden City Flights](#hidden-city-flights)
 * [License](#license)

Installation
============
```
yarn add skiplagged-node-api
```
Variables
=========
| Variable Name  | Datatype | Description
|----------------|----------|-----------------------------------------------------------------------------
| from           | string   | Departure Airport IATA Code [Required]
| to             | string   | Arrival Airport IATA Code [Required]
| departureDate  | string   | Departure Date in YYYY-MM-DD format [Required]
| sort           | string   | Sort method: `cost` (default), `duration`, or `path`. [Optional]
| resultsCount   | number   | Number of desired results. `0` (All), `1` (default), `2`, etc. [Optional]
| partialTrips   | boolean  | `true` or `false` (Default). Toggles Skiplagged's "Get off the flight and leave the airport before the final destination". [Optional]


Usage
=====
```javascript
const flightScanner = require('skiplagged-node-api');
const flights = flightScanner(searchOptions);
```

Cheapest Flight
---------------
```javascript
const flightScanner = require('skiplagged-node-api');

const searchOptions = {
  from: 'PDX',
  to: 'JFK',
  departureDate: '2018-02-01'
};

flightScanner(searchOptions).then(console.log);
```

Shortest Flight
---------------
```javascript
const flightScanner = require('skiplagged-node-api');

const searchOptions = {
  from: 'PDX',
  to: 'JFK',
  departureDate: '2018-02-01',
  sort: 'duration'
};

flightScanner(searchOptions).then(console.log);
```

Least Layovers
--------------
```javascript
const flightScanner = require('skiplagged-node-api');

const searchOptions = {
  from: 'PDX',
  to: 'JFK',
  departureDate: '2018-02-01',
  sort: 'path'
};

flightScanner(searchOptions).then(console.log);
```

Hidden City Flights
-------------------
Hidden city ticketing occurs when a passenger disembarks an indirect flight at the connection node. Flight fares are subject to market forces, and therefore do not necessarily correlate to the distance flown. As a result, a flight between point A to point C, with a connection node at point B, might be cheaper than a flight between point A and point B. It is then possible to purchase a flight ticket from point A to point C, disembark at the connection node (B) and discard the remaining segment (B to C).

Using the hidden city tactic is usually practical only for one-way trips, as the airlines will cancel the subsequent parts of the trip once a traveler has disembarked. Thus, round-trip itineraries need to be created by piecing two one-way flights together. This tactic also requires that the traveler have carry-on luggage only, as any checked baggage items will be unloaded only at the flight's ticketed final destination.

[Wikipedia](https://en.wikipedia.org/wiki/Airline_booking_ploys#Hidden_city_ticketing)

```javascript
const flightScanner = require('skiplagged-node-api');

const searchOptions = {
  from: 'PDX',
  to: 'JFK',
  departureDate: '2018-02-01',
  partialTrips: true
};

flightScanner(searchOptions).then(console.log);

```

License
=======
[The MIT License](https://opensource.org/licenses/MIT)
