import { Component } from '@angular/core';

import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { LocalNotifications } from '@ionic-native/local-notifications/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private notif: LocalNotifications,
    private storage: Storage
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.updateLocalNotifs();
      setInterval(() => this.updateLocalNotifs(), 30 * 1000);
    });
  }

  async updateLocalNotifs() {
    let resp = await fetch('https://utfinder.sshh.io/api/notifications');
    let data = await resp.json();
    let now = Date.now();
    await Promise.all(data.map(async ({hash, time, title, text}) => {
      let scheduled = await this.storage.get('notif:' + hash);
      if(!scheduled && time >= now) {
        await this.storage.set('notif:' + hash, true);
        this.notif.schedule({
          trigger: {at: time},
          text: text,
          title: title,
          led: 'BF5800',
          data: { hash: hash }
        });
      }
    }));
  }
}
