# Information Architecture

## Product Structure

The app should behave like a single-page workbench with persistent calculation feedback.

Primary regions:

1. Header
2. Parameter panel
3. Preview workspace
4. Results workspace

## Header

Purpose:

- Identify project
- Allow preset switching
- Support future save/load actions

Content:

- Product title
- Furniture type switcher
- Preset selector
- Future actions placeholder: save preset, export PDF

## Parameter Panel

Purpose:

- Main input area for all design variables

Sections:

### Common Inputs

- Furniture type
- Overall length
- Overall depth
- Overall height
- Extra support H-frame count
- Units

### Top Surface Inputs

- Preset type: bench or table

### Shelving Inputs

- Shelf level count

Behavior:

- Changing any parameter immediately recalculates preview and material outputs
- Inputs should have guardrails for minimum valid values

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

### Part Summary

- Aggregated part types and quantities

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

1. Select furniture type
2. Enter outer dimensions
3. Enter extra support H-frame count
4. If shelving, enter shelf level count
5. Review top, side, and front previews
6. Review part summary and cut list
7. Review optimized 8 ft board allocation

## Suggested Navigation

Single-screen desktop layout:

- Left column: parameter panel
- Center column: preview workspace
- Right column: results workspace

Responsive tablet/mobile layout:

- Parameters
- Preview tabs
- Result accordions
