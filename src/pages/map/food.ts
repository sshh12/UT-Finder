
export class FoodPlace {
  name: string;
  lat: number;
  lng: number;
};

// TODO add times
// http://housing.utexas.edu/dining/hours
export let foodPlaces: FoodPlace[] = [
  {name: 'J2 Dining', lat: 30.282942, lng: -97.736906},
  {name: 'Kinsolving Dining', lat: 30.290649, lng: -97.739581},
  {name: 'Jendys', lat: 30.282873, lng: -97.737118},
  {name: 'Jester City Limits', lat: 30.282856, lng: -97.736759},
  {name: 'Jester Pizza', lat: 30.283102, lng: -97.736604},
  {name: 'Taco Cabana', lat: 30.285180, lng: -97.735934},
  {name: 'Zen', lat: 30.285024, lng:  -97.735937},
  {name: 'Chick-fil-A', lat: 30.284926, lng: -97.736007},
  {name: 'Chick-fil-A', lat: 30.286697, lng: -97.741164},
  {name: 'Qualcomm Cafe', lat: 30.286197, lng: -97.736889},
  {name: 'Panda Express', lat: 30.286916, lng: -97.741161},
];
