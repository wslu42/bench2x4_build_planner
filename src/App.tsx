import { useMemo, useState, type CSSProperties } from "react";
import {
  BOARD_THICKNESS,
  BOARD_WIDTH,
  SAW_KERF,
  STOCK_LENGTH,
  type AppInputs,
  type FurnitureType,
  type ViewMode,
  deriveDesign,
  deriveFrameLayout,
  formatInches,
} from "./domain";

type FillMode = "solid" | "pattern";
type ColorTheme = "rainbow" | "pinkblue" | "neon" | "sunset" | "violet";

type FieldProps = {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (nextValue: number) => void;
};

function NumberField({ label, value, min, step = 0.5, onChange }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

const DEFAULT_BOARD_UNIT_PRICE = 4.15;
const DEFAULT_SCREW_UNIT_PRICE = 0.06;

function App() {
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("top-surface");
  const [viewMode, setViewMode] = useState<ViewMode>("side");
  const [length, setLength] = useState(72);
  const [depth, setDepth] = useState(14.5);
  const [height, setHeight] = useState(17.5);
  const [maxSpan, setMaxSpan] = useState(44);
  const [bottomRailClearance, setBottomRailClearance] = useState(6);
  const [shelfLevelCount, setShelfLevelCount] = useState(3);
  const [fillMode, setFillMode] = useState<FillMode>("solid");
  const colorTheme: ColorTheme = "sunset";

  const handleFurnitureTypeChange = (nextType: FurnitureType) => {
    setFurnitureType(nextType);

    if (nextType === "top-surface") {
      setHeight(17.5);
      setMaxSpan(44);
      setBottomRailClearance(6);
      return;
    }

    setHeight(44);
    setMaxSpan(44);
    setBottomRailClearance(6);
  };

  const inputs: AppInputs = useMemo(() => {
    if (furnitureType === "top-surface") {
      return {
        furnitureType,
        length,
        depth,
        height,
        maxSpan,
        bottomRailClearance,
      };
    }

    return {
      furnitureType,
      length,
      depth,
      height,
      maxSpan,
      bottomRailClearance,
      shelfLevelCount,
    };
  }, [
    bottomRailClearance,
    depth,
    furnitureType,
    height,
    length,
    maxSpan,
    shelfLevelCount,
  ]);

  const design = useMemo(() => deriveDesign(inputs), [inputs]);
  const effectiveInputs = design.normalizedInputs;
  const isTopSurface = effectiveInputs.furnitureType === "top-surface";
  const boardUnitPrice = DEFAULT_BOARD_UNIT_PRICE;
  const screwUnitPrice = DEFAULT_SCREW_UNIT_PRICE;
  const boardLineTotal = design.stockPlan.length * boardUnitPrice;
  const screwsLineTotal = design.estimatedScrewCount * screwUnitPrice;
  const shoppingGrandTotal = boardLineTotal + screwsLineTotal;
  const stockSegmentStyles: Record<string, { fill: string; stroke: string }> = {
    "top-board": { fill: "#FF7B00", stroke: "#BF5C00" },
    "shelf-board": { fill: "#FF7B00", stroke: "#BF5C00" },
    "vertical-leg": { fill: "#B68A2E", stroke: "#8A6822" },
    "side-rail": { fill: "#3A86FF", stroke: "#2B63BF" },
  };

  const ruleBadges = [
    `2x4 actual size: ${BOARD_THICKNESS}" x ${BOARD_WIDTH}"`,
    `Stock length: ${STOCK_LENGTH}"`,
    `Saw kerf: ${SAW_KERF}"`,
    `Max span: ${formatInches(effectiveInputs.maxSpan)}`,
    `Bottom rail clearance: ${formatInches(effectiveInputs.bottomRailClearance)}`,
    `Floor plane used as vertical datum`,
    `Fill mode: ${fillMode === "solid" ? "solid" : "transparent pattern"}`,
    isTopSurface
      ? `Top boards derived from outer depth: ${design.boardCountPerLevel}`
      : `Shelf boards per level derived from inner depth: ${design.boardCountPerLevel}`,
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">JustUse2x4</p>
          <h1>Fixed 2x4 furniture preview and cut planner</h1>
        </div>
      </header>

      <main className="workspace">
        <aside className="panel panel-controls">
          <section className="panel-section">
            <div className="panel-section-header">
              <h3>Parameterization</h3>
              <div className="segmented segmented-mode" aria-label="Furniture Type">
                {([
                  { value: "top-surface", label: "Bench" },
                  { value: "shelving", label: "Shelving" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={furnitureType === option.value ? "active" : ""}
                    onClick={() => handleFurnitureTypeChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="muted">
              All inputs are outer dimensions. Board counts are derived automatically.
            </p>
          </section>

          <section className="field-grid">
            <NumberField label="Length (in)" value={length} min={12} onChange={setLength} />
            <NumberField label="Depth (in)" value={depth} min={3.5} onChange={setDepth} />
            <NumberField label="Height (in)" value={height} min={3.5} onChange={setHeight} />
            <NumberField label="Max Span (in)" value={maxSpan} min={1} onChange={setMaxSpan} />
            <NumberField
              label="Bottom Rail Clearance (in)"
              value={bottomRailClearance}
              min={0}
              onChange={setBottomRailClearance}
            />
            {!isTopSurface ? (
              <NumberField
                label="Shelf Levels"
                value={shelfLevelCount}
                min={1}
                step={1}
                onChange={setShelfLevelCount}
              />
            ) : null}
          </section>

          <section className="panel-section">
            <h3>Derived Summary</h3>
            <dl className="summary-grid">
              <div>
                <dt>Frame count</dt>
                <dd>{design.frameCount}</dd>
              </div>
              <div>
                <dt>Extra H frames</dt>
                <dd>{design.extraSupportHFrameCount}</dd>
              </div>
              <div>
                <dt>Boards / level</dt>
                <dd>{design.boardCountPerLevel}</dd>
              </div>
              <div>
                <dt>Leg length</dt>
                <dd>{formatInches(design.legVerticalLength)}</dd>
              </div>
              <div>
                <dt>Rail length</dt>
                <dd>{formatInches(design.sideRailLength)}</dd>
              </div>
              <div>
                <dt>Actual clear span</dt>
                <dd>{formatInches(design.actualClearSpan)}</dd>
              </div>
              <div>
                <dt>Bottom rail clearance</dt>
                <dd>{formatInches(effectiveInputs.bottomRailClearance)}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="panel panel-preview">
          <div className="panel-section panel-header-row">
            <div>
              <h2>Preview</h2>
              <p className="muted">Orthographic SVG views for structure validation.</p>
            </div>

            <div className="preview-controls">
              <div className="segmented">
                {(["solid", "pattern"] as FillMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={mode === fillMode ? "active" : ""}
                    onClick={() => setFillMode(mode)}
                  >
                    {mode === "solid" ? "solid" : "pattern"}
                  </button>
                ))}
              </div>

              <div className="segmented">
                {(["top", "side", "front"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={mode === viewMode ? "active" : ""}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PreviewCanvas
            inputs={effectiveInputs}
            viewMode={viewMode}
            fillMode={fillMode}
            colorTheme={colorTheme}
            issues={design.issues}
          />

          <section className="panel-section">
            <ul className="chip-list">
              {ruleBadges.map((badge) => (
                <li key={badge} className="chip">
                  {badge}
                </li>
              ))}
            </ul>
          </section>

        </section>

        <aside className="panel panel-results">
          <section className="panel-section">
            <h2>Material Output</h2>
          </section>

          <section className="panel-section">
            <h3>Shopping List</h3>
            <table className="shopping-table">
              <colgroup>
                <col style={{ width: "26%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "31%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "12%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Full Length</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2x4 x 8ft</td>
                  <td>96"</td>
                  <td>${boardUnitPrice.toFixed(2)} / board</td>
                  <td>{design.stockPlan.length}</td>
                  <td>${boardLineTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Screws</td>
                  <td>2-1/2 in</td>
                  <td>${screwUnitPrice.toFixed(2)} / each</td>
                  <td>{design.estimatedScrewCount}</td>
                  <td>${screwsLineTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div className="shopping-total-row">
              <span className="shopping-total-label">Total Estimate</span>
              <span className="shopping-total-spacer" aria-hidden="true" />
              <span className="shopping-total-spacer" aria-hidden="true" />
              <span className="shopping-total-spacer" aria-hidden="true" />
              <strong>${shoppingGrandTotal.toFixed(2)}</strong>
            </div>
            <p className="material-note">
              Shopping list cost uses optimized board count from Board Optimization plus estimated
              screws.
            </p>
            <p className="material-note">
              Default pricing reference: 8 ft 2x4 from Home Depot at ${boardUnitPrice.toFixed(2)}
              {" "}per board and screws from Amazon at ${screwUnitPrice.toFixed(2)} per screw.
              Home Depot prices vary by store, and Amazon prices may change over time.
            </p>
            <p className="material-note">
              Sources:{" "}
              <a
                href="https://www.homedepot.com/p/2-in-x-4-in-x-96-in-Premium-Burrill-Fir-Stud-1000020053/206262176"
                target="_blank"
                rel="noreferrer"
              >
                Home Depot 2x4 stud
              </a>{" "}
              and{" "}
              <a
                href="https://www.amazon.com/dp/B0C23LJ6LJ?th=1"
                target="_blank"
                rel="noreferrer"
              >
                Amazon screw listing
              </a>
              .
            </p>
          </section>

          <section className="panel-section">
            <h3>Cut List</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Length</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {design.parts.map((part) => (
                  <tr key={part.key}>
                    <td>
                      <span className="table-type-item">
                        <span
                          className="preview-legend-swatch"
                          style={
                            {
                              "--swatch-color":
                                part.key === "top-board" || part.key === "shelf-board"
                                  ? "#FF7B00"
                                  : part.key === "vertical-leg"
                                    ? "#B68A2E"
                                    : "#3A86FF",
                              backgroundColor:
                                part.key === "top-board" || part.key === "shelf-board"
                                  ? "#FF7B00"
                                  : part.key === "vertical-leg"
                                    ? "#B68A2E"
                                    : "#3A86FF",
                            } as CSSProperties
                          }
                        />
                        {part.label}
                      </span>
                    </td>
                    <td>{formatInches(part.length)}</td>
                    <td>{part.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel-section">
            <div className="panel-section-header panel-section-header-compact">
              <h3>Board Optimization</h3>
              <div className="board-optimization-legend" aria-label="Board optimization legend">
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles[isTopSurface ? "top-board" : "shelf-board"].fill }}
                  />
                  {isTopSurface ? "Top Boards" : "Shelf Boards"}
                </span>
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles["vertical-leg"].fill }}
                  />
                  Vertical Legs
                </span>
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles["side-rail"].fill }}
                  />
                  Rails
                </span>
                <span className="board-optimization-legend-item">
                  <span className="board-optimization-legend-swatch board-optimization-legend-waste" />
                  Waste
                </span>
              </div>
            </div>
            <div className="board-stack">
              {design.stockPlan.map((board) => (
                <article key={board.boardIndex} className="board-card">
                  <header>
                    <div className="board-card-title">
                      <strong>Board {board.boardIndex}</strong>
                      <span>96" full board</span>
                    </div>
                  </header>
                  <div className="board-visual" aria-label={`Board ${board.boardIndex} cut layout`}>
                    <div className="board-visual-track">
                      {board.cuts.map((cut, index) => {
                        const segmentStyle = stockSegmentStyles[cut.partKey] ?? {
                          fill: "#d6c4b2",
                          stroke: "#8b7357",
                        };
                        return (
                          <div
                            key={`${board.boardIndex}-${cut.partKey}-${index}`}
                            className="board-visual-segment"
                            style={{
                              width: `${(cut.length / STOCK_LENGTH) * 100}%`,
                              backgroundColor: segmentStyle.fill,
                              borderColor: segmentStyle.stroke,
                            }}
                            title={`${cut.label} ${formatInches(cut.length)}`}
                          >
                            <span>{formatInches(cut.length)}</span>
                          </div>
                        );
                      })}
                      {board.waste > 0 ? (
                        <div
                          className="board-visual-segment board-visual-waste"
                          style={{ width: `${(board.waste / STOCK_LENGTH) * 100}%` }}
                          title={`Waste ${formatInches(board.waste)}`}
                        >
                          <span>{formatInches(board.waste)} waste</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <small>
                    Used {formatInches(board.usedLength)} including {board.kerfCount} kerf cuts ·{" "}
                    {formatInches(board.waste)} waste
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h3>Waste Summary</h3>
            <dl className="summary-grid">
              <div>
                <dt>Boards Needed</dt>
                <dd>{design.stockPlan.length}</dd>
              </div>
              <div>
                <dt>Total Used</dt>
                <dd>{formatInches(design.totalUsedLength)}</dd>
              </div>
              <div>
                <dt>Total Waste</dt>
                <dd>{formatInches(design.totalWaste)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>
    </div>
  );
}

type PreviewProps = {
  inputs: AppInputs;
  viewMode: ViewMode;
  fillMode: FillMode;
  colorTheme: ColorTheme;
  issues: string[];
};

type DimensionLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  textX?: number;
  textY?: number;
  textAnchor?: "start" | "middle" | "end";
};

function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  textX,
  textY,
  textAnchor = "middle",
}: DimensionLineProps) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const isVertical = Math.abs(x1 - x2) < Math.abs(y1 - y2);

  return (
    <g className="dimension-line">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {isVertical ? (
        <>
          <line x1={x1 - 6} y1={y1} x2={x1 + 6} y2={y1} />
          <line x1={x2 - 6} y1={y2} x2={x2 + 6} y2={y2} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 6} x2={x1} y2={y1 + 6} />
          <line x1={x2} y1={y2 - 6} x2={x2} y2={y2 + 6} />
        </>
      )}
      <text x={textX ?? midX} y={textY ?? midY - 8} textAnchor={textAnchor}>
        {label}
      </text>
    </g>
  );
}

function PreviewCanvas({
  inputs,
  viewMode,
  fillMode,
  colorTheme,
  issues,
}: PreviewProps) {
  const width = 760;
  const height = 540;
  const panelMargin = 52;
  const capsuleX = panelMargin;
  const capsuleY = 86;
  const capsuleWidth = width - panelMargin * 2;
  const capsuleHeight = height - capsuleY - 32;
  const annotationInsetLeft = 108;
  const annotationInsetRight = 92;
  const annotationInsetTop = 56;
  const annotationInsetBottom = 138;
  const annotationFrameX = capsuleX + annotationInsetLeft;
  const annotationFrameY = capsuleY + annotationInsetTop;
  const annotationFrameWidth = capsuleWidth - annotationInsetLeft - annotationInsetRight;
  const annotationFrameHeight = capsuleHeight - annotationInsetTop - annotationInsetBottom;
  const isTopSurface = inputs.furnitureType === "top-surface";
  const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(
    inputs.length,
    inputs.maxSpan,
  );
  const shelfLevels = inputs.furnitureType === "shelving" ? inputs.shelfLevelCount : 1;

  const boardCount =
    inputs.furnitureType === "top-surface"
      ? Math.max(1, Math.floor(inputs.depth / BOARD_WIDTH))
      : Math.max(1, Math.floor((inputs.depth - 2 * BOARD_THICKNESS) / BOARD_WIDTH));

  const viewWidth = viewMode === "side" ? inputs.depth : inputs.length;
  const viewHeight = viewMode === "top" ? inputs.depth : inputs.height;
  const scale = Math.min(annotationFrameWidth / viewWidth, annotationFrameHeight / viewHeight);
  const contentWidth = viewWidth * scale;
  const contentHeight = viewHeight * scale;
  const originX = annotationFrameX + (annotationFrameWidth - contentWidth) / 2;
  const originY = annotationFrameY + (annotationFrameHeight - contentHeight) / 2;

  const x = (value: number) => originX + value * scale;
  const yTop = (value: number) => originY + value * scale;
  const yBottom = (value: number) => originY + contentHeight - value * scale;
  const xRight = x(viewWidth);
  const showClearSpanDimension = actualClearSpan > 0.001;
  const leftDimX = Math.max(capsuleX + 56, x(0) - 18);
  const rightDimX = Math.min(capsuleX + capsuleWidth - 56, xRight + 18);
  const topNearDimY = yTop(inputs.depth) + 18;
  const topNearDimTextY = topNearDimY + 28;
  const topFarDimY = yTop(inputs.depth) + 48;
  const topFarDimTextY = topFarDimY + (showClearSpanDimension ? 34 : 28);
  const lowerNearDimY = yBottom(0) + 20;
  const lowerNearDimTextY = lowerNearDimY + 28;
  const lowerFarDimY = yBottom(0) + 50;
  const lowerFarDimTextY = lowerFarDimY + (showClearSpanDimension ? 34 : 28);

  const paletteMap: Record<
    ColorTheme,
    {
      boardColor: string;
      boardStroke: string;
      legColor: string;
      legStroke: string;
      railColor: string;
      railStroke: string;
      supportColor: string;
      supportStroke: string;
    }
  > = {
    rainbow: {
      boardColor: "#E63946",
      boardStroke: "#B02A35",
      legColor: "#2A9D8F",
      legStroke: "#1F756A",
      railColor: "#3A86FF",
      railStroke: "#2B63BF",
      supportColor: "#5CBDB0",
      supportStroke: "#3A9589",
    },
    pinkblue: {
      boardColor: "#FF5FA2",
      boardStroke: "#C7477D",
      legColor: "#5EDFFF",
      legStroke: "#47A8BF",
      railColor: "#7C83FD",
      railStroke: "#5D62BE",
      supportColor: "#A6EAFF",
      supportStroke: "#78B9CF",
    },
    neon: {
      boardColor: "#FF4D6D",
      boardStroke: "#C23A53",
      legColor: "#22C55E",
      legStroke: "#15803D",
      railColor: "#00E5FF",
      railStroke: "#00ACC0",
      supportColor: "#6CDE92",
      supportStroke: "#43A966",
    },
    sunset: {
      boardColor: "#FF7B00",
      boardStroke: "#BF5C00",
      legColor: "#B68A2E",
      legStroke: "#8A6822",
      railColor: "#3A86FF",
      railStroke: "#2B63BF",
      supportColor: "#D1AE63",
      supportStroke: "#A07F45",
    },
    violet: {
      boardColor: "#6D28D9",
      boardStroke: "#521EAA",
      legColor: "#EC4899",
      legStroke: "#B13673",
      railColor: "#06B6D4",
      railStroke: "#04889F",
      supportColor: "#F08CBC",
      supportStroke: "#C06391",
    },
  };
  const palette = paletteMap[colorTheme];
  const {
    boardColor,
    boardStroke,
    legColor,
    legStroke,
    railColor,
    railStroke,
    supportColor,
    supportStroke,
  } = palette;
  const datumColor = "#8b7357";
  const boardLineColor = fillMode === "pattern" ? boardColor : boardStroke;
  const legLineColor = fillMode === "pattern" ? legColor : legStroke;
  const railLineColor = fillMode === "pattern" ? railColor : railStroke;
  const supportLineColor = fillMode === "pattern" ? supportColor : supportStroke;
  const boardFill = fillMode === "solid" ? boardColor : "url(#boardPattern)";
  const legFill = fillMode === "solid" ? legColor : "url(#legPattern)";
  const railFill = fillMode === "solid" ? railColor : "url(#railPattern)";
  const supportFill = fillMode === "solid" ? supportColor : "url(#supportPattern)";
  const materialStrokeWidth = fillMode === "pattern" ? 0.75 : 1.5;
  const bottomRailBottom = inputs.bottomRailClearance;
  const bottomRailTop = bottomRailBottom + BOARD_THICKNESS;
  const innerDepth = inputs.depth - 2 * BOARD_THICKNESS;
  const visibleLegHeight = isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height;
  const sectionRadius = Math.max(2, Math.min(8, BOARD_THICKNESS * scale * 0.45));
  const boardGap =
    boardCount <= 1 ? 0 : Math.max(0, (innerDepth - boardCount * BOARD_WIDTH) / (boardCount - 1));
  const shelfBoardOffsets = Array.from({ length: boardCount }, (_, index) => {
    return BOARD_THICKNESS + index * (BOARD_WIDTH + boardGap);
  });
  const topBoardGap =
    boardCount <= 1 ? 0 : Math.max(0, (inputs.depth - boardCount * BOARD_WIDTH) / (boardCount - 1));
  const topBoardSideOffsets = Array.from({ length: boardCount }, (_, index) => {
    return index * (BOARD_WIDTH + topBoardGap);
  });

  const frameLeftPositions = framePositions;
  const frontFramePositions = framePositions;

  const levelBottoms =
    inputs.furnitureType === "shelving"
      ? Array.from({ length: shelfLevels }, (_, index) => {
          if (shelfLevels === 1) {
            return inputs.height - 2 * BOARD_THICKNESS;
          }

          const firstBottom = inputs.bottomRailClearance;
          const lastBottom = inputs.height - 2 * BOARD_THICKNESS;
          const step = (lastBottom - firstBottom) / (shelfLevels - 1);
          return firstBottom + step * index;
        })
      : [];

  const screwColor = "#5f2f1f";
  const legendItems = isTopSurface
    ? [
        { label: "Top Boards", color: boardColor, kind: "board" as const },
        { label: "Vertical Legs", color: legColor, kind: "leg" as const },
        { label: "Rails", color: railColor, kind: "rail" as const },
        { label: "Extra Support Frames", color: supportColor, kind: "support" as const },
      ]
    : [
        { label: "Shelf Boards", color: boardColor, kind: "board" as const },
        { label: "Vertical Legs", color: legColor, kind: "leg" as const },
        { label: "Rails", color: railColor, kind: "rail" as const },
        { label: "Extra Support Frames", color: supportColor, kind: "support" as const },
      ];
  const renderScrewMark = (cx: number, cy: number, key: string) => (
    <text
      key={key}
      x={cx}
      y={cy + 3}
      textAnchor="middle"
      fill={screwColor}
      fontSize="10"
      fontWeight="800"
      letterSpacing="0.6"
    >
      xx
    </text>
  );

  return (
    <div className="preview-canvas">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${viewMode} view`}>
        <defs>
          <pattern id="boardPattern" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.8" fill={boardColor} />
            <circle cx="6" cy="6" r="0.8" fill={boardColor} />
          </pattern>
          <pattern id="legPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="10" stroke={legColor} strokeWidth="1.6" />
          </pattern>
          <pattern id="railPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="10" y1="0" x2="0" y2="10" stroke={railColor} strokeWidth="1.6" />
          </pattern>
          <pattern id="supportPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="10" stroke={supportColor} strokeWidth="1.6" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={width} height={height} rx="28" fill="#fffaf1" />
        <rect
          x={capsuleX}
          y={capsuleY}
          width={capsuleWidth}
          height={capsuleHeight}
          rx="18"
          fill="#fff"
          stroke="#e2d5c4"
          strokeWidth="2"
        />

        {viewMode === "top" ? (
          <>
            {frameLeftPositions.map((left, index) => (
              <g key={`top-frame-${index}`}>
                <rect
                  x={x(left)}
                  y={yTop(0)}
                  width={BOARD_WIDTH * scale}
                  height={BOARD_THICKNESS * scale}
                  fill={index === 0 || index === frameCount - 1 ? legFill : supportFill}
                  stroke={index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor}
                  strokeWidth={materialStrokeWidth}
                />
                <rect
                  x={x(left)}
                  y={yTop(inputs.depth - BOARD_THICKNESS)}
                  width={BOARD_WIDTH * scale}
                  height={BOARD_THICKNESS * scale}
                  fill={index === 0 || index === frameCount - 1 ? legFill : supportFill}
                  stroke={index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor}
                  strokeWidth={materialStrokeWidth}
                />
                <rect
                  x={x(left)}
                  y={yTop(BOARD_THICKNESS)}
                  width={BOARD_WIDTH * scale}
                  height={(inputs.depth - 2 * BOARD_THICKNESS) * scale}
                  fill={railFill}
                  stroke={railLineColor}
                  strokeWidth={materialStrokeWidth}
                />
              </g>
            ))}

            {isTopSurface
              ? Array.from({ length: boardCount }, (_, index) => {
                  const gap =
                    boardCount <= 1
                      ? 0
                      : Math.max(0, (inputs.depth - boardCount * BOARD_WIDTH) / (boardCount - 1));
                  const boardY = index * (BOARD_WIDTH + gap);

                  return (
                    <rect
                      key={`top-board-${index}`}
                      x={x(0)}
                      y={yTop(boardY)}
                      width={contentWidth}
                      height={BOARD_WIDTH * scale}
                      fill={boardFill}
                      stroke={boardLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                  );
                })
              : shelfBoardOffsets.map((offset, index) => (
                  <rect
                    key={`top-shelf-board-${index}`}
                    x={x(0)}
                    y={yTop(offset)}
                    width={contentWidth}
                    height={BOARD_WIDTH * scale}
                    fill={boardFill}
                    stroke={boardLineColor}
                    strokeWidth={materialStrokeWidth}
                  />
                ))}

            {frameLeftPositions.map((left, index) => {
              const centerX = x(left + BOARD_WIDTH / 2);
              return (
                <g key={`top-screws-${index}`}>
                  {renderScrewMark(centerX, yTop(BOARD_THICKNESS), `top-screw-upper-${index}`)}
                  {renderScrewMark(
                    centerX,
                    yTop(inputs.depth - BOARD_THICKNESS),
                    `top-screw-lower-${index}`,
                  )}
                </g>
              );
            })}

            <DimensionLine
              x1={x(0)}
              y1={topFarDimY}
              x2={xRight}
              y2={topFarDimY}
              label={`Length ${formatInches(inputs.length)}`}
              textY={topFarDimTextY}
            />
            {showClearSpanDimension ? (
              <DimensionLine
                x1={x(BOARD_WIDTH)}
                y1={topNearDimY}
                x2={x(BOARD_WIDTH + actualClearSpan)}
                y2={topNearDimY}
                label={`Clear Span ${formatInches(actualClearSpan)}`}
                textY={topNearDimTextY}
              />
            ) : null}
            <DimensionLine
              x1={leftDimX}
              y1={yTop(0)}
              x2={leftDimX}
              y2={yTop(inputs.depth)}
              label={`Depth ${formatInches(inputs.depth)}`}
              textX={leftDimX - 12}
              textY={originY + contentHeight / 2 - 10}
              textAnchor="end"
            />
          </>
        ) : null}

        {viewMode === "side" ? (
          <>
            <line
              x1={capsuleX}
              y1={yBottom(0)}
              x2={capsuleX + capsuleWidth}
              y2={yBottom(0)}
              stroke={datumColor}
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <text
              x={capsuleX + capsuleWidth - 12}
              y={yBottom(0) + 18}
              className="datum-label"
              textAnchor="end"
            >
              FLOOR 0"
            </text>

            <rect
              x={x(0)}
              y={yBottom(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height)}
              width={BOARD_THICKNESS * scale}
              height={(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height) * scale}
              fill={legFill}
              stroke={legLineColor}
              strokeWidth={materialStrokeWidth}
            />
            <rect
              x={x(inputs.depth - BOARD_THICKNESS)}
              y={yBottom(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height)}
              width={BOARD_THICKNESS * scale}
              height={(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height) * scale}
              fill={legFill}
              stroke={legLineColor}
              strokeWidth={materialStrokeWidth}
            />

            {isTopSurface ? (
              <>
                <rect
                  x={x(BOARD_THICKNESS)}
                  y={yBottom(inputs.height - BOARD_THICKNESS)}
                  width={(inputs.depth - 2 * BOARD_THICKNESS) * scale}
                  height={BOARD_THICKNESS * scale}
                  fill={railFill}
                  stroke={railLineColor}
                  strokeWidth={materialStrokeWidth}
                />
                <rect
                  x={x(BOARD_THICKNESS)}
                  y={yBottom(bottomRailTop)}
                  width={(inputs.depth - 2 * BOARD_THICKNESS) * scale}
                  height={BOARD_THICKNESS * scale}
                  fill={railFill}
                  stroke={railLineColor}
                  strokeWidth={materialStrokeWidth}
                />
                {topBoardSideOffsets.map((offset, boardIndex) => (
                  <rect
                    key={`top-board-side-${boardIndex}`}
                    x={x(offset)}
                    y={yBottom(inputs.height)}
                    width={BOARD_WIDTH * scale}
                    height={BOARD_THICKNESS * scale}
                    rx={sectionRadius}
                    ry={sectionRadius}
                    fill={boardFill}
                    stroke={boardLineColor}
                    strokeWidth={materialStrokeWidth}
                  />
                ))}
                {renderScrewMark(
                  x(BOARD_THICKNESS),
                  yBottom(inputs.height - 1.5 * BOARD_THICKNESS),
                  "bench-side-upper-left",
                )}
                {renderScrewMark(
                  x(inputs.depth - BOARD_THICKNESS),
                  yBottom(inputs.height - 1.5 * BOARD_THICKNESS),
                  "bench-side-upper-right",
                )}
                {renderScrewMark(
                  x(BOARD_THICKNESS),
                  yBottom(bottomRailBottom + BOARD_THICKNESS / 2),
                  "bench-side-lower-left",
                )}
                {renderScrewMark(
                  x(inputs.depth - BOARD_THICKNESS),
                  yBottom(bottomRailBottom + BOARD_THICKNESS / 2),
                  "bench-side-lower-right",
                )}
              </>
            ) : (
              <>
                {levelBottoms.map((bottom, index) => (
                  <g key={`shelf-level-${index}`}>
                    <rect
                      x={x(BOARD_THICKNESS)}
                      y={yBottom(bottom + BOARD_THICKNESS)}
                      width={(inputs.depth - 2 * BOARD_THICKNESS) * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={railFill}
                      stroke={railLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                    {shelfBoardOffsets.map((offset, boardIndex) => (
                      <rect
                        key={`shelf-board-${index}-${boardIndex}`}
                        x={x(offset)}
                        y={yBottom(bottom + 2 * BOARD_THICKNESS)}
                        width={BOARD_WIDTH * scale}
                        height={BOARD_THICKNESS * scale}
                        rx={sectionRadius}
                        ry={sectionRadius}
                        fill={boardFill}
                        stroke={boardLineColor}
                        strokeWidth={materialStrokeWidth}
                      />
                    ))}
                    {renderScrewMark(
                      x(BOARD_THICKNESS),
                      yBottom(bottom + BOARD_THICKNESS / 2),
                      `shelf-side-left-${index}`,
                    )}
                    {renderScrewMark(
                      x(inputs.depth - BOARD_THICKNESS),
                      yBottom(bottom + BOARD_THICKNESS / 2),
                      `shelf-side-right-${index}`,
                    )}
                  </g>
                ))}
              </>
            )}

            <DimensionLine
              x1={x(0)}
              y1={lowerFarDimY}
              x2={xRight}
              y2={lowerFarDimY}
              label={`Depth ${formatInches(inputs.depth)}`}
              textY={lowerFarDimTextY}
            />
            <DimensionLine
              x1={leftDimX}
              y1={yBottom(0)}
              x2={leftDimX}
              y2={yBottom(inputs.height)}
              label={`Height ${formatInches(inputs.height)}`}
              textX={leftDimX - 12}
              textY={originY + contentHeight / 2 - 10}
              textAnchor="end"
            />
            <DimensionLine
              x1={x(BOARD_THICKNESS)}
              y1={lowerNearDimY}
              x2={x(inputs.depth - BOARD_THICKNESS)}
              y2={lowerNearDimY}
              label={`Rail ${formatInches(inputs.depth - 2 * BOARD_THICKNESS)}`}
              textY={lowerNearDimTextY}
            />
            <DimensionLine
              x1={rightDimX}
              y1={yBottom(0)}
              x2={rightDimX}
              y2={yBottom(bottomRailBottom)}
              label={`Clearance ${formatInches(bottomRailBottom)}`}
              textX={rightDimX + 12}
              textY={yBottom(bottomRailBottom / 2) - 10}
              textAnchor="start"
            />
          </>
        ) : null}

        {viewMode === "front" ? (
          <>
            <line
              x1={capsuleX}
              y1={yBottom(0)}
              x2={capsuleX + capsuleWidth}
              y2={yBottom(0)}
              stroke={datumColor}
              strokeWidth="2"
              strokeDasharray="6 5"
            />
            <text
              x={capsuleX + capsuleWidth - 12}
              y={yBottom(0) + 18}
              className="datum-label"
              textAnchor="end"
            >
              FLOOR 0"
            </text>

            {isTopSurface
              ? frontFramePositions.map((left, index) => (
                  <g key={`front-rail-pair-${index}`}>
                    <rect
                      x={x(left)}
                      y={yBottom(inputs.height - BOARD_THICKNESS)}
                      width={BOARD_WIDTH * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={railFill}
                      stroke={railLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                    <rect
                      x={x(left)}
                      y={yBottom(bottomRailTop)}
                      width={BOARD_WIDTH * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={railFill}
                      stroke={railLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                  </g>
                ))
              : levelBottoms.flatMap((bottom, levelIndex) =>
                  frontFramePositions.map((left, frameIndex) => (
                    <rect
                      key={`front-shelf-rail-${levelIndex}-${frameIndex}`}
                      x={x(left)}
                      y={yBottom(bottom + BOARD_THICKNESS)}
                      width={BOARD_WIDTH * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={railFill}
                      stroke={railLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                  )),
                )}

            {!isTopSurface
              ? levelBottoms.map((bottom, index) => (
                  <rect
                    key={`front-shelf-${index}`}
                    x={x(0)}
                    y={yBottom(bottom + 2 * BOARD_THICKNESS)}
                    width={contentWidth}
                    height={BOARD_THICKNESS * scale}
                    fill={boardFill}
                    stroke={boardLineColor}
                    strokeWidth={materialStrokeWidth}
                  />
                ))
              : null}

            {frontFramePositions.map((left, index) => (
              <rect
                key={`front-frame-${index}`}
                x={x(left)}
                y={yBottom(visibleLegHeight)}
                width={BOARD_WIDTH * scale}
                height={visibleLegHeight * scale}
                fill={index === 0 || index === frameCount - 1 ? legFill : supportFill}
                stroke={index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor}
                strokeWidth={materialStrokeWidth}
              />
            ))}

            {isTopSurface ? (
              <rect
                x={x(0)}
                y={yBottom(inputs.height)}
                width={contentWidth}
                height={BOARD_THICKNESS * scale}
                fill={boardFill}
                stroke={boardLineColor}
                strokeWidth={materialStrokeWidth}
              />
            ) : null}

            {isTopSurface
              ? frontFramePositions.map((left, index) => (
                  <g key={`front-top-screws-${index}`}>
                    {renderScrewMark(
                      x(left + BOARD_WIDTH / 2),
                      yBottom(inputs.height - 1.5 * BOARD_THICKNESS),
                      `front-top-upper-${index}`,
                    )}
                    {renderScrewMark(
                      x(left + BOARD_WIDTH / 2),
                      yBottom(bottomRailBottom + BOARD_THICKNESS / 2),
                      `front-top-lower-${index}`,
                    )}
                  </g>
                ))
              : levelBottoms.flatMap((bottom, levelIndex) =>
                  frontFramePositions.map((left, frameIndex) =>
                    renderScrewMark(
                      x(left + BOARD_WIDTH / 2),
                      yBottom(bottom + BOARD_THICKNESS / 2),
                      `front-shelf-${levelIndex}-${frameIndex}`,
                    ),
                  ),
                )}

            <DimensionLine
              x1={x(0)}
              y1={lowerFarDimY}
              x2={xRight}
              y2={lowerFarDimY}
              label={`Length ${formatInches(inputs.length)}`}
              textY={lowerFarDimTextY}
            />
            {showClearSpanDimension ? (
              <DimensionLine
                x1={x(BOARD_WIDTH)}
                y1={lowerNearDimY}
                x2={x(BOARD_WIDTH + actualClearSpan)}
                y2={lowerNearDimY}
                label={`Clear Span ${formatInches(actualClearSpan)}`}
                textY={lowerNearDimTextY}
              />
            ) : null}
            <DimensionLine
              x1={leftDimX}
              y1={yBottom(0)}
              x2={leftDimX}
              y2={yBottom(inputs.height)}
              label={`Height ${formatInches(inputs.height)}`}
              textX={leftDimX - 12}
              textY={originY + contentHeight / 2 - 10}
              textAnchor="end"
            />
          </>
        ) : null}

        <text x={capsuleX} y={38} className="svg-label">
          {viewMode.toUpperCase()} VIEW
        </text>
        {issues.length > 0 ? (
          <g className="svg-warning-pill" transform={`translate(${capsuleX + 132}, 20)`}>
            <rect x="0" y="0" rx="10" ry="10" width="152" height="28" />
            <text x="76" y="18" textAnchor="middle">
              Collision Warning
            </text>
          </g>
        ) : null}
        <text x={width - capsuleX} y={38} className="svg-label" textAnchor="end">
          L {formatInches(inputs.length)} / D {formatInches(inputs.depth)} / H {formatInches(inputs.height)}
        </text>
        <text x={width - capsuleX} y={60} className="svg-label" textAnchor="end">
          Bottom Rail Clearance {formatInches(bottomRailBottom)}
        </text>
      </svg>

      <div className="preview-legend">
        {legendItems.map((item) => (
          <div key={item.label} className="preview-legend-item">
            <span
              className="preview-legend-swatch"
              style={{
                backgroundColor: item.color,
                ["--swatch-color" as string]: item.color,
              }}
            />
            <span>{item.label}</span>
          </div>
        ))}
        <div className="preview-legend-item">
          <span
            className="preview-legend-swatch"
            style={{
              backgroundColor: "transparent",
              color: screwColor,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            xx
          </span>
          <span>Screws</span>
        </div>
      </div>
    </div>
  );
}

export default App;
