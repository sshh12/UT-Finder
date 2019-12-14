import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

export class Sport {
  name: string;
  gendered: boolean;
  code: string;
  icon: string;
}

export class SportEvent {
  iconURL: string;
  title: string;
  home: boolean;
  tv: string;
  location: string;
  date: string;
  time: string;
  result: string;
  actions: {name: string, link: string}[];
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

  async getSchedule(sport: Sport, sex: 'men' | 'women'): Promise<string> {
    let url = 'https://texassports.com/schedule.aspx?path=';
    if (sport.gendered) {
      url += sex.charAt(0);
    }
    url += sport.code;
    return (await this.http.get(url, {}, {})).data
  }

  async fetchStatSummary(sport: Sport, sex?: 'men' | 'women'): Promise<any[]> {
    let html = await this.getSchedule(sport, sex);
    let innerHTML
    try {
      innerHTML = html.match(/Schedule Record([\s\S]+?)<\/section>/)[1];
    } catch (e) {
      return [];
    }
    let regex = /<span class="flex-item-1">([^<]+)<\/span>\s*<span class="flex-item-1">([^<]+)<\/span>/g;
    let matcher;
    let stats = [];
    while (matcher = regex.exec(innerHTML)) {
      stats.push({
        name: matcher[1],
        value: matcher[2]
      });
    }
    return stats;
  }

  parseEvent(html: string): SportEvent {

    let iconURL;
    try {
      iconURL = 'https://texassports.com' + html.match(/lazyload" data-src="([^"]+)"/)[1];
    } catch (e) {
      iconURL = null;
    }
    let title;
    try {
      title = html.match(/sidearm-schedule-game-opponent-name">[\S\s]+?_blank">([^<]+)</)[1];
    } catch (e) {
      title = html.match(/sidearm-schedule-game-opponent-name">\s*([\s\S]+?\S)\s*<\/span>/)[1];
    }
    // regex patch
    if(title.indexOf('</div>') >= 0) {
      title = title.substring(0, title.indexOf('</div>')).trim();
    }

    let tv;
    try {
      tv = html.match(/tv-content">([^<]+)<\/span>/)[1];
    } catch(e) {
      tv = null;
    }
    let home = html.includes('home">vs');
    let location = html.replace(/<div>\s*<a class="hide-on-large[\s\S]+?<\/div>/g, '')
      .match(/sidearm-schedule-game-location">([\s\S]+?)<\/div/)[1]
      .replace('n><a', 'n> / <a').replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim();
    let dateMatch = html.match(/date flex-item-1">\s*<span>([\w ()]+)<\/span>\s*<span>([\w:\.\- ]+)</);

    let result;
    try {
      result = html.match(/game-result text-italic">([\s\S]+?)<\/div/)[1];
      result = result.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').trim();
    } catch(e) {
      result = null;
    }

    // Actions
    let actions = [];
    try {
      let matcher;
      let regex = /li class="game_custom\d+"><a href="([^"]+)"[^>]+>([^<]+)</g;
      while (matcher = regex.exec(html)) {
        // hide duplicate actions
        if(actions.find(action => action.name == matcher[2])) {
          continue;
        }
        actions.push({
          name: matcher[2],
          link: matcher[1]
        });
      }
      let boxMatch = html.match(/href="(\/boxscore[^"]+)"/);
      if(boxMatch) {
        actions.push({
          name: 'Box Score',
          link: 'https://texassports.com' + boxMatch[1]
        });
      }
      let newsMatch = html.match(/href="(\/news[^"]+)"/);
      if(newsMatch) {
        actions.push({
          name: 'News',
          link: 'https://texassports.com' + newsMatch[1]
        });
      }
    } catch(e) {}

    return {
      iconURL: iconURL,
      title: title,
      home: home,
      tv: tv,
      location: location,
      date: dateMatch[1].trim(),
      time: dateMatch[2].trim(),
      result: result,
      actions: actions
    };
  }

  async fetchEvents(sport: Sport, sex?: 'men' | 'women'): Promise<SportEvent[]> {
    let html = await this.getSchedule(sport, sex);
    let regex = /<li class="sidearm-schedule-game ([\s\S]+?)<\/[^a]+>\s*<\/li/g;
    let matcher;
    let events: SportEvent[] = [];
    while (matcher = regex.exec(html)) {
      let innerHTML = matcher[1];
      try {
        events.push(this.parseEvent(innerHTML));
      } catch(e) {
        console.log(e);
      }
    }
    return events;
  }

}
