# Credits and provenance

## Original application assets

Alabasta, Water 7 and Enies Lobby geometry, interface icons, ocean shaders, scene layouts and interactions were authored for this project. Architecture uses the references below. Layouts are interpretive and distances are compressed. No third-party One Piece model or promotional still is shipped as site artwork.

## Water 7

- [Official Water Seven summary](https://one-piece.com/story/water_seven/index.html): crew arrival, ship repairs, Franky Family, Iceburg and the pursuit of Robin.
- [Official Enies Lobby summary](https://one-piece.com/story/enies_lobby/index.html): later local events and departure aboard the Sunny, described in the Scrap Island story.
- [Water 7 overview](https://onepiece.fandom.com/wiki/Water_7) and [location index](https://onepiece.fandom.com/wiki/Category:Water_7_Locations): secondary naming and layout references.

The fourteen-stop city is an original compressed interpretation of the historical arrival setting. Exact bearings, dock ordering and secondary building proportions are illustrative. The Merry appears at the arrival waterfront; the Sunny is described as a later event. The Sea Train, Bull boat and station buildings are simplified original models. Enies Lobby is not included in this island. The static city uses a shared Cycles diffuse lighting atlas and 54 spatial batches; see [implementation notes](WATER-7-IMPLEMENTATION.md).

Modeled lettering uses Helvetiker by MAGENTA Ltd. (2004), bundled with Three.js under the [MgOpen font license](licenses/helvetiker.txt). No outside textures or extracted game geometry were used for Water 7.

## One Piece references

One Piece and its characters are the work of Eiichiro Oda and belong to their respective rights holders. This is an independent fan project, not an official product.

- [Alubarna anime reference still](https://staticg.sportskeeda.com/editor/2023/12/bacc4-17040164674071-1920.jpg) — used to study the plateau, staircase, pale city, palace ornament and gold domes. Research copy is excluded from Git and the public site.
- [Alubarna, One Piece Wiki](https://onepiece.fandom.com/wiki/Alubarna) — secondary layout reference.
- [Official episode 105](https://one-piece.com/anime/105/index.html) — arrival at Rainbase.
- [Official episode 125](https://one-piece.com/anime/125/index.html) — the clock tower and Pell.
- [Official episode 126](https://one-piece.com/anime/126/index.html) — Crocodile's defeat and the returning rain.
- [Official episode 129](https://one-piece.com/anime/129/index.html) and [official arc-conclusion article](https://one-piece.com/news/o20210709_12783/index.html) — Vivi and the crew's farewell.

The narrative descriptions are original short summaries, not copied episode text.

## Expanded island and world chart

- [Official episode 93](https://one-piece.com/anime/93/index.html): arrival and supplies at Nanohana. The Going Merry is placed at the arrival waterfront; the farewell is a separate Sandora River stop.
- [Official episode 103](https://one-piece.com/anime/103/index.html): the crew reaches drought-stricken Yuba.
- [Sandora River](https://onepiece.fandom.com/wiki/Sandora_River), [Erumalu](https://onepiece.fandom.com/wiki/Erumalu), [Katorea](https://onepiece.fandom.com/wiki/Katorea): secondary references for the inland route, ruined oasis and rebel relocation.
- [Red Line](https://onepiece.fandom.com/wiki/Red_Line), [Grand Line](https://onepiece.fandom.com/wiki/Grand_Line), [Calm Belt](https://onepiece.fandom.com/wiki/Calm_Belt): secondary world-geography references. Each selectable chart location also links to its individual reference.

The world-chart illustration is the user-supplied [OnePiece15 Map.png](../OnePiece15%20Map.png), used at the user's request. The app ships an overview and lossless full-resolution tiles derived from that image, preserving its artwork and embedded attribution. The illustration's authorship is not claimed by this project. Interactive pins are traced to its locations; the optional route overlay and navigation controls are authored for this app. Alabasta, Water 7 and Enies Lobby have implemented 3D islands; the remaining locations have informational entries. Uncharted destinations are listed without pins.

## Environment

[Potsdamer Platz HDRI](https://polyhaven.com/a/potsdamer_platz), Poly Haven, CC0. Distributed locally as `public/environment/city.hdr`, sourced from the [Drei asset mirror](https://github.com/pmndrs/drei-assets/tree/master/hdri). Used for the Log Pose's environment reflections.

## Typography and software

Cinzel, DM Sans and IBM Plex Mono, distributed via Fontsource under the SIL Open Font License. Font package license texts are included in [licenses/](licenses/). Dependencies retain their own licenses in their installed packages and lockfile provenance.

Blender is used only as a development asset tool. Its executable is not included in the Git repository or production website.

## Investigated but not used

[Alabasta Harbor by Cyrone](https://sketchfab.com/3d-models/alabasta-harbor-f28d97d8380e497b9e3b705c8049e23e) was listed with a Creative Commons Attribution license. It was not downloaded or incorporated because this milestone centers on the capital.


## Expanded atlas review — 17 October 2026

The illustration supplies names and marker positions across all four seas, Paradise, and the New World. An illustrated position is not a claim of a confirmed manga coordinate. Incidental places have chart descriptions instead of invented histories. Laugh Tale, All Blue, the Great Kingdom, Emerald City, Nakrowa, and Dias are directory-only entries with unknown positions. Merveille is identified as a film location. Moving places such as Zou, Germa, and Weatheria use illustrative positions.

Story descriptions include manga spoilers. New World coverage reaches Elbaph, using a dated review rather than an unsupported promise of chapter-by-chapter currency. Sources checked:

- [Official Egghead summary](https://one-piece.com/story/egghead/index.html): Egghead, Kuma and Bonney, the broadcast and escape, and the Nefertari connection.
- [Official Dressrosa summary](https://one-piece.com/story/dressrosa/index.html): the liberation and Grand Fleet.
- [Official Elbaph / Warland material dated 9 October 2026](https://one-piece.com/news/82672/index.html): current arc, Warland and Loki.
- [Official news index](https://one-piece.com/news/index.html): ongoing publication context; preview notices are not treated as released chapters.
- [Location directory](https://onepiece.fandom.com/wiki/List_of_Locations): naming, aliases, and unknown-position distinctions, cross-checked against the user-supplied illustration.

The voyage loader is original SVG/CSS artwork. Clouds drift at different speeds, the ship travels and bobs, and layered waves move beneath it. Reduced-motion mode keeps a static scene and short transitions; animations pause while the overlay is hidden.

### Water 7 visual revision references

Viewed reference stills (research copies remain excluded from the public site):

- [Franky House exterior](https://vignette3.wikia.nocookie.net/onepiece/images/4/42/Franky_House_Infobox.png/revision/latest?cb=20130718145910&path-prefix=pl): green frontage, purple framing, swept blue roof, gold crescent, articulated claw arms, windmill and water tank.
- [Galley-La headquarters](https://3.bp.blogspot.com/-pI3mBcWyDos/UaGSNBt1psI/AAAAAAAARV4/MEk9RtGjGhM/s1600/Quartel-General%2Bda%2BGalley-La.png): pale towers, crenellations, round windows and the arched front loggia.
- [Water 7 city view](https://pbs.twimg.com/media/HAq-YyKbAAEGTx1.jpg): broad built-up slopes, numbered water gates, cascading channels and the tiered fountain silhouette.
- [Puffing Tom exterior](https://static.wikia.nocookie.net/onepiece/images/3/3f/Puffing_Tom_Infobox.png/revision/latest/scale-to-width-down/1200?cb=20220701185753): green boiler, red/brown cab, brass details and passenger train proportions.

These stills are visual reference material, not verified dimensioned plans. Detailed building placement remains illustrative.

## Enies Lobby

The exterior island is an original stylized rescue-era reconstruction with compressed distances. Exact dimensions, secondary facades and town buildings are interpretive. No reference images or extracted models are bundled. Lettering uses the Helvetiker license above. See [implementation notes](ENIES-LOBBY-IMPLEMENTATION.md).

Visual references inspected:

- [Annotated OPwiki overview](https://opwiki.org/images/Enies_Lobby_karte2.JPG): separated landmasses, causeway, courthouse, tower and waterfall geography; a secondary schematic.
- [Tower still posted by OnePieceAnime](https://x.com/OnePieceAnime/status/1166062900794077191): stepped facade, green ornament, balconies and integrated lettering.
- [Entrance still, episode 263](https://www.opgt.it/files/gallerie/tv/Ep_263/068.jpg): keyhole opening, white/gold towers and green gate panels; anime still hosted by a third party.
- [Gates of Justice still](https://vignette.wikia.nocookie.net/onepiece/images/4/4d/Enies_Lobby%27s_Gate_of_Justice.png/revision/latest?cb=20160307220939&path-prefix=pt): rounded leaves, scale, seam and emblem.
- [Bridge cross-section repost](https://x.com/hamaboh_manga/status/1795616665230787048): supported spans and below-water approach; secondary source.
- [Enies Lobby location reference](https://onepiece.fandom.com/wiki/Enies_Lobby): secondary place naming and adjacency.

Original short narrative summaries link to official episodes [263](https://one-piece.com/anime/263/index.html), [264](https://one-piece.com/anime/264/index.html), [272](https://one-piece.com/anime/272/index.html), [278](https://one-piece.com/anime/278/index.html), [285](https://one-piece.com/anime/285/index.html), [306](https://one-piece.com/anime/306/index.html), [308](https://one-piece.com/anime/308/index.html) and [310](https://one-piece.com/anime/310/index.html). Geographic stops without a precise event use a historical-setting label. The Merry appears only at the remembered escape viewpoint.


## Thriller Bark

An original, compressed arrival-era ship with three masts, outer hull, ruined inner wall, forest, two mansions and four interpreted room cutaways. The Thousand Sunny and static Oars figure are original stylized geometry. Exact distances, room footprints and secondary details are artistic choices; later battles remain narrative memories. No extracted models, anime textures or song recordings are bundled. Lettering uses the Helvetiker license listed above.

The [research plan](THRILLER-BARK-PLAN.md#inspected-evidence) links the inspected anime stills: whole ship and arrival, Hogback exterior/laboratory, mast mansion, Wonder Garden, Perona's room, chapel, forest/cemetery and Oars' icy chamber. Research images remain excluded from production assets. See [implementation notes](THRILLER-BARK-IMPLEMENTATION.md).

Short original stories reference the [official arc summary](https://one-piece.com/story/thriller_bark/index.html) and episodes [339](https://one-piece.com/anime/339/index.html), [340](https://one-piece.com/anime/340/index.html), [342](https://one-piece.com/anime/342/index.html), [345](https://one-piece.com/anime/345/index.html), [350](https://one-piece.com/anime/350/index.html), [358](https://one-piece.com/anime/358/index.html), [361](https://one-piece.com/anime/361/index.html), [362](https://one-piece.com/anime/362/index.html), [374](https://one-piece.com/anime/374/index.html), [377](https://one-piece.com/anime/377/index.html) and [380](https://one-piece.com/anime/380/index.html). Unsurveyed event clearings are explicitly illustrative.

## Sabaody Archipelago

Original compressed geometry depicts the intact first-arrival groves, with later separation and reunion recalled in short stories. The [research plan](SABAODY-PLAN.md#reference-inspection) identifies inspected grove, bar, auction and park images and their hosts. Reference images and extracted assets are not bundled. Secondary architecture, distances and room footprints are interpretations; lettering uses the Helvetiker license listed above.

Stories refer to the [official arc summary](https://one-piece.com/story/sabaody/index.html), [official episode listing](https://one-piece.com/anime/index.html?category=sabaodyarchipelago&page=1&sort=asc), [auction episode 394](https://one-piece.com/anime/394/index.html) and [departure episode 522](https://one-piece.com/anime/522/index.html). The [secondary geography reference](https://onepiece.fandom.com/wiki/Sabaody_Archipelago) supplied grove numbering. See [implementation notes](SABAODY-IMPLEMENTATION.md) for scope and measurements.
