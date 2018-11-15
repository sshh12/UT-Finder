import { Component, ApplicationRef, ViewChild } from '@angular/core';
import { Content } from 'ionic-angular';
import { Calendar } from '@ionic-native/calendar';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { UTNav } from '../nav';
import { ClassCalendar, ClassTime } from './class-calendar';
import { FinalsCalendar, FinalTime } from './finals-calendar';


@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html'
})
export class SchedulePage {

    currentCalendar: ClassCalendar;
    futureCalendar: ClassCalendar;
    finalsCalendar: FinalsCalendar;

    timeNowBarOffset: number = -100; // current time bar offset

    scheduleView: string = 'current';

    @ViewChild(Content) content: Content;

    constructor(private ref: ApplicationRef,
                private storage: Storage,
                private altCtrl: AlertController,
                private calendar: Calendar,
                private nav: UTNav) {

      this.currentCalendar = new ClassCalendar(altCtrl);
      this.futureCalendar = new ClassCalendar(altCtrl);
      this.finalsCalendar = new FinalsCalendar(altCtrl);

      storage.get('schedule:classes').then((classes) => { // check cache
        if(classes && classes.length > 0) {
          this.currentCalendar.classes = classes;
          this.currentCalendar.generate();
        }
      });

      storage.get('schedule:futureclasses').then((classes) => { // check cache
        if(classes && classes.length > 0) {
          this.futureCalendar.classes = classes;
          this.futureCalendar.generate();
        }
      });

      storage.get('schedule:finals').then((finals) => { // check cache
        if(finals && finals.length > 0) {
          this.finalsCalendar.finals = finals;
          this.finalsCalendar.generate();
        }
      });

      setInterval(() => {this.updateTimeBar()}, 500); // auto update time bar

    }

    updateTimeBar() : void {

      let dateNow = new Date();
      let time: number = dateNow.getHours() + dateNow.getMinutes() / 60;
      time = Math.max(Math.min(time, 23), 5); // force bar into range

      if(this.scheduleView == 'current') {
        this.timeNowBarOffset = this.currentCalendar.calculateTimeBarOffset(time);
      } else if(this.scheduleView == 'future') {
        this.timeNowBarOffset = this.futureCalendar.calculateTimeBarOffset(time);
      } else {
        this.timeNowBarOffset = this.finalsCalendar.calculateTimeBarOffset(time);
      }

      this.ref.tick();

    }

    convertToDate(timeString : string) : Date { // convert time to date

      let time = timeString.match( /(\d+):(\d+)(\wm)/ );

      let hour = parseInt(time[1]) + (time[3] == 'pm' ? 12:0);
      let mins = parseInt(time[2]);

      if(time[1] == "12") {
        hour = 12;
      }

      let date = new Date();
      date.setHours(hour);
      date.setMinutes(mins);

      return date;

    }

    fetchSchedule() : void { // get schedule

      let url, selector;

      if(this.scheduleView == 'current') {
        url = `https://utdirect.utexas.edu/registration/classlist.WBX`;
        selector = '<th>Course</th>';
      } else if(this.scheduleView == 'future') {
        let sem = '20192'; // TODO calulate this somehow
        url = `https://utdirect.utexas.edu/registration/classlist.WBX?sem=${sem}`;
        selector = '<th>Course</th>';
      } else {
        url = `https://utdirect.utexas.edu/registrar/exam_schedule.WBX`;
        selector = '<b>Course</b>';
      }

      this.nav.fetchTable(url, selector,
        tableHTML => {

          try {

            if(this.scheduleView == 'finals') {

              this.finalsCalendar.finals = this.parseFinalsTable(tableHTML as string);
              this.storage.set('schedule:finals', this.finalsCalendar.finals);
              this.finalsCalendar.generate();

            } else {

              let classes: Array<ClassTime> = this.parseScheduleTable(tableHTML as string);

              if(this.scheduleView == 'current') {
                this.currentCalendar.classes = classes
                this.currentCalendar.generate();
                this.storage.set('schedule:classes', classes);
              } else {
                this.futureCalendar.classes = classes;
                this.futureCalendar.generate();
                this.storage.set('schedule:futureclasses', classes);
              }

            }

            this.updateTimeBar();
            this.content.scrollTo(0, this.timeNowBarOffset - 250);

          } catch {

            this.altCtrl.create({
              title: 'Error',
              subTitle: 'Something is weird with your schedule...',
              buttons: ['Dismiss']
            }).present();

          }

        });

    }

    parseScheduleTable(tableHTML: string) : Array<ClassTime> { // Convert HTML to classes

      let classes: Array<ClassTime> = [];

      for(let rowMatch of this.getRegexMatrix(/tr\s*?valign=\"top\">([\s\S]+?)<\/tr/g, tableHTML)) {

        let colsMatch = this.getRegexMatrix(/td\s*?>([\s\S]+?)<\/td/g, rowMatch[1]);

        let num = parseInt(colsMatch[0][1]);
        let name = colsMatch[1][1];
        let title = colsMatch[2][1];

        let buildings = this.getRegexMatrix(/>\s*?(\w+)\s*?</g, colsMatch[3][1]);
        let rooms = this.getRegexMatrix(/\s*?([\d.]+)\s*?/g, colsMatch[4][1]);
        let days = this.getRegexMatrix(/\s*?([MWTHF]+)\s*?/g, colsMatch[5][1]);
        let times = this.getRegexMatrix(/\s*?(\d{1,}:\d{2}\wm-\s*\d{1,}:\d{2}\wm)\s*?/g, colsMatch[6][1]);

        for(let i = 0; i < times.length; i++) {

          let daysAry = days[i][1].replace('TH', 'H').split(''); // TH -> H, since all other days are 1 letter

          let building = (buildings.length != times.length) ? '*Check Online*' : buildings[i][1]; // Weirdness
          let room = (rooms.length != times.length) ? '*Check Online*' : rooms[i][1]; // Weirdness

          classes.push({
            num: num,
            name: name,
            title: title,
            building: building,
            room: room,
            days: daysAry,
            timeslot: times[i][1].replace(' ', '')
          });

        }

      }

      return classes;

    }

    parseFinalsTable(tableHTML: string) : Array<FinalTime> { // Convert HTML to finals

      function clean(str) {
        return str.replace(/(\r\n\t|\n|\r\t)/gm, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }

      let finals: Array<FinalTime> = [];

      for(let rowMatch of this.getRegexMatrix(/tr\s*?>([\s\S]+?)<\/tr/g, tableHTML)) {

        let colsMatch = this.getRegexMatrix(/td[\s"a-z0-9%=]*?>([\s\S]+?)<\/td/g, rowMatch[1]);

        if(colsMatch[0][1].includes('Unique Number')) {
          continue;
        }

        let num = parseInt(clean(colsMatch[0][1]));
        let name = clean(colsMatch[1][1]);
        let title = clean(colsMatch[2][1]);

        if(!title.includes('did not request')) {

          let dateTime = this.getRegexMatrix(/\s*?\w+, (\w+) (\d+), (\d+-\d+ \w+)\s*?/g, clean(colsMatch[3][1]));
          let location = this.getRegexMatrix(/\s*?(\w+ [\d.]+)\s*?/g, clean(colsMatch[4][1]));

          let [startDate, endDate] = this.getDates(dateTime[0][1], dateTime[0][2], dateTime[0][3]);

          finals.push({
            num: num,
            name: name,
            title: title,
            startDate: startDate,
            endDate: endDate,
            location: location[0][1],
            exists: true
          });

        } else {

          finals.push({
            num: num,
            name: name,
            title: title,
            startDate: null,
            endDate: null,
            location: '',
            exists: false
          });

        }

      }

      return finals;

    }

    getDates(month: string, day: string, times: string) : Array<Date> {

      let monthIdx = ['JAN', 'f', 'm', 'AUG', 'MAY', 'JUN', 'j', 'a', 's', 'o', 'NOV', 'DEC'].indexOf(month.substring(0, 3));
      let dateIdx = parseInt(day);

      let start = new Date();
      start.setMonth(monthIdx);
      start.setDate(dateIdx);
      start.setMinutes(0);
      start.setSeconds(0);
      let end = new Date(start);

      let [range, suffix] = times.split(' ');
      let [startHour, endHour] = range.split('-');

      if(suffix == 'PM') {
        start.setHours(parseInt(startHour) + 12);
        end.setHours(parseInt(endHour) + 12);
      } else {
        start.setHours(parseInt(startHour));
        end.setHours(parseInt(endHour));
      }

      return [start, end];

    }

    getRegexMatrix(re: RegExp, input: string) : Array<any> { // apply regex to input, return a list of matches (each match is an array of groups)

      let matcher;
      let matrix = [];

      while(matcher = re.exec(input)) {
        matrix.push(matcher.slice(0));
      }

      return matrix;

    }

    saveToCalendar(check: boolean = true) {

      if(check) {
        this.altCtrl.create({
          title: 'Calendar',
          message: 'Would you like to add your current classes to your local calendar?',
          buttons: [
            {
              text: 'Cancel'
            },
            {
              text: `Add ${this.currentCalendar.classes.length} Classes`,
              handler: data => {
                this.saveToCalendar(false);
              }
            }
          ]
        }).present();
        return;
      }

      this.calendar.hasWritePermission().then((perms) => {

        if(perms) {

          let opts = this.calendar.getCalendarOptions();
          opts.firstReminderMinutes = null;
          opts.secondReminderMinutes = null;
          opts.calendarName = 'Classes';
          opts.recurrence = 'weekly';

          let currentDay = new Date().getDay();

          for(let classtime of this.currentCalendar.classes) {

            let [start, end] = classtime.timeslot.split('-');
            let startDate = this.convertToDate(start);
            let endDate = this.convertToDate(end);

            let name = classtime.name;
            let place = `${classtime.building} ${classtime.room}`;
            let notes = `(#${classtime.num}) ${classtime.title}`;

            for(let day of classtime.days) {

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
            if(perm) {
              this.calendar.createCalendar('Classes');
              this.saveToCalendar(false);
            }
          });
        }
      })

    }

}
