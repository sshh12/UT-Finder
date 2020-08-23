import { Component } from "@angular/core";

import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { Platform } from "@ionic/angular";

@Component({
  selector: "page-covid",
  templateUrl: "covid.page.html",
  styleUrls: ["covid.page.scss"],
})
export class CovidPage {
  constructor(private iab: InAppBrowser, private platform: Platform) {}

  showProtectTexasApp() {
    if (this.platform.is("ios")) {
      this.openLink(
        "https://apps.apple.com/us/app/protect-texas-together/id1518413974"
      );
    } else {
      this.openLink(
        "https://play.google.com/store/apps/details?id=com.hornsense"
      );
    }
  }

  openLink(url) {
    this.iab.create(url, "_blank", { location: "no" });
  }
}
