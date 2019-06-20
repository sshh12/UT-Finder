import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { UTAPI, Course } from '../backend/ut-api';
import { Router, ActivatedRoute  } from '@angular/router';

@Component({
  selector: 'page-canvas',
  templateUrl: 'canvas.page.html',
  styleUrls: ['canvas.page.scss']
})
export class CanvasPage {

    courses: Course[] = [];

    loading = false;
    outdated = true;

    constructor(private utapi: UTAPI,
                private storage: Storage,
                private router: Router) {

      storage.get('canvas:courses').then((courses) => {
        if (courses && courses.length > 0) {
          this.courses = courses;
        }
      });

    }

    async updateGrades() {

      this.loading = true;

      this.courses = await this.utapi.fetchCourses();
      this.storage.set('canvas:courses', this.courses);
      this.outdated = false;

      this.loading = false;

    }

    async showAssignments(course: Course) {
      if (course.assignments.length === 0) {
        this.loading = true;
        course.assignments = await this.utapi.fetchAssignments(course);
        await this.storage.set('canvas:courses', this.courses);
        this.loading = false;
      }
      this.router.navigateByUrl('/tabs/canvas/assignments?course=' + course.canvasID);
    }

    getIcon(course: Course) {
      return getCourseIcon(course);
    }

}

@Component({
  templateUrl: 'assignments.page.html',
  styleUrls: ['canvas.page.scss']
})
export class AssignmentsPage {

  course: Course;

  showDecimalScores = false;

  constructor(private aroute: ActivatedRoute, private storage: Storage) {
    this.aroute.queryParams.subscribe(async (params) => {
      let canvasID = parseInt(params.course, 10);
      for (let course of await this.storage.get('canvas:courses')) {
        if (course.canvasID === canvasID) {
          this.course = course;
          break;
        }
      }
    });
  }

  toggleScoreFormat() {
    this.showDecimalScores = !this.showDecimalScores;
  }

}

// Map class subjects to font-awesome icons
let ICONS = {
  'ast': 'meteor',
  'c s': 'laptop-code',
  'gov': 'landmark',
  'his': 'scroll',
  'm': 'calculator',
  'mis': 'wifi',
  'mus': 'music',
  'ped': 'dumbbell',
  'ugs': 'school'
}

function getCourseIcon(course) {
  let subject = course.code.match(/([A-Z ]+) \d+\w*/)[1].toLowerCase();
  if(subject in ICONS) {
    return ICONS[subject];
  }
  return "chalkboard-teacher";
}