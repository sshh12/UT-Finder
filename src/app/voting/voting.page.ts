import { Component } from "@angular/core";

import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { AlertController } from "@ionic/angular";

function getFormattedDate(date) {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, "0");
  let day = date.getDate().toString().padStart(2, "0");
  return month + "/" + day + "/" + year;
}

@Component({
  selector: "page-voting",
  templateUrl: "voting.page.html",
  styleUrls: ["voting.page.scss"],
})
export class VotingPage {
  constructor(private iab: InAppBrowser, private alertCtrl: AlertController) {}

  async checkRegistration() {
    this.openLink("https://teamrv-mvp.sos.texas.gov/MVP/back2HomePage.do");
  }

  async showResults(results) {
    if (!results) {
      let alert = await this.alertCtrl.create({
        header: "Not Found 😔",
        subHeader: "Unable to find your registration",
        message:
          "You may be registered in a different county (Travis) or your application is still processing.",
        buttons: ["OK"],
      });
      await alert.present();
    } else {
      let alert = await this.alertCtrl.create({
        header: "Found 🎉",
        subHeader: `Registration found for ${results.Name}`,
        message: `County: ${results.County}, VUID: ${results.VUID}, Status: ${results["Voter Status"]}`,
        buttons: ["OK"],
      });
      await alert.present();
    }
  }

  openLink(url) {
    this.iab.create(url, "_blank", { location: "no" });
  }
}
