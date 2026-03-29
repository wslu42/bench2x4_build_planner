# Engineering Notes

## Rendering Approach

- Use SVG for all three orthographic views
- Keep geometry generation independent from rendering
- Normalize units to inches in calculations
- Apply display scaling only in the SVG layer
- Treat floor datum as the vertical origin for side and front views

## Suggested Module Split

- `src/domain/constants.ts`
- `src/domain/types.ts`
- `src/domain/derive-top-surface.ts`
- `src/domain/derive-shelving.ts`
- `src/domain/build-parts.ts`
- `src/domain/optimize-stock.ts`
- `src/domain/build-views.ts`

## Preview Strategy

- Top view should show board rhythm and H-frame positions
- Side view should make the vertical logic obvious, including bottom rail clearance
- Front view should stay clean and diagrammatic
- Side and front views should show an explicit floor datum line

## UX Notes

- Recalculate on every input change
- Show invalid-state messaging early
- Keep the app usable on desktop first, mobile second
- Prioritize dimension readability over photorealism

## Future Extensions

- Preset saving
- PDF export
- Print layout
- Board price estimation
- Alternate stock lengths
- Alternate kerf values
