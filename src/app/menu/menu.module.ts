import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { MenuPage } from "./menu.page";

const routes: Routes = [
  {
    path: "",
    component: MenuPage,
    children: [
      {
        path: "main",
        loadChildren: "../tabs/tabs.module#TabsPageModule",
      },
      {
        path: "safety",
        loadChildren: "../safety/safety.module#SafetyPageModule",
      },
      {
        path: "courses",
        loadChildren: "../courses/courses.module#CoursesPageModule",
      },
      {
        path: "voting",
        loadChildren: "../voting/voting.module#VotingPageModule",
      },
      {
        path: "sports",
        loadChildren: "../sports/sports.module#SportsPageModule",
      },
      {
        path: "links",
        loadChildren: "../resources/resources.module#ResourcesPageModule",
      },
      {
        path: "covid",
        loadChildren: "../covid/covid.module#CovidPageModule",
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
  ],
  declarations: [MenuPage],
})
export class MenuPageModule {}
