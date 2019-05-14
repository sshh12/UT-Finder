import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UTAPI, MoneyAccount } from '../backend/ut-api';
import {
  AlertController,
  ToastController
} from '@ionic/angular';

class Account {
    name: string;
    balance: number;
    status: string;
}

@Component({
  selector: 'page-money',
  templateUrl: 'money.page.html',
  styleUrls: ['money.page.scss']
})
export class MoneyPage {

    accounts: Array<MoneyAccount> = [];

    loading = false;
    outdated = true;

    constructor(private utapi: UTAPI,
                private storage: Storage,
                private altCtrl: AlertController,
                private toastCtrl: ToastController) {

      storage.get('accounts').then((accounts) => {
        if (accounts && accounts.length > 0) {
          this.accounts = accounts;
        }
      });

    }

    async viewHistory(acc: Account) {
      if (acc.name.includes('Bevo Bucks')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/bevobucks/accountHist.WBX');
      } else if (acc.name.includes('Dine In')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/hfis/transactions.WBX');
      } else if (acc.name.includes('Owe')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX');
      } else {
        let toast = await this.toastCtrl.create({
          message: 'Unknown account type 😢',
          duration: 3000,
          position: 'top'
        });
        await toast.present();
      }
    }

    async addFunds(acc: Account) {
      if (acc.name.includes('Bevo Bucks')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/bevobucks/addBucks.WBX');
      } else if (acc.name.includes('Dine In')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/hfis/addDollars.WBX');
      } else if (acc.name.includes('Owe')) {
        this.utapi.openNewTab('https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX');
      } else {
        let toast = await this.toastCtrl.create({
          message: 'Unknown account type 😢',
          duration: 3000,
          position: 'top'
        });
        await toast.present();
      }
    }

    async updateAccounts() {

      this.loading = true;

      try {

        this.accounts = await this.utapi.fetchAccounts();
        this.storage.set('accounts', this.accounts);
        this.outdated = false;

      } catch {

        let alert = await this.altCtrl.create({
          header: 'Error',
          subHeader: 'Something is weird with your accounts 😔',
          buttons: ['Dismiss']
        });
        await alert.present();

      }

      this.loading = false;

    }

    getStatusColor(status: string) {
      if (status.toLowerCase() === 'active') {
        return 'success';
      }
      return 'danger';
    }

}
