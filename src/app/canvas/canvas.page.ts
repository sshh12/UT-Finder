import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';

import { UTLogin } from '../utlogin';
import { Router, ActivatedRoute } from '@angular/router';

class Course {
  canvasID: number;
  name: string;
  title: string;
  grade?: number;
  assignments?: Array<Assignment>;
}

class Assignment {
  title: string;
  gradetype: string;
  score: string;
  maxscore: string;
  due: string;
}

@Component({
  selector: 'page-canvas',
  templateUrl: 'canvas.page.html',
  styleUrls: ['canvas.page.scss']
})
export class CanvasPage {

    courses: Array<Course> = [];
    userID: number = 0;
    accountID: number;

    loading: boolean = false;

    constructor(private utauth: UTLogin,
                private storage: Storage,
                public router: Router) {

      storage.get('canvas:courses').then((courses) => { // check cache
        if(courses && courses.length > 0) {
          this.courses = courses;
        }
      });

      storage.get('canvas:userID').then((userID) => { // check cache
        if(userID && userID != 0) {
          this.userID = userID;
        }
      });

    }

    async fetchGrades() {

      this.loading = true;

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

        if(course.enrollments[0] && this.userID == 0) {
          this.userID = course.enrollments[0].user_id;
        }

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

        course.assignments = [];

      }

      this.courses = courses;
      this.storage.set('canvas:userID', this.userID);
      this.storage.set('canvas:courses', courses);
      this.loading = false;

    }

    openAssignments(course: Course) {

      this.router.navigate(['/assignments'],
        {
          queryParams: {
            course: JSON.stringify(course),
            userID: ""+this.userID,
            accountID: ""+this.accountID
          }
        }
      );

    }

}

@Component({
  templateUrl: 'assignments.page.html',
  styleUrls: ['canvas.page.scss']
})
export class AssignmentsPage {

  course: Course;
  userID: number;
  loading: boolean = false;

  constructor(private route: ActivatedRoute, private utauth: UTLogin) {
    this.route.queryParams.subscribe(params => {
      this.course = JSON.parse(params.course);
      this.userID = parseInt(params.userID);
      if(this.course.assignments.length == 0) {
        this.fetchAssignments();
      }
    });
  }

  async fetchAssignments() {

    this.loading = true;

    function clean(str) {
      return str.replace(/(\r\n\t|\n|\r\t)/gm, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    // this just verifies login
    let canvasAssignments = await this.utauth.getCanvas(`courses/${this.course.canvasID}/assignments`);

    let gradesPage = await this.utauth.getPage(`https://utexas.instructure.com/courses/${this.course.canvasID}/grades`);

    let assigns: Array<Assignment> = [];

    for(let rowMatch of this.getRegexMatrix(/<tr class="student_assignment[\S\s]+?>([\s\S]+?)<\/tr>/g, gradesPage)) {

      let titleMatch = /\/submissions\/\d+">([\S ]+?)<\/a>/g.exec(rowMatch[1])

      if(titleMatch != null) {

        let title = clean(titleMatch[1]);
        let context = clean(/<div class="context">([\s\S]+?)<\/div>/g.exec(rowMatch[1])[1]);
        let due = clean(/<td class="due">([\s\S]+?)<\/td>/g.exec(rowMatch[1])[1]);
        let score = clean(/<span class="original_score">([\s\S]+?)<\/span>/g.exec(rowMatch[1])[1]);
        let maxscore = clean(/<td class="possible points_possible">([\s\S]+?)<\/td>/g.exec(rowMatch[1])[1]);

        if(score.length == 0) {
          score = '?';
        }

        title = title.replace(/Submission Only\s*-?\s*/, '').replace(/DS \d+\s+-?\s*/, '');

        assigns.push({
          title: title,
          gradetype: context,
          score: score,
          maxscore: maxscore,
          due: due
        });

      }
      // console.log(rowMatch[1]);

    }

    this.course.assignments = assigns;
    this.loading = false;

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
