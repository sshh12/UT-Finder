import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

export class TowerState {
  position: {lat: number, lng: number};
  iconURL: string;
  text: string;
  subtext: string;
}

export class TowerNews {
  text: string;
  url: string;
  date: Date;
}

@Injectable()
export class TowerAPI {

  position = {lat: 30.286099, lng: -97.739377};

  constructor(private http: HTTP) {
  }

  async fetchTowerNews(): Promise<TowerNews[]> {

    let news = [];
    let htmlData, match;
    try {
      let resp = await this.http.get('https://tower.utexas.edu/lighting-updates/', {}, {});
      htmlData = resp.data;
    } catch(e) {
      return news;
    }

    let regex = /href="([:/\w\.\-]+)">([^<]+)<\/a>[</>\w"\s=-]+datetime="([\d\-:T+]+)"/g;

    while (match = regex.exec(htmlData)) {
      news.push({
        text: match[2],
        url: match[1],
        date: new Date(match[3])
      });
    }

    console.log(news);

    return news;

  }

  async fetchTowerState(): Promise<TowerState> {

    let news = await this.fetchTowerNews();
    let dateToday = new Date().toDateString();
    let newsToday = news.find((event) => {
      return event.date.toDateString() == dateToday;
    });

    if(newsToday) {
      return {
        position: this.position,
        iconURL: 'assets/tower-orange.png',
        text: 'The Tower (Lit)',
        subtext: newsToday.text
      };
    }

    return {
      position: this.position,
      iconURL: 'assets/tower-normal.png',
      text: 'The Tower',
      subtext: null
    };

  }

}
