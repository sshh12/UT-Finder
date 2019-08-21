import { IonicModule } from '@ionic/angular';
import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'schedule',
        loadChildren: '../schedule/schedule.module#SchedulePageModule'
      },
      {
        path: 'map',
        loadChildren: '../map/map.module#MapPageModule'
      },
      {
        path: 'money',
        loadChildren: '../money/money.module#MoneyPageModule'
      },
      {
        path: 'canvas',
        children: [{
          path: '',
          loadChildren: '../canvas/canvas.module#CanvasPageModule'
        }, {
          path: 'assignments',
          loadChildren: '../canvas/assignments.module#AssignmentsPageModule'
        }]
      }
    ]
  },
  {
    path: '',
    redirectTo: 'tabs/schedule',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}
