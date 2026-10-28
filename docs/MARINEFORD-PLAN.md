# Marineford — model and experience plan

Prepared 26 October 2026. Implementation is now authorized and built locally; see [implementation notes](MARINEFORD-IMPLEMENTATION.md) for the delivered scope and measured costs. The budgets below remain the original targets.

## Direction and historical state

Build the **original Marineford before the Summit War**, around episode 459: intact headquarters, the execution scaffold, open water in the crescent bay, town districts and the Marine blockade. This is the former headquarters in Paradise, not New Marineford's later double-arch fortress.

The main composition is a large empty bay leading into a broad plaza, with a monumental white headquarters and layered blue-green roofs above it. Four rocky pinnacles carry watch pavilions. Small red-roofed houses give the fortress scale. The headquarters, bay and scaffold must remain recognizable on a phone before any small props are added.

Later battle events belong in sourced story cards. Do not combine a frozen harbor, burning Moby Dick, intact fortress and Blackbeard's destruction in one permanent physical state. The first build is an architectural journey with no combat crowds or character simulation. Whitebeard's arrival can become a separate, explicit later state after the base scene passes review; it is not part of the first asset commitment.

## Inspected visual evidence

Reference copies are held locally for research, not shipped as textures. All production geometry will be original.

| Reference | What is visible | What it does not establish |
| --- | --- | --- |
| [Island overview](https://img4.wikia.nocookie.net/__cb20100718224610/onepiece/images/4/46/Marineford_Island.png) | Crescent arms, open bay, inner cannon line, broad plaza, gate terrace, dense side towns, four pinnacles and layered headquarters; fleet outside the perimeter | Exact distances, full rear elevations or interior plans |
| [Headquarters frontal view](https://fotografias-2.larazon.es/assets/videojuegos/2020/10/2f04e289d25118907e598e8a29fc1fa8b43e2d6f_hq.jpg) | Tall tapered pale foundation, 海軍 characters around a Marine emblem, red balconies, central entrance stair, roof silhouette and ship sails | Street-by-street plan or reliable ship dimensions |
| [Episode 459: scaffold from behind](https://simkl.in/episodes/45/456321270704c2364_w.webp) | Scaffold on a raised fortified terrace, cross-braced timber legs, small upper platform and direct relation to the plaza and bay | Every joint or the full stair connection |
| [Episode 459: broadcast view](https://simkl.in/episodes/45/45631708da861a045_w.webp) | Front cross-bracing and placement beneath the headquarters frontage | Green broadcast tint is not the construction palette |
| [Episode 459: plaza edge](https://simkl.in/episodes/45/45631820d3af57143_w.webp) | Scaffold bracing, pale retaining walls, side stairs and small houses against the slope | Full side-district street network |

Some search results showed Loguetown's scaffold, Montblanc Cricket's house and fan/game reconstructions. They are not references for this model. One episode still shows Luffy facing a Gate of Justice; it does not fix that gate's distance or direction from Marineford, so the gate stays outside the first model.

### Remaining reference work before detail modeling

- Obtain a clearer side view of the scaffold, stairs, railings and Admirals' dais; the inspected wide view is enough for blockout, not final joinery.
- Inspect cannon carriages, watchtower roof ends, entrance doors and Marine vessel side/stern profiles at useful resolution.
- Confirm the Ox Bell's location and shape before committing it as a landmark.
- Resolve a complete Moby Dick hull/sail reference set only if adding the later arrival state. Never substitute the Marine ship or Merry.
- Treat rear-town streets, unseen courtyards and connective stairs as authored interpretation. Exact canon coordinates are unavailable.

## Layout and scale study

Use a shared `marineford-layout.json` for geometry, water boundaries, cameras, props and markers. Y is vertical; sea level is zero; the harbor opens toward +Z. The following are **proposed artistic units**, not measured canon dimensions:

| Mass | Proposed envelope / placement | Composition test |
| --- | --- | --- |
| Island footprint | About 620 wide × 570 deep; outer radius near 310 | Crescent reads clearly from approach and high overview |
| Bay | Inner radius about 175; center near Z +110 | At least 55% of visible harbor width stays open water |
| Harbor mouth | Opening about 150–180 wide | Two large vessels can pass without sail or rigging collisions |
| Plaza | About 280 × 110, Y 15–22 | Continuous sightline from bay to scaffold; no filler houses in its middle |
| Scaffold terrace | Near [0, 26, -110], about 90 × 65 | Terraced fortress base stays distinct from wooden platform |
| Scaffold | Roughly 28 × 18; top about 20 above terrace | Braced legs, raised deck and staircase read at phone scale |
| Headquarters | Near [0, 105, -205], foundation about 155 × 90; full height near 190 | Dominant vertical silhouette; 海軍 and emblem remain readable |
| Four pinnacles | Flank and sit behind headquarters; heights 90–150 | Unequal silhouettes, secure pavilion foundations, clear camera corridors |
| Side towns | Bands roughly X ±110–240 | Houses remain subordinate; streets connect instead of filling every gap |
| Marine vessels | Hero hull about 70 long, beam 25–30 | Full mast/sail bounds plus wave/bob envelope clear quay and neighbors |

Start with one coherent crescent mesh and connected terraces. Avoid overlapping disks that produce seams. Place cannon platforms along the inner and outer walls. Model the real water opening rather than covering a solid land disk with blue material. Keep the empty plaza and bay large enough to communicate the battle's scale.

## Proposed journey — fourteen views

| Stop | Primary subject | Story or interpretation |
| --- | --- | --- |
| 01 | Sea approach and blockade | Marineford prepares; episode 459 |
| 02 | Crescent harbor mouth | Geographic orientation |
| 03 | Inner seawall and cannon batteries | The defended bay; architectural view |
| 04 | Eastern quay and hero Marine vessel | Fleet design and naval presence |
| 05 | Western town | Marine families' town; interpreted streets |
| 06 | Eastern town and stepped access | Houses, stairs and fortress hierarchy |
| 07 | Oris Plaza | Clear route toward the execution terrace |
| 08 | Scaffold terrace | Raised fortified platform and access |
| 09 | Execution scaffold | Ace is brought to the platform; episode 459 |
| 10 | Admirals' dais | Below the scaffold; precise detailing pending reference |
| 11 | Headquarters facade | 海軍, Marine emblem, buttresses and entrance stair |
| 12 | Roof galleries | Layered roof profiles and red balconies |
| 13 | Pinnacle watchtower | Grounded pavilion and view across the harbor |
| 14 | Harbor overlook | Later war and departure recalled in text; no mixed-time scenery |

The Ox Bell, Gate of Justice, Moby Dick, underground holding cells and unverified offices are **not promised stops**. Add only when reference, placement, scope and budget are resolved. The full four-pinnacle ensemble still appears in the model even though only one needs its own stop.

## Event chronology and sources

- [Official Marineford arc overview](https://one-piece.com/story/marineford/index.html): broad narrative context.
- [Episode 459](https://one-piece.com/anime/459/index.html): Ace approaches the execution platform; basis for the intact starting state.
- [Episode 461](https://one-piece.com/anime/461/index.html): Whitebeard's coated ships appear inside the bay. This would require an explicit arrival state, rather than ships permanently placed in the pre-arrival harbor.
- [Episode 474](https://one-piece.com/anime/474/index.html): the encircling walls, melting ice and destruction of Moby Dick are later developments. They cannot be ambient decoration in the intact state.
- [Episode 459 screenshot index](https://simkl.com/anime/38636/one-piece/episode-459/screenshots/): inspected architectural views listed above.
- [Marineford geography](https://onepiece.fandom.com/wiki/Marineford): secondary location cross-check; visual interpretation takes priority over unsourced diagram precision.

Some official pages reject direct retrieval; indexed official summaries were readable. Final later-event cards still need their specific episode verified. The official arc index extends through aftermath and flashbacks; that full range does not mean every scene occurs on this island.

## Build sequence

1. **Scale blockout:** crescent, bay, plaza, headquarters, scaffold terrace, four pinnacles and one vessel. Review approach, scaffold and facade at 1440×900, 390×740 and 320×568. Fix proportions before town detail.
2. **Architecture:** original tapered fortress, separate balconies and roofs, raised vector lettering, properly braced scaffold and connected stairs. Test close views and shadows before mass duplication.
3. **Environment:** district houses, alleys, vegetation pockets, seawall joints, cannon carriages, bollards, flags and fleet. Use detail hierarchies: one hero vessel, several medium silhouettes, simplified distant ships.
4. **Lighting:** diffuse Cycles bake to a shared 4096 atlas, preserve source corner normals, prioritize facade/scaffold/vessel texels. Check roof edges and sail fronts; export only attributes used by the unlit runtime.
5. **Experience:** fourteen sourced cards, measured camera framing, continuous approach route and atlas integration. The atlas stays informational until a working model exists.
6. **Review and cost measurement:** all landmarks on desktop and phone, normal travel and reduced motion, failed asset recovery, cached return and cross-island regressions. Record actual bytes, geometry and whole-frame rendering separately from budgets.

## Mobile, motion and rendering design

Fit each landmark into the measured region between header, story and dock. Author a closer facade composition and a separate full-fortress overview; scaling the entire headquarters behind a card is insufficient. Phone stories should keep source and next action on one row where needed, with 44px targets, readable copy and no inner scrollbar. Check 360×640 and 844×390 as well as the blockout sizes; enlarged text needs a complete accessible reading flow.

Route focus changes around pinnacles and above town roofs. Keep a lower unobstructed harbor path for the arrival. Test intermediate positions for arbitrary landmark jumps and rapid changes. Return, Escape, reverse scroll and downward swipe restore the saved journey. Only initial/scene changes use the sea/cloud loader.

Use bounded vertical bob for ships, individually checked full envelopes and appropriate water displacement. Static architectural depth should exclude moving ships and flags. One pooled flag/water system is preferable to independent expensive effects on every vessel. No automatic tsunami, endlessly firing cannons or permanent battle particles. A future frozen-bay state must explicitly replace/mask water in the same region; it needs independent camera, ship-height and depth checks.

## Initial budgets — targets, not measurements

| Resource | Proposed target |
| --- | --- |
| Static triangles | 220k–280k: fortress/pinnacles 80k, harbor/plaza 45k, town 55k, scaffold/ships/detail 100k maximum |
| Spatial batches | 60–90; merge repeated distant ship/cannon families by district |
| Download | 16–22 MiB, reviewed after bake |
| Atlas | One 4096px image; about 85.3 MiB decoded RGBA with mipmaps |
| Whole-frame balanced calls | Under 100 at focused landmarks; report moving-camera depth pass separately |
| Ambient particles | None required for the intact first state |
| Fleet rendering | One detailed ship plus distance tiers; shared geometry/materials, not many unique large textures |

If the atlas or geometry cannot support close-view clarity, reduce unseen/repeated detail and improve UV allocation before adding another 4096 texture. Hidden objects still occupy memory. Physical-phone FPS, context loss and high-quality rendering remain future measurements; this plan makes no performance guarantee.

## Implementation decisions, 26 October

The authored bay radius is 150 units at Z=130, preserving more open plaza behind it; the outer radius remains 310. The headquarters reaches approximately Y=230. The fleet uses one detailed flagship and 24 reduced-detail vessels, not a claim to reproduce all fifty warships.

Additional episode 459 stills were inspected: [stair behind Sengoku](https://simkl.in/episodes/45/4563218d77e4e15cb_w.webp), [stair behind Ace](https://simkl.in/episodes/45/45632240a5532860f_w.webp), and [Aokiji’s chair](https://simkl.in/episodes/45/4563190fec57153f6_w.webp). The stairs establish the approach, and the chair confirms gold scrollwork and purple upholstery. Hidden joinery and chair ornament remain simplified original interpretation. The frontal headquarters reference supplies roof and ship silhouettes; exact vessel stern geometry is authored.

The first visual review covered approach, scaffold and facade at desktop, 390-pixel and 320-pixel phone widths before the final bake. It prompted a connected headquarters stair, grounded foundation and more irregular rock pinnacles. See the implementation notes for final review results.
