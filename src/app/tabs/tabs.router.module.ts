import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';
import { SchedulePage } from '../schedule/schedule.page';
import { MapPage } from '../map/map.page';
import { MoneyPage } from '../money/money.page';
import { CanvasPage, AssignmentsPage } from '../canvas/canvas.page';
import { ResourcesPage } from '../resources/resources.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        redirectTo: '/tabs/(schedule:schedule)',
        pathMatch: 'full',
      },
      {
        path: 'schedule',
        outlet: 'schedule',
        component: SchedulePage
      },
      {
        path: 'map',
        outlet: 'map',
        component: MapPage
      },
      {
        path: 'money',
        outlet: 'money',
        component: MoneyPage
      },
      {
        path: 'canvas',
        outlet: 'canvas',
        component: CanvasPage
      },
      {
        path: 'resources',
        outlet: 'resources',
        component: ResourcesPage
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/(schedule:schedule)',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
