import { expandedPlaces } from './atlas-expansion'

export type ChartPlace = {
  id: string
  name: string
  sea: string
  x: number
  y: number
  description: string
  aliases?: string
  era?: string
  kind?: 'Country' | 'Marine base' | 'Island / place'
  position?: 'chart' | 'unknown'
  source?: string
}

// Coordinates traced from OnePiece15 Map.png, normalized to a 3000 x 1500 chart.
export const chartPlaces: ChartPlace[] = [
  {
    id: 'foosha',
    name: 'Foosha Village',
    sea: 'East Blue',
    x: 2593.33,
    y: 320.0,
    description:
      'Luffy’s home village in the Goa Kingdom. The voyage begins with a borrowed straw hat and a promise to Shanks.',
  },
  {
    id: 'shells',
    name: 'Shells Town',
    sea: 'East Blue',
    x: 2538.33,
    y: 286.67,
    description: 'A Marine base town where Luffy meets the imprisoned swordsman Roronoa Zoro.',
  },
  {
    id: 'orange',
    name: 'Orange Town',
    sea: 'East Blue',
    x: 2311.67,
    y: 401.67,
    description:
      'Buggy’s occupation brings Luffy, Zoro and Nami together in a town whose people refuse to abandon their home.',
  },
  {
    id: 'syrup',
    name: 'Syrup Village',
    sea: 'East Blue',
    x: 2140.0,
    y: 450.0,
    description:
      'Usopp’s home on the Gecko Islands. Kaya’s gift of the Going Merry gives the crew its first proper ship.',
  },
  {
    id: 'baratie',
    name: 'Baratie',
    sea: 'East Blue',
    x: 2206.67,
    y: 573.33,
    description:
      'Zeff’s floating restaurant. Sanji leaves its kitchens to search for the All Blue.',
  },
  {
    id: 'cocoyasi',
    name: 'Cocoyasi Village',
    sea: 'East Blue',
    x: 1951.67,
    y: 411.67,
    description:
      'Nami’s home in the Conomi Islands, near Arlong Park. The crew fights to free her village from Arlong.',
  },
  {
    id: 'loguetown',
    name: 'Loguetown',
    sea: 'East Blue',
    x: 1741.67,
    y: 666.67,
    description:
      'The town of the beginning and the end: the birthplace and execution site of Gol D. Roger.',
  },
  {
    id: 'reverse',
    name: 'Reverse Mountain',
    sea: 'Red Line',
    x: 1398.33,
    y: 850.0,
    description:
      'Four rising currents converge at the mountain, carrying ships from the Blues into the Grand Line.',
  },
  {
    id: 'twin',
    name: 'Twin Cape',
    sea: 'Paradise',
    x: 1630.0,
    y: 848.33,
    description:
      'At the foot of Reverse Mountain, Crocus watches over the lighthouse and the whale Laboon.',
  },
  {
    id: 'whiskey',
    name: 'Whiskey Peak',
    sea: 'Paradise',
    x: 1708.33,
    y: 821.67,
    description:
      'A welcoming town on Cactus Island conceals a nest of Baroque Works bounty hunters.',
  },
  {
    id: 'garden',
    name: 'Little Garden',
    sea: 'Paradise',
    x: 1790.0,
    y: 806.67,
    description:
      'A prehistoric island where the giants Dorry and Brogy have continued their duel for a hundred years.',
  },
  {
    id: 'drum',
    kind: 'Country',
    aliases: 'Sakura Kingdom Drum Kingdom',
    name: 'Drum Island',
    sea: 'Paradise',
    x: 1890.0,
    y: 821.67,
    description:
      'A winter kingdom beneath towering drum-shaped mountains. Here the crew meets Chopper and Doctor Kureha.',
  },
  {
    id: 'alabasta',
    kind: 'Country',
    aliases: 'Arabasta Sandy Island Nefertari',
    era: 'Across eras / manga spoilers',
    source: 'https://one-piece.com/story/egghead/index.html',
    name: 'Alabasta',
    sea: 'Paradise',
    x: 2040.0,
    y: 818.33,
    description:
      'The desert kingdom on Sandy Island. The 3D journey revisits Vivi’s fight to save her homeland. Later, Cobra’s death at the Reverie and the revelation about the Nefertari family connect Alabasta to the mystery of the D. name.',
  },
  {
    id: 'jaya',
    name: 'Jaya',
    sea: 'Paradise',
    x: 2178.33,
    y: 878.33,
    description:
      'Mock Town, Bellamy and Mont Blanc Cricket mark the crew’s search for a way to the sky.',
  },
  {
    id: 'skypiea',
    kind: 'Country',
    aliases: 'Sky Island Shandora Upper Yard Angel Island',
    name: 'Skypiea',
    sea: 'Sky Islands',
    x: 2268.33,
    y: 845.0,
    description:
      'A kingdom above the clouds, reached by the Knock Up Stream. Upper Yard holds a missing piece of Jaya’s history.',
  },
  {
    id: 'long-ring',
    name: 'Long Ring Long Land',
    sea: 'Paradise',
    x: 2471.67,
    y: 856.67,
    description:
      'An island of long animals and wide grasslands, where Foxy challenges the crew to a Davy Back Fight.',
  },
  {
    id: 'water-seven',
    aliases: 'Shipbuilding Island Water Seven',
    name: 'Water 7',
    sea: 'Paradise',
    x: 2650.0,
    y: 860.0,
    description:
      'The city of shipwrights and canals. The Going Merry’s condition and Robin’s departure test the crew.',
  },
  {
    id: 'enies-lobby',
    name: 'Enies Lobby',
    sea: 'Government route',
    x: 2783.33,
    y: 883.33,
    description:
      'The judicial island of perpetual daylight, connected to Water 7 by the Sea Train. The crew declares war to bring Robin home.',
  },
  {
    id: 'thriller',
    name: 'Thriller Bark',
    sea: 'Florian Triangle',
    x: 2803.33,
    y: 825.0,
    description:
      'A vast ship drifting through the Florian Triangle. Stolen shadows, Gecko Moria and the musician Brook await.',
  },
  {
    id: 'sabaody',
    name: 'Sabaody Archipelago',
    sea: 'Paradise',
    x: 2858.33,
    y: 846.67,
    description:
      'Mangrove groves and resin bubbles near the Red Line. Ships are coated here for the underwater passage.',
  },
  {
    id: 'amazon',
    kind: 'Country',
    aliases: 'Kuja Island of Women',
    name: 'Amazon Lily',
    sea: 'Calm Belt',
    x: 2723.33,
    y: 961.67,
    description:
      'The island of the Kuja, ruled by Boa Hancock. Luffy lands here after the crew is scattered at Sabaody.',
  },
  {
    id: 'impel',
    name: 'Impel Down',
    sea: 'Calm Belt',
    x: 2838.33,
    y: 963.33,
    description:
      'The World Government’s underwater prison. Luffy descends through its levels in an attempt to rescue Ace.',
  },
  {
    id: 'marineford',
    name: 'Marineford',
    sea: 'Government route',
    x: 2898.33,
    y: 880.0,
    description:
      'The former Marine headquarters and site of the Summit War. The headquarters later moves across the Red Line to New Marineford.',
  },
  {
    id: 'mariejois',
    aliases: 'Mariejois Marijoa Mary Geoise',
    name: 'Mary Geoise',
    sea: 'Red Line',
    x: 45.0,
    y: 831.67,
    description:
      'The World Government’s holy land atop the Red Line, above the passage between the two halves of the Grand Line.',
  },
  {
    id: 'fishman',
    aliases: 'Ryugu Kingdom Fishman Fish-Man',
    kind: 'Country',
    era: 'After the timeskip',
    name: 'Fish-Man Island',
    sea: 'Below the Red Line',
    x: 2953.33,
    y: 856.67,
    description:
      'The undersea home of the Ryugu Kingdom. After their reunion, the Straw Hats confront Hody Jones, meet Shirahoshi, and begin their voyage into the New World.',
  },
  ...expandedPlaces,
]

export const mainRoute = [
  'foosha',
  'shells',
  'orange',
  'syrup',
  'baratie',
  'cocoyasi',
  'loguetown',
  'reverse',
  'twin',
  'whiskey',
  'garden',
  'drum',
  'alabasta',
  'jaya',
  'long-ring',
  'water-seven',
  'thriller',
  'sabaody',
  'fishman',
]
export const routePoints = mainRoute
  .map((id) => chartPlaces.find((p) => p.id === id)!)
  .map((p) => `${p.x},${p.y}`)
  .join(' ')

export const newWorldRoute = [
  'punk-hazard',
  'dressrosa',
  'zou',
  'whole-cake-island',
  'wano-country',
  'egghead',
  'elbaph',
]
export const newWorldRoutePoints = newWorldRoute
  .map((id) => chartPlaces.find((p) => p.id === id)!)
  .map((p) => `${p.x},${p.y}`)
  .join(' ')
export const chartRegions = [...new Set(chartPlaces.map((place) => place.sea))]
export const atlasReviewDate = '17 October 2026'
export const atlasSources = {
  egghead: 'https://one-piece.com/story/egghead/index.html',
  current: 'https://one-piece.com/news/index.html',
  locations: 'https://onepiece.fandom.com/wiki/List_of_Locations',
}
