export type ChartPlace = {
  id: string
  name: string
  sea: string
  x: number
  y: number
  description: string
}

// An unfolded route chart, not canonical coordinates or island scales.
export const chartPlaces: ChartPlace[] = [
  {
    id: 'foosha',
    name: 'Foosha Village',
    sea: 'East Blue',
    x: 1580,
    y: 280,
    description:
      'Luffy’s home village in the Goa Kingdom. The voyage begins with a borrowed straw hat and a promise to Shanks.',
  },
  {
    id: 'shells',
    name: 'Shells Town',
    sea: 'East Blue',
    x: 1380,
    y: 350,
    description: 'A Marine base town where Luffy meets the imprisoned swordsman Roronoa Zoro.',
  },
  {
    id: 'orange',
    name: 'Orange Town',
    sea: 'East Blue',
    x: 1190,
    y: 260,
    description:
      'Buggy’s occupation brings Luffy, Zoro and Nami together in a town whose people refuse to abandon their home.',
  },
  {
    id: 'syrup',
    name: 'Syrup Village',
    sea: 'East Blue',
    x: 1020,
    y: 380,
    description:
      'Usopp’s home on the Gecko Islands. Kaya’s gift of the Going Merry gives the crew its first proper ship.',
  },
  {
    id: 'baratie',
    name: 'Baratie',
    sea: 'East Blue',
    x: 840,
    y: 270,
    description:
      'Zeff’s floating restaurant. Sanji leaves its kitchens to search for the All Blue.',
  },
  {
    id: 'cocoyasi',
    name: 'Cocoyasi Village',
    sea: 'East Blue',
    x: 700,
    y: 400,
    description:
      'Nami’s home in the Conomi Islands, near Arlong Park. The crew fights to free her village from Arlong.',
  },
  {
    id: 'loguetown',
    name: 'Loguetown',
    sea: 'East Blue',
    x: 530,
    y: 500,
    description:
      'The town of the beginning and the end: the birthplace and execution site of Gol D. Roger.',
  },
  {
    id: 'reverse',
    name: 'Reverse Mountain',
    sea: 'Red Line',
    x: 390,
    y: 740,
    description:
      'Four rising currents converge at the mountain, carrying ships from the Blues into the Grand Line.',
  },
  {
    id: 'twin',
    name: 'Twin Cape',
    sea: 'Paradise',
    x: 570,
    y: 780,
    description:
      'At the foot of Reverse Mountain, Crocus watches over the lighthouse and the whale Laboon.',
  },
  {
    id: 'whiskey',
    name: 'Whiskey Peak',
    sea: 'Paradise',
    x: 730,
    y: 680,
    description:
      'A welcoming town on Cactus Island conceals a nest of Baroque Works bounty hunters.',
  },
  {
    id: 'garden',
    name: 'Little Garden',
    sea: 'Paradise',
    x: 880,
    y: 820,
    description:
      'A prehistoric island where the giants Dorry and Brogy have continued their duel for a hundred years.',
  },
  {
    id: 'drum',
    name: 'Drum Island',
    sea: 'Paradise',
    x: 1050,
    y: 690,
    description:
      'A winter kingdom beneath towering drum-shaped mountains. Here the crew meets Chopper and Doctor Kureha.',
  },
  {
    id: 'alabasta',
    name: 'Alabasta',
    sea: 'Paradise',
    x: 1230,
    y: 820,
    description:
      'The desert kingdom on Sandy Island. Follow Vivi from Nanohana’s waterfront to the royal capital of Alubarna.',
  },
  {
    id: 'jaya',
    name: 'Jaya',
    sea: 'Paradise',
    x: 1400,
    y: 710,
    description:
      'Mock Town, Bellamy and Mont Blanc Cricket mark the crew’s search for a way to the sky.',
  },
  {
    id: 'skypiea',
    name: 'Skypiea',
    sea: 'Sky Island',
    x: 1435,
    y: 505,
    description:
      'A kingdom above the clouds, reached by the Knock Up Stream. Upper Yard holds a missing piece of Jaya’s history.',
  },
  {
    id: 'long-ring',
    name: 'Long Ring Long Land',
    sea: 'Paradise',
    x: 1570,
    y: 835,
    description:
      'An island of long animals and wide grasslands, where Foxy challenges the crew to a Davy Back Fight.',
  },
  {
    id: 'water-seven',
    name: 'Water 7',
    sea: 'Paradise',
    x: 1760,
    y: 715,
    description:
      'The city of shipwrights and canals. The Going Merry’s condition and Robin’s departure test the crew.',
  },
  {
    id: 'enies-lobby',
    name: 'Enies Lobby',
    sea: 'Government route',
    x: 1780,
    y: 990,
    description:
      'The judicial island of perpetual daylight, connected to Water 7 by the Sea Train. The crew declares war to bring Robin home.',
  },
  {
    id: 'thriller',
    name: 'Thriller Bark',
    sea: 'Florian Triangle',
    x: 1950,
    y: 820,
    description:
      'A vast ship drifting through the Florian Triangle. Stolen shadows, Gecko Moria and the musician Brook await.',
  },
  {
    id: 'sabaody',
    name: 'Sabaody Archipelago',
    sea: 'Paradise',
    x: 2150,
    y: 700,
    description:
      'Mangrove groves and resin bubbles near the Red Line. Ships are coated here for the underwater passage.',
  },
  {
    id: 'amazon',
    name: 'Amazon Lily',
    sea: 'Calm Belt',
    x: 1930,
    y: 1130,
    description:
      'The island of the Kuja, ruled by Boa Hancock. Luffy lands here after the crew is scattered at Sabaody.',
  },
  {
    id: 'impel',
    name: 'Impel Down',
    sea: 'Calm Belt',
    x: 2210,
    y: 1150,
    description:
      'The World Government’s underwater prison. Luffy descends through its levels in an attempt to rescue Ace.',
  },
  {
    id: 'marineford',
    name: 'Marineford',
    sea: 'Government route',
    x: 2230,
    y: 940,
    description: 'Marine headquarters before the timeskip and the site of the Summit War.',
  },
  {
    id: 'mariejois',
    name: 'Mary Geoise',
    sea: 'Red Line',
    x: 2400,
    y: 580,
    description:
      'The World Government’s holy land atop the Red Line, above the passage between the two halves of the Grand Line.',
  },
  {
    id: 'fishman',
    name: 'Fish-Man Island',
    sea: 'Below the Red Line',
    x: 2400,
    y: 820,
    description:
      'The underwater gateway toward the New World. Shown as a destination on this pre-timeskip chart; its later story is not included.',
  },
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
]
export const routePoints = mainRoute
  .map((id) => chartPlaces.find((p) => p.id === id)!)
  .map((p) => `${p.x},${p.y}`)
  .join(' ')
