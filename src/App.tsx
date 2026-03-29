import { useEffect, useMemo, useState, type CSSProperties } from "react";
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
import entryBenchImage from "./gallery_asset/entry_bench_L24_D14_H19.jpg";
import longBenchImage from "./gallery_asset/long_bench_L60_D14_H17p5.jpg";
import threeTierShelfImage from "./gallery_asset/three_tier_shelf_L33_D17p5_H92.jpg";
import twoTierShelfImage from "./gallery_asset/two_tier_shelf_L51_D17p5_H92.jpg";

type FillMode = "solid" | "pattern";
type ColorTheme = "rainbow" | "pinkblue" | "neon" | "sunset" | "violet";
type PageMode = "planner" | "gallery";

type GalleryBuild = {
  id: string;
  title: string;
  category: "Bench" | "Shelving";
  description: string;
  imageSrc: string;
  inputs: AppInputs;
};

type GalleryPreview = {
  src: string;
  title: string;
};

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

const GALLERY_BUILDS: GalleryBuild[] = [
  {
    id: "entry-bench",
    title: "Entry Bench",
    category: "Bench",
    description: "Compact hallway bench with a simple open base and generous clearance.",
    imageSrc: entryBenchImage,
    inputs: {
      furnitureType: "top-surface",
      length: 24,
      depth: 14,
      height: 19,
      maxSpan: 44,
      bottomRailClearance: 6,
    },
  },
  {
    id: "long-bench",
    title: "Long Bench",
    category: "Bench",
    description: "Longer seating span with one extra support frame to reduce flex.",
    imageSrc: longBenchImage,
    inputs: {
      furnitureType: "top-surface",
      length: 60,
      depth: 14,
      height: 17.5,
      maxSpan: 44,
      bottomRailClearance: 6,
    },
  },
  {
    id: "two-tier-shelf",
    title: "Two-Tier Shelf",
    category: "Shelving",
    description: "Open shelving preset for entry or workshop storage with comfortable lower clearance.",
    imageSrc: twoTierShelfImage,
    inputs: {
      furnitureType: "shelving",
      length: 51,
      depth: 17.5,
      height: 92,
      maxSpan: 44,
      bottomRailClearance: 6,
      shelfLevelCount: 2,
    },
  },
  {
    id: "three-tier-shelf",
    title: "Three-Tier Shelf",
    category: "Shelving",
    description: "Denser storage layout that still respects the fixed 2x4 frame system.",
    imageSrc: threeTierShelfImage,
    inputs: {
      furnitureType: "shelving",
      length: 33,
      depth: 17.5,
      height: 92,
      maxSpan: 44,
      bottomRailClearance: 6,
      shelfLevelCount: 3,
    },
  },
];

function App() {
  const [pageMode, setPageMode] = useState<PageMode>("gallery");
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("top-surface");
  const [viewMode, setViewMode] = useState<ViewMode>("side");
  const [length, setLength] = useState(72);
  const [depth, setDepth] = useState(14.5);
  const [height, setHeight] = useState(17.5);
  const [maxSpan, setMaxSpan] = useState(44);
  const [bottomRailClearance, setBottomRailClearance] = useState(6);
  const [shelfLevelCount, setShelfLevelCount] = useState(3);
  const [fillMode, setFillMode] = useState<FillMode>("solid");
  const [galleryPreview, setGalleryPreview] = useState<GalleryPreview | null>(null);
  const colorTheme: ColorTheme = "sunset";

  useEffect(() => {
    if (!galleryPreview) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGalleryPreview(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryPreview]);

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

  const applyBuildPreset = (presetInputs: AppInputs) => {
    setFurnitureType(presetInputs.furnitureType);
    setLength(presetInputs.length);
    setDepth(presetInputs.depth);
    setHeight(presetInputs.height);
    setMaxSpan(presetInputs.maxSpan);
    setBottomRailClearance(presetInputs.bottomRailClearance);
    setShelfLevelCount(
      presetInputs.furnitureType === "shelving" ? presetInputs.shelfLevelCount : 3,
    );
    setViewMode("side");
    setPageMode("planner");
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

  useEffect(() => {
    if (length !== effectiveInputs.length) {
      setLength(effectiveInputs.length);
    }

    if (depth !== effectiveInputs.depth) {
      setDepth(effectiveInputs.depth);
    }

    if (height !== effectiveInputs.height) {
      setHeight(effectiveInputs.height);
    }

    if (maxSpan !== effectiveInputs.maxSpan) {
      setMaxSpan(effectiveInputs.maxSpan);
    }

    if (bottomRailClearance !== effectiveInputs.bottomRailClearance) {
      setBottomRailClearance(effectiveInputs.bottomRailClearance);
    }

    if (!isTopSurface && shelfLevelCount !== effectiveInputs.shelfLevelCount) {
      setShelfLevelCount(effectiveInputs.shelfLevelCount);
    }
  }, [
    bottomRailClearance,
    depth,
    effectiveInputs,
    height,
    isTopSurface,
    length,
    maxSpan,
    shelfLevelCount,
  ]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Bench2x4</p>
          <h1>2x4 Build Planner</h1>
        </div>
        <div className="segmented app-mode-toggle" aria-label="Page">
          {([
            { value: "planner", label: "Planner" },
            { value: "gallery", label: "Gallery" },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              className={pageMode === option.value ? "active" : ""}
              onClick={() => setPageMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {pageMode === "planner" ? (
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
                {(["top", "side", "front", "assembly"] as ViewMode[]).map((mode) => (
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
                          const widthPercent = (cut.length / STOCK_LENGTH) * 100;
                          const showSegmentLabel = widthPercent >= 10;
                          return (
                            <div
                              key={`${board.boardIndex}-${cut.partKey}-${index}`}
                              className="board-visual-segment"
                              style={{
                                width: `${widthPercent}%`,
                                backgroundColor: segmentStyle.fill,
                                borderColor: segmentStyle.stroke,
                              }}
                              title={`${cut.label} ${formatInches(cut.length)}`}
                            >
                              {showSegmentLabel ? <span>{formatInches(cut.length)}</span> : null}
                            </div>
                          );
                        })}
                        {board.waste > 0 ? (
                          (() => {
                            const wastePercent = (board.waste / STOCK_LENGTH) * 100;
                            let wasteLabel: string | null = null;
                            if (wastePercent >= 16) {
                              wasteLabel = `${formatInches(board.waste)} waste`;
                            } else if (wastePercent >= 10) {
                              wasteLabel = formatInches(board.waste);
                            }

                            return (
                              <div
                                className="board-visual-segment board-visual-waste"
                                style={{ width: `${wastePercent}%` }}
                                title={`Waste ${formatInches(board.waste)}`}
                              >
                                {wasteLabel ? <span>{wasteLabel}</span> : null}
                              </div>
                            );
                          })()
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
      ) : (
        <main className="gallery-layout">
          <section className="panel panel-gallery">
            <section className="panel-section">
              <div className="panel-section-header">
                <h2>Build Gallery</h2>
              </div>
              <p className="muted">
                Example builds that use the same fixed 2x4 system. Pick one to load its parameters
                into the planner.
              </p>
            </section>

            <section className="gallery-grid">
              {GALLERY_BUILDS.map((build) => {
                const buildInputs = build.inputs;
                const shelfLevelsLabel =
                  buildInputs.furnitureType === "shelving"
                    ? `Levels ${buildInputs.shelfLevelCount}`
                    : null;

                return (
                  <article key={build.id} className="gallery-card">
                    <button
                      type="button"
                      className="gallery-image-button"
                      onClick={() => setGalleryPreview({ src: build.imageSrc, title: build.title })}
                      aria-label={`Preview ${build.title} photo`}
                    >
                      <div
                        className="gallery-image"
                        aria-hidden="true"
                        style={{ backgroundImage: `url(${build.imageSrc})` }}
                      />
                    </button>
                    <div className="gallery-card-body">
                      <div className="gallery-card-header">
                        <div>
                          <p className="gallery-card-eyebrow">{build.category}</p>
                          <h3>{build.title}</h3>
                        </div>
                        <div className="gallery-card-actions">
                          <span
                            className={`gallery-chip ${
                              build.category === "Bench" ? "gallery-chip-bench" : "gallery-chip-shelving"
                            }`}
                          >
                            {build.category}
                          </span>
                          <button
                            type="button"
                            className="gallery-load-pill"
                            onClick={() => applyBuildPreset(build.inputs)}
                          >
                            Load This Build
                          </button>
                        </div>
                      </div>
                      <p className="gallery-card-description">{build.description}</p>
                      <ul className="gallery-meta">
                        <li>{`L ${formatInches(buildInputs.length)}`}</li>
                        <li>{`D ${formatInches(buildInputs.depth)}`}</li>
                        <li>{`H ${formatInches(buildInputs.height)}`}</li>
                        <li>{`Max Span ${formatInches(buildInputs.maxSpan)}`}</li>
                        <li>{`Clearance ${formatInches(buildInputs.bottomRailClearance)}`}</li>
                        {shelfLevelsLabel ? <li>{shelfLevelsLabel}</li> : null}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </section>
          </section>
        </main>
      )}
      {galleryPreview ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${galleryPreview.title} preview`}
          onClick={() => setGalleryPreview(null)}
        >
          <div className="gallery-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <div className="gallery-lightbox-header">
              <p className="gallery-lightbox-caption">{galleryPreview.title}</p>
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setGalleryPreview(null)}
                aria-label="Close image preview"
              >
                Close
              </button>
            </div>
            <img src={galleryPreview.src} alt={galleryPreview.title} className="gallery-lightbox-image" />
            <div className="gallery-lightbox-actions">
              <button
                type="button"
                className="gallery-load-button"
                onClick={() => {
                  const selectedBuild = GALLERY_BUILDS.find((build) => build.title === galleryPreview.title);
                  if (selectedBuild) {
                    applyBuildPreset(selectedBuild.inputs);
                  }
                  setGalleryPreview(null);
                }}
              >
                Load This Build
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

  const viewWidth =
    viewMode === "side"
      ? inputs.depth
      : viewMode === "assembly"
        ? inputs.length + inputs.depth * 0.72
        : inputs.length;
  const viewHeight =
    viewMode === "top"
      ? inputs.depth
      : viewMode === "assembly"
        ? inputs.height + inputs.depth * 0.44 + BOARD_THICKNESS
        : inputs.height;
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
  const sameLevelBoardGap = isTopSurface ? topBoardGap : boardGap;
  const sameLevelBoardOffsets = isTopSurface ? topBoardSideOffsets : shelfBoardOffsets;

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
  const levelGap =
    !isTopSurface && levelBottoms.length > 1
      ? Math.max(0, levelBottoms[1] - (levelBottoms[0] + 2 * BOARD_THICKNESS))
      : 0;

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

  const tintColor = (hex: string, amount: number) => {
    const value = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
    const mix = (channel: number) =>
      Math.max(0, Math.min(255, Math.round(channel + (amount >= 0 ? (255 - channel) * amount : channel * amount))));
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  };

  const assemblySkewX = 0.52;
  const assemblySkewY = 0.28;
  const assemblyProject = (px: number, py: number, pz: number) => ({
    x: originX + (px + pz * assemblySkewX) * scale,
    y: originY + contentHeight - py * scale - pz * assemblySkewY * scale,
  });

  const renderPrism = (
    key: string,
    prism: { x: number; y: number; z: number; width: number; height: number; depth: number },
    faceColor: string,
    edgeColor: string,
  ) => {
    const frontBottomLeft = assemblyProject(prism.x, prism.y, prism.z + prism.depth);
    const frontBottomRight = assemblyProject(prism.x + prism.width, prism.y, prism.z + prism.depth);
    const frontTopLeft = assemblyProject(prism.x, prism.y + prism.height, prism.z + prism.depth);
    const frontTopRight = assemblyProject(prism.x + prism.width, prism.y + prism.height, prism.z + prism.depth);
    const backBottomLeft = assemblyProject(prism.x, prism.y, prism.z);
    const backBottomRight = assemblyProject(prism.x + prism.width, prism.y, prism.z);
    const backTopLeft = assemblyProject(prism.x, prism.y + prism.height, prism.z);
    const backTopRight = assemblyProject(prism.x + prism.width, prism.y + prism.height, prism.z);

    const facePoints = (points: { x: number; y: number }[]) =>
      points.map((point) => `${point.x},${point.y}`).join(" ");

    return (
      <g key={key}>
        <polygon
          points={facePoints([backTopLeft, backTopRight, frontTopRight, frontTopLeft])}
          fill={tintColor(faceColor, 0.2)}
          stroke={edgeColor}
          strokeWidth={materialStrokeWidth}
        />
        <polygon
          points={facePoints([backBottomRight, frontBottomRight, frontTopRight, backTopRight])}
          fill={tintColor(faceColor, -0.14)}
          stroke={edgeColor}
          strokeWidth={materialStrokeWidth}
        />
        <polygon
          points={facePoints([frontBottomLeft, frontBottomRight, frontTopRight, frontTopLeft])}
          fill={faceColor}
          stroke={edgeColor}
          strokeWidth={materialStrokeWidth}
        />
      </g>
    );
  };

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

            {sameLevelBoardGap > 0.001 && sameLevelBoardOffsets.length > 1 ? (
              <DimensionLine
                x1={x(sameLevelBoardOffsets[0] + BOARD_WIDTH)}
                y1={Math.max(capsuleY + 26, yBottom(inputs.height) - 18)}
                x2={x(sameLevelBoardOffsets[1])}
                y2={Math.max(capsuleY + 26, yBottom(inputs.height) - 18)}
                label={`Board Gap ${formatInches(sameLevelBoardGap)}`}
                textY={Math.max(capsuleY + 16, yBottom(inputs.height) - 28)}
              />
            ) : null}

            <DimensionLine
              x1={x(0)}
              y1={showClearSpanDimension ? lowerFarDimY + 28 : lowerFarDimY}
              x2={xRight}
              y2={showClearSpanDimension ? lowerFarDimY + 28 : lowerFarDimY}
              label={`Depth ${formatInches(inputs.depth)}`}
              textY={showClearSpanDimension ? lowerFarDimTextY + 28 : lowerFarDimTextY}
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
              y1={showClearSpanDimension ? lowerNearDimY + 28 : lowerNearDimY}
              x2={x(inputs.depth - BOARD_THICKNESS)}
              y2={showClearSpanDimension ? lowerNearDimY + 28 : lowerNearDimY}
              label={`Rail ${formatInches(inputs.depth - 2 * BOARD_THICKNESS)}`}
              textY={showClearSpanDimension ? lowerNearDimTextY + 28 : lowerNearDimTextY}
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
            {!isTopSurface && levelGap > 0.001 ? (
              <DimensionLine
                x1={Math.min(capsuleX + capsuleWidth - 24, rightDimX + 40)}
                y1={yBottom(levelBottoms[0] + 2 * BOARD_THICKNESS)}
                x2={Math.min(capsuleX + capsuleWidth - 24, rightDimX + 40)}
                y2={yBottom(levelBottoms[1])}
                label={`Level Gap ${formatInches(levelGap)}`}
                textX={Math.min(capsuleX + capsuleWidth - 12, rightDimX + 52)}
                textY={(yBottom(levelBottoms[0] + 2 * BOARD_THICKNESS) + yBottom(levelBottoms[1])) / 2 - 10}
                textAnchor="start"
              />
            ) : null}
          </>
        ) : null}

        {viewMode === "assembly" ? (
          <>
            {frameLeftPositions.map((left, index) => (
              <g key={`assembly-frame-${index}`}>
                {renderPrism(
                  `assembly-back-leg-${index}`,
                  {
                    x: left,
                    y: 0,
                    z: 0,
                    width: BOARD_WIDTH,
                    height: visibleLegHeight,
                    depth: BOARD_THICKNESS,
                  },
                  index === 0 || index === frameCount - 1 ? legColor : supportColor,
                  index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                )}
                {renderPrism(
                  `assembly-front-leg-${index}`,
                  {
                    x: left,
                    y: 0,
                    z: inputs.depth - BOARD_THICKNESS,
                    width: BOARD_WIDTH,
                    height: visibleLegHeight,
                    depth: BOARD_THICKNESS,
                  },
                  index === 0 || index === frameCount - 1 ? legColor : supportColor,
                  index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                )}
              </g>
            ))}

            {isTopSurface ? (
              <>
                {frameLeftPositions.map((left, index) => (
                  <g key={`assembly-bench-rails-${index}`}>
                    {renderPrism(
                      `assembly-top-rail-${index}`,
                      {
                        x: left,
                        y: inputs.height - 2 * BOARD_THICKNESS,
                        z: BOARD_THICKNESS,
                        width: BOARD_WIDTH,
                        height: BOARD_THICKNESS,
                        depth: inputs.depth - 2 * BOARD_THICKNESS,
                      },
                      railColor,
                      railLineColor,
                    )}
                    {renderPrism(
                      `assembly-bottom-rail-${index}`,
                      {
                        x: left,
                        y: bottomRailBottom,
                        z: BOARD_THICKNESS,
                        width: BOARD_WIDTH,
                        height: BOARD_THICKNESS,
                        depth: inputs.depth - 2 * BOARD_THICKNESS,
                      },
                      railColor,
                      railLineColor,
                    )}
                  </g>
                ))}
                {topBoardSideOffsets.map((offset, boardIndex) =>
                  renderPrism(
                    `assembly-top-board-${boardIndex}`,
                    {
                      x: 0,
                      y: inputs.height - BOARD_THICKNESS,
                      z: offset,
                      width: inputs.length,
                      height: BOARD_THICKNESS,
                      depth: BOARD_WIDTH,
                    },
                    boardColor,
                    boardLineColor,
                  ),
                )}
              </>
            ) : (
              <>
                {levelBottoms.flatMap((bottom, levelIndex) =>
                  frameLeftPositions.map((left, frameIndex) =>
                    renderPrism(
                      `assembly-shelf-rail-${levelIndex}-${frameIndex}`,
                      {
                        x: left,
                        y: bottom + BOARD_THICKNESS,
                        z: BOARD_THICKNESS,
                        width: BOARD_WIDTH,
                        height: BOARD_THICKNESS,
                        depth: inputs.depth - 2 * BOARD_THICKNESS,
                      },
                      railColor,
                      railLineColor,
                    ),
                  ),
                )}
                {levelBottoms.flatMap((bottom, levelIndex) =>
                  shelfBoardOffsets.map((offset, boardIndex) =>
                    renderPrism(
                      `assembly-shelf-board-${levelIndex}-${boardIndex}`,
                      {
                        x: 0,
                        y: bottom + 2 * BOARD_THICKNESS,
                        z: offset,
                        width: inputs.length,
                        height: BOARD_THICKNESS,
                        depth: BOARD_WIDTH,
                      },
                      boardColor,
                      boardLineColor,
                    ),
                  ),
                )}
              </>
            )}
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
