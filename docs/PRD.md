# Product Requirements Document

## Product Name

Bench2x4

## Objective

Create a lightweight self-use website that parameterizes a fixed 2x4 furniture building method and outputs:

- Orthographic previews
- Part lengths, quantities, and purposes
- Estimated screw count for frame assembly
- 8 ft stock count
- Cut allocation with 1/8 in saw kerf
- Waste estimate

## Supported Furniture Types

### Bench

Structure:

- Two end H-frames
- Optional extra support H-frames along the length
- Top boards running continuously in the length direction
- Top board count derived from outer depth

Height logic:

- Overall height includes the top board thickness
- Vertical leg cut length equals `H - 1.5`

### Shelving

Structure:

- Two end H-frames
- Optional extra support H-frames along the length
- Every shelf level spans the full furniture length
- Every shelf level uses the same board count
- Every shelf level has a pair of supporting rails
- The topmost shelf always exists
- The bottom is open by default and does not count as a shelf level

Height logic:

- Vertical legs run to the overall top edge
- The top support rail sits 1.5 in below the top of the legs
- Vertical leg cut length equals `H`

## Fixed Assumptions

- All furniture uses only 2x4 lumber
- User-entered dimensions are always outer dimensions
- 2x4 orientation is fixed
- Stock length defaults to 96 in
- Saw kerf is fixed at 0.125 in
- Views are orthographic only
- A floor datum is defined as `0 in` for vertical coordinates in side and front views

## Material Dimensions

- Thickness `T = 1.5 in`
- Face width `W = 3.5 in`

## Core Dimensional Rules

### Top Surface

Inputs:

- `L`: overall length
- `D`: overall depth
- `H`: overall height
- `max_span`
- `bottom_rail_clearance`

Derived values:

- `span_count = max(1, ceil(L / max_span))`
- `frame_count = span_count + 1`
- `extra_support_h_frame_count = frame_count - 2`
- `top_board_qty = floor(D / 3.5)`
- `top_board_length = L`
- `leg_vertical_length = H - 1.5`
- `leg_vertical_qty = 2 * frame_count`
- `side_rail_length = D - 3`
- `side_rail_qty = 2 * frame_count`

Key interpretation:

- Top board quantity is not user-entered
- Top board quantity is derived from outer depth

### Shelving

Inputs:

- `L`: overall length
- `D`: overall depth
- `H`: overall height
- `shelf_level_count`
- `max_span`
- `bottom_rail_clearance`

Derived values:

- `span_count = max(1, ceil(L / max_span))`
- `frame_count = span_count + 1`
- `extra_support_h_frame_count = frame_count - 2`
- `shelf_board_qty_per_level = floor((D - 3) / 3.5)`
- `shelf_board_length = L`
- `shelf_board_qty_total = shelf_level_count * shelf_board_qty_per_level`
- `leg_vertical_length = H`
- `leg_vertical_qty = 2 * frame_count`
- `side_rail_length = D - 3`
- `side_rail_qty = 2 * frame_count * shelf_level_count`

Key interpretation:

- Shelf board quantity is derived from inner usable depth
- Every shelf level uses the same board count and full length

## Difference Between Bench And Shelving

For the same outer depth `D`:

- Bench board count is based on outer depth
- Shelving board count is based on inner depth `D - 3`

Example with `D = 14.5`:

- Bench board count = `floor(14.5 / 3.5) = 4`
- Shelving board count = `floor(11.5 / 3.5) = 3`

## Max Span Driven Support Frames

- User defines `max_span` in inches
- The app derives the required number of spans along the length
- Total frame count equals `ceil(L / max_span) + 1`, with a minimum of `2`
- Derived extra support H-frame count equals `frame_count - 2`
- Extra support H-frames are identical to end H-frames
- All H-frames are distributed evenly along the length

## Bottom Rail Clearance

- The app includes a shared `bottom_rail_clearance` input
- This value is measured from the floor datum to the underside of the lowest horizontal rail
- It affects preview geometry and future layout calculations
- It does not change the rail cut length
- The same definition must be used everywhere in formulas, previews, and labels

## Visualization Requirements

The app must show:

- Top view
- Side view
- Front view

Visualization rules:

- Use color to distinguish part categories
- Show main dimensions
- Show the floor datum in side and front views
- Do not label every board with IDs
- Do not show gap dimensions
- Front view should simplify top/shelf boards into a single thickness band
- Gallery should show real example photos and allow loading a build into the planner
- Gallery photos should open a larger preview overlay
- The preview overlay should include a clear `Load This Build` action

## Outputs

- Orthographic preview
- Shopping list
- Cut list
- Estimated screw count
- Board optimization
- Waste summary

Recommended cut list fields:

- Part type
- Purpose
- Length
- Quantity

Shopping list fields:

- Item
- Unit
- Quantity
- Cost

Shopping list cost rules:

- 2x4 quantity must come from the board count produced by Board Optimization
- Screw quantity must come from the estimated screw count
- Cost should be based on shopping list items, not on cut-list rows
- The total estimate should read as a shopping-list summary, not as another material row

Default pricing references:

- 8 ft 2x4 stud reference: Home Depot product page
- Screw reference: Amazon product page
- Default unit pricing currently assumes `$4.15` per 8 ft 2x4 and `$0.06` per screw
- Prices should be treated as editable defaults because retailer pricing varies over time and by store

Screw estimate rule:

- Each `vertical leg` to `rail` intersection uses `2` screws
- Each rail board has `2` intersections
- Estimated screw count = `side_rail_qty * 4`

Recommended optimization fields:

- Board number
- Assigned cuts
- Kerf count
- Used length
- Waste

## Cutting Optimization

Stock rule:

- Stock length = 96 in
- Kerf = 0.125 in

Per-board used length formula:

- `used_length = sum(parts) + (n - 1) * 0.125`

Suggested v1 algorithm:

- Sort parts from longest to shortest
- Use First-Fit Decreasing

## Non-Goals

- Drag-and-drop editing
- Snap tools
- Arbitrary 3D rotation
- Joinery selection
- Material switching

## Current Product Notes

- The app lands on `Gallery` by default
- The gallery uses real photos stored locally in `src/gallery_asset`
- Loading a gallery card returns the user to the planner with the matching parameters applied
