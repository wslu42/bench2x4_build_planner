# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- MIT `LICENSE`
- Gallery page with example build cards and real photos from `src/gallery_asset`
- Bilingual gallery promo card above the example builds
- Click-to-preview gallery lightbox with `Load This Build`
- Shopping List with default pricing and total estimate
- Board Optimization proportional bars and waste summary
- Screw count estimation and screw markers in preview
- Domain-level guard rails with input normalization
- `Frame Mode` for shelving with `H-frame` and `P-frame` options
- Cut list support for `rear-leg` parts in shelving `P-frame` builds
- Shelf sub-modes: `Fixed Shelf`, `Adjustable Shelf`, and `Hybrid Shelf`
- Adjustable shelf presets and explicit opening-based shelf layout derivation
- Domain-level section/layout output so previews and material calculations can share shelf geometry
- Hybrid shelf section controls, shared center-frame material logic, and a gallery preset

### Changed

- Unified project naming to `justuse2x4`
- Landing page now opens on `Gallery`
- Bench and Shelving defaults refined for height, clearance, max span, gallery presets, and default view
- Material output reorganized into Shopping List, Cut List, Board Optimization, and Waste Summary
- Preview layout, legends, dimension labels, in-canvas warning placement, and gallery card interactions refined
- Planner and gallery-loaded builds now open directly into `Assembly` view with `solid` fill
- Preview fill toggle now uses `solid / see-thru`
- `Assembly` see-thru mode now uses 50% transparency for orange boards and tan legs while keeping blue rails opaque
- Bench and shelving assembly rendering order was refined to improve front/back leg, rail, and board overlap
- Shelving assembly rendering is now grouped by shelf level so rails and boards layer together per tier
- `Assembly` now uses an in-canvas control card for dimensions, show/hide toggles, and explode control
- `Assembly` replaced the separate exploded view and now owns explode controls directly
- Gallery shelf examples now default to `P-frame`
- Gallery assets were relinked and resized to lighter `.jpg` files for faster loading
- App footer now shows copyright and MIT license text
- Planner furniture hierarchy now uses `Bench` plus `Shelf` sub-modes instead of a flat bench/shelving split
- Existing shelving presets now map into the new `Fixed Shelf` model

### Fixed

- GitHub Pages production asset base path and deployment workflow
- Gallery image imports and TypeScript asset typing
- Multiple orthographic view geometry, overlap, and annotation issues across Bench and Shelving modes
- Shelving assembly now restores missing vertical legs and applies shelving-only special rules consistently:
  front legs extend `1.5"` above the top shelf in assembly view and front legs render above the top shelf board
- `P-frame` rear-leg cutoff now aligns with the lower rail zone instead of over-trimming the rear leg
- Preview warning copy now reflects build constraints rather than collisions
