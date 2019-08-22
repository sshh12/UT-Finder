import { Component } from '@angular/core';
import { UTSportsAPI, SPORTS } from '../backend/utsports-api';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'page-sports',
  templateUrl: 'sports.page.html',
  styleUrls: ['sports.page.scss']
})
export class SportsPage {

    sports = SPORTS;

    sport = 'Baseball';
    sportObj = SPORTS[0];
    sex: 'male' | 'female' = 'male';

    constructor(private iab: InAppBrowser, private utsports: UTSportsAPI) {
      utsports.fetchStatSummary(this.sportObj, this.sex);
    }

    updateSport() {
      this.sportObj = this.sports.find((sport) => sport.name == this.sport);
      this.utsports.fetchStatSummary(this.sportObj, this.sex);
      this.utsports.fetchEvents(this.sportObj, this.sex);
    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

}
