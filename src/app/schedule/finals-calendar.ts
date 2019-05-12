import { AlertController } from '@ionic/angular';
import { FinalTime } from '../backend/ut-api';

export class FinalsCalendar {

  scheduleOffset = 0; // use row index to hide the top of calendar
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

  dayOfTheYear(date: Date) : number { // date -> day of year
    let dateUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    let startUTC = Date.UTC(date.getFullYear(), 0, 0);
    let daySize = 24 * 60 * 60 * 1000;
    return (dateUTC - startUTC) / daySize;
  }

  dateFromDay(dayNum: number) : Date { // day of year -> date
    let date = new Date(new Date().getFullYear(), 0);
    date.setDate(dayNum);
    return date;
  }

  dayOffset(date: Date, days: Array<any>) : number {
    return days.indexOf("" + this.dayOfTheYear(date))
  }

  generate() {

    // calculate the calendar offset to display only relevent time period
    let firstDate: Date = new Date(9e12);
    let lastDate: Date = new Date(0);
    let dayMap: { [key:number]:boolean; } = {};

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

      dayMap[this.dayOfTheYear(final.startDate)] = true;

    }
    this.scheduleOffset = minStartIndex - 1; // ignore header index

    let days: Array<any> = Object.keys(dayMap).sort((a: any, b: any) => a - b);

    for(let final of this.finals) {

      if(!final.exists) {
        continue;
      }

      let offset = this.dayOffset(final.startDate, days);
      final.dayIndex = offset + 1;

    }

    let calendarMatrix: Array<Array<any>> = [[
      null
    ]];

    let numDays = days.length;
    for(let i = 0; i < numDays; i++) {
      let date = this.dateFromDay(days[i] as number);
      let label = `${date.getMonth() + 1}/${date.getDate()}`
      calendarMatrix[0].push({
        label: label,
        class: 'day-header'
      });
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
    this.checkFinalsToday();

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

  async checkFinalsToday() {

    let now = new Date();
    let finalsToday = [];
    for(let final of this.finals) {
      if(!final.exists) {
        continue;
      }
      let date = final.startDate;
      if(date.getMonth() == now.getMonth() && date.getDate() == now.getDate()) {
        finalsToday.push(final);
      }
    }

    if(finalsToday.length == 1) {

      let alert = await this.altCtrl.create({
        header: 'Finals',
        subHeader: `Good luck on your ${finalsToday[0].title} Final today! 💯👍`,
        buttons: ['Dismiss']
      });
      await alert.present();

    } else if(finalsToday.length > 1){

      let alert = await this.altCtrl.create({
        header: 'Finals',
        subHeader: `Good luck on your ${finalsToday.length} finals today! 💯👍`,
        buttons: ['Dismiss']
      });
      await alert.present();

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
