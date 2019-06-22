import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';

export class BusRoute {
  num: number;
  name: string;
  dir: string;
  type: 'MetroBus' | 'MetroRapid' | 'MetroRail' | 'MetroExpress';
}

class RouteData {
  routeCoords: {lat: number, lng: number}[];
  stops: BusStop[];
}

class BusStop {
  name: string;
  position: {lat: number, lng: number};
}

class LiveBusLocation {
  id: string;
  routeId: string; 
  position: {lat: number, lng: number};
}

// https://www.capmetro.org/busroutes/#!
export let busRoutes: BusRoute[] = [
  {num: 1, type: 'MetroBus', name: 'North Lamar/South Congress', dir: 'N'},
  {num: 3, type: 'MetroBus', name: 'Burnet/Manchaca', dir: 'N'},
  {num: 19, type: 'MetroBus', name: 'Bull Creek', dir: 'N'},
  {num: 640, type: 'MetroBus', name: 'Forty Acres', dir: 'C'},
  {num: 641, type: 'MetroBus', name: 'East Campus', dir: 'E'},
  {num: 642, type: 'MetroBus', name: 'West Campus', dir: 'K'},
  {num: 656, type: 'MetroBus', name: 'Intramural Fields', dir: 'I'},
  {num: 661, type: 'MetroBus', name: 'Far West', dir: 'I'},
  {num: 663, type: 'MetroBus', name: 'Lake Austin', dir: 'I'},
  {num: 670, type: 'MetroBus', name: 'Crossing Place', dir: 'I'},
  {num: 671, type: 'MetroBus', name: 'North Riverside', dir: 'I'},
  {num: 672, type: 'MetroBus', name: 'Lakeshore', dir: 'I'},
  {num: 680, type: 'MetroBus', name: 'North Riverside/Lakeshore', dir: 'I'},
  {num: 681, type: 'MetroBus', name: 'Intramural Fields/Far West', dir: 'I'},
  {num: 682, type: 'MetroBus', name: 'Forty Acres/East Campus', dir: 'C'},
  {num: 801, type: 'MetroRapid', name: 'North Lamar/South Congress', dir: 'N'},
  {num: 803, type: 'MetroRapid', name: 'Burnet/South Lamar', dir: 'N'}
];

@Injectable()
export class BusAPI {

  constructor(private http: HTTP, private storage: Storage) {
  }

  fetchRoutes(): Promise<BusRoute[]> {
    return Promise.resolve(busRoutes);
  }

  async fetchRouteData(route: BusRoute): Promise<RouteData> {

    let date: Date = new Date();
    let dateString = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    let url = `https://www.capmetro.org/planner/s_routetrace.php?route=${route.num}&dir=${route.dir}&date=${dateString}&opts=30`;
    let routeData, json;

    try {
      routeData = await this.http.get(url, {}, {});
      json = JSON.parse(routeData.data);
    } catch(error) {
      console.warn('Unable to access route data.', route, routeData);
      return null;
    }

    if (json.status !== 'OK') {
      return null;
    }

    let traceCoords: {lat: number, lng: number}[] = [];

    traceCoords.push({
      lat: json.trace[0][0],
      lng: json.trace[0][1]
    });

    // undo weird compression algo
    for (let i = 1; i < json.trace.length; i++) {
      traceCoords.push({
        lat: traceCoords[i - 1].lat + json.trace[i][0] / 1000000,
        lng: traceCoords[i - 1].lng + json.trace[i][1] / 1000000
      });
    }

    let stops: BusStop[] = [];

    for (let stop of json.stops) {

      let stopData = await this.http.get(`https://www.capmetro.org/planner/s_stopinfo.asp?stopid=${stop.id}&opt=2`, {}, {});
      let stopJson = JSON.parse(stopData.data);

      stops.push({
        name: stopJson.name,
        position: {lat: stop.latLng[0], lng: stop.latLng[1]}
      });

    }

    return {
      routeCoords: traceCoords,
      stops: stops
    };

  }

  async fetchBusLocations(): Promise<LiveBusLocation[]> {

    let data;
    let liveBuses = [];

    try {
      let resp = await this.http.get('https://data.texas.gov/download/cuc7-ywmd/text%2Fplain', {}, {});
      data = parseFakeJSON(resp.data);
    } catch(e) {
      console.warn('Unable to fetch live bus data.', e);
      return liveBuses;
    }

    for(let key in data) {
      if(!key.includes('ent') || !data[key].vehicle.trip) {
        continue;
      }
      let busData = data[key];
      liveBuses.push({
        id: busData.id,
        routeId: busData.vehicle.trip.route_id,
        position: {
          lat: busData.vehicle.position.latitude,
          lng: busData.vehicle.position.longitude
        }
      });
    }

    return liveBuses

  }

}

// Parse weird psuedo JSON returned by https://data.texas.gov
function parseFakeJSON(fakeJSON: string): any {
  let cleaned =
    fakeJSON.replace(/(\w+): ([\"\w\-\.]+)/g, '"$1": $2,')
            .replace(/}(\s+[\w"])/g, '},$1')
            .replace(/([a-z_]+) {/g, '"$1": {')
            .replace(/: ([A-Z_]+),/g, ': "$1",')
            .replace(/,(\s+)}/g, '$1}');
  let idx = 0;
  while(cleaned.includes('entity')) {
    cleaned = cleaned.replace('entity', `ent-${idx}`);
    idx++;
  }
  return JSON.parse('{' + cleaned + '}');
}