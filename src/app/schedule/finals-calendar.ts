import { AlertController } from '@ionic/angular';

export class FinalTime {
    num: number;
    name: string;
    title: string;
    startDate: Date;
    endDate: Date;
    location: string;
    exists: boolean;
    dayIndex?: number;
}

export class FinalsCalendar {

  scheduleOffset: number = 0; // use row index to hide the top of calendar
  finals: Array<FinalTime> = [];
  weekMatrix: Array<Array<any>> = [[]]; // calendar

  constructor(private altCtrl: AlertController) {

  }

  calculateTimeBarOffset(time: number) {
    if(this.finals.length == 0) {
      return -100;
    }
    return time * 60 - 228 - this.scheduleOffset * 60;
  }

  dayOffset(start: Date, end: Date) {

    console.log(start, end);

    let startTemp = new Date(start);
    startTemp.setHours(10);
    startTemp.setMinutes(0);

    let endTemp = new Date(end);
    endTemp.setHours(10);
    endTemp.setMinutes(0);

    let diff = endTemp.getTime() - startTemp.getTime();
    let numDays = Math.round(diff / (1000 * 60 * 60 * 24));
    let nonWeekendDays = numDays;

    // remove weekends
    let iterDate = new Date(startTemp);
    for(let i = 0; i < numDays; i++) {
      if(iterDate.getDay() == 0 || iterDate.getDay() == 6) {
        nonWeekendDays--;
      }
      iterDate.setTime(iterDate.getTime() + 1000 * 60 * 60 * 24);
    }

    return nonWeekendDays;

  }

  generate() {

    // calculate the calendar offset to display only relevent time period
    let firstDate = new Date(9e12);
    let lastDate = new Date(0);

    let minStartIndex = 999;
    for(let final of this.finals) {

      if(!final.exists) {
        continue;
      }
      minStartIndex = Math.min(minStartIndex, this.getFinalIndex(final));

      if(final.startDate.getTime() < firstDate.getTime()) {
        firstDate = final.startDate;
      }
      if(final.endDate.getTime() > lastDate.getTime()) {
        lastDate = final.endDate;
      }

    }
    this.scheduleOffset = minStartIndex - 1; // ignore header index

    for(let final of this.finals) {

      if(!final.exists) {
        continue;
      }

      let offset = this.dayOffset(firstDate, final.startDate);
      final.dayIndex = offset + 1;

    }

    let calendarMatrix: Array<Array<any>> = [[
      null
    ]];

    let numDays = this.dayOffset(firstDate, lastDate) + 1;
    let date = new Date(firstDate.getTime());
    for(let i = 0; i < numDays; i++) {
      let label = `${date.getMonth() + 1}/${date.getDate()}`
      calendarMatrix[0].push({
        label: label,
        class: 'day-header'
      });
      date.setTime(date.getTime() + 1000 * 60 * 60 * 24);
      while(date.getDay() == 0 || date.getDay() == 6) {
        date.setTime(date.getTime() + 1000 * 60 * 60 * 24);
      }
    }

    for(let i = 5 + this.scheduleOffset; i <= 22; i++) {

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

    let index = 1 + (hour - 5);

    return index;

  }

  addFinals(calendarMatrix) : void { // adds finals to matrix

    for(let final of this.finals) {

      if(!final.exists) {
        continue;
      }

      let startIndex = this.getFinalIndex(final) - this.scheduleOffset;
      let endIndex = this.getFinalIndex(final, false) - this.scheduleOffset;

      let onClick = async () => {
        let alert = await this.altCtrl.create({
          header: final.name,
          subHeader: `(#${final.num}) ${final.title}`,
          message: `@ ${final.location}, ${final.startDate.toLocaleString()} to ${final.endDate.toLocaleString()}`,
          buttons: ['Dismiss']
        });
        await alert.present();
      };

      let dayIndex: number = final.dayIndex;

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
