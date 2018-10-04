import { Injectable } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';

@Injectable()
export class UTNav {

  checker: number;

  constructor(private iab: InAppBrowser) {

  }

  fetchTable(url: string, include: string, callback) { // get table from given url

    const browser = this.iab.create(url, "_blank", {location: 'no'});

    browser.on('loadstop').subscribe(event => {

      this.checker = setInterval(() => { // keep checking browser to see if they are on the right page

        browser.executeScript(
           { code: "document.getElementsByTagName(\"table\")[0].innerHTML" } // extract table html
        ).then((tableElem) => {

          let tableHTML = "" + tableElem;

          if(tableHTML.includes(include)) {

            clearInterval(this.checker);
            browser.close();

            callback(tableHTML);

          }

        });

      }, 500);

    });

    browser.on('exit').subscribe(event => {
      clearInterval(this.checker);
    });

  }

}
