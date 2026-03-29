# Information Architecture

## Product Structure

The app should behave like a single-page workbench with persistent calculation feedback.

Primary regions:

1. Header
2. Gallery workspace
3. Parameter panel
4. Preview workspace
5. Results workspace

## Header

Purpose:

- Identify project
- Switch between planner and gallery
- Keep furniture-type switching close to parameterization

Content:

- Product title
- Page switcher: `Planner / Gallery`
- Furniture type switcher

## Gallery Workspace

Purpose:

- Show finished build examples
- Help users start from real cases instead of blank parameters

Content:

- Build cards with photos
- Clickable photos that open a larger preview overlay
- Build title and short description
- Key dimensions and settings
- `Load This Build` action that transfers values into the planner

Default behavior:

- The app lands on `Gallery`
- Loading a gallery card switches back to the planner and opens `Side View`

## Parameter Panel

Purpose:

- Main input area for all design variables

Sections:

### Common Inputs

- Furniture type
- Overall length
- Overall depth
- Overall height
- Max span
- Bottom rail clearance

### Shelving Inputs

- Shelf level count

Behavior:

- Changing any parameter immediately recalculates preview and material outputs
- Inputs should have guardrails for minimum valid values
- Guardrails may clamp invalid values to effective values shown back in the inputs

## Preview Workspace

Purpose:

- Confirm structural interpretation visually before reviewing cut outputs

Subsections:

### Top View

- Shows outer footprint
- Shows board arrangement for top surface or one shelf level
- Shows H-frame locations along the length

### Side View

- Shows height and depth relationship
- Makes top-vs-shelf height logic obvious

### Front View

- Shows overall length and frame placements
- Uses a band representation for top or shelf thickness

## Results Workspace

Purpose:

- Translate geometry into practical build data

Sections:

### Shopping List

- Purchase-ready material list
- Includes default unit costs and total estimate

### Cut List

- Build-ready list of part lengths and counts

### Board Optimization

- 8 ft stock assignment
- Kerf-aware used lengths
- Waste by board

### Waste Summary

- Boards needed
- Total used length
- Total waste
- Waste percentage

## User Flow

1. Start in Gallery or Planner
2. If using Gallery, load an example build
3. Select furniture type
4. Enter outer dimensions
5. Enter max span and bottom rail clearance
6. If shelving, enter shelf level count
7. Review top, side, and front previews
8. Review shopping list and cut list
9. Review optimized 8 ft board allocation

## Suggested Navigation

Single-screen desktop layout:

- Top: header and page switcher
- `Gallery` mode: build card grid
- `Planner` mode:
  - upper: parameter panel
  - middle: preview workspace
  - lower: results workspace

Responsive tablet/mobile layout:

- Header switcher
- Gallery cards or planner sections
- Preview tabs
- Result accordions
