# Bundled 3D Model Attribution

The model files in this directory are third-party visual assets. They are not
covered by the repository's MIT source-code license; each remains available
under the license listed below.

| File | Original work and creator | Source | License | Project modifications |
|---|---|---|---|---|
| `airplane.glb` | “boeing 747” by [zairiq-123](https://sketchfab.com/zairiq-123) | [Sketchfab model](https://sketchfab.com/3d-models/boeing-747-9b16672038ba48f98e6d80a159044ed9) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Substantially modified and optimized for God's Eye View, including geometry/material simplification and coordinate/orientation preparation. The former 24× runtime calibration is baked into the mesh; location, rotation, and scale are applied; the bounding-box centre is at the origin; and the model uses glTF +Y-up with its nose toward local −X. Geometry remains uncompressed so the aircraft asset does not compete with photogrammetry for Draco worker capacity. |
| `jet.glb` | “Private Jet” by [Nick the Name](https://sketchfab.com/Nick_The_Name) | [Sketchfab model](https://sketchfab.com/3d-models/private-jet-cbdd1de6ced9461e950eafaa302cc82b) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Repackaged as a glTF binary for the project's military-flight visualization. Imported hierarchy transforms are baked into the meshes; location, rotation, and scale are applied; the bounding-box centre is at the origin; and the model uses meter scale, glTF +Y-up, and the shared nose −X convention. Existing materials are preserved. |
| `ship.glb` | “Low Poly Cargo Ship” by [Javier_Fernandez](https://sketchfab.com/Javier.Fernandez) | [Sketchfab model](https://sketchfab.com/3d-models/low-poly-cargo-ship-4c22cbaf01c1427f8ab60b3a07b1b32c) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized and repackaged as a glTF binary for the project's vessel visualization. |
| `bell206.glb` | “Bell 206 JetRanger” by [terran4627](https://sketchfab.com/terran4627) | [Sketchfab model](https://sketchfab.com/3d-models/bell-206-jetranger-d2f7ba1d671549d4b26aaf834139a1dd) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures resized to 256 px WebP, orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |
| `c172.glb` | “Cessna 172” by [e737](https://sketchfab.com/e0057537) | [Sketchfab model](https://sketchfab.com/3d-models/cessna-172-64cddaee5aff470682659a8c08525046) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures resized to 256 px WebP, orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |
| `citation2.glb` | “1990 Cessna Citation, Texture Detailed, Exterior” by [BlenderCommunityHead](https://sketchfab.com/aboodgoudagad) | [Sketchfab model](https://sketchfab.com/3d-models/1990-cessna-citation-texture-detailed-exterior-a78839624fe64900a8352cb23462350a) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures resized to 256 px WebP, orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |
| `mq9.glb` | “MQ-9” by [IProZenoN](https://sketchfab.com/IProZenoN) | [Sketchfab model](https://sketchfab.com/3d-models/mq-9-fabe963feb354c5584b51f9c470c3f7e) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures resized to 256 px WebP, orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |
| `b789.glb` | “Boeing 787-9” by [Nobilis 2](https://sketchfab.com/nobilishornet2) | [Sketchfab model](https://sketchfab.com/3d-models/boeing-787-9-b6711e2e698e4e469675c1154a50b7a3) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures resized to 256 px WebP, orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |
| `atr72.glb` | “ATR 72 - 600” by [Oyan3D](https://sketchfab.com/oyan3D) | [Sketchfab model](https://sketchfab.com/3d-models/atr-72-600-1e1a7186f7444d288675262fcee44744) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | Optimized for God's Eye View: geometry/material simplification, textures removed with dominant material colors baked into PBR factors (flat “abstracted” style), orientation/scale vertex-baked to real-world meters (Y-up, nose −X), origin centered. |


## Flight Sim aircraft — DIFFERENT LICENCE, READ THIS

`flight-sim/boeing-747-8i.glb` is **GPL-2.0**, not CC BY. It is the only
copyleft asset in this repository and the only one whose licence imposes
obligations beyond attribution.

| File | Original work | Source | License | Project modifications |
|---|---|---|---|---|
| `flight-sim/boeing-747-8i.glb` | Boeing 747-8i, FlightGear community aircraft, redistributed by the FlightAirMap project | [FlightAirMap-3dmodels](https://github.com/Ysurac/FlightAirMap-3dmodels/tree/master/b748) | **[GPL-2.0](./flight-sim/boeing-747-8i.LICENSE)** | None to the mesh. Used verbatim as published. `boeing-747-8i.hinges.json` is generated alongside it by `scripts/extract-hinges.mjs` and is our own work. |

**Why it matters.** Every other asset here is CC BY 4.0: credit the author and
you are done. GPL-2.0 is copyleft — it carries source-provision obligations,
and whether bundling it into a distributed build makes that build a derivative
work is genuinely unsettled. For running God's Eye View locally this is a
non-issue. It becomes a real question if the project is relicensed, vendored,
or packaged commercially.

**Source provision.** `flight-sim/boeing-747-8i.blend` is the upstream Blender
source, kept beside the GLB so GPL §3 ('the preferred form for modification')
is genuinely satisfiable rather than theoretical.

**No trademark exposure.** The asset ships blank white textures with no airline
livery, so no carrier trade marks are redistributed. Upstream also publishes
real airline liveries — those are trade marks and are deliberately NOT bundled.

**Removing it.** Delete `public/models/flight-sim/` and Flight Sim reports
`AIRCRAFT MODEL UNAVAILABLE` rather than starting an invisible aircraft. No
other feature depends on it.

CC BY 4.0 permits sharing and adaptation, including commercial use, provided
appropriate credit is retained, the license is linked, and modifications are
identified. These credits do not imply endorsement by the original creators.
