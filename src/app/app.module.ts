import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { GoogleMaps } from '@ionic-native/google-maps';
import { HTTP } from '@ionic-native/http/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { SecureStorage } from '@ionic-native/secure-storage/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

import { UTAPI } from './backend/ut-api';
import { WeatherAPI } from './backend/weather-api';
import { TowerAPI } from './backend/tower-api';
import { MapsAPI } from './backend/maps-api';
import { BusAPI } from './backend/bus-api';
import { UTSportsAPI } from './backend/utsports-api';
import { VotingAPI } from './backend/voting-api';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AppRoutingModule
  ],
  providers: [
    SecureStorage,
    LocalNotifications,
    StatusBar,
    SplashScreen,
    InAppBrowser,
    GoogleMaps,
    Keyboard,
    HTTP,
    CallNumber,
    UTAPI,
    WeatherAPI,
    TowerAPI,
    MapsAPI,
    BusAPI,
    UTSportsAPI,
    VotingAPI,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
