# Wireframes

## Desktop Workbench

```text
+------------------------------------------------------------------------------------------------------------------+
| Bench2x4                                                 [Planner] [Gallery]                                     |
+------------------------------------------------------------------------------------------------------------------+
| Gallery                                                                                                          |
|                                                                                                                  |
| [ build photo card ] [ build photo card ] [ build photo card ]                                                  |
| click photo -> preview overlay with larger image and Load This Build                                             |
+------------------------------------------------------------------------------------------------------------------+
| Parameterization                                                                                                 |
| [Furniture Type: Bench / Shelving] [Length] [Depth] [Height] [Max Span] [Bottom Rail Clearance] [Shelf Levels] |
+------------------------------------------------------------------------------------------------------------------+
| Preview                                                                                                          |
|                                                                                                                  |
|                                      [solid / pattern] [top / side / front]                                     |
|   SIDE VIEW                                                                                         L / D / H    |
|   +--------------------------------------------------------------------------------------------+                 |
|   |                                                                                            |                 |
|   |                                        active SVG view                                     |                 |
|   |                                                                                            |                 |
|   +--------------------------------------------------------------------------------------------+                 |
|   legend                                                                                                           |
|   structural note chips                                                                                           |
+------------------------------------------------------------------------------------------------------------------+
| Material Output                                                                                                  |
|                                                                                                                  |
| Shopping List                                                                                                    |
| Cut List                                                                                                         |
| Board Optimization                                                                                               |
| Waste Summary                                                                                                    |
+------------------------------------------------------------------------------------------------------------------+
```

## Mobile / Narrow Layout

```text
+--------------------------------------+
| Bench2x4                             |
| [Planner] [Gallery]                  |
+--------------------------------------+
| Gallery                              |
| [photo card]                         |
| tap photo -> preview overlay         |
+--------------------------------------+
| Parameterization                     |
| [Bench / Shelving]                   |
| Length                               |
| Depth                                |
| Height                               |
| Max Span                             |
| Bottom Rail Clearance                |
| Shelf Levels                         |
+--------------------------------------+
| Preview                              |
| [Top] [Side] [Front]                 |
| +----------------------------------+ |
| |                                  | |
| |             SVG view             | |
| |                                  | |
| +----------------------------------+ |
+--------------------------------------+
| Shopping List                        |
+--------------------------------------+
| Cut List                             |
+--------------------------------------+
| Board Optimization                   |
+--------------------------------------+
| Waste Summary                        |
+--------------------------------------+
```

## View-Specific Notes

### Top View

- Shows footprint `L x D`
- Shows board pattern
- Shows H-frame positions
- Bench boards occupy full outer depth
- Shelving boards occupy only the inner rail span

### Side View

- Shows height-depth relationship
- Shows top board above frame for Bench
- Shows top shelf flush with leg tops for Shelving

### Front View

- Strict orthographic
- Top or shelf shown as a single thickness band
- Intermediate H-frames visible along length positions
