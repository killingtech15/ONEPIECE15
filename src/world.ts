import data from './world.json'
export const island = data.islands[0]
export const places = [
  {
    name: 'Royal palace',
    location: 'ALUBARNA',
    icon: 'palace',
    target: [6, 13, -9],
    offset: [16, 10, 22],
    source: 'https://one-piece.com/anime/126/index.html',
  },
  {
    name: 'The clock tower',
    location: 'PALACE SQUARE',
    icon: 'clock',
    target: [-1, 11, 3],
    offset: [10, 6, 15],
    source: 'https://one-piece.com/anime/125/index.html',
  },
  {
    name: 'Rain Dinners',
    location: 'RAINBASE',
    icon: 'sand',
    target: [-24, 5, -4],
    offset: [14, 10, 18],
    source: 'https://one-piece.com/anime/105/index.html',
  },
  {
    name: 'The eastern coast',
    location: 'A FINAL FAREWELL',
    icon: 'ship',
    target: [14, 2, 29],
    offset: [13, 8, 16],
    source: 'https://one-piece.com/anime/129/index.html',
  },
] as const
// Mutable frame state: high-frequency scroll values never trigger React renders.
export const travel = { progress: 0, velocity: 0 }
