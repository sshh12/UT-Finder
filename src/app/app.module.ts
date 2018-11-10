import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { SchedulePage } from '../pages/schedule/schedule';
import { MapPage } from '../pages/map/map';
import { MoneyPage } from '../pages/money/money';
import { ResourcesPage } from '../pages/resources/resources';
import { TabsPage } from '../pages/tabs/tabs';
import { UTNav } from '../pages/nav';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { IonicStorageModule } from '@ionic/storage';
import { Calendar } from '@ionic-native/calendar';
import { GoogleMaps } from "@ionic-native/google-maps";
import { HttpModule } from '@angular/http';

@NgModule({
  declarations: [
    MyApp,
    SchedulePage,
    MapPage,
    MoneyPage,
    ResourcesPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    SchedulePage,
    MapPage,
    MoneyPage,
    ResourcesPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    InAppBrowser,
    GoogleMaps,
    UTNav,
    Calendar,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
