import { Component } from '@angular/core';

import { SchedulePage } from '../schedule/schedule';
import { MapPage } from '../map/map';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = SchedulePage;
  tab2Root = MapPage;

  constructor() {

  }
}
