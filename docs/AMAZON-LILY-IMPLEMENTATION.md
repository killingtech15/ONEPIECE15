# Amazon Lily implementation

26 October 2026. Original compressed diorama of the Kuja homeland during Luffy's first visit. The atlas now offers Amazon Lily as a working 3D destination. Impel Down remains a separate plan.

## Model and scope

Twelve viewpoints cover the island approach, serpent monument, jungle clearing, village threshold, river bridges, streets, Kuja Castle, cliff galleries, arena, fighting platform, Perfume Yuda and valley overlook.

The model includes a continuous hollow mountain, an enclosed valley, nine original serpent sculptures, authored vector 九蛇 lettering, a connected river/inlet, a water gate, forest shelves, varied one/two-storey houses, upturned roof profiles, lattice facades, lanterns and market props. The palace has a broad open forecourt, central staircase, tiered hall, side pavilions, circular lower windows and supported cliff galleries. The arena has tiered seating, a raised platform, a dry surrounding drop and a separate royal canopy.

Perfume Yuda has a curved dark hull, red trim, gunports, railings, a deckhouse, two masts, three battened curved sails, rigging, an original Kuja-style emblem and two green Yuda with collars and connections to the ship. Its authored mooring is offshore; the entire vessel/animal group has bounded vertical motion of ±0.06 units. It remains outside the static ocean-depth layer.

No character combat, crowds, palace interior, Gloriosa cottage or Rusukaina model is included. The arena seating count, access arrangement, gate construction, secondary streets and exact distances are interpretations. Additional references are still needed before calling those details a screen-exact reconstruction. This scene preserves first-visit architecture; later destruction and incompatible ships are absent.

## Reference review

The [research plan](AMAZON-LILY-PLAN.md) links the inspected exterior panorama, inner-valley aerial, palace facade and ship profile. Research imagery is excluded from production assets; the meshes, vector lettering and emblem are authored geometry.

Additional inspected episode 412 frames hosted by SIMKL establish:

- [Red columns, white infill and a violet eave underside](https://simkl.in/episodes/45/4567872cc525aefad_w.webp).
- [Pale stepped arena seating, a stair aisle and lower red doorway](https://simkl.in/episodes/45/456790214f6d14a4f_w.webp).
- The previously inspected [arena edge](https://i.sstatic.net/dVIKF.png) shows rock walls and pointed elements below the seating. The pictured green-haired fighter is Sandersonia; an image-search caption incorrectly named Hancock.

These are partial architectural views, not a dimensioned arena plan. A second complete ship angle and detailed water-gate elevations remain unresolved. Short original stories link to official episodes 408, 409, 411, 413, 415 and 417, with geographic/architectural labels where no specific event is asserted. The [official arc summary](https://one-piece.com/story/amazon_lily/index.html) supports the infiltration, sisters' confrontation and change in Hancock's judgment.

## Integration and camera behavior

`amazon-lily-layout.json` owns landmark targets, desktop/phone directions, fitting radii, journey waypoints, palace, arena, river and vessel positions. The model uses sea level Y=0. Bridges cross the carved river instead of following its tangent; the dry arena floor remains above the ocean.

The shared measured camera has an optional `travelClearance` setting. Amazon Lily rises above its enclosing mountain before traversing to another focus position, then descends into the authored view. Return rises before rejoining the journey. Existing islands omit this setting and retain their focus behavior. Phone views reserve the actual header/story/dock space, with independent angles where the serpent crown blocks a desktop approach.

Atlas-first entry, brand return, scene-only travel loaders, Escape/return/reverse-wheel/downward-swipe behavior and cached model re-entry remain in place. Story changes, water settings and camera moves do not invoke a loader. Calm Belt water uses 0.12 of the usual displacement amplitude and 0.2 of its wave speed. Reduced motion stops waves and ship bob; Still waters stops the vessel's bob.

## Measured asset costs

Final baked asset, 26 October 2026:

| Measurement | Result |
| --- | ---: |
| GLB bytes | 15,347,560 |
| GLB size | 14.64 MiB |
| Static triangles, including vessel | 206,945 |
| Spatial batches | 64 |
| Lighting atlas | One 4096 × 4096 image |
| Decoded RGBA atlas + mip estimate | 85.3 MiB; excludes geometry and other GPU resources |
| Sampled balanced desktop idle frames | 23–65 calls across six viewpoints |
| Sampled normal-motion travel frames | Up to 127 calls, including refreshed ocean depth |

The initial source was 259,212 triangles. Lower-cost canopy clusters, roof ribs and terrain tessellation brought the final model within the planned 150k–210k triangle range while preserving the main silhouettes. Spatial grouping uses approximately 120-unit sectors. Geometry and texture resources stay cached after entry; this is not district streaming or mobile LOD.

Idle-frame samples were taken in headless Chrome at 1440 × 900, balanced quality, with all render calls accumulated across the frame. Three normal-motion travel windows reached 127, 75 and 73 calls respectively. Static ocean depth is reused at rest; wide travel can exceed the under-100 planning goal because it refreshes that pass. No measured FPS or physical-phone performance claim is made.

Source geometry bounds for the complete vessel/animal group are X 239.46–270.54, Y -3.77–82.02, Z -302.45–-200. The full projected envelope clears the global above-water terrain radius by at least 20.26 units and the pier's ship-facing side by 11.46 units. Vertical-only bob preserves these horizontal clearances. Review captures additionally check the visible waterline and mooring connection.

## Verification and remaining limits

- Every final landmark reviewed at 1440 × 900 and 390 × 740. Layout assertions also cover 360 × 640, 320 × 568 and 844 × 390, with no internal story scrolling and complete actions.
- Final Amazon Lily tests cover all twelve cards, scene navigation, loader boundaries, reverse-wheel return, failed-model recovery, ship layers/bob, wave settings, sampled camera clearance over terrain/sculptures, normal-motion touch return, cached re-entry and reduced motion.
- Map, Sabaody and Thriller Bark regression checks passed after the shared camera and ocean changes.
- Corrected during review: sparse jungle, unsupported galleries, a serpent obstructing the village approach, trees touching the gate, bridge orientation, sail winding and the missing upper sail.
- Screenshots, source GLBs, Blender files and raw measurements are retained in ignored working directories.

Physical Android/iOS frame rates, browser-toolbar resizing, enlarged system text, long-session GPU memory, GPU context-loss recovery and high-quality rendering cost need separate testing. Source-based camera clearance samples complement visual review; they do not constitute exhaustive collision verification for every possible rapid-input sequence.

## Rebuild

```sh
node scripts/build-amazon-lily.mjs --source
blender --background --threads 6 --python scripts/bake-amazon-lily.py
blender --background --threads 6 --python scripts/denoise-amazon-lily.py
npm run build
```

The static geometry uses Cycles diffuse color, direct/indirect lighting, 96 samples and OIDN cleanup, then an unlit runtime material. Split corner normals survive welding; UV packing has explicit margins and higher weighting for architecture. Opposing sail surfaces have outward-facing winding and distinct depth so they do not bake each other black. Running the builder without `--source` exports a quick vertex-lit preview and must be followed by the bake before release.
