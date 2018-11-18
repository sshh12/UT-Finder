import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'page-resources',
  templateUrl: 'resources.page.html',
  styleUrls: ['resources.page.scss']
})
export class ResourcesPage {

    constructor(private iab: InAppBrowser) {

    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

}
