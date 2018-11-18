import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';

import {
  NavController,
  AlertController,
  ToastController,
  Platform,
} from '@ionic/angular';

import { Keyboard } from '@ionic-native/keyboard/ngx';

import {
  GoogleMaps,
  GoogleMap,
  GoogleMapOptions,
  GoogleMapsMapTypeId,
  TileOverlayOptions,
  MarkerOptions,
  Marker,
  ILatLng,
  PolylineOptions,
  Polygon,
  MarkerIcon
} from '@ionic-native/google-maps';

import { busRoutes, BusRoute } from './buses';
import { foodPlaces, FoodPlace } from './food';

import { BackupMap } from './backup-map'; // b/c website breaks

class Building {
  name: string; // A Building Center
  symbol: string; // ABC
  location: ILatLng;
  rawJSON: any;
  _repr: string;
}

@Component({
  selector: 'page-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss']
})
export class MapPage {

  utCenter: ILatLng = {
    lat: 30.285512,
    lng: -97.735946
  };

  // Maps
  map: GoogleMap;
  mapData: any;
  tileOptions: TileOverlayOptions;
  buildings: Array<Building> = [];

  weatherAPIKey: string = '30a796e71ba6c4c2e5e7270dfbbe78a2';

  constructor(public navCtrl: NavController,
              private platform: Platform,
              private http: Http,
              private keyboard: Keyboard,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController) {
    //...
  }

  async ngOnInit() {
    await this.platform.ready();
    await this.loadMap();
  }

  clearMap() {
    this.map.clear();
    this.map.addTileOverlay(this.tileOptions);
  }

  closeKeyboard() {
    this.keyboard.hide();
  }

  search(event: any) { // Handle search bar

    this.clearMap();

    let query = event.target.value.toLowerCase();

    if (query && query.trim() !== '') {

      for(let building of this.buildings) {

        if(building._repr.includes(query)) {

          let icon: MarkerIcon = {
            url: 'assets/map-building.png',
            size: {
              width: 32,
              height: 32
            }
          };

          let options: MarkerOptions = { // Create a marker for results
            title: building.name,
            position: building.location,
            visible: true,
            animation: null,
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

  loadMapFromJSON(mapJSON: any) { // TODO delete when UT fixes their stuff

    this.buildings = [];

    for (let i in mapJSON.features) { // Copied from https://maps.utexas.edu/js/controller.js
      let current = mapJSON.features[i];

      if (current.properties &&
        current.properties.Building_A &&
        current.properties.Building_A.length > 2 &&
        current.properties.BldFAMIS_N &&
        current.properties.BldFAMIS_N.length > 2) {

        let repr = current.properties.Building_A + current.properties.BldFAMIS_N;
        repr = repr.toLowerCase();

        let [lat, lng] = current.properties.centroid.split(", ");
        this.buildings.push({
          name: current.properties.Building_A,
          symbol: current.properties.BldFAMIS_N,
          location: {lat: parseFloat(lat), lng: parseFloat(lng)},
          _repr: repr,
          rawJSON: current
        });

      }
    }

  }

  loadMap() { // Init the map and tile data

    this.http.get('https://maps.utexas.edu/data/utm.json').subscribe( // Gather geodata
      data => {
        let json = data.json();
        this.loadMapFromJSON(json);
      }, error => {
        this.loadMapFromJSON(BackupMap);
      });

    let mapOptions: GoogleMapOptions = {
      mapType: GoogleMapsMapTypeId.HYBRID,
      camera: {
         target: this.utCenter,
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

    this.clearMap();

  }

  showFood() {

    this.closeKeyboard();
    this.clearMap();

    for(let foodPlace of foodPlaces) {

      let icon: MarkerIcon = {
        url: 'assets/map-food.png',
        size: {
          width: 32,
          height: 32
        }
      };

      let options: MarkerOptions = {
        title: foodPlace.name,
        icon: icon,
        position: {lat: foodPlace.lat, lng: foodPlace.lng},
        visible: true,
        animation: null,
        flat: false,
        zIndex: 9999
      };

      this.map.addMarker(options).then((marker: Marker) => {
      });

    }

  }

  async showBuses() {

    this.closeKeyboard();

    if(!this.map) {
      this.loadMap();
    }

    let alertOptions = {
      header: 'Bus Routes',
      inputs: [],
      buttons: [{
          text: 'cancel'
        }, {
          text: 'Show',
          handler: (data: any) => {
            this.renderRoute(JSON.parse(data));
          }
        }]
    };

    let checked = true;

    for(let route of busRoutes) {

      alertOptions.inputs.push({
        type: 'radio',
        label: `${route.num} ${route.name}`,
        value: JSON.stringify(route),
        checked: checked
      });

      checked = false;

    }

    let alert = await this.alertCtrl.create(alertOptions);

    await alert.present();

  }

  renderRoute(route: BusRoute) { // Render a specific route

    this.clearMap();

    let date: Date = new Date();
    let dateString: string = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    let url = `https://www.capmetro.org/planner/s_routetrace.php?route=${route.num}&dir=${route.dir}&date=${dateString}&opts=30`;

    this.http.get(url).subscribe( // Get route geo data
      async data => {

        let json = data.json();

        if(json.status != 'OK') {
          let toast = await this.toastCtrl.create({
            message: 'Route not available 😢',
            duration: 3000,
            position: 'top'
          })
          await toast.present();
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
                url: 'assets/map-front-bus.png',
                size: {
                  width: 32,
                  height: 32
                }
              };

              let options: MarkerOptions = {
                title: stopJson.name,
                icon: icon,
                position: {lat: stop.latLng[0], lng: stop.latLng[1]},
                visible: true,
                animation: null,
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

  showWeather() {

    this.http.get(`http://api.openweathermap.org/data/2.5/weather?lat=${this.utCenter.lat}&lon=${this.utCenter.lng}&appid=${this.weatherAPIKey}`).subscribe(
        async weatherData => {

          let weather = weatherData.json();

          let temp = Math.round((weather.main.temp - 273.15) * 9 / 5 + 32);

          let conditions = [];
          for(let cond of weather.weather) {
            conditions.push(cond.description);
          }

          let alert = await this.alertCtrl.create({
            header: 'Weather',
            message: `It's ${temp}°F with ${conditions.join(", ")}`
          });
          await alert.present();

        });

  }

}
