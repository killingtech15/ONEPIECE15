import { createContext, useContext } from 'react'
import { island, places } from './world'
import { water7Island, water7Places } from './water7'

export const islands = {
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
