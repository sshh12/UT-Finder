import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser';
import { CallNumber } from '@ionic-native/call-number';

@Component({
  selector: 'page-resources',
  templateUrl: 'resources.page.html',
  styleUrls: ['resources.page.scss']
})
export class ResourcesPage {

    constructor(private iab: InAppBrowser, private caller: CallNumber) {

    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

    callNumber(num) {
      this.caller.callNumber(num, true);
    }

}
