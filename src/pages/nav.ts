import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

@Injectable()
export class UTNav {

  checker: number;
  lastLogged: Date = new Date(0);

  constructor(private iab: InAppBrowser,
              private alertCtrl: AlertController,
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
               { code: "[window.location.href, document.getElementById('IDToken1')]" }
            ).then((test) => {

              if(("" + test[0]).includes("www.utexas.edu")) { // this means the user is prob already logged in

                clearInterval(this.checker);
                browser.close();
                this.lastLogged = new Date();
                resolve();

              } else if (test[1] != null) { // currently on the login page

                browser.executeScript(
                   { code: `document.getElementById('IDToken1').value = "${username}"; document.getElementById('IDToken2').value = "${password}"` }
                ).then(() => {
                  browser.executeScript({ code: "LoginSubmit('Log In')" })
                }).then(() => {
                  clearInterval(this.checker);
                  browser.close();
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

        if(timeSinceLogged > 180 * 1000) { // reset after 3 mins

          Promise.all([this.storage.get('eid'), this.storage.get('password')]).then((creds) => {

            let username = creds[0], password = creds[1];

            if(!username || !password) { // need user/pass

              this.alertCtrl.create({
                title: 'Login',
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
              }).present();

            } else { // already have user/pass

              this.alertCtrl.create({
                title: 'Login',
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
              }).present();

            }

          });

        }

    });

  }

  async fetchTable(url: string, include: string) { // get table from given url

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

                resolve(tableHTML);

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
