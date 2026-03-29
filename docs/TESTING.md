# Testing Checklist

## How To Run

```bash
npm.cmd install
npm.cmd run dev
```

Open the local URL shown in the terminal, usually `http://localhost:5173/`.

## Smoke Test

- [ ] App loads without console errors
- [ ] Furniture type switcher works
- [ ] Bench preset sets height to `11`
- [ ] Table preset sets height to `30`
- [ ] Changing any numeric field updates preview and output immediately

## Top Surface Geometry

Use:

- Furniture Type: `Top Surface`
- Preset: `Bench`
- Length: `72`
- Depth: `14.5`
- Height: `11`
- Max Span: `72`
- Bottom Rail Clearance: `0`

Check:

- [ ] Top view shows `4` top boards
- [ ] Top view left and right frame strips stay inside the preview
- [ ] Side view shows top board above the upper rail
- [ ] Front view shows a single top band, not individual top boards
- [ ] Part Summary shows leg length `9.5"`
- [ ] Part Summary shows rail length `11.5"`
- [ ] Derived Summary shows estimated screws `16`

## Shelving Geometry

Use:

- Furniture Type: `Shelving`
- Length: `72`
- Depth: `14.5`
- Height: `48`
- Shelf Levels: `3`
- Max Span: `72`
- Bottom Rail Clearance: `4`

Check:

- [ ] Boards per level resolves to `3`
- [ ] Bottom remains open with no shelf at floor level
- [ ] Top shelf exists at the highest level
- [ ] Lowest shelf support begins above the floor
- [ ] Side view shelf levels are evenly distributed between lowest and highest levels
- [ ] Front view shows shelf bands only

## Max Span Driven Support Frames

Use:

- Furniture Type: `Top Surface`
- Length: `96`
- Depth: `14.5`
- Height: `18`
- Max Span: `32`

Check:

- [ ] Frame count resolves to `4`
- [ ] Top view shows two internal support frames
- [ ] Front view shows two internal support frames
- [ ] Internal support frames are evenly distributed
- [ ] Part Summary increases leg and rail quantities accordingly
- [ ] Derived Summary updates estimated screws when frame count changes

## Bottom Rail Clearance

Use:

- Furniture Type: `Top Surface`
- Length: `60`
- Depth: `14.5`
- Height: `20`
- Bottom Rail Clearance: `4`

Check:

- [ ] Side view lowest rail is visibly raised above the ground
- [ ] Bottom rail clearance is measured to the underside of the lowest rail
- [ ] Side view dimension label shows `Clearance 4"`
- [ ] Derived Summary shows `Bottom rail clearance 4"`
- [ ] Rail length does not change when only clearance changes

## Collision Warning

Use:

- Furniture Type: `Shelving`
- Length: `72`
- Depth: `14.5`
- Height: `11`
- Shelf Levels: `3`
- Bottom Rail Clearance: `6`

Check:

- [ ] A collision warning appears in the parameter panel
- [ ] The warning explains that shelf levels overlap vertically
- [ ] Lowering bottom rail clearance removes the warning

## Dimension Labels

Check all three views:

- [ ] Top view shows overall length
- [ ] Top view shows overall depth
- [ ] Side view shows overall depth
- [ ] Side view shows overall height
- [ ] Side view shows inner rail length
- [ ] Front view shows overall length
- [ ] Front view shows overall height

## Floor Datum

Check:

- [ ] Side view shows a visible floor datum line
- [ ] Front view shows a visible floor datum line
- [ ] Floor datum is labeled `FLOOR 0"`
- [ ] Vertical dimensions are visually referenced from the same baseline

## Material Output

Check:

- [ ] Part Summary renders all expected part categories
- [ ] Board Optimization lists one or more stock boards
- [ ] Each stock board shows used length and waste
- [ ] Waste Summary updates when dimensions change

## Build Verification

```bash
npm.cmd run build
```

Check:

- [ ] Build completes successfully
