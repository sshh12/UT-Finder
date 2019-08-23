import { Injectable } from '@angular/core';
import { HTTP } from '@ionic-native/http/ngx';

@Injectable()
export class VotingAPI {

  constructor(private http: HTTP) {
  }

  async fetchNameRegistration(first: string, last: string, bday: string) {

  }

  async fetchVUIDRegistration() {

  }

}
