import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';
import {
  AlertController,
  ToastController
} from '@ionic/angular';

declare var cookieEmperor;

export class ClassTime {
    num: number;
    name: string;
    title: string;
    building: string;
    room: string;
    days: Array<string>;
    timeslot: string;
}

export class FinalTime {
    num: number;
    name: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    exists: boolean;
    dayIndex?: number;
}

@Injectable()
export class UTAPI {

  checker: any;
  lastLogged: Date = new Date(0);

  utLoginCookie = '';
  utSCCookie = '';
  canvasCookie = '';

  constructor(private iab: InAppBrowser,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController,
              private http: HTTP,
              private storage: Storage) {

    this.http.disableRedirect(false);

  }

  doLogin(username: string, password: string, save: boolean): Promise<void> {

    return new Promise((resolve) => {

      if (save) {
        this.storage.set('eid', username);
        this.storage.set('password', password);
      }

      const browser = this.iab.create('https://utdirect.utexas.edu/registration/classlist.WBX', '_blank', {location: 'no'});

      browser.on('loadstop').subscribe(() => {

        this.checker = setInterval(async () => {

          const curUrl = await browser.executeScript({ code: 'window.location.href' }) + '';

          // this means the user is prob already logged in
          if (curUrl.includes('https://utdirect.utexas.edu/registration/classlist.WBX')) {

            clearInterval(this.checker);
            browser.close();
            this.lastLogged = new Date();
            this.utLoginCookie = await this.getCookie('https://utdirect.utexas.edu', 'utlogin-prod');
            this.utSCCookie = await this.getCookie('https://utexas.edu', 'SC');
            resolve();

          } else if (curUrl.startsWith('https://login.utexas.edu')) {
            // currently on the login page
            let error = await browser.executeScript(
               { code: 'document.getElementById(\'error-message\') != null' }
            ) + '';

            if (error === 'true') {

              const toast = await this.toastCtrl.create({
                message: 'Unable to login 😢',
                duration: 3000,
                position: 'top'
              });
              await toast.present();
              clearInterval(this.checker);
              browser.close();
              resolve();

            } else {

              await browser.executeScript(
                 { code: `document.getElementById('IDToken1').value = "${username}";` }
              );
              await browser.executeScript(
                 { code: `document.getElementById('IDToken2').value = "${password}"` }
              );
              await browser.executeScript({ code: 'LoginSubmit(\'Log In\')' });

              // do it again cause ios broke
              await browser.executeScript(
                 { code: `document.getElementById('IDToken1').value = "${username}";` }
              );
              await browser.executeScript(
                 { code: `document.getElementById('IDToken2').value = "${password}"` }
              );

            }

          }

        }, 800);

      });

      browser.on('exit').subscribe(() => {
        clearInterval(this.checker);
      });

    });

    }

    ensureCanvasLogin(): Promise<boolean> {

      return new Promise(async (resolve) => {

        await this.ensureUTLogin();

        if (this.canvasCookie !== '') {
          resolve(true);
          return;
        }

        const browser = this.iab.create('https://utexas.instructure.com/courses', '_blank', {location: 'no'});

        browser.on('loadstop').subscribe(() => {

          this.checker = setInterval(async () => {

            const curUrl = await browser.executeScript({ code: 'window.location.href' }) + '';

            // this means the user is prob already logged in
            if (curUrl.includes('https://utexas.instructure.com/courses')) {

              clearInterval(this.checker);
              browser.close();
              this.canvasCookie = await this.getCookie('https://utexas.instructure.com', 'canvas_session');
              resolve(true);

            }

          }, 800);

        });

        browser.on('exit').subscribe(() => {
          clearInterval(this.checker);
        });

      });

    }

    ensureUTLogin(): Promise<boolean> {

      return new Promise(async (resolve) => {

        const timeSinceLogged = new Date().getTime() - this.lastLogged.getTime();

        if (timeSinceLogged > 20 * 60 * 1000) { // reset after 20 mins

          const username = await this.storage.get('eid');
          const password = await this.storage.get('password');

            if (!username || !password) { // need user/pass

              let alert = await this.alertCtrl.create({
                header: 'Login',
                message: 'Your login will be stored solely on your device.',
                inputs: [
                  {
                    name: 'EID',
                    placeholder: 'abc12345'
                  }, {
                    name: 'password',
                    placeholder: 'password',
                    type: 'password'
                  }
                ],
                buttons: [
                  {
                    text: 'Login',
                    handler: async data => {
                      await this.doLogin(data.EID.toLowerCase(), data.password, false);
                      resolve(true);
                    }
                  },
                  {
                    text: 'Login & Save',
                    handler: async data => {
                      await this.doLogin(data.EID.toLowerCase(), data.password, true);
                      resolve(true);
                    }
                  }
                ]
              });
              alert.onDidDismiss().then((event) => {
                if (event.role === 'backdrop') {
                  resolve(false);
                }
              });
              await alert.present();

            } else { // already have user/pass

              let alert = await this.alertCtrl.create({
                header: 'Login',
                buttons: [
                  {
                    text: 'New Login',
                    handler: async () => {
                      await this.storage.set('eid', '');
                      await this.storage.set('password', '');
                      resolve(await this.ensureUTLogin());
                    }
                  },
                  {
                    text: `As ${username}`,
                    handler: async () => {
                      await this.doLogin(username, password, false);
                      resolve(true);
                    }
                  }
                ]
              });
              alert.onDidDismiss().then((event) => {
                if (event.role === 'backdrop') {
                  resolve(false);
                }
              });
              await alert.present();

            }

        } else {
          resolve(true);  // already logged in, nothing to do
        }

    });

  }

  getCookie(url: string, name: string): Promise<string> {

    return new Promise<string>(async (resolve) => {
      cookieEmperor.getCookie(url, name,
        (c) => resolve(c.cookieValue),
        () => resolve(''));
    });

  }

  async getCanvas(apiURL: string) {

    await this.ensureCanvasLogin();

    const rawResp = await this.getPage('https://utexas.instructure.com/api/v1/' + apiURL);
    return JSON.parse(rawResp.replace('while(1);', ''));

  }

  async getPage(url: string): Promise<string> {
    this.http.setCookie('https://utdirect.utexas.edu', 'utlogin-prod=' + this.utLoginCookie);
    this.http.setCookie('https://utexas.edu', 'SC=' + this.utSCCookie);
    this.http.setCookie('https://utexas.instructure.com', 'canvas_session=' + this.canvasCookie);
    return (await this.http.get(url, {}, {})).data;
  }

  async fetchHTMLFromTable(url: string, include: string): Promise<string> {

    const html = await this.getPage(url);
    const reg = /<table["=\w\s%]*>\s*([\s\S]*?)\s*<\/table>/.exec(html);

    if (reg != null && html.includes(include)) {
      return reg[1];
    }

    return '';

  }

  async fetchSchedule(sem: string = null): Promise<ClassTime[]> {

    if (!await this.ensureUTLogin()) {
      return [];
    }

    let url = 'https://utdirect.utexas.edu/registration/classlist.WBX';
    let selector = '<th>Course</th>';
    if (sem) {
      url = `https://utdirect.utexas.edu/registration/classlist.WBX?sem=${sem}`;
      selector = '<th>Course</th>';
    }

    let tableHTML = await this.fetchHTMLFromTable(url, selector);

    let classes: Array<ClassTime> = [];

    for (let rowMatch of this.getRegexMatrix(/tr\s*?valign=\"top\">([\s\S]+?)<\/tr/g, tableHTML)) {

      let colsMatch = this.getRegexMatrix(/td\s*?>([\s\S]+?)<\/td/g, rowMatch[1]);

      let num = parseInt(colsMatch[0][1], 10);
      let name = colsMatch[1][1];
      let title = colsMatch[2][1];

      let buildings = this.getRegexMatrix(/>\s*?(\w+)\s*?</g, colsMatch[3][1]);
      let rooms = this.getRegexMatrix(/\s*?([\d.]+)\s*?/g, colsMatch[4][1]);
      let days = this.getRegexMatrix(/\s*?([MWTHF]+)\s*?/g, colsMatch[5][1]);
      let times = this.getRegexMatrix(/\s*?(\d{1,}:\d{2}\wm-\s*\d{1,}:\d{2}\wm)\s*?/g, colsMatch[6][1]);

      for (let i = 0; i < times.length; i++) {

        let daysAry = days[i][1].replace('TH', 'H').split(''); // TH -> H, since all other days are 1 letter

        let building = (buildings.length !== times.length) ? '*Check Online*' : buildings[i][1]; // Weirdness
        let room = (rooms.length !== times.length) ? '*Check Online*' : rooms[i][1]; // Weirdness

        classes.push({
          num: num,
          name: name,
          title: title,
          building: building,
          room: room,
          days: daysAry,
          timeslot: times[i][1].replace(' ', '')
        });

      }

    }

    return classes;

  }

  async fetchFinals(): Promise<FinalTime[]> {

    if (!await this.ensureUTLogin()) {
      return [];
    }

    function clean(str) {
      return str.replace(/(\r\n\t|\n|\r\t)/gm, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    let tableHTML = await this.fetchHTMLFromTable('https://utdirect.utexas.edu/registrar/exam_schedule.WBX', '<b>Course</b>');

    let finals: Array<FinalTime> = [];

    for (let rowMatch of this.getRegexMatrix(/tr\s*?>([\s\S]+?)<\/tr/g, tableHTML)) {

      let colsMatch = this.getRegexMatrix(/td[\s"a-z0-9%=]*?>([\s\S]+?)<\/td/g, rowMatch[1]);

      if (colsMatch[0][1].includes('Unique Number')) {
        continue;
      }

      let num = parseInt(clean(colsMatch[0][1]), 10);
      let name = clean(colsMatch[1][1]);
      let title = clean(colsMatch[2][1]);

      if (!title.includes('did not request')) {

        let dateTime = this.getRegexMatrix(/\s*?\w+, (\w+) (\d+), (\d+-\d+ \w+)\s*?/g, clean(colsMatch[3][1]));
        let location = this.getRegexMatrix(/\s*?(\w+ [\d.]+)\s*?/g, clean(colsMatch[4][1]));

        let [startDate, endDate] = this.parseDateRange(dateTime[0][1], dateTime[0][2], dateTime[0][3]);

        finals.push({
          num: num,
          name: name,
          title: title,
          startDate: startDate,
          endDate: endDate,
          location: location[0][1],
          exists: true
        });

      } else {

        finals.push({
          num: num,
          name: name,
          title: title,
          startDate: null,
          endDate: null,
          location: '',
          exists: false
        });

      }

    }

    return finals;

  }

  getSemesterCodes(): string[] {
    let now = new Date();
    let curYear = now.getFullYear();
    let curMonth = now.getMonth();
    let codes = [];
    if (0 <= curMonth && curMonth <= 4) {
      codes.push(`${curYear}2`);
      codes.push(`${curYear}6`);
      codes.push(`${curYear}9`);
    } else if (5 <= curMonth && curMonth <= 7) {
      codes.push(`${curYear}6`);
      codes.push(`${curYear}9`);
      codes.push(`${curYear + 1}2`);
    } else {
      codes.push(`${curYear}9`);
      codes.push(`${curYear + 1}2`);
      codes.push(`${curYear + 1}6`);
    }
    return codes;
  }

  parseDateRange(month: string, day: string, times: string): Array<Date> {

    let monthIdx = ['JAN', 'f', 'm', 'AUG', 'MAY', 'JUN', 'j', 'a', 's', 'o', 'NOV', 'DEC'].indexOf(month.substring(0, 3));
    let dateIdx = parseInt(day, 10);

    let start = new Date();
    start.setMonth(monthIdx, dateIdx);
    start.setHours(0, 0, 0, 0);
    let end = new Date(start);

    let [range, suffix] = times.split(' ');
    let [startHour, endHour] = range.split('-');

    if (suffix === 'PM') {
      start.setHours(parseInt(startHour, 10) + 12);
      end.setHours(parseInt(endHour, 10) + 12);
    } else {
      start.setHours(parseInt(startHour, 10));
      end.setHours(parseInt(endHour, 10));
    }

    return [start, end];

  }

  getRegexMatrix(re: RegExp, input: string): Array<any> {
    // apply regex to input, return a list of matches (each match is an array of groups)
    let matcher;
    let matrix = [];

    while (matcher = re.exec(input)) {
      matrix.push(matcher.slice(0));
    }

    return matrix;

  }

}
