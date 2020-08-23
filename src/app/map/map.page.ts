import { Component, OnInit } from "@angular/core";
import { HTTP } from "@ionic-native/http/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { CallNumber } from "@ionic-native/call-number/ngx";
import { ActivatedRoute } from "@angular/router";
import { AlertController, ToastController, Platform } from "@ionic/angular";
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
  MarkerIcon,
} from "@ionic-native/google-maps";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { WeatherAPI } from "../backend/weather-api";
import { TowerAPI } from "../backend/tower-api";
import { MapsAPI, MapLocation } from "../backend/maps-api";

@Component({
  selector: "page-map",
  templateUrl: "map.page.html",
  styleUrls: ["map.page.scss"],
})
export class MapPage implements OnInit {
  mapCenter: ILatLng = {
    lat: 30.285512,
    lng: -97.735946,
  };

  // Maps
  map: GoogleMap;
  mapLoaded = false;
  tileOptions: TileOverlayOptions;
  loading = false;
  view = "places";

  places: MapLocation[] = [];
  placeMarkers: { [key: string]: Marker } = {};

  classes: any;
  classMarkers: { [key: string]: Marker } = {};

  constructor(
    private platform: Platform,
    private keyboard: Keyboard,
    private caller: CallNumber,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private aroute: ActivatedRoute,
    private weatherAPI: WeatherAPI,
    private mapAPI: MapsAPI,
    private TowerAPI: TowerAPI,
    private iab: InAppBrowser
  ) {
    this.aroute.queryParams.subscribe((params) => {
      let waitForLoad = setInterval(() => {
        if (this.mapLoaded) {
          if (params.search) {
            this.search(params.search);
          } else if (params.classes) {
            this.classes = JSON.parse(params.classes);
            this.showClassView("M");
          }
          clearInterval(waitForLoad);
        }
      }, 100);
    });
  }

  ngOnInit() {
    this.platform.ready().then(() => this.loadMap());
  }

  closeKeyboard() {
    this.keyboard.hide();
  }

  search(event: any) {
    let query;
    try {
      query = event.target.value;
    } catch {
      query = event;
    }

    let testLoc = this.findBuilding(query);
    if (testLoc) {
      for (let place of this.places) {
        this.placeMarkers[place.name].setVisible(false);
      }
      this.placeMarkers[testLoc.name].setVisible(true);
      return;
    }

    query = query.toLowerCase().trim();

    for (let place of this.places) {
      if (query.length != 0 && place.repr.includes(query)) {
        this.placeMarkers[place.name].setVisible(true);
      } else {
        this.placeMarkers[place.name].setVisible(false);
      }
    }
  }

  findBuilding(abbr: string) {
    abbr = abbr.trim().toUpperCase();
    for (let place of this.places) {
      if (place.type != "UT") continue;
      else if (place.abbr == abbr) return place;
    }
    return null;
  }

  addLocations(locations: MapLocation[]) {
    for (let loc of locations) {
      if (loc.type == "UT" || loc.type == "FoodLocation") {
        // Only create searchable string for places
        loc.repr = (loc.name + loc.abbr + loc.type).toLowerCase();
      } else {
        loc.repr = loc.type.toLowerCase();
      }
      let icon: MarkerIcon = {
        url: loc.iconURL,
        size: {
          width: 32,
          height: 32,
        },
      };
      let options: MarkerOptions = {
        title: loc.name,
        snippet: loc.desc || loc.abbr,
        position: loc.location,
        visible: false,
        animation: null,
        flat: false,
        icon: icon,
        zIndex: 9999,
      };
      this.map.addMarker(options).then((marker) => {
        this.placeMarkers[loc.name] = marker;
      });
    }
    this.places.push(...locations);
  }

  async loadMap() {
    this.loading = true;

    this.mapAPI.fetchUTBuildings().then((locations) => {
      this.addLocations(locations);
    });
    this.mapAPI.fetchFoodPlaces().then((locations) => {
      this.addLocations(locations);
    });
    this.mapAPI.fetchInclusiveRestrooms().then((locations) => {
      this.addLocations(locations);
    });
    this.TowerAPI.fetchTowerState().then((towerState) => {
      let icon: MarkerIcon = {
        url: towerState.iconURL,
        size: {
          width: 36,
          height: 36,
        },
      };
      let options: MarkerOptions = {
        title: towerState.text,
        snippet: towerState.subtext,
        position: towerState.position,
        visible: true,
        animation: null,
        flat: false,
        icon: icon,
        zIndex: 9999,
      };
      this.map.addMarker(options);
    });

    let mapOptions: GoogleMapOptions = {
      mapType: GoogleMapsMapTypeId.HYBRID,
      camera: {
        target: this.mapCenter,
        zoom: 15,
      },
      styles: [
        {
          featureType: "all",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
      mapToolbar: false,
    };

    this.map = GoogleMaps.create("map_canvas", mapOptions);

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
      opacity: 1.0,
    };
    await this.map.addTileOverlay(this.tileOptions);

    this.mapLoaded = true;
    this.loading = false;
  }

  showFood() {
    this.closeKeyboard();
    this.search("FoodLocation");
  }

  async showInclusiveRestrooms() {
    this.closeKeyboard();
    this.search("InclusiveRestroom");
  }

  async showBuses() {
    this.openLink("https://capmetro.org/schedmap/");
  }

  openLink(url) {
    this.iab.create(url, "_blank", { location: "no" });
  }

  async showWeather() {
    this.loading = true;
    let weather = await this.weatherAPI.fetchWeather(
      this.mapCenter.lat,
      this.mapCenter.lng
    );
    this.loading = false;

    let alert = await this.alertCtrl.create({
      header: "Weather",
      message: `It's ${weather.temp}°F with ${weather.conditions.join(", ")}`,
    });
    await alert.present();
  }

  async showSURE() {
    let alert = await this.alertCtrl.create({
      header: "SURE Walk",
      message: "Would you like to order a SURE Walk?",
      buttons: [
        "cancel",
        {
          text: "Call",
          handler: (data) => {
            this.caller.callNumber("5122329255", true);
          },
        },
      ],
    });
    await alert.present();
  }

  async showClassView(day: string) {
    this.view = "classes";
    this.cleanMap();
    for (let key in this.classMarkers) {
      this.classMarkers[key].remove();
    }
    this.classMarkers = {};

    let showClasses = this.classes.filter((c) => c.days.includes(day));
    if (showClasses.length == 0) {
      let toast = await this.toastCtrl.create({
        message: "No classes that day! 🌴",
        duration: 2000,
        position: "top",
      });
      await toast.present();
      return;
    }

    showClasses.sort((a, b) => this.classToTime(a) - this.classToTime(b));

    let points = [];
    for (let section of showClasses) {
      let loc = this.findBuilding(section.building);
      if (!loc) {
        let toast = await this.toastCtrl.create({
          message: `Couldn't find ${section.building}`,
          duration: 2000,
          position: "top",
        });
        await toast.present();
      } else {
        let icon: MarkerIcon = {
          url: loc.iconURL,
          size: {
            width: 32,
            height: 32,
          },
        };
        let options: MarkerOptions = {
          title: `${loc.name} (${loc.abbr} ${section.room})`,
          snippet: section.timeslot,
          position: loc.location,
          visible: true,
          animation: null,
          flat: false,
          icon: icon,
          zIndex: 9999,
        };
        this.map.addMarker(options).then((marker) => {
          this.classMarkers[loc.name] = marker;
        });
        points.push(loc.location);
      }
    }
    if (points.length == 0) {
      return;
    }
    let polyOptions: PolylineOptions = {
      points: points,
      color: "#c77716",
      strokeWidth: 10,
      zIndex: 99,
      strokeOpacity: 1.0,
      clickable: false,
    };
    this.map.addPolyline(polyOptions).then((line) => {
      this.classMarkers["line"] = line;
    });
  }

  classToTime(section: any) {
    let time = section.timeslot.split("-")[0].match(/(\d+):(\d+)(\wm)/);
    let hour = parseInt(time[1], 10) + (time[3] === "pm" ? 12 : 0);
    if (time[1] === "12") {
      hour = 12;
    }
    return 1 + (hour - 5) * 2 + (time[2] === "30" ? 1 : 0);
  }

  async closeClassView() {
    this.view = "places";
    for (let key in this.classMarkers) {
      this.classMarkers[key].remove();
    }
    this.classMarkers = {};
  }

  cleanMap() {
    Object.values(this.placeMarkers).map((marker) => marker.setVisible(false));
    Object.values(this.classMarkers).map((marker) => marker.setVisible(false));
  }
}
