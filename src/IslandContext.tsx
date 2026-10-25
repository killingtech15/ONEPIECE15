import { createContext, useContext } from 'react'
import { island, places } from './world'
import { water7Island, water7Places } from './water7'
import { thrillerIsland, thrillerPlaces } from './thriller'
import { eniesIsland, eniesPlaces } from './enies'

export const islands = {
  'thriller-bark': {
    island: thrillerIsland,
    places: thrillerPlaces,
    title: 'THRILLER BARK',
    region: 'THE ISLAND SHIP',
    subtitle: 'A shadow beyond the mist.',
    description:
      'Pass the grinning gate, follow the forest road, and discover the mansions beneath three towering masts.',
    action: 'Enter the haunted ship',
    chapter: '04',
    weather: ['Florian mist', 'Clearer view'],
    landmarkHint: 'Sixteen landmarks. From the mouth gate to the tallest mast.',
  },
  'enies-lobby': {
    island: eniesIsland,
    places: eniesPlaces,
    title: 'ENIES LOBBY',
    region: 'THE JUDICIAL ISLAND',
    subtitle: 'Across the divide, a promise.',
    description:
      'Cross the gates, follow the rooftops, and look into the abyss. A rescue remembered beneath a sky that never darkens.',
    action: 'Cross the first gate',
    chapter: '03',
    weather: ['Perpetual daylight', 'Perpetual daylight'],
    landmarkHint: 'Fourteen landmarks. From the Sea Train to the Gates of Justice.',
  },
  alabasta: {
    island,
    places,
    title: 'ALABASTA',
    region: 'SANDY ISLAND',
    subtitle: 'A kingdom waiting for rain.',
    description:
      'Beyond the dunes, a promise still stands. Follow the needle into the land of sand, and the stories that changed its course.',
    action: 'Enter the kingdom',
    chapter: '01',
    weather: ['Desert sun', 'The rain returns'],
    landmarkHint: 'Eight landmarks. Follow the coast, then head inland.',
  },
  'water-7': {
    island: water7Island,
    places: water7Places,
    title: 'WATER 7',
    region: 'THE CITY OF WATER',
    subtitle: 'Every current carries a story.',
    description:
      'Climb the canals, cross the shipyards, and follow the rails out to sea. A city of shipwrights, hidden loyalties, and new beginnings.',
    action: 'Enter the city',
    chapter: '02',
    weather: ['Clear canals', 'Aqua Laguna'],
    landmarkHint: 'Fourteen landmarks. From the canals to the open sea.',
  },
}
export type IslandId = keyof typeof islands
export const IslandContext = createContext<(typeof islands)[IslandId]>(islands.alabasta)
export const useIsland = () => useContext(IslandContext)
