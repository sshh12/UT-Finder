
export class FoodPlace {
  name: string;
  lat: number;
  lng: number;
};

// http://housing.utexas.edu/dining/hours
export let foodPlaces: FoodPlace[] = [
  {name: 'J2 Dining', lat: 30.282942, lng: -97.736906},
  {name: 'Kinsolving Dining', lat: 30.290649, lng: -97.739581},
  {name: 'Wendys', lat: 30.282873, lng: -97.737118},
  {name: 'Jester City Limits', lat: 30.282856, lng: -97.736759},
];
