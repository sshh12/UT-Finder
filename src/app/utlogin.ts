import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage';
import { HTTP } from '@ionic-native/http/ngx';

import {
  AlertController,
  ToastController
} from '@ionic/angular';

declare var cookieEmperor;

@Injectable()
export class UTLogin {

  checker: any;
  lastLogged: Date = new Date(0);

  utLoginCookie: string = '';
  utSCCookie: string = '';
  canvasCookie: string = '';

  constructor(private iab: InAppBrowser,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController,
              private http: HTTP,
              private storage: Storage) {

    this.http.disableRedirect(false);

  }

  doLogin(username: string, password: string, save: boolean) : Promise<void> { // open the browser and login as the user

    return new Promise((resolve, reject) => {

        if(save) {
          this.storage.set('eid', username)
          this.storage.set('password', password);
        }

        const browser = this.iab.create('https://login.utexas.edu/login/UI/Login', '_blank', {location: 'no'});

        browser.on('loadstop').subscribe(event => {

          this.checker = setInterval(async () => {

            let curUrl = await browser.executeScript({ code: "window.location.href" }) + "";

            if(curUrl.includes("www.utexas.edu")) { // this means the user is prob already logged in

              clearInterval(this.checker);
              browser.close();
              this.lastLogged = new Date();
              resolve();

            } else if (curUrl.startsWith("https://login.utexas.edu")) { // currently on the login page

              let error = await browser.executeScript(
                 { code: "document.getElementById('error-message') != null" }
              );

              if(error == 'true') {

                let toast = await this.toastCtrl.create({
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
                   { code: `document.getElementById('IDToken1').value = "${username}"; document.getElementById('IDToken2').value = "${password}"` }
                );
                await browser.executeScript({ code: "LoginSubmit('Log In')" });

              }

            }

          }, 400);

        });

        browser.on('exit').subscribe(event => {
          clearInterval(this.checker);
        });

      });

    }

    checkCanvasLogin() {

      return new Promise(async (resolve, reject) => {

          if(this.canvasCookie != '') {
            resolve();
            return;
          }

          await this.checkLogin();

          const browser = this.iab.create('https://utexas.instructure.com/courses', '_blank', {location: 'no'});

          browser.on('loadstop').subscribe(event => {

            this.checker = setInterval(async () => {

              let curUrl = await browser.executeScript({ code: "window.location.href" }) + "";

              if(curUrl.includes("utexas.instructure.com/courses")) { // this means the user is prob already logged in

                clearInterval(this.checker);
                browser.close();
                this.canvasCookie = await this.getCookie('https://utexas.instructure.com', 'canvas_session');
                resolve();

              }

            }, 200);

          });

          browser.on('exit').subscribe(event => {
            clearInterval(this.checker);
          });

        });

    }

    checkLogin() : Promise<void> {

      return new Promise(async (resolve, reject) => {

        let timeSinceLogged = new Date().getTime() - this.lastLogged.getTime();

        if(timeSinceLogged > 5 * 60 * 1000) { // reset after 5 mins

          let username = await this.storage.get('eid');
          let password = await this.storage.get('password');

            if(!username || !password) { // need user/pass

              let alert = await this.alertCtrl.create({
                header: 'Login',
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
                      await this.doLogin(data.EID.toLowerCase(), data.password, false)
                      resolve();
                    }
                  },
                  {
                    text: 'Login & Save',
                    handler: async data => {
                      await this.doLogin(data.EID.toLowerCase(), data.password, true)
                      resolve();
                    }
                  }
                ]
              });
              await alert.present();

            } else { // already have user/pass

              let alert = await this.alertCtrl.create({
                header: 'Login',
                buttons: [
                  {
                    text: 'New Login',
                    handler: async data => {
                      await this.storage.set('eid', '');
                      await this.storage.set('password', '');
                      await this.checkLogin();
                      resolve();
                    }
                  },
                  {
                    text: `As ${username}`,
                    handler: async data => {
                      await this.doLogin(username, password, false)
                      resolve();
                    }
                  }
                ]
              });
              await alert.present();

            }

        } else {

          resolve(); // already logged in, nothing to do

        }

    });

  }

  getCookie(url: string, name: string) : Promise<string> {

    return new Promise<string>(async (resolve, reject) => {
      cookieEmperor.getCookie(url, name,
        (c) => resolve(c.cookieValue),
        (e) => resolve(''));
    });

  }

  async doHTTP(url: string, method: string = 'get') : Promise<any> { // retrieve page as an authed user

    await this.checkLogin();

    if(this.utLoginCookie == '') {
      this.utLoginCookie = await this.getCookie('https://utdirect.utexas.edu', 'utlogin-prod');
      this.utSCCookie = await this.getCookie('https://utexas.edu', 'SC');
    }

    this.http.setCookie('https://utdirect.utexas.edu', 'utlogin-prod=' + this.utLoginCookie);
    this.http.setCookie('https://utexas.edu', 'SC=' + this.utSCCookie);
    this.http.setCookie('https://utexas.instructure.com', 'canvas_session=' + this.canvasCookie);

    let resp = await this.http.get(url, {}, {});

    return resp;

  }

  async getCanvas(apiURL: string) {

    await this.checkCanvasLogin();

    let rawResp = await this.getPage('https://utexas.instructure.com/api/v1/' + apiURL);
    return JSON.parse(rawResp.replace('while(1);', ''));

  }

  async getPage(url: string) : Promise<string> {
    let resp = await this.doHTTP(url, 'get');
    console.log(url, resp.data);
    return resp.data;
  }

  async fetchTable(url: string, include: string) : Promise<string> { // get table from given url

    let html = await this.getPage(url);
    let reg = /<table["=\w\s%]*>\s*([\s\S]*?)\s*<\/table>/.exec(html);

    if(reg != null && html.includes(include)) {
      return reg[1];
    }

    return '';

  }

}
