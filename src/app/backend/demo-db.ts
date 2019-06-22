import {
    ClassTime, 
    MoneyAccount,
    Course,
    Assignment
} from './ut-api';

export const SCHEDULE_DATA: {[key: string]: ClassTime[]} = {
    NOW: [
        {"num":12345,"name":"C S 314","title":"DATA STRUCTURES-C S","building":"GDC","room":"2.216","days":["M"],"timeslot":"10:00am-11:00am"},
        {"num":43253,"name":"C S 311","title":"DISCRETE MATH-C S","building":"GDC","room":"2.216","days":["T","H"],"timeslot":"9:30am-11:00am"},
        {"num":87663,"name":"UGS 303","title":"SUSTAINING A PLANET-C S","building":"JGB","room":"3.123","days":["M","W","F"],"timeslot":"11:00am-12:00pm"},
    ],
    OTHER: [
        {"num":50410,"name":"C S 439","title":"PRINCIPLES OF COMPUTER SYS-C S","building":"UTC","room":"3.124","days":["M","W"],"timeslot":"11:00am-1:00pm"},
        {"num":50410,"name":"C S 439","title":"PRINCIPLES OF COMPUTER SYS-C S","building":"SZB","room":"426","days":["F"],"timeslot":"1:00pm-3:00pm"},
        {"num":20900,"name":"ITD 150","title":"ETHICS IN ARTIF INTEL DSGN","building":"DFA","room":"4.106","days":["H"],"timeslot":"6:00pm-9:00pm"},
        {"num":37290,"name":"SWE 604","title":"ACCELERATED FIRST-YEAR SWEDISH","building":"BUR","room":"337","days":["M","W","F"],"timeslot":"9:00am-11:00am"}
    ]
};

export const MONEY_DATA: MoneyAccount[] = [
    {"name":"Rollover","balance":593.22,"status":"Active"},
    {"name":"Bevo Bucks","balance":10.69,"status":"Active"}
]

export const CANVAS_DATA: Course[] = [
    {"canvasID":1229535,"name":"Fa18 - DATA STRUCTURES (51355)","code":"C S 314","title":"DATA STRUCTURES","grade":96.32,"assignments":[]},
    {"canvasID":1229509,"name":"Fa18 - DISCRETE MATH FOR COMPUTER SCI (51225)","code":"C S 311","title":"DISCRETE MATH FOR COMPUTER SCI","grade":97.21,"assignments":[]},
    {"canvasID":1233570,"name":"Fa18 - SEQ, SERIES, AND MULTIVAR CALC (53690)","code":"M 408D (2-3)","title":"SEQ, SERIES, AND MULTIVAR CALC","grade":98.58,"assignments":[]},
    {"canvasID":1237665,"name":"Fa18 - SUSTAINING A PLANET (63785)","code":"UGS 303","title":"SUSTAINING A PLANET","grade":93.65,"assignments":[]},
    {"canvasID":1239148,"name":"Sp19 - COMP ORGANIZATN AND ARCH (50800)","code":"C S 429","title":"COMP ORGANIZATN AND ARCH","grade":95.00,"assignments":[]},
    {"canvasID":1246720,"name":"Sp19 - MATRICES/MATRIX CALCULATNS-C S (53445)","code":"M 340L","title":"MATRICES/MATRIX CALCULATNS-C S","grade":92.12,"assignments":[]},
    {"canvasID":1243165,"name":"Sp19 - THE UNITED STATES, 1492-1865 (38755)","code":"HIS 315K","title":"THE UNITED STATES, 1492-1865","grade":85.43,"assignments":[]},
    {"canvasID":1251971,"name":"Su19 - ISS & POLICIES IN AMER GOV-WB (81785)","code":"GOV F312L","title":"ISS & POLICIES IN AMER GOV-WB","grade":96.56,"assignments":[]}
]

export const CANVAS_ASSIGNMENT_DATA: {[key: string]: Assignment[]} = {
    DEFAULT: [
        {"title":"Module 1 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 7 by 11pm"},
        {"title":"Module 2 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 10 by 11pm"},
        {"title":"I will be taking the exams in Austin","gradetype":"Imported Assignments","score":"1","maxscore":"1","due":"Jun 11 by 5pm"},
        {"title":"Sign-up for exams with ProctorU","gradetype":"Imported Assignments","score":"?","maxscore":"1","due":"Jun 11 by 5pm"},
        {"title":"Module 3 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 11 by 11pm"},
        {"title":"Module 4 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 12 by 11pm"},
        {"title":"Module 5 Quiz","gradetype":"Quizzes","score":"4","maxscore":"5","due":"Jun 13 by 11pm"},
        {"title":"Module 6 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 14 by 11pm"},
        {"title":"Module 7 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 17 by 11pm"},
        {"title":"Exam 1","gradetype":"Exam 1","score":"94.5","maxscore":"100","due":"Jun 18 by 10pm"},
        {"title":"Module 8 Quiz","gradetype":"Quizzes","score":"4","maxscore":"5","due":"Jun 19 by 11pm"},
        {"title":"Module 9 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 20 by 11pm"},
        {"title":"Module 10 Quiz","gradetype":"Quizzes","score":"5","maxscore":"5","due":"Jun 21 by 11pm"},
        {"title":"Module 11 Quiz","gradetype":"Quizzes","score":"?","maxscore":"5","due":"Jun 24 by 11pm"},
        {"title":"Module 12 Quiz","gradetype":"Quizzes","score":"?","maxscore":"5","due":"Jun 25 by 11pm"},
        {"title":"Module 13 Quiz","gradetype":"Quizzes","score":"?","maxscore":"5","due":"Jun 26 by 11pm"},
        {"title":"Module 14 Quiz","gradetype":"Quizzes","score":"?","maxscore":"5","due":"Jun 27 by 11pm"},
        {"title":"Pre-class Survey","gradetype":"Surveys","score":"0","maxscore":"0","due":""}
    ]
};