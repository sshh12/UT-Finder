import { Component, ApplicationRef } from '@angular/core';

import { InAppBrowser } from '@ionic-native/in-app-browser';
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

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html'
})
export class SchedulePage {

    weekMatrix: Array<Array<any>>; // Calender
    classes: Array<ClassTime> = []; // List of classes

    timeNowBarOffset: number = -100; // current time bar offset

    constructor(private ref: ApplicationRef,
                private storage: Storage,
                private altCtrl: AlertController,
                private nav: UTNav) {

      storage.get('classes').then((classes) => { // check cache
        if(classes && classes.length > 0) {
          this.classes = classes;
          this.createCalender();
        }
      });

      setInterval(() => { // auto update time bar

        let dateNow = new Date();
        let time = dateNow.getHours() + dateNow.getMinutes() / 60;
        time = Math.max(Math.min(time, 21), 8); // ensure bar is within window

        this.timeNowBarOffset = time * 120 - 888; // calc pixels to position

      }, 5000);

    }

    createCalender() : void { // Fill the matrix with stuff

      let calenderMatrix = [
        [null, {label:'M'}, {label:'T'}, {label:'W'}, {label:'TH'}, {label:'F'}]
      ];

      for(let i = 8; i <= 20; i++) {

        let timeString;
        if(i > 12) {
          timeString = '' + (i - 12);
        } else {
          timeString = '' + i;
        }

        if(timeString.length < 2) {
          timeString = ' ' + timeString;
        }

        calenderMatrix.push([{label: timeString}, null, null, null, null, null]);
        calenderMatrix.push([{label: ' '}, null, null, null, null, null]);

      }

      this.addClasses(calenderMatrix);

      this.weekMatrix = calenderMatrix;

      this.ref.tick(); // force refresh required

    }

    addClasses(calenderMatrix) : void { // adds classes to matrix

      for(let classtime of this.classes) {

        let [start, end] = classtime.timeslot.split('-');
        let startIndex = this.getIndex(start);
        let endIndex = this.getIndex(end);

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

    getColor(classtime) : string { // Simple func to convert classname to unique color

      let prefix = classtime.name.substring(0, classtime.name.lastIndexOf(' '));
      let sum = 0;

      for(let i = 0; i < prefix.length; i++) {
        sum += prefix.charCodeAt(i);
      }

      let hue = Math.floor((sum % 30) / 30 * 360);

      return `hsl(${hue}, 50%, 80%)`

    }

    getIndex(timeString : string) : number { // convert time to row index in matrix

      let time = timeString.match( /(\d+):(\d+)(\wm)/ );

      let hour = parseInt(time[1]) + (time[3] == 'pm' ? 12:0);

      if(time[1] == "12") {
        hour = 12;
      }

      let index = 1 + (hour - 8) * 2 + (time[2] == '30' ? 1:0);

      return index;

    }

    fetchSchedule() : void { // get schedule

      this.nav.fetchTable("https://utdirect.utexas.edu/registration/classlist.WBX", "<th>Course</th>",
        tableHTML => {

          try {
            this.classes = this.parseScheduleTable(tableHTML);
            this.storage.set('classes', this.classes);
            this.createCalender();
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

    getRegexMatrix(re: RegExp, input: string) : Array<any> { // apply regex to input, return a list of matches (each match is an array of groups)

      let matcher;
      let matrix = [];

      while(matcher = re.exec(input)) {
        matrix.push(matcher.slice(0));
      }

      return matrix;

    }

}
