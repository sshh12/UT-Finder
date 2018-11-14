import { AlertController } from 'ionic-angular';

export class FinalTime {
    num: number;
    name: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    exists: boolean;
}

export class FinalsCalendar {

  scheduleOffset: number = 0; // use row index to hide the top of calendar
  finals: Array<FinalTime> = [];
  weekMatrix: Array<Array<any>> = [[]]; // calendar

  constructor(private altCtrl: AlertController) {

  }

  calculateTimeBarOffset(time: number) {
    return time * 120 - 528 - this.scheduleOffset * 60;
  }

  generate() {

    let calendarMatrix: Array<Array<any>> = [[
      null,
      {label:'M', class:'day-header'},
      {label:'T', class:'day-header'},
      {label:'W', class:'day-header'},
      {label:'TH', class:'day-header'},
      {label:'F', class:'day-header'}
    ]];

    // calculate the calendar offset to display only relevent time period
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

      calendarMatrix.push([{label: timeString, class:'time-header'}, null, null, null, null, null]);
      calendarMatrix.push([{label: ' ', class:'time-header'}, null, null, null, null, null]);

    }

    this.addFinals(calendarMatrix);

    this.weekMatrix = calendarMatrix;

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

  addFinals(calendarMatrix) : void { // adds finals to matrix

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
            calendarMatrix[i][dayIndex] = {
              label: final.name,
              class:'class-slot start-slot',
              bg: this.getColor(final),
              click: onClick};
          } else {
            calendarMatrix[i][dayIndex] = {
              label: '\x00',
              class:'class-slot end-slot',
              bg: this.getColor(final),
              click: onClick};
          }

      }

    }

  }

  getColor(event: FinalTime) : string { // Simple func to convert classname to unique color

    let prefix = event.name.substring(0, event.name.lastIndexOf(' '));
    let sum = 0;

    for(let i = 0; i < prefix.length; i++) {
      sum += prefix.charCodeAt(i);
    }

    let hue = Math.floor((sum % 30) / 30 * 360);

    return `hsl(${hue}, 50%, 85%)`

  }

}
