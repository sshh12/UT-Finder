import { Component } from "@angular/core";
import { Router, RouterEvent } from "@angular/router";
import { UTAPI } from "../backend/ut-api";

@Component({
  selector: "menu",
  templateUrl: "menu.page.html",
  styleUrls: [],
})
export class MenuPage {
  selectedPath = "";

  constructor(private router: Router, public utapi: UTAPI) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event && event.url) {
        this.selectedPath = event.url;
      }
    });
  }

  openCalendar() {
    let sem = this.utapi.getSemesters()[0];
    this.utapi.openNewTab(
      "https://registrar.utexas.edu/calendars/" + sem.lsCode
    );
  }

  openGithub() {
    this.utapi.openNewTab("https://github.com/sshh12/UT-Finder");
  }
}
