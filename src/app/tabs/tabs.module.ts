import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './tabs.router.module';

import { TabsPage } from './tabs.page';
import { SchedulePageModule } from '../schedule/schedule.module';
import { MapPageModule } from '../map/map.module';
import { MoneyPageModule } from '../money/money.module';
import { ResourcesPageModule } from '../resources/resources.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule,
    SchedulePageModule,
    MapPageModule,
    MoneyPageModule,
    ResourcesPageModule
  ],
  declarations: [TabsPage]
})
export class TabsPageModule {}
