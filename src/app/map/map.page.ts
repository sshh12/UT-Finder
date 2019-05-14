import { Component, OnInit } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import {
  NavController,
  AlertController,
  ToastController,
  Platform,
} from '@ionic/angular';
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
import { WeatherAPI } from '../backend/weather-api';
import { MapsAPI, MapLocation } from '../backend/maps-api';
import { BusAPI, BusRoute } from '../backend/bus-api';

@Component({
  selector: 'page-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss']
})
export class MapPage implements OnInit {

  utCenter: ILatLng = {
    lat: 30.285512,
    lng: -97.735946
  };

  // Maps
  map: GoogleMap;
  places: MapLocation[] = [];
  tileOptions: TileOverlayOptions;

  constructor(private platform: Platform,
              private keyboard: Keyboard,
              private caller: CallNumber,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController,
              private weatherAPI: WeatherAPI,
              private mapAPI: MapsAPI,
              private busAPI: BusAPI) {
  }

  ngOnInit() {
    this.platform.ready().then(() => this.loadMap());
  }

  clearMap() {
    this.map.clear();
    this.map.addTileOverlay(this.tileOptions);
  }

  closeKeyboard() {
    this.keyboard.hide();
  }

  search(event: any) {

    this.clearMap();

    let query;
    try {
      query = event.target.value.toLowerCase();
    } catch {
      query = event.toLowerCase();
    }

    if (query && query.trim() !== '') {

      let hits = 0;

      for (let place of this.places) {

        if (place.repr.includes(query)) {

          hits++;
          if (hits > 100) {
            break;
          }

          let icon: MarkerIcon = {
            url: place.iconURL,
            size: {
              width: 32,
              height: 32
            }
          };

          let options: MarkerOptions = {
            title: place.name,
            position: place.location,
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

  addLocations(locations: MapLocation[]) {
    for (let loc of locations) {
      loc.repr = (loc.name + loc.abbr + loc.type).toLowerCase();
    }
    this.places.push(...locations);
  }

  async loadMap() {

    this.mapAPI.fetchUTBuildings().then((locations) => {
      this.addLocations(locations);
    });
    this.mapAPI.fetchFoodPlaces().then((locations) => {
      this.addLocations(locations);
    });

    let mapOptions: GoogleMapOptions = {
      mapType: GoogleMapsMapTypeId.HYBRID,
      camera: {
         target: this.utCenter,
         zoom: 15
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

    // Copied from https://maps.utexas.edu/js/controller.js
    this.tileOptions = {
      getTile: (x: number, y: number, zoom: number) => {
        let z2 = Math.pow(2, zoom);
        x = x >= 0 ? x : z2 + x;
        if (13 <= zoom && zoom <= 21) {
          return `https://maps.utexas.edu/map_tiler/${zoom}/${x}/${y}.png`;
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
    this.search('food');
  }

  async showBuses() {

    this.closeKeyboard();

    if (!this.map) {
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
            this.showRoute(JSON.parse(data));
          }
        }]
    };

    let checked = true;

    for (let route of await this.busAPI.fetchRoutes()) {
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

  async showRoute(route: BusRoute) {

    this.clearMap();

    let routeData = await this.busAPI.fetchRouteData(route);

    if (!routeData) {
      let toast = await this.toastCtrl.create({
        message: 'Route not available 😢',
        duration: 3000,
        position: 'top'
      });
      await toast.present();
      return;
    }

    let polyOptions: PolylineOptions = {
      points: routeData.routeCoords,
      strokeColor: '#1070AF',
      fillColor: '#00000000', // no fill
      strokeWidth: 10,
      zIndex: 99,
      strokeOpacity: 1.0,
      clickable: false
    };

    this.map.addPolygon(polyOptions).then((polygon: Polygon) => {});

    for (let stop of routeData.stops) {

      let icon: MarkerIcon = {
        url: 'assets/map-front-bus.png',
        size: {
          width: 32,
          height: 32
        }
      };

      let options: MarkerOptions = {
        title: stop.name,
        icon: icon,
        position: stop.position,
        visible: true,
        animation: null,
        flat: false,
        zIndex: 9999
      };

      this.map.addMarker(options).then((marker: Marker) => { });

    }

  }

  async showWeather() {

    let weather = await this.weatherAPI.fetchWeather(this.utCenter.lat, this.utCenter.lng);

    let alert = await this.alertCtrl.create({
      header: 'Weather',
      message: `It's ${weather.temp}°F with ${weather.conditions.join(', ')}`
    });
    await alert.present();

  }

  async showSURE() {

    let alert = await this.alertCtrl.create({
      header: 'SURE Walk',
      message: 'Would you like to order a SURE Walk?',
      buttons: [
        'cancel',
        {
          text: 'Call',
          handler: data => {
            this.caller.callNumber('5122329255', true);
          }
        },
      ]
    });
    await alert.present();

  }

}
