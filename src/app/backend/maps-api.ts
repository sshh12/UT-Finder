import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';

export class MapLocation {
    abbr: string;
    name: string;
    location: {lat: number, lng: number};
    type: 'UT' | 'Food' | 'ManualFood';
    iconURL: string;
    repr?: string;
}

let PLACES = [
  {name: 'J2 Dining', lat: 30.282942, lng: -97.736906},
  {name: 'Kinsolving Dining', lat: 30.290649, lng: -97.739581},
  {name: 'Jendys', lat: 30.282873, lng: -97.737118},
  {name: 'Jester City Limits', lat: 30.282856, lng: -97.736759},
  {name: 'Jester Pizza', lat: 30.283102, lng: -97.736604},
  {name: 'Taco Cabana', lat: 30.285180, lng: -97.735934},
  {name: 'Qualcomm Cafe', lat: 30.286197, lng: -97.736889},
  {name: 'Panda Express', lat: 30.286916, lng: -97.741161},
  {name: 'Halal Bros', lat: 30.292533, lng: -97.741647},
  {name: 'In-N-Out', lat: 30.292216, lng: -97.741654},
  {name: 'Whataburger', lat: 30.293458, lng: -97.742170},
  {name: 'Cabo Bob\'s', lat: 30.295704, lng: -97.744204},
  {name: 'Torchy\'s Tacos', lat: 30.293710, lng: -97.741730},
  {name: 'Madam Mam\'s', lat: 30.290672, lng: -97.742399},
  {name: 'Caffe Medici', lat: 30.285541, lng: -97.742003},
  {name: 'Pluckers Wing Bar', lat: 30.286330, lng: -97.744990},
  {name: 'Mango Mango', lat: 30.286705, lng: -97.744907},
  {name: 'Raku Sushi', lat: 30.286634, lng: -97.744928},
  {name: 'Thai, How Are You?', lat: 30.284213, lng: -97.742339}
];

@Injectable()
export class MapsAPI {

  googleAPIKey = 'AIzaSyCX5h8Xm3GBb2bBg0beyETURTpDtVQTz-o';
  googleNearbyURL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

  constructor(private http: HTTP, private storage: Storage) {
  }

  async fetchUTBuildings() {

    let buildings: MapLocation[] = await this.storage.get('map:utbuildings');
    if (buildings) {
      return buildings;
    }
    buildings = [];

    let mapData = await this.http.get('https://maps.utexas.edu/data/utm.json', {}, {});
    let mapJSON = JSON.parse(mapData.data);

    for (let i = 0; i < mapJSON.features.length; i++) {

      let current = mapJSON.features[i];

      if (current.properties &&
          current.properties.Building_A &&
          current.properties.Building_A.length > 2 &&
          current.properties.BldFAMIS_N &&
          current.properties.BldFAMIS_N.length > 2) {

        let [lat, lng] = current.properties.centroid.split(', ');
        buildings.push({
          abbr: current.properties.Building_A,
          name: current.properties.BldFAMIS_N,
          location: {lat: parseFloat(lat), lng: parseFloat(lng)},
          type: 'UT',
          iconURL: 'assets/map-building.png'
        });

      }
    }

    this.storage.set('map:utbuildings', buildings);

    return buildings;

  }

  async fetchFoodPlaces() {

    let places: MapLocation[] = await this.storage.get('map:food');
    if (places) {
      return places;
    }
    places = [];

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    let results = [];
    let pageToken;
    for (let i = 0; i < 4; i++) {
      let url;
      if (i === 0) {
        url = `${this.googleNearbyURL}?key=${this.googleAPIKey}&location=30.285512,-97.735946&radius=2000&keyword=food`;
      } else {
        url = `${this.googleNearbyURL}?key=${this.googleAPIKey}&pagetoken=${pageToken}`;
      }
      let resp = await this.http.get(url, {}, {});
      let mapJSON = JSON.parse(resp.data);
      results.push(...mapJSON.results);
      pageToken = mapJSON.next_page_token;
      await sleep(800);
    }

    for (let place of results) {
      places.push({
        abbr: place.name,
        name: place.name,
        location: place.geometry.location,
        type: 'Food',
        iconURL: 'assets/map-food.png'
      });
    }

    for (let place of PLACES) {
      places.push({
        abbr: place.name,
        name: place.name,
        location: {lat: place.lat, lng: place.lng},
        type: 'ManualFood',
        iconURL: 'assets/map-food.png'
      });
    }

    this.storage.set('map:food', places);

    return places;

  }

}
