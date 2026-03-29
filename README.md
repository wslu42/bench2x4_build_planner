# Bench2x4

A small React app for planning fixed 2x4 furniture builds.

It is designed around one constrained build system instead of freeform modeling: you enter outer dimensions, and the app derives board counts, frame layout, cut lengths, stock usage, shopping list cost, and orthographic previews.

The current landing view opens on the gallery first, where example builds can be loaded directly into the planner.

## What It Supports

- `Bench`
- `Shelving`

## What It Does

- Opens with a gallery of example builds and photos
- Lets gallery photos open in a larger preview
- Loads gallery presets directly into the planner
- Generates `top / side / front / assembly` previews
- Calculates a cut list from fixed 2x4 rules
- Optimizes cuts against `8 ft` stock boards
- Estimates screws from rail-to-leg joints
- Produces a shopping list with default cost assumptions

## Current Assumptions

- Material: actual `2x4 = 1.5" x 3.5"`
- Stock length: `96"`
- Saw kerf: `1/8"`
- Frame spacing is derived from `Max Span`
- `Max Span` means the unsupported clear span between adjacent frames
- Planner default `Max Span` is `48"` with a minimum of `6"` and `6"` stepping
- The planner opens to `Assembly` view by default
- Loading any gallery build also opens the planner in `Assembly` view using `solid` fill mode

## Shelving Modes

Shelving supports two frame modes:

- `H-frame`: front and rear legs both run full height
- `P-frame`: rear legs are cut off below the lowest shelf board, while front legs remain full height

## Shelving Assembly View Rules

The shelving assembly preview intentionally differs from the bench assembly preview in two ways:

- Front legs extend `1.5"` above the top shelf board in `Assembly` view only
- Front legs render above the top shelf board, so the front posts remain visually dominant in the stacked shelf view

Bench assembly keeps the opposite behavior: top boards remain above the front legs and the legs are not extended.

## Pricing Defaults

The shopping list currently uses static default pricing:

- `2x4 x 8ft`: `$4.15` each
- `Screw`: `$0.06` each

Reference pages:

- Home Depot 2x4 stud: https://www.homedepot.com/p/2-in-x-4-in-x-96-in-Premium-Burrill-Fir-Stud-1000020053/206262176
- Amazon screw listing: https://www.amazon.com/dp/B0C23LJ6LJ?th=1

These are reference defaults only. Retail pricing can vary by store, region, and time.

## Run Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Project Structure

- [`src/App.tsx`](./src/App.tsx): UI, preview rendering, material tables
- [`src/domain.ts`](./src/domain.ts): geometry, formulas, stock optimization
- [`src/styles.css`](./src/styles.css): layout and visual styling
- [`src/gallery_asset`](./src/gallery_asset): gallery photos used by the example build page

## Docs

- [Product Requirements](./docs/PRD.md)
- [Information Architecture](./docs/information-architecture.md)
- [Wireframes](./docs/wireframes.md)
- [Data Model And Formulas](./docs/data-model-and-formulas.md)
- [Engineering Notes](./docs/engineering-notes.md)
- [Testing Checklist](./docs/TESTING.md)

## Notes

This project is intentionally parameter-based. It does not aim to support:

- drag-and-drop modeling
- arbitrary joinery systems
- freeform furniture design

The value of the tool is consistency: one repeatable 2x4 system, fast iteration, and predictable material output.
