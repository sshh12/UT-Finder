import { Component } from '@angular/core';

import { SchedulePage } from '../schedule/schedule';
import { MapPage } from '../map/map';
import { MoneyPage } from '../money/money';
import { ResourcesPage } from '../resources/resources';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = SchedulePage;
  tab2Root = MapPage;
  tab3Root = MoneyPage;
  tab4Root = ResourcesPage;

  constructor() {
    //
  }

}
