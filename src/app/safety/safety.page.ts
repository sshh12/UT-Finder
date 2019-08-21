import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';

@Component({
  selector: 'page-safety',
  templateUrl: 'safety.page.html',
  styleUrls: ['safety.page.scss']
})
export class SafetyPage {

    constructor(private iab: InAppBrowser, private caller: CallNumber) {

    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

    callNumber(num) {
      this.caller.callNumber(num, true);
    }

}
