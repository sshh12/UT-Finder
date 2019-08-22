import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

export class Sport {
  name: string;
  gendered: boolean;
  code: string;
  icon: string;
}

export class SportEvent {

}

export let SPORTS = [
  {
    name: 'Baseball',
    gendered: false,
    code: 'baseball',
    icon: 'baseball-ball'
  }, {
    name: 'Basketball',
    gendered: true,
    code: 'bball',
    icon: 'basketball-ball'
  }, {
    name: 'Football',
    gendered: false,
    code: 'football',
    icon: 'football-ball'
  }, {
    name: 'Golf',
    gendered: true,
    code: 'golf',
    icon: 'golf-ball'
  }, {
    name: 'Rowing',
    gendered: false,
    code: 'wrow',
    icon: 'water'
  }, {
    name: 'Soccer',
    gendered: false,
    code: 'wsoc',
    icon: 'futbol'
  }, {
    name: 'Softball',
    gendered: false,
    code: 'softball',
    icon: 'baseball-ball'
  }, {
    name: 'Swimming',
    gendered: true,
    code: 'swim',
    icon: 'swimming-pool'
  }, {
    name: 'Tennis',
    gendered: true,
    code: 'ten',
    icon: 'globe'
  }, {
    name: 'Texas Relays',
    gendered: false,
    code: 'relays',
    icon: 'running'
  }, {
    name: 'Track & Field',
    gendered: false,
    code: 'xc_tf',
    icon: 'running'
  }, {
    name: 'Volleyball',
    gendered: false,
    code: 'wvball',
    icon: 'volleyball-ball'
  }
];

@Injectable()
export class UTSportsAPI {

  constructor(private http: HTTP) {
  }

  async getSchedule(sport: Sport, sex?: 'male' | 'female'): Promise<string> {
    let url = 'https://texassports.com/schedule.aspx?path=';
    if(sport.gendered) {
      url += sex.charAt(0);
    }
    url += sport.code;
    return (await this.http.get(url, {}, {})).data
  }

  async fetchStatSummary(sport: Sport, sex?: 'male' | 'female'): Promise<any[]> {
    let html = await this.getSchedule(sport, sex);
    let innerHTML = html.match(/Schedule Record([\s\S]+?)<\/section>/)[1];
    let regex = /<span class="flex-item-1">([^<]+)<\/span>\s*<span class="flex-item-1">([^<]+)<\/span>/g;
    let matcher;
    let stats = [];
    while (matcher = regex.exec(innerHTML)) {
      stats.push({
        name: matcher[1],
        value: matcher[2]
      });
    }
    console.log(stats);
    return stats;
  }

  async fetchEvents(sport: Sport, sex?: 'male' | 'female'): Promise<SportEvent[]> {
    let html = await this.getSchedule(sport, sex);
    let regex = /<li class="sidearm-schedule-game ([\s\S]+?)<\/[^a]+>\s*<\/li/g;
    let matcher;
    while (matcher = regex.exec(html)) {
      let innerHTML = matcher[1];
      let iconURL = 'https://texassports.com' + innerHTML.match(/lazyload" data-src="([^"]+)"/)[1];
      console.log(iconURL)
    }
    return null;
  }

}
