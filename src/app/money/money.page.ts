import { Component } from '@angular/core';

import {
  AlertController,
  ToastController
} from '@ionic/angular';

import { Storage } from '@ionic/storage';

import { UTLogin } from '../utlogin';

import { InAppBrowser } from '@ionic-native/in-app-browser';

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

    accounts: Array<Account> = []; // current accounts
    loading: boolean = false;

    constructor(private utauth: UTLogin,
                private storage: Storage,
                private altCtrl: AlertController,
                private toastCtrl: ToastController,
                private iab: InAppBrowser) {

      storage.get('accounts').then((accounts) => { // check cache
        if(accounts && accounts.length > 0) {
          this.accounts = accounts;
        }
      });

    }

    async viewHistory(acc: Account) {
      if(acc.name.includes('Bevo Bucks')) {
        this.iab.create('https://utdirect.utexas.edu/bevobucks/accountHist.WBX', '_blank', {location: 'no'});
      } else if (acc.name.includes('Dine In')) {
        this.iab.create('https://utdirect.utexas.edu/hfis/transactions.WBX', '_blank', {location: 'no'});
      } else if (acc.name.includes('Owe')) {
        this.iab.create('https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX', '_blank', {location: 'no'});
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
      if(acc.name.includes('Bevo Bucks')) {
        this.iab.create('https://utdirect.utexas.edu/bevobucks/addBucks.WBX', '_blank', {location: 'no'});
      } else if (acc.name.includes('Dine In')) {
        this.iab.create('https://utdirect.utexas.edu/hfis/addDollars.WBX', '_blank', {location: 'no'});
      } else if (acc.name.includes('Owe')) {
        this.iab.create('https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX', '_blank', {location: 'no'});
      } else {
        let toast = await this.toastCtrl.create({
          message: 'Unknown account type 😢',
          duration: 3000,
          position: 'top'
        });
        await toast.present();
      }
    }

    async fetchAccounts() { // get account balances

      this.loading = true;

      let tableHTML = await this.utauth.fetchTable("https://utdirect.utexas.edu/hfis/diningDollars.WBX", "<th>Balance  </th>");
      let wioHTML = await this.utauth.getPage("https://utdirect.utexas.edu/acct/rec/wio/wio_home.WBX");

      try {

        this.accounts = this.parseAccountsTable(tableHTML);
        this.accounts.push(...this.parseWIO(wioHTML));
        this.storage.set('accounts', this.accounts);

      } catch {

        let alert = await this.altCtrl.create({
          header: 'Error',
          subHeader: 'Something is weird with your accounts...',
          buttons: ['Dismiss']
        });
        await alert.present();

      }

      this.loading = false;

    }

    getStatusColor(status: string) {
      if(status.toLowerCase() == 'active') {
        return 'success';
      }
      return 'danger';
    }

    parseAccountsTable(tableHTML: string) : Array<Account> { // Convert HTML to classes

      let accounts: Array<Account> = [];

      for(let rowMatch of this.getRegexMatrix(/tr\s*?class=\"datarow\">([\s\S]+?)<\/tr/g, tableHTML)) {

        let colsMatch = this.getRegexMatrix(/td\s*?>([\s\S]+?)<\/td/g, rowMatch[1]);

        let name = colsMatch[0][1];
        let balance = parseFloat(colsMatch[1][1].replace('$ ', ''));
        let status = colsMatch[2][1];

        accounts.push({
          name: name,
          balance: balance,
          status: status
        });

      }

      return accounts;

    }

    parseWIO(wioHTML: string) : Array<Account> {

      let accounts: Array<Account> = [];

      let amtMatches = this.getRegexMatrix(/td\s*?class=\"item_amt\">([\s\S]+?)<\/td/g, wioHTML);

      let clean = (s) => s.replace(/(\r\n\t|\n|\r\t)/gm, '').replace('&#44;', '').replace('&#46;', '.').replace(' ', '').replace('$', '');

      let bal = parseFloat(clean(amtMatches[0][1]));

      accounts.push({
        name: 'What I Owe',
        balance: bal,
        status: 'Active'
      });

      return accounts;

    }

    getRegexMatrix(re: RegExp, input: string) : Array<any> { // apply regex to input, return a list of matches (each match is an array of groups)

      let matcher;
      let matrix = [];

      while(matcher = re.exec(input)) {
        matrix.push(matcher.slice(0));
      }

      return matrix;

    }

}
