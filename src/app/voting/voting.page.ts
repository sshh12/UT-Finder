import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'page-voting',
  templateUrl: 'voting.page.html',
  styleUrls: ['voting.page.scss']
})
export class VotingPage {

    constructor(private iab: InAppBrowser) {

    }

    openLink(url) {
      this.iab.create(url, '_blank', {location: 'no'});
    }

}
