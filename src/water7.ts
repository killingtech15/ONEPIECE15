import layout from './water7-layout.json' with { type: 'json' }
const storySource = 'https://one-piece.com/story/water_seven/index.html'
const entries = [
  [
    'Rocky Cape',
    'ARRIVAL WATERFRONT',
    'A city built on water',
    'The crew arrives seeking repairs for the Going Merry and a shipwright for the journey ahead. Beyond the landing, canals rise through a city shaped by generations of shipbuilders.',
  ],
  [
    'Bull Rental Shop',
    'CANAL ENTRANCE',
    'Take the water road',
    'Waterways connect the city. Bull-drawn boats carry passengers through busy canals, introducing the crew to a place where water is part of everyday life.',
  ],
  [
    'Shopping canals',
    'LOWER CITY',
    'Fortunes change hands',
    'The crew explores the markets and exchanges its gold. Busy bridges and narrow streets hide the first signs of trouble as the money intended for the Merry becomes a target.',
  ],
  [
    'Water Gate Elevator',
    'TERRACE ASCENT',
    'A route to the rooftops',
    'Water routes climb between the city’s levels. This view follows an illustrated gate and elevated canal, showing how the terraced city connects its waterfront to the streets above.',
  ],
  [
    'Central fountain',
    'THE CITY OF WATER',
    'Water above the sea',
    'From the upper terraces, falling water traces the city’s silhouette. This scenic stop celebrates Water 7’s extraordinary architecture; its proportions are compressed for this interactive diorama.',
  ],
  [
    'Dock 1',
    'GALLEY-LA SHIPYARD',
    'The shipwrights’ verdict',
    'At Galley-La, the crew seeks the expertise that might save the Merry. The shipwrights’ assessment changes their plans and brings the question of their ship’s future painfully into focus.',
  ],
  [
    'Galley-La headquarters',
    'ICEBURG’S RESIDENCE',
    'Behind the trusted faces',
    'An attack on Iceburg draws the crew into a conspiracy. The truth about the people around him turns familiar shipwrights into dangerous enemies, while Robin’s choices remain difficult to understand.',
  ],
  [
    'Blueno’s Bar',
    'CANAL QUARTER',
    'A quiet façade',
    'Among the city’s ordinary businesses, a familiar bar conceals a connection to CP9. Its unassuming frontage becomes another reminder that Water 7’s welcoming streets hold secrets.',
  ],
  [
    'Franky House',
    'OUTER SHORE',
    'The family’s stronghold',
    'The theft of the repair money draws Usopp to the Franky Family’s base. His friends follow, setting off a confrontation that binds the crew’s troubles to Franky’s own story.',
  ],
  [
    'Under-bridge warehouse',
    'BACK STREETS',
    'Beneath the city',
    'Away from the bright commercial canals, warehouses and sheltered passages offer quieter corners. This compressed back-street vignette connects the Franky Family’s story to the city’s industrial edge.',
  ],
  [
    'Scrap Island',
    'TOM’S WORKERS',
    'A shipwright’s inheritance',
    'Shipbuilding connects Tom, Iceburg and Franky across generations. Later, the Thousand Sunny is constructed at Scrap Island. This arrival-era workshop suggests that history without placing the finished Sunny beside the Merry.',
  ],
  [
    'Blue Station',
    'SEA TRAIN TERMINAL',
    'The last departure',
    'The Sea Train connects Water 7 to the world beyond its canals. As danger and the approaching storm reshape the city, a departure from this station becomes the start of a desperate pursuit.',
  ],
  [
    'Rocketman warehouse',
    'RAIL WORKSHOP',
    'Another way forward',
    'A prototype train offers the crew and its allies a chance to follow Robin. Rocketman’s storage vignette is separate from the public terminal, preserving the distinction between the two trains.',
  ],
  [
    'Shift Station',
    'OFFSHORE OUTPOST',
    'Rails across the ocean',
    'An outpost on the Sea Train approach introduces the route to Water 7. Its distance from the city is compressed here so the station and its connection can be explored in one scene.',
  ],
] as const

// Approach from each district's open waterfront, keeping the city behind the subject.
const approaches: [number, number, number][] = [
  [-14, 11, 18],
  [-14, 13, 19],
  [-6, 15, 21],
  [21, 16, 15],
  [14, 13, 22],
  [22, 13, 17],
  [10, 16, 30],
  [-24, 13, 5],
  [-8, 14, 32],
  [-15, 12, -24],
  [21, 14, -22],
  [7, 12, 24],
  [24, 13, -8],
  [21, 13, 20],
]
export const water7Places = entries.map(([name, location], index) => ({
  name,
  location,
  target: layout.landmarks[index].target as [number, number, number],
  radius: layout.landmarks[index].radius,
  offset: approaches[index],
  icon: 'town',
  source:
    name === 'Scrap Island' ? 'https://one-piece.com/story/enies_lobby/index.html' : storySource,
}))
export const water7Island = {
  id: 'water-7',
  name: 'Water 7',
  meshUrl: '/models/water7.glb',
  splineProgress: 0,
  cameraZoomOffset: { x: 32, y: 28, z: 42 },
  incidents: entries.map(([, , title, description], index) => ({
    title,
    description,
    episodes: 'Water 7 · historical setting',
    localPosition: {
      x: layout.landmarks[index].target[0],
      y: layout.landmarks[index].target[1] + 5,
      z: layout.landmarks[index].target[2],
    },
  })),
}
