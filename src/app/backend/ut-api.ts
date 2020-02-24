import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx';
import { HTTP } from '@ionic-native/http/ngx';
import {
  AlertController,
  ToastController
} from '@ionic/angular';

const DEMO_EID = 'utdemo';
import {
  SCHEDULE_DATA,
  MONEY_DATA,
  CANVAS_DATA,
  CANVAS_ASSIGNMENT_DATA
} from './demo-db';

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

export class MoneyAccount {
  name: string;
  balance: number;
  status: string;
}

export class Course {
  canvasID: number;
  name: string;
  title: string;
  code: string;
  grade?: number;
  assignments?: Array<Assignment> = [];
}

export class Assignment {
  title: string;
  gradetype: string;
  score: string;
  maxscore: string;
  due: string;
}

export class AccountInfo {
  eid: string;
  name: string;
  names: string[];
  birthday: Date;
}

export class SemesterInfo {
  code: string;
  lsCode: string;
}

export class RISInfo {
  bars: boolean;
  regDates: string[];
}

export class WaitListInfo {
  pos: string;
  code: string;
  name: string;
  title: string;
}

export class AuditInfo {
  created: Date;
  type: string;
  degree: string;
  progress: number;
};

@Injectable()
export class UTAPI {

  checker: any;
  lastLogged: Date = new Date(0);

  utLoginCookie = '';
  utSCCookie = '';
  canvasCookie = '';
  canvasAccountID = 0;
  canvasUserID = 0;
  usingDemoAccount = false;
  secStorage: SecureStorageObject = null;
  account: AccountInfo = null;

  constructor(private iab: InAppBrowser,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private http: HTTP,
    private storage: Storage,
    private secureStorage: SecureStorage) {

    this.http.disableRedirect(false);
    this.initStorage();
  }

  async initStorage() {
    this.secStorage = await this.secureStorage.create('ut_finder_secure');
    if(this.secStorage) {
      // Migrate old storage
      let password = await this.storage.get('password');
      try {
        await this.secStorage.get('password');
      } catch (e) {
        await this.secStorage.set('password', '');
      }
      if (password) {
        await this.secStorage.set('password', password);
      }
      await this.storage.set('password', null);
    } else {
      // insecure fallback
      console.log('Secure storage failed...falling back to normal storage.')
      // @ts-ignore:131
      this.secStorage = this.storage;
    }
    this.account = await this.storage.get('account');
  }

  openNewTab(url: string) {
    this.iab.create(url, '_blank', { location: 'no' });
  }

  doLogin(username: string, password: string, save: boolean): Promise<void> {

    return new Promise((resolve) => {

      if (save) {
        this.storage.set('eid', username);
        this.secStorage.set('password', password);
      }

      if (username == DEMO_EID) {
        this.lastLogged = new Date();
        this.utLoginCookie = DEMO_EID;
        this.utSCCookie = DEMO_EID;
        this.usingDemoAccount = true;
        resolve();
        return;
      }

      const browser = this.iab.create('https://utdirect.utexas.edu/registration/classlist.WBX', '_blank', { location: 'no' });

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
            this.account = await this.fetchAccountInfo();
            this.storage.set('account', this.account);
            resolve();

          } else if (curUrl.startsWith('https://login.utexas.edu')) {
            // currently on the login page
            let error = await browser.executeScript(
              { code: 'document.getElementById(\'error-message\') != null' }
            ) + '';

            if (error != 'true') {

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

      if(!await this.ensureUTLogin()) {
        resolve(false);
        return;
      }

      if (this.canvasCookie !== '' || this.usingDemoAccount) {
        resolve(true);
        return;
      }

      const username = await this.storage.get('eid') || '';
      const password = await this.secStorage.get('password') || '';

      const browser = this.iab.create('https://utexas.instructure.com/courses', '_blank', { location: 'no' });

      browser.on('loadstop').subscribe(() => {

        this.checker = setInterval(async () => {

          const curUrl = await browser.executeScript({ code: 'window.location.href' }) + '';

          // this means the user is prob already logged in
          if (curUrl.includes('https://utexas.instructure.com/courses')) {

            clearInterval(this.checker);
            browser.close();
            this.canvasCookie = await this.getCookie('https://utexas.instructure.com', 'canvas_session');
            resolve(true);

          } else if (curUrl.includes('https://enterprise.login.utexas.edu')) {

            let error = await browser.executeScript(
              { code: 'document.getElementsByClassName(\'form-error\').length != 0' }
            ) + '';

            if (error != 'true') {

              await browser.executeScript(
                { code: `document.getElementById('username').value = "${username}";` }
              );
              await browser.executeScript(
                { code: `document.getElementById('password').value = "${password}"` }
              );
              await browser.executeScript(
                { code: 'document.getElementsByName(\'_eventId_proceed\')[0].click()' });

              // do it again cause ios broke
              await browser.executeScript(
                { code: `document.getElementById('username').value = "${username}";` }
              );
              await browser.executeScript(
                { code: `document.getElementById('password').value = "${password}"` }
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

  ensureUTLogin(): Promise<boolean> {

    return new Promise(async (resolve) => {

      const timeSinceLogged = new Date().getTime() - this.lastLogged.getTime();

      if (timeSinceLogged > 20 * 60 * 1000) { // reset after 20 mins

        const username = await this.storage.get('eid');
        const password = await this.secStorage.get('password');

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
                  await this.secStorage.set('password', '');
                  await this.storage.set('account', null);
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

  async getPage(url: string, method: string = 'GET', data: any = {}): Promise<string> {
    this.http.setCookie('https://utdirect.utexas.edu', 'utlogin-prod=' + this.utLoginCookie);
    this.http.setCookie('https://utexas.edu', 'SC=' + this.utSCCookie);
    this.http.setCookie('https://utexas.instructure.com', 'canvas_session=' + this.canvasCookie);
    if(method === 'GET') {
      return (await this.http.get(url, data, {})).data;
    } else if(method === 'POST') {
      return (await this.http.post(url, data, {})).data;
    }
  }

  async fetchHTMLFromTable(url: string, include: string): Promise<string> {

    const html = await this.getPage(url);
    const reg = /<table["=\w\s%]*>\s*([\s\S]*?)\s*<\/table>/.exec(html);

    if (reg != null && html.includes(include)) {
      return reg[1];
    }

    return '';

  }

  async fetchAccountInfo(): Promise<AccountInfo> {

    if (!await this.ensureUTLogin()) {
      return null;
    }

    let html = await this.getPage('https://utdirect.utexas.edu/apps/utd/all_my_addresses/');
    let name = html.match(/upd_name" value="([^"]+)"/)[1];
    let bdayString = html.match(/Date of Birth:[<\/span> cl="fied_vu]+(\d\d\/\d\d\/\d\d)/)[1];
    let names = name.split(/[, ]+/);
    names.push(names.shift());
    return {
      name: name,
      names: names,
      birthday: new Date(bdayString),
      eid: await this.storage.get('eid')
    };

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

    if (this.usingDemoAccount) {
      return sem ? SCHEDULE_DATA.OTHER : SCHEDULE_DATA.NOW;
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
        let location = this.getRegexMatrix(/\s*?(\w+ [a-z]*[\d.]+[a-z]*)\s*?/g, clean(colsMatch[4][1]));

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

  async fetchAccounts(): Promise<MoneyAccount[]> {

    if (!await this.ensureUTLogin()) {
      return [];
    }

    if (this.usingDemoAccount) {
      return MONEY_DATA;
    }

    let accounts: MoneyAccount[] = [];

    let tableHTML = await this.fetchHTMLFromTable('https://utdirect.utexas.edu/hfis/diningDollars.WBX', '<th>Balance  </th>');
    let wioHTML = await this.getPage('https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX');

    accounts.push(...this.parseAccountsTable(tableHTML));
    accounts.push(...this.parseWIO(wioHTML));

    return accounts;

  }

  async fetchCourses(): Promise<Course[]> {

    if (!await this.ensureCanvasLogin()) {
      return [];
    }

    if (this.usingDemoAccount) {
      return CANVAS_DATA;
    }

    let canvasCourses = await this.getCanvas('courses?enrollment_state=active');
    let courses: Course[] = [];

    for (let course of canvasCourses) {

      // ensure active course
      if (!course.enrollments || course.enrollments[0].enrollment_state !== 'active') {
        continue;
      }

      // people prob only want to see real courses
      if (course.name.includes('University Housing')) {
        continue;
      }

      this.canvasAccountID = course.account_id;

      if (this.canvasUserID === 0) {
        this.canvasUserID = course.enrollments[0].user_id;
      }

      courses.push({
        canvasID: course.id,
        name: course.name,
        code: course.course_code,
        title: course.name.replace(/\w\w\d\d -/, '')
          .replace(/\w\d\d \w{2,6}: /, '')
          .replace(/\s+\(\d+\)\s*/, '').trim()
      });

    }

    // look up enrollments
    let canvasEnrollments = await this.getCanvas(`users/${this.canvasUserID}/enrollments`);

    for (let enroll of canvasEnrollments) {

      // find course attached to enrollment
      let course: Course = courses.find((course) => {
        return course.canvasID === enroll.course_id;
      });
      if (!course) {
        continue;
      }

      if (enroll.grades.current_score) {
        course.grade = enroll.grades.current_score;
      } else {
        course.grade = 0;
      }
      course.assignments = [];

    }

    return courses;

  }

  async fetchAssignments(course: Course): Promise<Assignment[]> {

    if (!await this.ensureCanvasLogin()) {
      return [];
    }

    if (this.canvasUserID === 0) {
      await this.fetchCourses();
    }

    if (this.usingDemoAccount) {
      return CANVAS_ASSIGNMENT_DATA.DEFAULT;
    }

    function clean(str) {
      return str.replace(/(\r\n\t|\n|\r\t)/gm, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    let gradesPage = await this.getPage(`https://utexas.instructure.com/courses/${course.canvasID}/grades`);

    let assigns: Assignment[] = [];

    for (let rowMatch of this.getRegexMatrix(/<tr class="student_assignment[\S\s]+?>([\s\S]+?)<\/tr>/g, gradesPage)) {

      let titleMatch = /\/submissions\/\d+">([\S ]+?)<\/a>/g.exec(rowMatch[1]);

      if (titleMatch != null) {

        let title = clean(titleMatch[1]);
        let context = clean(/<div class="context">([\s\S]+?)<\/div>/g.exec(rowMatch[1])[1]);
        let due = clean(/<td class="due">([\s\S]+?)<\/td>/g.exec(rowMatch[1])[1]);
        let score = clean(/<span class="original_score">([\s\S]+?)<\/span>/g.exec(rowMatch[1])[1]);
        let maxscore = clean(/<td class="possible points_possible">([\s\S]+?)<\/td>/g.exec(rowMatch[1])[1]);

        if (score.length === 0) {
          score = '?';
        }

        title = title.replace(/Submission Only\s*-?\s*/, '')
          .replace(/DS \d+\s+-?\s*/, '')
          .replace('&#39;', '\'').replace('&amp;', '&');

        assigns.push({
          title: title,
          gradetype: context,
          score: score,
          maxscore: maxscore,
          due: due
        });

      }

    }

    return assigns;

  }

  async fetchRIS(): Promise<RISInfo> {
    let ris = {
      bars: false,
      regDates: []
    };
    if (!await this.ensureUTLogin()) {
      return ris;
    }
    let sems = this.getSemesters();
    let page = await this.getPage('https://utdirect.utexas.edu/registrar/ris.WBX', 
      'POST', {ccyys: sems[1].code, seq_num: '0'});
    ris.bars = !page.includes('You have no bars at this time');
    for (let rowMatch of this.getRegexMatrix(/([A-Z]\w{2}\s{1,2}[\d\wMidnight, APM\-]+[tM])\|/g, page)) {
      ris.regDates.push(rowMatch[1].trim());
    }
    return ris;
  }

  async fetchWaitLists(): Promise<WaitListInfo[]> {
    let waitlist = []
    if (!await this.ensureUTLogin()) {
      return waitlist;
    }
    let page = await this.getPage('https://utdirect.utexas.edu/registrar/waitlist/wl_see_my_waitlists.WBX');
    for (let rowMatch of this.getRegexMatrix(/<td\s+col[^>]+>\s*<[^>]+>\s*(\d+)\s*<\/span>\s*<[^>]+>\s*([A-Z][A-Z \d]+)\s*<[^>]+>\s*(\S[\s\S]+?)\s*</g, page)) {
      waitlist.push({
        pos: '',
        code: rowMatch[1],
        name: rowMatch[2],
        title: rowMatch[3]
      });
    }
    let i = 0;
    for (let rowMatch of this.getRegexMatrix(/\s*(\d+ of \d+)\s*</g, page)) {
      waitlist[i++].pos = rowMatch[1];
    }
    return waitlist;
  }

  async fetchIDAs(): Promise<AuditInfo[]> {
    let audits = [];
    if (!await this.ensureUTLogin()) {
      return audits;
    }
    let page = await this.getPage('https://utdirect.utexas.edu/apps/degree/audits/requests/history/');
    for(let rowMatch of this.getRegexMatrix(/<tr>([\s\S]+?)<\/tr>/g, page)) {
      let rowText = rowMatch[1];
      if(rowText.includes('Degree Audits Requested') || rowText.includes('Request Created')) {
        continue;
      }
      let cols = this.getRegexMatrix(/<td[ style="x\-align:rh]*>([\s\S]+?)<\/td>/g, rowText).map(c => c[1].trim());
      let audit = {
        created: new Date(cols[1]),
        type: cols[2],
        degree: cols[3].replace(/\s{2,}/g, ' '),
        progress: parseFloat(cols[7].replace('%', ''))
      };
      audits.push(audit);
    }
    audits.sort((a, b) => b.created.getTime() - a.created.getTime());
    return audits;
  }

  getSemesters(): SemesterInfo[] {
    let now = new Date();
    let curYear = now.getFullYear();
    let curYearAbbr = curYear - 2000;
    let curMonth = now.getMonth();
    let sems = [];
    if (0 <= curMonth && curMonth <= 4) {
      sems.push({ code: `${curYear}2`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}` });
      sems.push({ code: `${curYear}6`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}`});
      sems.push({ code: `${curYear}9`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}`});
    } else if (5 <= curMonth && curMonth <= 7) {
      sems.push({ code: `${curYear}6`, lsCode: `${curYearAbbr}-${curYearAbbr + 1}` });
      sems.push({ code: `${curYear}9`, lsCode: `${curYearAbbr}-${curYearAbbr + 1}` });
      sems.push({ code: `${curYear + 1}2`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}` });
    } else {
      sems.push({ code: `${curYear}9`, lsCode: `${curYearAbbr}-${curYearAbbr + 1}` });
      sems.push({ code: `${curYear + 1}2`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}` });
      sems.push({ code: `${curYear + 1}6`, lsCode: `${curYearAbbr - 1}-${curYearAbbr}` });
    }
    return sems;
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

  parseAccountsTable(tableHTML: string): Array<MoneyAccount> { // Convert HTML to classes

    let accounts: Array<MoneyAccount> = [];

    for (let rowMatch of this.getRegexMatrix(/tr\s*?class=\"datarow\">([\s\S]+?)<\/tr/g, tableHTML)) {

      let colsMatch = this.getRegexMatrix(/td\s*?>([\s\S]+?)<\/td/g, rowMatch[1]);

      let name = colsMatch[0][1].trim();
      let balance = parseFloat(colsMatch[1][1].replace('$ ', ''));
      let status = colsMatch[2][1];

      accounts.push({
        name: name,
        balance: balance,
        status: status
      });

    }

    return accounts;

  }

  parseWIO(wioHTML: string): Array<MoneyAccount> {

    let accounts: Array<MoneyAccount> = [];

    let amtMatches = this.getRegexMatrix(/td\s*?class=\"item_amt\">([\s\S]+?)<\/td/g, wioHTML);

    let clean = (s) => s.replace(/(\r\n\t|\n|\r\t)/gm, '').replace('&#44;', '').replace('&#46;', '.').replace(' ', '').replace('$', '');

    if (amtMatches.length === 0) {
      return [];
    }

    let bal = parseFloat(clean(amtMatches[0][1]));

    // For now only one account
    accounts.push({
      name: 'What I Owe',
      balance: bal,
      status: 'Active'
    });

    return accounts;

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
