import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable()
export class VotingAPI {

  constructor(private http: HTTP) {
  }

  async getVotingResults(data: any) {
    let req = await this.http.post('https://teamrv-mvp.sos.texas.gov/MVP/voterDetails.do',
      Object.assign({}, {
        selType: '',
        firstName: '',
        lastName: '',
        nmSuffix: '',
        county: '227',
        dob: '',
        adZip5: '78705',
        idVoter: '',
        vuidDob: '',
        idTdl: '',
        tdlDob: '',
        popupClicker: '',
        popupClicker2: '',
        popupClicker3: '',
        language: '',
        countyName: '',
        currentSearch: ''
      }, data), {});
    let regex = /<span[^>]*>([\w ]+): ([^<]+)</g;
    let matcher;
    let result: any = {};
    while (matcher = regex.exec(req.data)) {
      result[matcher[1]] = matcher[2];
    }
    if(!result.Name || !result.VUID) {
      return null;
    }
    return result;
  }

  async fetchNameRegistration(first: string, last: string, bday: string) {
    let data = {
      selType: 'lfcd',
      firstName: first,
      lastName: last,
      dob: bday
    }
    return await this.getVotingResults(data);
  }

}
