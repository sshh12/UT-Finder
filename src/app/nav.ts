import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';

import {
  AlertController,
  ToastController
} from '@ionic/angular';

@Injectable()
export class UTNav {

  checker: any;
  lastLogged: Date = new Date(0);

  constructor(private iab: InAppBrowser,
              private alertCtrl: AlertController,
              private toastCtrl: ToastController,
              private storage: Storage) {

  }

  doLogin(username: string, password: string, save: boolean) { // open the browser and login as the user

    return new Promise((resolve, reject) => {

        if(save) {
          this.storage.set('eid', username)
          this.storage.set('password', password);
        }

        const browser = this.iab.create('https://login.utexas.edu/login/UI/Login', '_blank', {location: 'no'});

        browser.on('loadstop').subscribe(event => {

          this.checker = setInterval(() => {

            browser.executeScript(
               { code: "window.location.href" }
            ).then((curUrl) => {

              curUrl = "" + curUrl;

              if(curUrl.includes("www.utexas.edu")) { // this means the user is prob already logged in

                clearInterval(this.checker);
                browser.close();
                this.lastLogged = new Date();
                resolve();

              } else if (curUrl.startsWith("https://login.utexas.edu")) { // currently on the login page

                browser.executeScript(
                   { code: "document.getElementById('error-message') != null" }
                ).then(async (error) => {
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
                  }
                  return browser.executeScript(
                     { code: `document.getElementById('IDToken1').value = "${username}"; document.getElementById('IDToken2').value = "${password}"` }
                  )
                }).then(() => {
                  return browser.executeScript({ code: "LoginSubmit('Log In')" })
                }).then(() => {
                  clearInterval(this.checker);
                  // browser.close();
                  this.lastLogged = new Date();
                  resolve();
                });

              }

            });

          }, 500);

        });

        browser.on('exit').subscribe(event => {
          clearInterval(this.checker);
        });

      });

    }

    checkLogin() {

      return new Promise((resolve, reject) => {

        let timeSinceLogged = new Date().getTime() - this.lastLogged.getTime();

        if(timeSinceLogged > 5 * 60 * 1000) { // reset after 5 mins

          Promise.all([this.storage.get('eid'), this.storage.get('password')]).then(async (creds) => {

            let username = creds[0], password = creds[1];

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
                    handler: data => {
                      this.doLogin(data.EID.toLowerCase(), data.password, false).then(() => resolve());
                    }
                  },
                  {
                    text: 'Login & Save',
                    handler: data => {
                      this.doLogin(data.EID.toLowerCase(), data.password, true).then(() => resolve());
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
                    handler: data => {
                      Promise.all([this.storage.set('eid', ''), this.storage.set('password', '')]).then(() => {
                        this.checkLogin().then(() => resolve());
                      });
                    }
                  },
                  {
                    text: `As ${username}`,
                    handler: data => {
                      this.doLogin(username, password, false).then(() => resolve());
                    }
                  }
                ]
              });
              await alert.present();

            }

          });

        } else {

          resolve(); // already logged in, nothing to do

        }

    });

  }

  fetchTable(url: string, include: string, callback?) { // get table from given url

    return new Promise((resolve, reject) => {

      this.checkLogin().then(() => {

        const browser = this.iab.create(url, '_blank', {location: 'no'});

        browser.on('loadstop').subscribe(event => {

          this.checker = setInterval(() => { // keep checking browser to see if they are on the right page

            browser.executeScript(
               { code: "document.getElementsByTagName(\"table\")[0].innerHTML" } // extract table html
            ).then((tableElem) => {

              let tableHTML = "" + tableElem;

              if(tableHTML.includes(include)) {

                clearInterval(this.checker);
                browser.close();

                // this is silly but passing the data through
                // the resolve(...) wasn't working
                if(callback) {
                  callback(tableHTML);
                }

                resolve();

              }

            });

          }, 500);

        });

        browser.on('exit').subscribe(event => {
          clearInterval(this.checker);
        });

      });

    });

  }

}
