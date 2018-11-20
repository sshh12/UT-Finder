import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasPage, AssignmentsPage } from './canvas.page';
import { AssignmentsPageModule } from './assignments.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    AssignmentsPageModule,
    RouterModule.forChild([
      { path: '', component: CanvasPage },
      { path: 'assignments', component: AssignmentsPage }
    ])
  ],
  declarations: [CanvasPage]
})
export class CanvasPageModule {}
