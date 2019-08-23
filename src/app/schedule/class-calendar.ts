import { AlertController } from '@ionic/angular';
import { ClassTime } from '../backend/ut-api';
import { Router  } from '@angular/router';

export class ClassCalendar {

  scheduleOffset = 0; // use row index to hide the top of calendar
  classes: Array<ClassTime> = [];
  weekMatrix: Array<Array<any>> = [[]]; // calendar

  constructor(private altCtrl: AlertController,
              private router: Router) {
  }

  calculateTimeBarOffset(time: number) {
    if (this.classes.length === 0) {
      return -100;
    }
    return time * 120 - 528 - this.scheduleOffset * 60;
  }

  generate() {

    let calendarMatrix: Array<Array<any>> = [[
      null,
      {label: 'M', class: 'day-header'},
      {label: 'T', class: 'day-header'},
      {label: 'W', class: 'day-header'},
      {label: 'TH', class: 'day-header'},
      {label: 'F', class: 'day-header'}
    ]];

    // calculate the calendar offset to display only relevent time period
    let minStartIndex = 999;
    for (let classtime of this.classes) {
      let start = classtime.timeslot.split('-')[0];
      minStartIndex = Math.min(minStartIndex, this.getIndex(start));
    }
    if (minStartIndex % 2 === 0) { // should be odd #, so it starts on the hour
      minStartIndex -= 1;
    }
    this.scheduleOffset = minStartIndex - 1; // ignore header index

    for (let i = 5 + this.scheduleOffset / 2; i <= 22; i++) {

      let timeString;
      if (i > 12) {
        timeString = '' + (i - 12);
      } else {
        timeString = '' + i;
      }

      if (timeString.length < 2) {
        timeString = ' ' + timeString;
      }

      calendarMatrix.push([{label: timeString, class: 'time-header'}, null, null, null, null, null]);
      calendarMatrix.push([{label: ' ', class: 'time-header'}, null, null, null, null, null]);

    }

    this.addClasses(calendarMatrix);

    this.weekMatrix = calendarMatrix;

  }

  getIndex(timeString: string): number {
    // convert time to row index in matrix
    let time = timeString.match( /(\d+):(\d+)(\wm)/ );

    let hour = parseInt(time[1], 10) + (time[3] === 'pm' ? 12 : 0);

    if (time[1] === '12') {
      hour = 12;
    }

    let index = 1 + (hour - 5) * 2 + (time[2] === '30' ? 1 : 0);

    return index;

  }

  addClasses(calendarMatrix) {
    // adds classes to matrix
    for (let classtime of this.classes) {

      let [start, end] = classtime.timeslot.split('-');
      let startIndex = this.getIndex(start) - this.scheduleOffset;
      let endIndex = this.getIndex(end) - this.scheduleOffset;

      let onClick = async () => {
        let alert = await this.altCtrl.create({
          header: classtime.name,
          subHeader: `${classtime.title} (#${classtime.num})`,
          message: `${classtime.building} ${classtime.room} @ ${classtime.timeslot}`,
          buttons: [
            {
              text: 'Close'
            },
            {
              text: 'See on Map',
              handler: () => {
                this.router.navigateByUrl('/menu/main/tabs/map?search=' + classtime.building);
              }
            }
          ]
        });
        await alert.present();
      };

      for (let i = startIndex; i < endIndex; i++) {

        for (let day of classtime.days) {

          let dayIndex = ['M', 'T', 'W', 'H', 'F'].indexOf(day) + 1; // H = Thursday
          if (i === startIndex) {
            calendarMatrix[i][dayIndex] = {
              label: classtime.name,
              class: 'class-slot start-slot',
              bg: this.getColor(classtime),
              click: onClick};
          } else {
            calendarMatrix[i][dayIndex] = {
              label: '\x00',
              class: 'class-slot end-slot',
              bg: this.getColor(classtime),
              click: onClick};
          }

        }

      }

    }

  }

  getColor(event: ClassTime): string {
    // Simple func to convert classname to unique color
    let prefix = event.name.substring(0, event.name.lastIndexOf(' '));
    let sum = 0;

    for (let i = 0; i < prefix.length; i++) {
      sum += prefix.charCodeAt(i);
    }

    let hue = Math.floor((sum % 30) / 30 * 360);

    return `hsl(${hue}, 50%, 85%)`;

  }

}
