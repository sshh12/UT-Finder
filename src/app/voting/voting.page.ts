import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { UTAPI } from '../backend/ut-api';
import { VotingAPI } from '../backend/voting-api';
import { AlertController } from '@ionic/angular';

function getFormattedDate(date) {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  return month + '/' + day + '/' + year;
}

@Component({
  selector: 'page-voting',
  templateUrl: 'voting.page.html',
  styleUrls: ['voting.page.scss']
})
export class VotingPage {

  constructor(private iab: InAppBrowser,
    private utapi: UTAPI,
    private votingapi: VotingAPI,
    private alertCtrl: AlertController) {

  }

  async checkRegistration() {
    let alert = await this.alertCtrl.create({
      header: 'Check Registration',
      buttons: [
        {
          text: 'Manually',
          handler: async () => {
            this.openLink('https://teamrv-mvp.sos.texas.gov/MVP/back2HomePage.do');
          }
        },
        {
          text: 'Using UT EID',
          handler: async () => {
            let account = await this.utapi.fetchAccountInfo();
            let results = await this.votingapi.fetchNameRegistration(
              account.names[0],
              account.names[account.names.length - 1],
              getFormattedDate(account.birthday)
            );
            this.showResults(results);
          }
        }
      ]
    });
    await alert.present();
  }

  async showResults(results) {
    if (!results) {
      let alert = await this.alertCtrl.create({
        header: 'Not Found 😔',
        subHeader: 'Unable to find your registration',
        message: 'You may be registered in the wrong county (should be Travis) or your application is still processing.',
        buttons: ['OK']
      });
      await alert.present();
    } else {
      let alert = await this.alertCtrl.create({
        header: 'Found 🎉',
        subHeader: `Registration found for ${results.Name}`,
        message: `County: ${results.County}, VUID: ${results.VUID}, Status: ${results['Voter Status']}`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  openLink(url) {
    this.iab.create(url, '_blank', { location: 'no' });
  }

}
