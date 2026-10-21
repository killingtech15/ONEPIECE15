# Water 7 implementation

Implemented 18 October 2026 from the [planning brief](WATER-7-PLAN.md). This is a stylized historical diorama, with illustrative distances and bearings rather than a surveyed reconstruction.

## Included

- Map pin and search entry open Water 7; the brand returns to the atlas. Alabasta remains accessible through the same registry.
- Fourteen selectable places: Rocky Cape, Bull Rental Shop, shopping canals, Water Gate Elevator, central fountain, Dock 1, Galley-La headquarters, Blueno's Bar, Franky House, under-bridge warehouse, Scrap Island, Blue Station, Rocketman warehouse and Shift Station.
- Tiered canal city, barrel roofs, dock gates, bridge/gate structures, shipbuilding frame, cranes, outposts and offshore railway. Named stops have their own framing radius and camera approach.
- Animated waterfalls, fountain, sea train, Bull boat and arrival ship. Aqua Laguna changes rain/ocean atmosphere and raises a distant swell. Reduced motion freezes decorative travel.
- Shared Alabasta controls: scroll journey, landmark focus, reverse-wheel/downward-swipe return, keyboard navigation, scene-change-only voyage loader, settings and error recovery.
- Phone introduction/story markers stay hidden. Content-sized story cards reuse the short-phone layout without nested scrolling.

## Model and rendering budget

| Static asset | Measured value |
|---|---:|
| GLB bytes | 10,657,712 (10.16 MiB) |
| Triangles | 132,016 |
| District meshes | 54 |
| Shared lighting texture | 4096 × 4096 |

Geometry is generated deterministically by [build-water7.mjs](../scripts/build-water7.mjs). [bake-water7.py](../scripts/bake-water7.py) bakes Cycles diffuse color, direct and indirect light into one atlas, then exports unlit materials while retaining district boundaries for frustum culling. Water 7 has no realtime building shadows. Mipmaps and up to 8× anisotropy preserve texture clarity at oblique views. Animated vehicles and water are additional geometry outside the static counts above.

The single model loads on first island entry. Separate district downloads and LODs proposed in the plan are not implemented: the complete static asset is currently about 10.16 MiB. The render loop pauses on the world chart; the inactive island is unmounted and model assets remain cached for re-entry. Balanced rendering remains the default.

```sh
npm run model:water7
blender --background --threads 6 --python scripts/bake-water7.py
npm run build
```

Blender is only needed to regenerate the baked asset. The website runs from the included GLB. Source assets and intermediate bake files stay in ignored `.tools/`.

## Verification and limits

Browser checks cover all fourteen cards at 1440×900, 390×740 and 360×640, action visibility, mobile card overflow, map/island switching, weather without a loader, reverse wheel, and missing-model recovery to Alabasta. The existing Alabasta phone suite also checks map pinch, all eight cards, downward swipe and landscape controls.

These are Chrome browser/emulation checks. Real Android/iOS frame rate, thermal endurance, twenty-switch resource stability, browser text enlargement and WebGL context-loss restoration have not been established. No claim of a guaranteed phone frame rate is made. The atlas remains a dated curated directory; Water 7 is not presented as a latest-chapter scene.

Secondary landmarks and rail outposts are compressed vignettes. The Rocketman warehouse includes a static prototype nose and workshop rather than a complete second animated train. Enies Lobby, character models, interiors, audio and full walkable streets are outside this diorama. Sources and provenance are in [credits](CREDITS.md); story links use arc summaries instead of unverified per-episode labels.

## Revision after visual review

The city footprint and outlying districts were expanded. Six staggered residential rows, radial water channels, larger dry docks, cranes, market awnings, the three-basin fountain, and more shoreline buildings replace the narrow concentric neighborhood rings. Franky House now includes the green/purple facade, swept blue roof, crescent, claw arms, windmill, tank and star signage. Galley-La has crenellated towers and an arched loggia; Blue Station has an arched facade, clock entrance and blue vault. These are original interpretations informed by the reference stills linked in the credits.

The Sea Train has five independently positioned units: locomotive, tender and three coaches. Each samples a different arc-length distance on the shared rail curve; headings follow the rail beneath each carriage. Couplings connect neighboring units, wheels turn, and steam is pooled in ten instances. A geometry test checks spacing and coupling gaps across the bends. The complete train leaves the far end before its travel cycle restarts behind the terminal.

### Boat and sign placement correction - 21 October 2026

The Merry is moored beside the arrival pier, with its world-map marker aligned to the boat. The Bull boat now floats at sea level beyond the western end of the rental jetty, clear of the numbered gate and seawall. Its drift is limited to 0.35 units instead of crossing the shore. Both landmark camera bounds include the boats. The WATER 7 lettering is attached to a framed, bracketed plaque above the lower fountain rim, with clearance from the sloped city foundation and curved basin. An open forecourt keeps nearby rooftops clear of the sign.
