import { Component } from '@angular/core';

import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { UTNav } from '../nav';

class Account {
    name: string;
    balance: number;
    status: string;
}

@Component({
  selector: 'page-money',
  templateUrl: 'money.html'
})
export class MoneyPage {

    accounts: Array<Account> = []; // current accounts

    constructor(private nav: UTNav,
                private storage: Storage,
                private altCtrl: AlertController) {

      storage.get('accounts').then((accounts) => { // check cache
        if(accounts && accounts.length > 0) {
          this.accounts = accounts;
        }
      });

    }

    fetchAccounts() : void { // get account balances

      this.nav.fetchTable("https://utdirect.utexas.edu/hfis/diningDollars.WBX", "<th>Balance  </th>").then(
        tableHTML => {

          try {
            this.accounts = this.parseAccountsTable(tableHTML as string);
            this.storage.set('accounts', this.accounts);
          } catch {
            this.altCtrl.create({
              title: 'Error',
              subTitle: 'Something is weird with your accounts...',
              buttons: ['Dismiss']
            }).present();
          }

        });

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

    getRegexMatrix(re: RegExp, input: string) : Array<any> { // apply regex to input, return a list of matches (each match is an array of groups)

      let matcher;
      let matrix = [];

      while(matcher = re.exec(input)) {
        matrix.push(matcher.slice(0));
      }

      return matrix;

    }

}
