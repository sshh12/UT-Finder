import { Component } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { UTAPI } from '../backend/ut-api';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'page-courses',
  templateUrl: 'courses.page.html',
  styleUrls: ['courses.page.scss']
})
export class CoursesPage {

  registration = null;
  waitlist = [];

  constructor(private iab: InAppBrowser,
      private utapi: UTAPI,
      private alertCtrl: AlertController) {
    (async () => {
      this.registration = await this.utapi.fetchRIS();
      this.waitlist = await this.utapi.fetchWaitLists();
    })();
  }

  async openCourseSearch() {
    let sems = this.utapi.getSemesters();
    this.openLink(`https://utdirect.utexas.edu/apps/registrar/course_schedule/${sems[1].code}/`);
  }

  openLink(url) {
    this.iab.create(url, '_blank', { location: 'no' });
  }

}
