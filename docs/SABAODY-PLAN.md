# Sabaody Archipelago — plan, 25 October 2026

Implemented and refined on 25–26 October 2026. See [implementation notes](SABAODY-IMPLEMENTATION.md) for delivered scope, measured costs and verification limits.

## Composition and historical state

Build an airy jade-and-ivory diorama: enormous fluted blue-green mangroves, exposed arching roots, moss platforms, turquoise channels, pastel domed buildings and iridescent resin bubbles. Preserve the numbered grove system. Eight connected clusters represent the map's 0/10/20/30/40/50/60/70 divisions; 79 numbered trees are authored, with deliberate foreground clearings for landmarks. Coordinates, heights, secondary buildings and distances are compressed artistic choices.

The physical setting is intact first-arrival Sabaody. The Sunny is moored at Grove 41. Grove 12 remembers the separation; Grove 42 remembers the later reunion in text. Do not add simultaneous combat, destruction, a duplicate Sunny or a false present-day reconstruction.

## Planned views

1. Grove 41 arrival waterfront and Sunny.
2. Yarukiman mangrove: full trunk, buttresses, numbered bark and crown.
3. Bubble transport landing, with rooted approach and rental fittings.
4. Shakky's bar, Grove 13: rounded stone base, tall green dome, window band, moss and supported wooden sign.
5. Grove 1 auction house: broad layered roof, timber gable, curved turquoise facade, columns and projecting balconies.
6. Auction hall cutaway: stage and seating, kept clear of the removed shell. No people sold as decorative props.
7. Lawless streets, representing Groves 20–29.
8. Grove 12 clearing: a quiet story of the crew's separation.
9. Sabaody Park: pastel gate, turrets, layered sign and looped ride track.
10. Bubble Ferris wheel: slow rotation with level gondolas and reduced-motion support.
11. Tourist shops, Groves 40–49: small arcades, awnings and souvenirs.
12. Coating yards, Groves 50–59: scaffolds, resin equipment and an unfinished vessel.
13. Marine district, Grove 66: restrained original government-port architecture.
14. Hotel district, Groves 70–79: terraced domed lodging and waterfront paths.
15. Grove 42 pier: the reunion and underwater departure recalled in text.
16. Archipelago overlook: all districts and complete mangrove canopy silhouette.

## Reference inspection

Inspected locally: [anime grove panorama](https://m.media-amazon.com/images/M/MV5BZjRlZWNlMTQtYzk3NS00NmZmLWFiNmItZTA5OTFlNTY3NzI0XkEyXkFqcGc%40._V1_.jpg), [grove zoning diagram](https://vignette.wikia.nocookie.net/onepiece/images/4/4c/Map_of_Sabaody_Archipelago.png/revision/latest?cb=20130125210806), [Shakky exterior](https://i.pinimg.com/originals/d5/07/45/d507455981fe7827c55f46359eb0949a.png), [auction house still](https://4.bp.blogspot.com/-TvWCcJbbeX0/UaEgsmzOZgI/AAAAAAAAROQ/dDkVrXXUJhU/s1600/Casa%2Bde%2BLeil%C3%B5es%2BHumanos.png), [park still](https://images.everyeye.it/img-singole/articolo-110589.jpg), and [wide illustrated overview](https://staticg.sportskeeda.com/editor/2025/01/dea90-17362862595357-1920.jpg). These third-party hosted references are research only, not production textures. Geometry is original. Secondary stores, hotels, Marine port and room footprints are interpretations rather than exact surveyed architecture.

Story sources: [official Sabaody overview](https://one-piece.com/story/sabaody/index.html), [official episode listing](https://one-piece.com/anime/index.html?category=sabaodyarchipelago&page=1&sort=asc), [394](https://one-piece.com/anime/394/index.html), [522](https://one-piece.com/anime/522/index.html). Official summaries establish the coating search, auction rescue, Rayleigh, separation and later departure. The [secondary geographic reference](https://onepiece.fandom.com/wiki/Sabaody_Archipelago) clarifies grove numbers. Some direct official pages rejected automated access; indexed official text was available. Avoid asserting uncertain episode-specific architecture.

## Build and validation

Shared layout drives models, markers and measured-rectangle camera framing. Use an independent baked GLB with spatial batches, a separately moving Sunny and an instance-local auction cutaway. Preserve split normals during welding and explicit UV margins from the established pipeline. Allow OptiX acceleration with CPU fallback.

Targets: 120k–220k triangles, 45–85 spatial/visibility batches, 10–16 MiB GLB, one 4096px lighting atlas. These are targets, not measurements. Cap bubbles at 48 lightweight instances, without full-screen refraction or a separate render target for each bubble. Wheel motion uses a shared pivot and separately level gondolas. Balanced quality remains default; reduced motion freezes ambient travel.

Review every final landmark on desktop and phone. Check five existing viewport sizes, full story actions with no nested scroll, long title fit, waterline and swept ship bounds, canopy occlusion, clear signage, actual scene-only transitions, preserved return progress, missing-asset recovery and cached cross-island entry. Record measured geometry/bytes/frame calls separately from physical-device FPS, which cannot be established by browser emulation. Keep the private island rulebook local.
