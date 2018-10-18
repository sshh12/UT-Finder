import { Component, ApplicationRef } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser';

@Component({
  selector: 'page-resources',
  templateUrl: 'resources.html'
})
export class ResourcesPage {

    constructor(private iab: InAppBrowser) {

    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

}
