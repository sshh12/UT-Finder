
export class BusRoute {
  num: number;
  name: string;
  dir: string;
};

export let busRoutes: BusRoute[] = [ // https://www.capmetro.org/busroutes/#!
  {num: 640, name: 'Forty Acres', dir: 'C'},
  {num: 641, name: 'East Campus', dir: 'E'},
  {num: 642, name: 'West Campus', dir: 'K'},
  {num: 656, name: 'Intramural Fields', dir: 'I'},
  {num: 661, name: 'Far West', dir: 'I'},
  {num: 663, name: 'Lake Austin', dir: 'I'},
  {num: 670, name: 'Crossing Place', dir: 'I'},
  {num: 671, name: 'North Riverside', dir: 'I'},
  {num: 672, name: 'Lakeshore', dir: 'I'},
  {num: 680, name: 'North Riverside/Lakeshore', dir: 'I'},
  {num: 681, name: 'Intramural Fields/Far West', dir: 'I'},
  {num: 682, name: 'Forty Acres/East Campus', dir: 'C'},
  {num: 801, name: 'North Lamar/South Congress', dir: 'N'},
  {num: 803, name: 'Burnet/South Lamar', dir: 'N'}
];
