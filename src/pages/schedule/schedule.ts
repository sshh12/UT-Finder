import { Component, ApplicationRef, ViewChild } from '@angular/core';
import { Content } from 'ionic-angular';
import { Calendar } from '@ionic-native/calendar';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

import { UTNav } from '../nav';

class ClassTime {
    num: number;
    name: string;
    title: string;
    building: string;
    room: string;
    days: Array<string>;
    timeslot: string;
}

class FinalTime {
    num: number;
    name: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    exists: boolean;
}

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html'
})
export class SchedulePage {

    weekMatrix: Array<Array<any>>; // Calender
    classes: Array<ClassTime> = []; // List of classes
    finals: Array<FinalTime> = []; // List of classes

    scheduleOffset: number = 0; // use row index to hide the top of calender
    timeNowBarOffset: number = -100; // current time bar offset

    @ViewChild(Content) content: Content;

    constructor(private ref: ApplicationRef,
                private storage: Storage,
                private altCtrl: AlertController,
                private calendar: Calendar,
                private nav: UTNav) {

      storage.get('classes').then((classes) => { // check cache
        if(classes && classes.length > 0) {
          this.classes = classes;
          this.createClassesCalender();
        }
      });

      setInterval(() => {this.updateTimeBar()}, 1000); // auto update time bar

    }

    updateTimeBar() : void {

      let dateNow = new Date();
      let time: number = dateNow.getHours() + dateNow.getMinutes() / 60;
      time = Math.max(Math.min(time, 23), 5); // force bar into range

      this.timeNowBarOffset = time * 120 - 528 - this.scheduleOffset * 60; // calc pixels to position
      this.ref.tick();

    }

    createFinalsCalender() : void { // Fill the matrix with stuff

      let calenderMatrix: Array<Array<any>> = [[
        null,
        {label:'M', class:'day-header'},
        {label:'T', class:'day-header'},
        {label:'W', class:'day-header'},
        {label:'TH', class:'day-header'},
        {label:'F', class:'day-header'}
      ]];

      // calculate the calender offset to display only relevent time period
      let minStartIndex = 999;
      for(let final of this.finals) {
        if(!final.exists) {
          continue;
        }
        minStartIndex = Math.min(minStartIndex, this.getFinalIndex(final));
      }
      if(minStartIndex % 2 == 0) { // should be odd #, so it starts on the hour
        minStartIndex -= 1;
      }
      this.scheduleOffset = minStartIndex - 1; // ignore header index

      for(let i = 5 + this.scheduleOffset / 2; i <= 22; i++) {

        let timeString;
        if(i > 12) {
          timeString = '' + (i - 12);
        } else {
          timeString = '' + i;
        }

        if(timeString.length < 2) {
          timeString = ' ' + timeString;
        }

        calenderMatrix.push([{label: timeString, class:'time-header'}, null, null, null, null, null]);
        calenderMatrix.push([{label: ' ', class:'time-header'}, null, null, null, null, null]);

      }

      this.addFinals(calenderMatrix);

      this.classes = []; // forget the prev screen

      this.weekMatrix = calenderMatrix;

      this.ref.tick(); // force refresh required

      this.updateTimeBar();
      this.content.scrollTo(0, this.timeNowBarOffset - 250);

    }

    createClassesCalender() : void { // Fill the matrix with stuff

      let calenderMatrix: Array<Array<any>> = [[
        null,
        {label:'M', class:'day-header'},
        {label:'T', class:'day-header'},
        {label:'W', class:'day-header'},
        {label:'TH', class:'day-header'},
        {label:'F', class:'day-header'}
      ]];

      // calculate the calender offset to display only relevent time period
      let minStartIndex = 999;
      for(let classtime of this.classes) {
        let start = classtime.timeslot.split('-')[0];
        minStartIndex = Math.min(minStartIndex, this.getIndex(start));
      }
      if(minStartIndex % 2 == 0) { // should be odd #, so it starts on the hour
        minStartIndex -= 1;
      }
      this.scheduleOffset = minStartIndex - 1; // ignore header index

      for(let i = 5 + this.scheduleOffset / 2; i <= 22; i++) {

        let timeString;
        if(i > 12) {
          timeString = '' + (i - 12);
        } else {
          timeString = '' + i;
        }

        if(timeString.length < 2) {
          timeString = ' ' + timeString;
        }

        calenderMatrix.push([{label: timeString, class:'time-header'}, null, null, null, null, null]);
        calenderMatrix.push([{label: ' ', class:'time-header'}, null, null, null, null, null]);

      }

      this.addClasses(calenderMatrix);

      this.weekMatrix = calenderMatrix;

      this.ref.tick(); // force refresh required

      this.updateTimeBar();
      this.content.scrollTo(0, this.timeNowBarOffset - 250);

    }

    addClasses(calenderMatrix) : void { // adds classes to matrix

      for(let classtime of this.classes) {

        let [start, end] = classtime.timeslot.split('-');
        let startIndex = this.getIndex(start) - this.scheduleOffset;
        let endIndex = this.getIndex(end) - this.scheduleOffset;

        let onClick = () => {
          let alert = this.altCtrl.create({
            title: classtime.name,
            subTitle: `(#${classtime.num}) ${classtime.title}`,
            message: `${classtime.building} ${classtime.room} @ ${classtime.timeslot}`,
            buttons: ['Dismiss']
          });
          alert.present();
        };

        for(let i = startIndex; i < endIndex; i++) {

          for(let day of classtime.days) {

            let dayIndex = ['M', 'T', 'W', 'H', 'F'].indexOf(day) + 1; // H = Thursday
            if(i == startIndex) {
              calenderMatrix[i][dayIndex] = {
                label: classtime.name,
                class:'class-slot start-slot',
                bg: this.getColor(classtime),
                click: onClick};
            } else {
              calenderMatrix[i][dayIndex] = {
                label: '\x00',
                class:'class-slot end-slot',
                bg: this.getColor(classtime),
                click: onClick};
            }

          }

        }

      }

    }

    addFinals(calenderMatrix) : void { // adds finals to matrix

      for(let final of this.finals) {

        if(!final.exists) {
          continue;
        }

        let startIndex = this.getFinalIndex(final) - this.scheduleOffset;
        let endIndex = this.getFinalIndex(final, false) - this.scheduleOffset;

        let onClick = () => {
          let alert = this.altCtrl.create({
            title: final.name,
            subTitle: `(#${final.num}) ${final.title}`,
            message: `${final.location}`,
            buttons: ['Dismiss']
          });
          alert.present();
        };

        let dayIndex: number = final.startDate.getDay();

        for(let i = startIndex; i < endIndex; i++) {

            if(i == startIndex) {
              calenderMatrix[i][dayIndex] = {
                label: final.name,
                class:'class-slot start-slot',
                bg: this.getColor(final),
                click: onClick};
            } else {
              calenderMatrix[i][dayIndex] = {
                label: '\x00',
                class:'class-slot end-slot',
                bg: this.getColor(final),
                click: onClick};
            }

        }

      }

    }

    getColor(event: ClassTime | FinalTime) : string { // Simple func to convert classname to unique color

      let prefix = event.name.substring(0, event.name.lastIndexOf(' '));
      let sum = 0;

      for(let i = 0; i < prefix.length; i++) {
        sum += prefix.charCodeAt(i);
      }

      let hue = Math.floor((sum % 30) / 30 * 360);

      return `hsl(${hue}, 50%, 85%)`

    }

    getIndex(timeString : string) : number { // convert time to row index in matrix

      let time = timeString.match( /(\d+):(\d+)(\wm)/ );

      let hour = parseInt(time[1]) + (time[3] == 'pm' ? 12:0);

      if(time[1] == "12") {
        hour = 12;
      }

      let index = 1 + (hour - 5) * 2 + (time[2] == '30' ? 1:0);

      return index;

    }

    getFinalIndex(final: FinalTime, start=true) : number { // convert time to row index in matrix

      let hour;
      if(start) {
        hour = final.startDate.getHours();
      } else {
        hour = final.endDate.getHours();
      }

      let index = 1 + (hour - 5) * 2;

      return index;

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

    updateSchedule() : void { // get schedule

      this.altCtrl.create({
        title: 'Schedule',
        message: 'What schedule would you like to view?',
        buttons: [
          {
            text: 'Future',
            handler: data => {
              this.fetchSchedule('20192');
            }
          },
          {
            text: 'Finals',
            handler: data => {
              this.fetchFinalsSchedule();
            }
          },
          {
            text: 'Current',
            handler: data => {
              this.fetchSchedule('');
            }
          }
        ]
      }).present();

    }

    fetchFinalsSchedule() : void { // get finals

      this.nav.fetchTable(`https://utdirect.utexas.edu/registrar/exam_schedule.WBX`, "<b>Course</b>").then(
        tableHTML => {

          try {
            this.finals = this.parseFinalsTable(tableHTML as string);
            this.createFinalsCalender();
          } catch {
            this.altCtrl.create({
              title: 'Error',
              subTitle: 'Something is weird with your schedule...',
              buttons: ['Dismiss']
            }).present();
          }

        });

    }

    fetchSchedule(sem: string) : void { // get schedule

      this.nav.fetchTable(`https://utdirect.utexas.edu/registration/classlist.WBX?sem=${sem}`, "<th>Course</th>").then(
        tableHTML => {

          try {
            this.classes = this.parseScheduleTable(tableHTML as string);
            this.storage.set('classes', this.classes);
            this.createClassesCalender();
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
          title: 'Calender',
          message: 'Would you like to add your classes to your local calender?',
          buttons: [
            {
              text: 'Cancel'
            },
            {
              text: `Add ${this.classes.length} Classes`,
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

          for(let classtime of this.classes) {

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
