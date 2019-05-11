import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'schedule',
        children: [{
          path: '',
          loadChildren: '../schedule/schedule.module#SchedulePageModule'
        }]
      },
      {
        path: 'map',
        children: [{
          path: '',
          loadChildren: '../map/map.module#MapPageModule'
        }]
      },
      {
        path: 'money',
        children: [{
          path: '',
          loadChildren: '../money/money.module#MoneyPageModule'
        }]
      },
      {
        path: 'canvas',
        children: [{
          path: '',
          loadChildren: '../canvas/canvas.module#CanvasPageModule'
        }]
      },
      {
        path: 'resources',
        children: [{
          path: '',
          loadChildren: '../resources/resources.module#ResourcesPageModule'
        }]
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/schedule',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
