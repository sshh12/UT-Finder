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
          text: 'Use VUID',
          handler: async () => {
            this.votingapi.fetchVUIDRegistration();
          }
        },
        {
          text: `Use UT EID`,
          handler: async () => {
            let account = await this.utapi.fetchAccountInfo();
            this.votingapi.fetchNameRegistration(
              account.names[0],
              account.names[account.names.length - 1],
              getFormattedDate(account.birthday)
            );
          }
        }
      ]
    });
    await alert.present();
  }

  openLink(url) {
    this.iab.create(url, '_blank', { location: 'no' });
  }

}
