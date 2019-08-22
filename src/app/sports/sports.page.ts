import { Component } from '@angular/core';
import { UTSportsAPI, SPORTS, SportEvent } from '../backend/utsports-api';
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
    sex: 'men' | 'women' = 'women';

    events: SportEvent[] = [];
    stats: any[] = [];
    loading = false;

    constructor(private iab: InAppBrowser, private utsports: UTSportsAPI) {
      this.updateSport();
    }

    updateSport() {
      this.sportObj = this.sports.find((sport) => sport.name == this.sport);
      this.stats = [];
      this.events = [];
      this.loading = true;
      this.utsports.fetchStatSummary(this.sportObj, this.sex).then(stats => {
        this.stats = stats;
      });
      this.utsports.fetchEvents(this.sportObj, this.sex).then(events => {
        this.events = events;
        this.loading = false;
      });
    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

    colorResult(event: SportEvent) {
      if(event.result.startsWith('L,')) {
        return 'danger';
      } else if(event.result.startsWith('W,') || 
          event.result.endsWith('st') || 
          event.result.endsWith('nd')) {
        return 'success';
      } else {
        return 'warning';
      }
    }

}
