import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { Http } from '@angular/http';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapOptions,
  GoogleMapsMapTypeId,
  TileOverlayOptions,
  MarkerOptions,
  GoogleMapsAnimation,
  Marker
} from '@ionic-native/google-maps';

@Component({
  selector: 'page-map',
  templateUrl: 'map.html'
})
export class MapPage {

  // Maps
  map: GoogleMap;
  mapData: any;
  tileOptions: TileOverlayOptions;
  buildings = [];

  constructor(public navCtrl: NavController, private http: Http) {
    //...
  }

  ionViewDidLoad() {
    this.loadMap();
  }

  search(event: any) { // Handle search bar

    let query = event.target.value.toLowerCase();

    this.map.clear();
    this.map.addTileOverlay(this.tileOptions);

    if (query && query.trim() !== '') {

      for(let building of this.buildings) {

        if(building._repr.includes(query)) {

          let pos = building.properties.centroid.split(", ");
          let lat = parseFloat(pos[0]);
          let lng = parseFloat(pos[1]);

          let options: MarkerOptions = { // Create a marker for results
            title: building.properties.Building_A,
            position: {lat: lat, lng: lng},
            visible: true,
            animation: GoogleMapsAnimation.DROP,
            flat: false,
            zIndex: 9999
          };

          this.map.addMarker(options).then((marker: Marker) => {
            marker.showInfoWindow();
          });

        }

      }

    }

  }

  loadMap() { // Init the map and tile data

    this.http.get('https://maps.utexas.edu/data/utm.json').subscribe( // Gather geodata
      data => {
        let json = data.json();
        for (let i in json.features) { // Copied from https://maps.utexas.edu/js/controller.js
          let current = json.features[i];
          if (current.properties &&
            current.properties.Building_A &&
            current.properties.Building_A.length > 2 &&
            current.properties.BldFAMIS_N &&
            current.properties.BldFAMIS_N.length > 2) {
            current._repr = current.properties.Building_A + current.properties.BldFAMIS_N;
            current._repr = current._repr.toLowerCase();
            this.buildings.push(current);
          }
        }
        this.mapData = json;
      });

    let mapOptions: GoogleMapOptions = {
      mapType: GoogleMapsMapTypeId.HYBRID,
      camera: {
         target: {
           lat: 30.285512,
           lng: -97.735946
         },
         zoom: 16
       },
       styles: [
         {
            featureType: 'all',
            elementType: 'labels',
            stylers: [
              { visibility: 'off' }
            ]
          }
       ],
       mapToolbar: false
    };

    this.map = GoogleMaps.create('map_canvas', mapOptions);

    this.tileOptions = { // Copied from https://maps.utexas.edu/js/controller.js
      getTile: (x: number, y: number, zoom: number) => {
        let z2 = Math.pow(2, zoom);
        x = x >= 0 ? x : z2 + x
        if ((13 <= zoom) && (zoom <= 21)) {
          return "https://maps.utexas.edu/map_tiler/" + zoom + "/" + x + "/" + y + ".png";
        }
        return null;
      },
      tileSize: 256,
      isPng: true,
      visible: true,
      zIndex: 999,
      opacity: 1.0
    };

    this.map.addTileOverlay(this.tileOptions);

  }

}
