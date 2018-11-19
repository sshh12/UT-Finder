import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';

import { UTLogin } from '../utlogin';

class Course {
  canvasID: number;
  name: string;
  title: string;
  grade?: number;
  assignments?: Array<Assignment>;
}

class Assignment {
  canvasID: number;
  name: string;
  grade: number;
}

@Component({
  selector: 'page-canvas',
  templateUrl: 'canvas.page.html',
  styleUrls: ['canvas.page.scss']
})
export class CanvasPage {

    courses: Array<Course> = [];
    userID: number;
    accountID: number;

    constructor(private utauth: UTLogin, private storage: Storage) {

      storage.get('canvas:courses').then((courses) => { // check cache
        if(courses && courses.length > 0) {
          this.courses = courses;
        }
      });

    }

    async fetchGrades() {

      let canvasCourses = await this.utauth.getCanvas('courses');
      let courses: Array<Course> = [];

      // get all courses

      for(let course of canvasCourses) {

        // ensure active course
        if(course.enrollments[0].enrollment_state != 'active') {
          continue;
        }

        // people prob only want to see real courses
        if(course.name.includes('University Housing')) {
          continue;
        }

        this.accountID = course.account_id;
        this.userID = course.enrollments[0].user_id;

        courses.push({
          canvasID: course.id,
          name: course.name,
          title: course.name.replace(/\w\w\d\d -/, '').replace(/\s+\(\d+\)\s*/, '').trim()
        });

      }

      // look up enrollments

      let canvasEnrollments = await this.utauth.getCanvas(`users/${this.userID}/enrollments`);

      for(let enroll of canvasEnrollments) {

        // find course attached to enrollment
        let course: Course = null;
        for(let c of courses) {
          if(c.canvasID == enroll.course_id) {
            course = c;
            break;
          }
        }
        if(course == null) {
          continue;
        }

        if(enroll.grades.current_score) {
          course.grade = enroll.grades.current_score;
        } else {
          course.grade = 0;
        }

        // locate assignments
        let canvasAssignments = await this.utauth.getCanvas(`courses/${course.canvasID}/assignments`);
        let assigns: Array<Assignment> = [];

        /*for(let assignment of canvasAssignments) {

          // download assignment grades
          let assignGrades = await this.utauth.getCanvas(`courses/${course.canvasID}/assignments/${assignment.id}/submissions/${this.userID}`);
          let grade = assignGrades.score;

          assigns.push({
            canvasID: assignment.id,
            name: assignment.name,
            grade: grade
          });

        }*/

        course.assignments = assigns;

      }

      this.courses = courses;
      this.storage.set('canvas:courses', courses);

    }

    getRegexMatrix(re: RegExp, input: string) : Array<any> { // apply regex to input, return a list of matches (each match is an array of groups)

      let matcher;
      let matrix = [];

      while(matcher = re.exec(input)) {
        matrix.push(matcher.slice(0));
      }

      return matrix;

    }

}
