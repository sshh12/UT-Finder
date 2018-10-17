import { Component, ApplicationRef } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser';

@Component({
  selector: 'page-resources',
  templateUrl: 'resources.html'
})
export class ResourcesPage {

    constructor(private browser: InAppBrowser) {

    }

    openLink(url) {
      this.browser.create(url, '_system');
    }

}
