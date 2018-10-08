import { Component } from '@angular/core';
import { Http } from '@angular/http';

import {
  NavController,
  AlertController,
  ToastController
} from 'ionic-angular';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapOptions,
  GoogleMapsMapTypeId,
  TileOverlayOptions,
  MarkerOptions,
  GoogleMapsAnimation,
  Marker,
  ILatLng,
  PolylineOptions,
  Polygon,
  MarkerIcon
} from '@ionic-native/google-maps';

import { busRoutes, BusRoute } from './buses';
import { foodPlaces, FoodPlace } from './food';

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

  constructor(public navCtrl: NavController,
              private http: Http,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController) {
    //...
  }

  ionViewDidLoad() {
    this.loadMap();
  }

  clearMap() {
    this.map.clear();
    this.map.addTileOverlay(this.tileOptions);
  }

  search(event: any) { // Handle search bar

    this.clearMap();

    let query = event.target.value.toLowerCase();

    if (query && query.trim() !== '') {

      for(let building of this.buildings) {

        if(building._repr.includes(query)) {

          let pos = building.properties.centroid.split(", ");
          let lat = parseFloat(pos[0]);
          let lng = parseFloat(pos[1]);

          let icon: MarkerIcon = {
            url: 'assets/map-building.png'
          };

          let options: MarkerOptions = { // Create a marker for results
            title: building.properties.Building_A,
            position: {lat: lat, lng: lng},
            visible: true,
            animation: GoogleMapsAnimation.DROP,
            flat: false,
            icon: icon,
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
      zIndex: 20,
      opacity: 1.0
    };

    this.map.addTileOverlay(this.tileOptions);

  }

  showFood() {

    this.clearMap();

    for(let foodPlace of foodPlaces) {

      let icon: MarkerIcon = {
        url: 'assets/map-food.png'
      };

      let options: MarkerOptions = {
        title: foodPlace.name,
        icon: icon,
        position: {lat: foodPlace.lat, lng: foodPlace.lng},
        visible: true,
        animation: GoogleMapsAnimation.DROP,
        flat: false,
        zIndex: 9999
      };

      this.map.addMarker(options).then((marker: Marker) => {
      });

    }

  }

  showBuses() {

    let alert = this.alertCtrl.create();
    alert.setTitle('Bus Routes');

    let checked = true;

    for(let route of busRoutes) {

      alert.addInput({
        type: 'radio',
        label: `${route.num} ${route.name}`,
        value: JSON.stringify(route),
        checked: checked
      });

      checked = false;

    }

    alert.addButton('Cancel');
    alert.addButton({
      text: 'Show',
      handler: (data: any) => {
        this.renderRoute(JSON.parse(data));
      }
    });

    alert.present();

  }

  renderRoute(route: BusRoute) { // Render a specific route

    this.clearMap();

    let date: Date = new Date();
    let dateString: string = `${date.getMonth() + 1}/${date.getDay()}/${date.getFullYear()}`;

    let url = `https://www.capmetro.org/planner/s_routetrace.php?route=${route.num}&dir=${route.dir}&date=${dateString}&opts=30`;

    this.http.get(url).subscribe( // Get route geo data
      data => {

        let json = data.json();

        if(json.status != 'OK') {
          this.toastCtrl.create({
            message: 'Route not available',
            duration: 3000,
            position: 'top'
          }).present();
          return;
        }

        // ----- Outline
        let traceCoords: ILatLng[] = [];

        traceCoords.push({
          lat: json.trace[0][0],
          lng: json.trace[0][1]
        });

        for(let i = 1; i < json.trace.length; i++) { // undo weird compression algo
          traceCoords.push({
            lat: traceCoords[i-1].lat + json.trace[i][0] / 1000000,
            lng: traceCoords[i-1].lng + json.trace[i][1] / 1000000
          });
        }

        let polyOptions: PolylineOptions = {
          points: traceCoords,
          strokeColor: '#1070AF',
          fillColor: '#00000000', // no fill
          strokeWidth: 10,
          zIndex: 99,
          strokeOpacity: 1.0,
          clickable: false
        };

        this.map.addPolygon(polyOptions).then((polygon: Polygon) => {

        });

        // -----

        // ----- Stops

        for(let stop of json.stops) {

          this.http.get(`https://www.capmetro.org/planner/s_stopinfo.asp?stopid=${stop.id}&opt=2`).subscribe( // load stop data
            stopdata => {

              let stopJson = stopdata.json();

              let icon: MarkerIcon = {
                url: 'assets/map-front-bus.png'
              };

              let options: MarkerOptions = {
                title: stopJson.name,
                icon: icon,
                position: {lat: stop.latLng[0], lng: stop.latLng[1]},
                visible: true,
                animation: GoogleMapsAnimation.DROP,
                flat: false,
                zIndex: 9999
              };

              this.map.addMarker(options).then((marker: Marker) => {
              });

            });

        }

        // -----


      });

  }

}
