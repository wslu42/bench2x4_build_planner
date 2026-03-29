# Wireframes

## Desktop Workbench

```text
+--------------------------------------------------------------------------------------------------+
| JustUse2x4                                   [Top Surface v] [Bench v] [Save] [Export]          |
+------------------------------+--------------------------------------+----------------------------+
| Parameters                   | Preview                              | Material Output            |
|                              |                                      |                            |
| Furniture Type               | [ Top View ] [ Side View ] [ Front ] | Part Summary               |
|  - Top Surface               |                                      | -------------------------  |
|  - Shelving                  |  +-------------------------------+   | top boards                |
|                              |  |                               |   | legs                      |
| Preset                       |  |        active SVG view        |   | rails                     |
|  - Bench                     |  |                               |   |                            |
|  - Table                     |  +-------------------------------+   | Cut List                   |
|                              |                                      | -------------------------  |
| Length   [ 72   ]            |  Dimension chips / structural notes  | Part | Purpose | Qty ...  |
| Depth    [ 14.5 ]            |                                      |                            |
| Height   [ 11   ]            |                                      | Board Optimization         |
| Extra H  [ 0    ]            |                                      | -------------------------  |
| Units    [ in   ]            |                                      | Board 1 ...               |
|                              |                                      | Board 2 ...               |
| Shelf Lv [ 3    ] only shelf |                                      |                            |
|                              |                                      | Waste Summary             |
| Rule Notes                   |                                      | -------------------------  |
| - outer dims                 |                                      | boards needed             |
| - kerf 1/8                   |                                      | total waste               |
+------------------------------+--------------------------------------+----------------------------+
```

## Mobile / Narrow Layout

```text
+--------------------------------------+
| JustUse2x4                           |
| [Type] [Preset]                      |
+--------------------------------------+
| Parameters                           |
| Length                               |
| Depth                                |
| Height                               |
| Extra H                              |
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
| Part Summary                         |
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

### Side View

- Shows height-depth relationship
- Shows top board above frame for Top Surface
- Shows top shelf flush with leg tops for Shelving

### Front View

- Strict orthographic
- Top or shelf shown as a single thickness band
- Intermediate H-frames visible along length positions
