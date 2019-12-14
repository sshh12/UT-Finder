import { Component, ApplicationRef } from '@angular/core';
import { Calendar } from '@ionic-native/calendar/ngx';
import { AlertController, ToastController  } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { Router  } from '@angular/router';

import { UTAPI } from '../backend/ut-api';
import { ClassCalendar } from './class-calendar';
import { FinalsCalendar } from './finals-calendar';

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.page.html',
  styleUrls: ['schedule.page.scss']
})
export class SchedulePage {

    currentCalendar: ClassCalendar;
    futureCalendar: ClassCalendar;
    finalsCalendar: FinalsCalendar;

    timeNowBarOffset = -100; // current time bar offset

    scheduleView = 'current';
    loading = false;

    constructor(private ref: ApplicationRef,
                private storage: Storage,
                private altCtrl: AlertController,
                private toastCtrl: ToastController,
                private calendar: Calendar,
                private utapi: UTAPI,
                private router: Router) {

      this.currentCalendar = new ClassCalendar(altCtrl, router);
      this.futureCalendar = new ClassCalendar(altCtrl, router);
      this.finalsCalendar = new FinalsCalendar(altCtrl);

      storage.get('schedule:classes').then((classes) => {
        if (classes && classes.length > 0) {
          this.currentCalendar.classes = classes;
          this.currentCalendar.generate();
        }
      });

      storage.get('schedule:futureclasses').then((classes) => {
        if (classes && classes.length > 0) {
          this.futureCalendar.classes = classes;
          this.futureCalendar.generate();
        }
      });

      storage.get('schedule:finals').then((finals) => {
        if (finals && finals.length > 0) {
          this.finalsCalendar.finals = finals;
          this.finalsCalendar.generate();
        }
      });

      setInterval(() => { this.updateTimeBar(); }, 500);

    }

    updateTimeBar() {

      let dateNow = new Date();
      let time: number = dateNow.getHours() + dateNow.getMinutes() / 60;
      time = Math.max(Math.min(time, 23), 5);  // Force bar into range

      if (this.scheduleView === 'current') {
        this.timeNowBarOffset = this.currentCalendar.calculateTimeBarOffset(time);
      } else if (this.scheduleView === 'future') {
        this.timeNowBarOffset = this.futureCalendar.calculateTimeBarOffset(time);
      } else {
        this.timeNowBarOffset = this.finalsCalendar.calculateTimeBarOffset(time);
      }

      this.ref.tick();  // Force update

    }

    convertToDate(timeString: string): Date {

      let time = timeString.match( /(\d+):(\d+)(\wm)/ );

      let hour = parseInt(time[1], 10) + (time[3] === 'pm' ? 12 : 0);
      let mins = parseInt(time[2], 10);

      if (time[1] === '12') {
        hour = 12;
      }

      let date = new Date();
      date.setHours(hour);
      date.setMinutes(mins);

      return date;

    }

    async updateSchedule() {

      this.loading = true;

      try {

        let noItemsFound = false;

        if (this.scheduleView === 'finals') {
          let finals = await this.utapi.fetchFinals();
          this.finalsCalendar.finals = finals;
          this.finalsCalendar.generate();
          this.storage.set('schedule:finals', finals);
          noItemsFound = (finals.length == 0);
        } else if (this.scheduleView === 'current') {
          let classes = await this.utapi.fetchSchedule();
          this.currentCalendar.classes = classes;
          this.currentCalendar.generate();
          this.storage.set('schedule:classes', classes);
          noItemsFound = (classes.length == 0);
        } else {
          let sems = this.utapi.getSemesters().map(sim => sim.code);
          let classes = await this.utapi.fetchSchedule(sems[1]);
          if (classes.length === 0) {
            classes = await this.utapi.fetchSchedule(sems[2]);
          }
          this.futureCalendar.classes = classes;
          this.futureCalendar.generate();
          this.storage.set('schedule:futureclasses', classes);
          noItemsFound = (classes.length == 0);
        }

        this.updateTimeBar();

        if(noItemsFound) {
          let toast = await this.toastCtrl.create({
            message: 'Looks like you don\'t have any scheduled 🤷',
            duration: 3000,
            position: 'top'
          });
          await toast.present();
        } else {
          let toast = await this.toastCtrl.create({
            message: 'Please check this with the offical website 👌',
            duration: 3000,
            position: 'top'
          });
          await toast.present();
        }

      } catch {

        let alert = await this.altCtrl.create({
          header: 'Error',
          subHeader: 'Something is weird with your schedule 😔',
          buttons: ['Dismiss']
        });
        await alert.present();

      }

      this.loading = false;

    }

    async saveToCalendar(check: boolean = true) {

      if (check) {
        let alert = await this.altCtrl.create({
          header: 'Calendar',
          message: 'Would you like to add your current classes to your local calendar?',
          buttons: [
            {
              text: 'Cancel'
            },
            {
              text: `Add ${this.currentCalendar.classes.length} Classes`,
              handler: () => {
                this.saveToCalendar(false);
              }
            }
          ]
        });
        await alert.present();
        return;
      }

      this.calendar.hasWritePermission().then((perms) => {

        if (perms) {

          let opts = this.calendar.getCalendarOptions();
          opts.firstReminderMinutes = null;
          opts.secondReminderMinutes = null;
          opts.calendarName = 'Classes';
          opts.recurrence = 'weekly';

          let currentDay = new Date().getDay();

          for (let classtime of this.currentCalendar.classes) {

            let [start, end] = classtime.timeslot.split('-');
            let startDate = this.convertToDate(start);
            let endDate = this.convertToDate(end);

            let name = classtime.name;
            let place = `${classtime.building} ${classtime.room}`;
            let notes = `${classtime.title} (#${classtime.num})`;

            for (let day of classtime.days) {

              let weekday = ['-', 'M', 'T', 'W', 'H', 'F', '-'].indexOf(day);

              let actualStart = new Date(startDate);
              let actualEnd = new Date(endDate);
              actualStart.setDate(actualStart.getDate() + weekday - currentDay);
              actualEnd.setDate(actualEnd.getDate() + weekday - currentDay);

              this.calendar.createEventWithOptions(name, place, notes, actualStart, actualEnd, opts);

            }

          }

          this.calendar.openCalendar(new Date());

        } else {
          this.calendar.requestWritePermission().then((perm) => {
            if (perm) {
              this.calendar.createCalendar('Classes');
              this.saveToCalendar(true);
            }
          });
        }
      });

    }

    async showClassRoute() {
      let classes = await this.utapi.fetchSchedule();
      this.router.navigateByUrl('/menu/main/tabs/map?classes=' + JSON.stringify(classes));
    }

}
