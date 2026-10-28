# Impel Down — implementation notes

Built locally, 26 October 2026. Original stylized geometry depicts the intact infiltration-era prison; later escape events are recalled in stories. This is an architectural interpretation, not a measured canon floorplan or a playable prison interior.

## Delivered

Fourteen views cover the surface approach, entrance, full section, six main prison levels, Level 4 operations and ascent, the hidden passage, Newkama Land and the Marine ship berth.

- Surface: curved fortress, layered battlements, pointed gate towers, portcullis, raised crown plaque, masonry details and quay.
- Level 1: branching blade trees, sharp foliage, needle grass, cells and descent opening.
- Level 2: oversized barred openings, high corridor arches and clear central circulation.
- Level 3: dry ground, cracks, a grated shaft, ventilation fan and restrained security infrastructure.
- Level 4: large shaped cauldron with a red liquid surface, flame bed, supported crossings, stairs, pipes and operations/security galleries. The cauldron represents boiling blood, not lava.
- Level 5: snow, cylindrical frozen cell towers, chains, bridges, icicles and conifers.
- Level 5.5: a small carved pocket with a passage, curved sofas, dining tables, food, bar and cabaret details. Rear structural rock encloses the pocket in the full section.
- Level 6: monumental barred cells, rivets, restraint rings, chains and a central avenue. The environment is dark stone rather than another frozen floor.
- Marine vessel: curved hull, deck planks, cannon ports, deckhouse, two masts, four bowed sails, seams, Marine gull motifs, crow nests, ladders and rigging.

The ship moves vertically by at most 0.05 artistic units; no sideways drift. Only the active hot/cold floor runs a 36-instance ambient effect. Reduced motion and the quiet toggle freeze effects at valid poses.

## Presentation and interaction

The journey begins with the sea fortress. Past the initial approach it reveals an authored section. The named dock selects individual floors and architectural views. Interior selection hides inactive floors and removes the ocean entirely, avoiding a sea surface through the rooms. The selected floor keeps its supporting slab and back walls; the near wall and ceiling are intentionally absent for viewing.

These are modes within one scene, so selecting floors, returning, changing atmosphere and opening settings do not run the voyage loader. Atlas/scene changes retain the existing transition. The brand returns to the chart. Surface and section pins now follow the visible journey mode. A visible named level selector reaches all fourteen stops directly. Phones and short landscape use this selector instead of the horizontal dock; desktop retains both. Intro and focused-story pins remain hidden.

Camera moves first withdraw into a clear +Z corridor, change floor there, then approach the subject. Return restores the saved journey and its presentation mode. Desktop and phone framing uses measured UI rectangles, with a separate full-prison overview and close architectural views. Phone source/next actions share a row so cards fit without internal scrolling while retaining useful model space. The small hidden-passage view uses an oblique approach; the refuge view centers the room.

## Reference record and interpretation limits

The [original plan](IMPEL-DOWN-PLAN.md) records the inspected entrance, stepped depth schematic and Newkama seating panel. Additional images actually inspected during implementation:

- [Blade forest](https://m.media-amazon.com/images/M/MV5BNTE1YmFlZmEtYzZkMy00ZWUzLWI4MjAtYjE3MTVlMWM3YzYzXkEyXkFqcGc%40._V1_.jpg): sharp branching foliage, needle grass and a stone-rimmed descent opening.
- [Level 2 corridor](https://genk.mediacdn.vn/2017/4-1487667026864.png): towering masonry arches and barred openings; the pictured beast was not modeled.
- [Blazing Hell](https://vignette2.wikia.nocookie.net/onepiece/images/9/99/Blazing_Hell.png/revision/latest?cb=20141209173917): enormous cauldron, fire outside it and a narrow projecting bridge with rails.
- [Freezing Hell](https://vignette2.wikia.nocookie.net/onepiece/images/b/be/Freezing_Hell.png/revision/latest?cb=20151129200806): cylindrical cell towers, massive hanging chains, elevated connections, icicles and snowy conifers.
- [Eternal Hell](https://vignette2.wikia.nocookie.net/onepiece/images/8/88/Eternal_Hell.png/revision/latest?cb=20141211161044): thick square bars, riveted crosspieces, stone surrounds and restraint rings.

These are third-party-hosted anime references, not shipped images. Complete floor plans, the precise warden office, hidden access routing, rear fortress and mooring dimensions remain interpretations. Level 3 uses the sourced dry/ventilation setting with authored floor layout. The Gate of Justice, its control room, jailer beasts, combatants and prisoner crowds are outside this first model. The entrance is explicitly distinguished from the Gate of Justice in its story. Ace is already gone in the Level 6 card.

Short original stories link to official episodes 422, 424, 425, 431, 433, 434, 437, 438, 442, 446 and 451. [Episode 446](https://one-piece.com/anime/446/index.html) supports the escape toward Level 3; the exact security landing in this model is an authored connection.

## Asset pipeline

```sh
node scripts/build-impel-down.mjs --source
blender --background --python scripts/bake-impel-down.py
blender --background --python scripts/denoise-impel-down.py
```

The generator and runtime share `src/impel-down-layout.json`. Preview generation without `--source` writes a temporary vertex-lit GLB; always restore the baked output before release. Floors are separated spatially during the bake to prevent upper slabs blacking out lower rooms, then returned to their exact coordinates. The bake retains corner normals through welding and uses a shared 4096px diffuse atlas, 96 Cycles samples and OIDN cleanup. Runtime unlit export omits unused normal attributes; baked shading still uses the original normals.

Geometry/materials remain shared in the GLTF cache while each runtime scene owns its visibility state. Hiding floors reduces drawing, not resident asset memory. Moving ship meshes are excluded from the cached architectural ocean-depth pass. Interior modes have no ocean depth pass.

## Verification

- Production TypeScript/Vite build passed.
- Browser checks cover all fourteen cards at 1440×900, 390×740, 360×640, 320×568 and 844×390: complete actions, no internal card scrolling and no card/header collision. Short phone cards also reserve model space.
- Every landmark was visually inspected on desktop and phone; section structure, refuge framing and small-phone card layout were corrected during review.
- Normal-motion segment sampling checks actual visible geometry during surface → section → Level 1 → Level 6 → refuge → furnace → ship transitions. Sampled camera segments had no intersections. This is coverage of those routes, not a proof of every possible continuous path.
- Water is present only at the surface; inactive floor groups are hidden at focused stops. Rapid selection, Escape, reverse wheel, downward swipe, missing-model recovery and one-request cached re-entry are exercised. Cached return preserves the journey mode.
- Amazon Lily's camera, mobile and cached navigation regression suite passed after the shared camera extension. Atlas navigation is also checked separately.

Physical-phone FPS, context-loss recovery, enlarged system text and high-quality GPU costs remain unmeasured. Headless desktop measurements are not phone performance guarantees.

## Measured result

Final asset: **180,452 triangles, 59 mesh batches, 15,775,788 bytes (15.05 MiB)** and one 4096px baked texture. Estimated decoded RGBA atlas storage with mipmaps is 85.3 MiB, separate from geometry, render targets and other scene allocations. Tiny repeated rivets were simplified after the first export; every cell, chain and floor remains.

Balanced quality, Chrome headless, 1440×900; whole-frame samples include any ocean depth refresh. These are draw costs, not FPS:

| View | Settled calls | Maximum sampled triangles |
| --- | ---: | ---: |
| Sea fortress / ship | 8 | 64,456 |
| Complete section | 59 | 180,452 |
| Crimson Hell | 4 | 19,522 |
| Wild Beast Hell | 4 | 14,188 |
| Blazing Hell + embers | 9 | 24,444 |
| Freezing Hell + snow | 11 | 31,352 |
| Newkama refuge | 2 | 8,296 |
| Eternal Hell | 10 | 41,856 |

Additional 1.8-second normal-motion samples for Level 1, Level 6, refuge and surface return ranged from 1 to 12 calls. The section overview draws more architecture than individual floors. These samples met the under-100-call target; other quality levels and hardware are not implied.

Full source ship bounds: X 73.40–112.60, Y −4.00–72.00, Z −17.44–60.21. Its minimum radial gap from the conservative radius-60 fortress envelope is 16.78 units; the full sail/rigging envelope clears the pier side by 3.40 units. Vertical-only bob is ±0.05, so these horizontal clearances remain constant. The hull crosses the waterline with roughly four units of draft.

The production and source-served GLBs have matching SHA-256: `1F190D61ACCA7DB63B235D0681622B2820B531055E585C89D5CA8D6799203A26`. Final Impel tests were rerun after this asset optimization. Amazon Lily's three regression tests and the four atlas-navigation tests also passed in this task. Vite retains its existing large-JavaScript-chunk warning.
