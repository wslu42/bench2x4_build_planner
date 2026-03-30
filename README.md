# justuse2x4

A small React app for planning fixed 2x4 furniture builds.

Released under the [MIT License](./LICENSE).

It is designed around one constrained build system instead of freeform modeling: you enter outer dimensions, and the app derives board counts, frame layout, cut lengths, stock usage, shopping list cost, and orthographic previews.

The current landing view opens on the gallery first, where example builds can be loaded directly into the planner.

## Why am I building this
I built this because I genuinely think the humble `2x4` is one of the most underrated furniture materials on the planet.

It is structural lumber. Houses trust it to hold up roofs. That does not automatically make every 2x4 project elegant, but it does mean the raw material starts with a kind of honest, overqualified strength that most store-bought flat-pack furniture can only cosplay.

It is also refreshingly low drama to work with. You are usually dealing with straight cuts, repeated lengths, and pieces you can carry without wrestling a giant sheet across your garage like it is a boss battle. No giant plywood panels. No melamine dust storm. No moment where you realize you cut directly into the floor because you forgot a sacrificial board underneath.

I also like that 2x4 furniture ages with a little dignity. If you screw into it, ding it, drag it, overload it, or let it pick up a few scars, it still feels like the same object. A drywall hole feels like a mistake. A beat-up 2x4 feels like field data.

And then there is the practical part: `2x4s` are cheap, available almost everywhere, and easy to replace. If a design works, great. If a design needs revision, you are not emotionally trapped by a pile of expensive sheet goods and exotic hardware. You just cut another board and keep iterating.

There is also a materials philosophy here. A simple 2x4 build is basically wood plus screws. No laminated mystery layers. No plastic coating pretending to be wood grain. No glue-heavy panel products if you do not want them. Just a very understandable material system that is easy to inspect, easy to repair, and easy to explain.

So this project is my nerdy attempt to make that system easier to use. I wanted a planner that helps you think in the native language of `2x4` builds: outer dimensions, repeated frames, predictable spans, cut lengths, stock usage, and a shopping list you can trust before you even leave the house.


## What It Supports

- `Bench`
- `Shelving`

## What It Does

- Shows a bilingual gallery intro card above the example builds
- Opens with a gallery of example builds and photos
- Lets gallery photos open in a larger preview
- Loads gallery presets directly into the planner
- Generates `top / side / front / assembly` previews
- Uses a unified in-canvas preview layout across all views
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
- Gallery shelf examples default to `P-frame`

## Shelving Modes

Shelving supports two frame modes:

- `H-frame`: front and rear legs both run full height
- `P-frame`: rear legs are cut off below the lowest rail zone, while front legs remain full height

## Shelving Assembly View Rules

The shelving assembly preview intentionally differs from the bench assembly preview in two ways:

- Front legs extend `1.5"` above the top shelf board in `Assembly` view only
- Front legs render above the top shelf board, so the front posts remain visually dominant in the stacked shelf view

Bench assembly keeps the opposite behavior: top boards remain above the front legs and the legs are not extended.

## Assembly Preview Controls

The `Assembly` preview includes an in-canvas control card on the right side:

- `Dimensions`: `Depth / Height / Length`
- `Show / Hide`: toggle `Boards`, `Legs`, and `Rails`
- `Explode Amount`: controls the assembly separation amount

The fill toggle label in preview is:

- `solid`
- `see-thru`

In `see-thru` mode for `Assembly`, orange boards and tan leg/support members use `50%` opacity while blue rails remain opaque.

Build issues in preview are shown as an in-canvas `Build Constraint Warning`.

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

## License

MIT. See [LICENSE](./LICENSE).
