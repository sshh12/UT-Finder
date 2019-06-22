import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';
import { PLACES } from './food-db';

export class MapLocation {
    abbr: string;
    name: string;
    location: {lat: number, lng: number};
    type: 'UT' | 'FoodLocation';
    iconURL: string;
    repr?: string;
}

@Injectable()
export class MapsAPI {

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

    let places = [];

    for (let place of PLACES) {
      places.push({
        abbr: place.name,
        name: place.name,
        location: {lat: place.lat, lng: place.lng},
        type: 'FoodLocation',
        iconURL: 'assets/map-food.png'
      });
    }

    return places;

  }

}
