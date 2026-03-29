# Data Model And Formulas

## Core Constants

```ts
export const BOARD_THICKNESS = 1.5;
export const BOARD_WIDTH = 3.5;
export const DEFAULT_STOCK_LENGTH = 96;
export const DEFAULT_SAW_KERF = 0.125;
export const FLOOR_DATUM = 0;
```

## Core Domain Types

```ts
export type FurnitureType = "top-surface" | "shelving";
export type TopSurfacePreset = "bench" | "table";

export type CommonInputs = {
  length: number;
  depth: number;
  height: number;
  maxSpan: number;
  bottomRailClearance: number;
};

export type TopSurfaceInputs = CommonInputs & {
  furnitureType: "top-surface";
  preset: TopSurfacePreset;
};

export type ShelvingInputs = CommonInputs & {
  furnitureType: "shelving";
  shelfLevelCount: number;
};

export type AppInputs = TopSurfaceInputs | ShelvingInputs;
```

## Derived Geometry

```ts
export type FramePlacement = {
  index: number;
  xCenter: number;
};

export type DerivedGeometry = {
  frameCount: number;
  framePlacements: FramePlacement[];
  sideRailLength: number;
  legVerticalLength: number;
  boardCountPerLevel: number;
};
```

## Parts

```ts
export type PartGroup =
  | "vertical-leg"
  | "side-rail"
  | "top-board"
  | "shelf-board";

export type Part = {
  key: string;
  group: PartGroup;
  purpose: string;
  length: number;
  quantity: number;
};
```

## Optimization Output

```ts
export type AssignedCut = {
  partKey: string;
  length: number;
};

export type StockBoardPlan = {
  boardIndex: number;
  stockLength: number;
  cuts: AssignedCut[];
  kerfCount: number;
  usedLength: number;
  waste: number;
};
```

## Top Surface Formulas

```ts
const spanCount = Math.max(1, Math.ceil(length / maxSpan));
const frameCount = spanCount + 1;
const extraSupportHFrameCount = frameCount - 2;
const topBoardQty = Math.floor(depth / BOARD_WIDTH);
const topBoardLength = length;
const legVerticalLength = height - BOARD_THICKNESS;
const legVerticalQty = 2 * frameCount;
const sideRailLength = depth - 2 * BOARD_THICKNESS;
const sideRailQty = 2 * frameCount;
const bottomRailClearance = inputs.bottomRailClearance;
```

All vertical positions should be measured from `FLOOR_DATUM = 0`.

For vertical placement:

```ts
const bottomRailBottom = bottomRailClearance;
const bottomRailTop = bottomRailBottom + BOARD_THICKNESS;
```

## Shelving Formulas

```ts
const spanCount = Math.max(1, Math.ceil(length / maxSpan));
const frameCount = spanCount + 1;
const extraSupportHFrameCount = frameCount - 2;
const shelfBoardQtyPerLevel = Math.floor(
  (depth - 2 * BOARD_THICKNESS) / BOARD_WIDTH,
);
const shelfBoardLength = length;
const shelfBoardQtyTotal = shelfLevelCount * shelfBoardQtyPerLevel;
const legVerticalLength = height;
const legVerticalQty = 2 * frameCount;
const sideRailLength = depth - 2 * BOARD_THICKNESS;
const sideRailQty = 2 * frameCount * shelfLevelCount;
const bottomRailClearance = inputs.bottomRailClearance;
```

All vertical positions should be measured from `FLOOR_DATUM = 0`.

For vertical placement:

```ts
const lowestRailBottom = bottomRailClearance;
const lowestRailTop = lowestRailBottom + BOARD_THICKNESS;
const lowestShelfBottom = lowestRailTop;
const lowestShelfTop = lowestShelfBottom + BOARD_THICKNESS;
```

## Frame Placement Rule

For `frameCount >= 2`:

- First frame is at the left end
- Last frame is at the right end
- Intermediate frames are evenly distributed

Suggested implementation:

```ts
const step = frameCount === 1 ? 0 : length / (frameCount - 1);
const framePlacements = Array.from({ length: frameCount }, (_, index) => ({
  index,
  xCenter: index * step,
}));
```

The final drawing layer may offset these center values based on exact linework thickness.

## Kerf-Aware Used Length

If a stock board is cut into `n` pieces:

```ts
const kerfCount = Math.max(0, n - 1);
const usedLength = sum(cuts) + kerfCount * DEFAULT_SAW_KERF;
const waste = DEFAULT_STOCK_LENGTH - usedLength;
```

## Screw Estimate

For each rail board:

- Each end meets one vertical leg
- Each leg-to-rail joint uses `2` screws

So:

```ts
const estimatedScrewCount = sideRailQty * 4;
```

This estimate only covers `vertical leg` to `rail` joints.

## Recommended Part Keys

```ts
TOP_BOARD
SHELF_BOARD
VERTICAL_LEG
SIDE_RAIL
```

## Validation Guardrails

- `length > 0`
- `depth >= 3.5`
- `height > 0`
- `maxSpan > 0`
- `bottomRailClearance >= 0`
- If shelving: `shelfLevelCount >= 1`
- Derived board count must be at least 1 for a valid configuration
