import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

export class Weather {
    temp: number;
    conditions: string[];
}

@Injectable()
export class WeatherAPI {

  weatherAPIKey = '30a796e71ba6c4c2e5e7270dfbbe78a2';
  weatherAPIURL = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HTTP) {
  }

  async fetchWeather(lat: number, lng: number): Promise<Weather> {

    let weatherData = await this.http.get(`${this.weatherAPIURL}?lat=${lat}&lon=${lng}&appid=${this.weatherAPIKey}`, {}, {});
    let weather = JSON.parse(weatherData.data);

    let temp = Math.round((weather.main.temp - 273.15) * 9 / 5 + 32);

    let conditions = [];
    for (let cond of weather.weather) {
      conditions.push(cond.description);
    }

    return {
      temp: temp,
      conditions: conditions
    };

  }

}
