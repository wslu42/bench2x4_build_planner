import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  BOARD_THICKNESS,
  BOARD_WIDTH,
  deriveDesign,
  formatInches,
  SAW_KERF,
  STOCK_LENGTH,
  type AppInputs,
  type BenchInputs,
  type DerivedDesign,
  type FixedShelfInputs,
  type FrameMode,
  type FurnitureType,
  type HybridShelfInputs,
  type ShelfMode,
  type AdjustableShelfInputs,
  type ViewMode,
} from "./domain";
import entryBenchImage from "./gallery_asset/entry_bench_L24_D14_H19.jpg";
import longBenchImage from "./gallery_asset/long_bench_L60_D14_H17p5.jpg";
import threeTierShelfImage from "./gallery_asset/three_tier_shelf_L33_D17p5_H92.jpg";
import twoTierShelfImage from "./gallery_asset/two_tier_shelf_L51_D17p5_H92.jpg";

type FillMode = "solid" | "pattern";
type ColorTheme = "rainbow" | "pinkblue" | "neon" | "sunset" | "violet";
type PageMode = "planner" | "gallery";
type Locale = "en" | "zh-TW";
type GalleryBuildInputs =
  | Omit<BenchInputs, "maxSpan">
  | Omit<FixedShelfInputs, "maxSpan">
  | Omit<AdjustableShelfInputs, "maxSpan">
  | Omit<HybridShelfInputs, "maxSpan">;
type LocalizedText = Record<Locale, string>;

type GalleryBuild = {
  id: string;
  title: LocalizedText;
  category: FurnitureType;
  description: LocalizedText;
  imageSrc: string;
  inputs: GalleryBuildInputs;
};

type GalleryPreview = {
  id: string;
  src: string;
  title: string;
};

type AssemblyVisibility = {
  boards: boolean;
  legs: boolean;
  rails: boolean;
};

type HybridSectionId = "left" | "right";

type FieldProps = {
  label: string;
  value: number;
  min: number;
  max?: number;
  step?: number;
  hint?: string;
  onChange: (nextValue: number) => void;
};

type IconToggleProps<T extends string> = {
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  caption?: string;
};

function NumberField({ label, value, min, max, step = 0.5, hint, onChange }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  );
}

function IconToggle<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  caption,
}: IconToggleProps<T>) {
  return (
    <div className="icon-toggle">
      {caption ? <span className="icon-toggle-caption">{caption}</span> : null}
      <div className="icon-toggle-track" role="group" aria-label={ariaLabel}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`icon-toggle-button ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            aria-label={option.label}
            title={option.label}
          >
            <span className="icon-toggle-glyph" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="icon-toggle-button-label">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_BOARD_UNIT_PRICE = 4.15;
const DEFAULT_SCREW_UNIT_PRICE = 0.06;
const LOCALE_STORAGE_KEY = "justuse2x4-locale";

const UI_STRINGS = {
  en: {
    appTitle: "2x4 Build Planner",
    pagePlanner: "Planner",
    pageGallery: "Gallery",
    languageEnglish: "EN",
    languageTraditionalChinese: "繁中",
    parameterization: "Build Size",
    parameterizationNote: "Enter the outside size. Board counts update automatically.",
    lengthIn: "Length (in)",
    depthIn: "Depth (in)",
    heightIn: "Height (in)",
    maxSpanIn: "Max Open Span (in)",
    bottomRailClearanceIn: "Bottom Shelf clearance (in)",
    shelfLevels: "Shelf Levels",
    bench: "Bench",
    shelving: "Shelf",
    frameMode: "Frame Style",
    hFrame: "H-frame",
    pFrame: "P-frame",
    derivedSummary: "Build Summary",
    frameCount: "Total frames",
    extraHFrames: "Middle frames",
    boardsPerLevel: "Boards per row",
    legLength: "Leg cut length",
    railLength: "Rail cut length",
    actualClearSpan: "Actual open span",
    bottomRailClearance: "Bottom Shelf clearance",
    preview: "Preview",
    previewNote: "Simple SVG views to check the structure.",
    solid: "solid",
    seeThru: "see-through",
    top: "top",
    side: "side",
    front: "front",
    assembly: "3D",
    materialOutput: "Materials",
    shoppingList: "Shopping List",
    item: "Item",
    fullLength: "Stock Length",
    unit: "Price",
    qty: "Qty",
    screws: "Screws",
    perBoard: "/ board",
    perEach: "/ each",
    totalEstimate: "Estimated Total",
    boardsCostBreakdown: "Boards",
    screwsCostBreakdown: "Screws",
    shoppingNote: "Cost is based on the board count from Board Layout plus the screw estimate.",
    pricingReferencePrefix: "Price reference: Home Depot 8 ft 2x4 at",
    pricingReferenceMiddle: "per board, and Amazon screws at",
    pricingReferenceSuffix: "per screw. Prices may change by store and over time.",
    sources: "Sources:",
    cutList: "Cut List",
    type: "Part",
    lengthColumn: "Length",
    boardOptimization: "Board Layout",
    boardOptimizationLegend: "Board layout legend",
    verticalLegs: "Legs",
    rails: "Rails",
    waste: "Scrap",
    boardN: "Board",
    fullBoard: 'stock board',
    cutLayout: "cut layout",
    usedIncludingKerfWaste: "Used {used} including {kerfCount} kerf cuts · {waste} waste",
    wasteSummary: "Scrap Summary",
    boardsNeeded: "Stock boards needed",
    totalUsed: "Total Used",
    totalWaste: "Total Scrap",
    buildGallery: "Example Builds",
    buildGalleryNote: "Ready-made builds that use the same 2x4 system. Load one into the planner.",
    levels: "Levels",
    frame: "Frame",
    clearance: "Bottom rail",
    loadThisBuild: "Load Build",
    close: "Close",
    closeImagePreview: "Close image preview",
    previewPhoto: "Preview {title} photo",
    imagePreview: "{title} preview",
    actual2x4: 'Actual board size: {thickness}" x {width}"',
    stockBoardLength: 'Stock board length: {length}"',
    sawKerf: 'Saw cut width: {kerf}"',
    maxSpanBadge: "Max open span: {value}",
    bottomRailClearanceBadge: "Bottom Shelf clearance: {value}",
    topBoardCount: "Top boards: {count}",
    shelfBoardCountPerLevel: "Shelf board count per level: {count}",
    frameModeBadge: "Frame style: {mode}",
    topBoards: "Top Boards",
    shelfBoards: "Shelf Boards",
    extraSupportFrames: "Middle Frames",
    frontLegs: "Front Legs",
    rearLegs: "Rear Legs",
    sideRails: "Side Rails",
    dimensions: "Size",
    showHide: "Show",
    boards: "Boards",
    legs: "Legs",
    explodeAmount: "Pull Apart",
    buildConstraintWarning: "Build Limit Warning",
    depthLabel: "Depth {value}",
    heightLabel: "Height {value}",
    lengthLabel: "Length {value}",
    clearSpanLabel: "Open Span {value}",
    boardGapLabel: "Board Gap {value}",
    railLabel: "Rail {value}",
    clearanceLabel: "Clearance {value}",
    levelGapLabel: "Level Gap {value}",
    floorZero: 'FLOOR 0"',
  },
  "zh-TW": {
    appTitle: "2x4 家具規劃工具",
    pagePlanner: "規劃器",
    pageGallery: "案例集",
    languageEnglish: "EN",
    languageTraditionalChinese: "繁中",
    parameterization: "參數設定",
    parameterizationNote: "所有輸入皆為外部尺寸，板材數量會自動推導。",
    lengthIn: "長度（英吋）",
    depthIn: "深度（英吋）",
    heightIn: "高度（英吋）",
    maxSpanIn: "最大跨距（英吋）",
    bottomRailClearanceIn: "底層淨空（英吋）",
    shelfLevels: "層數",
    bench: "長凳",
    shelving: "層架",
    frameMode: "框架模式",
    hFrame: "H 型",
    pFrame: "P 型",
    derivedSummary: "推導摘要",
    frameCount: "框架數量",
    extraHFrames: "額外 H 型支撐",
    boardsPerLevel: "每層板數",
    legLength: "立柱長度",
    railLength: "橫檔長度",
    actualClearSpan: "實際淨跨距",
    bottomRailClearance: "底層淨空",
    preview: "預覽",
    previewNote: "預覽結構配置，可用分解程度來看拆解結構。",
    solid: "實心",
    seeThru: "透視",
    top: "上視",
    side: "側視",
    front: "正視",
    assembly: "組裝",
    materialOutput: "材料輸出",
    shoppingList: "採購清單",
    item: "項目",
    fullLength: "原材長度",
    unit: "單價",
    qty: "數量",
    screws: "螺絲",
    perBoard: "/ 根",
    perEach: "/ 支",
    totalEstimate: "總成本估算",
    boardsCostBreakdown: "木料",
    screwsCostBreakdown: "螺絲",
    shoppingNote: "採購成本依 Board Optimization 的最佳板材數量，再加上估算螺絲數量計算。",
    pricingReferencePrefix: "預設價格參考：Home Depot 的 8 呎 2x4 每根",
    pricingReferenceMiddle: "，Amazon 螺絲每支",
    pricingReferenceSuffix: "。Home Depot 價格會因門市不同而變動，Amazon 價格也可能隨時間調整。",
    sources: "資料來源：",
    cutList: "裁切清單",
    type: "類型",
    lengthColumn: "長度",
    boardOptimization: "板材裁切",
    boardOptimizationLegend: "板材裁切圖例",
    verticalLegs: "立柱",
    rails: "橫檔",
    waste: "餘料",
    boardN: "板材",
    fullBoard: "完整板",
    cutLayout: "裁切配置",
    usedIncludingKerfWaste: "已用 {used}，包含 {kerfCount} 道鋸縫；餘料 {waste}",
    wasteSummary: "餘料摘要",
    boardsNeeded: "所需板材",
    totalUsed: "總使用長度",
    totalWaste: "總餘料",
    buildGallery: "案例集",
    buildGalleryNote: "這些案例都使用相同的固定 2x4 結構系統，可直接載入參數到規劃器。",
    levels: "層數",
    frame: "框架",
    clearance: "離地",
    loadThisBuild: "載入這個案例",
    close: "關閉",
    closeImagePreview: "關閉圖片預覽",
    previewPhoto: "預覽 {title} 圖片",
    imagePreview: "{title} 預覽",
    actual2x4: '實際 2x4 尺寸：{thickness}" x {width}"',
    stockBoardLength: '原材板長：{length}"',
    sawKerf: '鋸縫：{kerf}"',
    maxSpanBadge: "最大跨距：{value}",
    bottomRailClearanceBadge: "底層淨空：{value}",
    topBoardCount: "頂板數量：{count}",
    shelfBoardCountPerLevel: "每層層板數量：{count}",
    frameModeBadge: "框架模式：{mode}",
    topBoards: "頂板",
    shelfBoards: "層板",
    extraSupportFrames: "額外支撐框",
    frontLegs: "前側立柱",
    rearLegs: "後側立柱",
    sideRails: "側邊橫檔",
    dimensions: "尺寸",
    showHide: "顯示 / 隱藏",
    boards: "板材",
    legs: "立柱",
    explodeAmount: "分解程度",
    buildConstraintWarning: "結構限制警示",
    depthLabel: "深度 {value}",
    heightLabel: "高度 {value}",
    lengthLabel: "長度 {value}",
    clearSpanLabel: "淨跨距 {value}",
    boardGapLabel: "板縫 {value}",
    railLabel: "橫檔 {value}",
    clearanceLabel: "離地 {value}",
    levelGapLabel: "層間距 {value}",
    floorZero: '地板 0"',
  },
} as const;

function formatAssemblyDimension(value: number): string {
  if (value <= 24) {
    return formatInches(value);
  }

  const feet = Math.floor(value / 12);
  const inches = value - feet * 12;
  const roundedInches = Math.round(inches * 1000) / 1000;

  if (roundedInches === 0) {
    return `${feet}'`;
  }

  return `${feet}' ${formatInches(roundedInches)}`;
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

function getLocalizedPartLabel(
  locale: Locale,
  partKey: string,
  frameMode?: FrameMode,
  isBench?: boolean,
) {
  const t = UI_STRINGS[locale];
  switch (partKey) {
    case "top-board":
      return t.topBoards;
    case "shelf-board":
      return t.shelfBoards;
    case "vertical-leg":
      return !isBench && frameMode === "p-frame" ? t.frontLegs : t.verticalLegs;
    case "rear-leg":
      return t.rearLegs;
    case "side-rail":
      return t.sideRails;
    default:
      return partKey;
  }
}

function getDefaultShelfOpenings(shelfCount: number) {
  return Array.from({ length: Math.max(0, shelfCount - 1) }, () => 12);
}

function getDefaultHybridSections() {
  return {
    leftLength: 36,
    rightLength: 24,
    leftOpenings: [14, 14],
    rightOpenings: [18],
  };
}

function clampToRange(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function snapToHalfInch(value: number) {
  return Math.round(value * 2) / 2;
}

function snapToInch(value: number) {
  return Math.round(value);
}

function getAdjustableOpeningMax(height: number, openingCount: number, otherOpeningsTotal: number) {
  const maxTotalOpenings = Math.max(BOARD_THICKNESS, height - (openingCount + 1) * 2 * BOARD_THICKNESS);
  return Math.max(BOARD_THICKNESS, maxTotalOpenings - otherOpeningsTotal);
}

function getOpeningMaxHint(locale: Locale, max: number) {
  return locale === "en" ? `Max ${formatInches(max)}` : `上限 ${formatInches(max)}`;
}

function deriveOpeningLevelBottoms(height: number, clearOpenings: number[]) {
  const highestRailBottom = Math.max(0, height - 2 * BOARD_THICKNESS);
  const levelBottoms = [highestRailBottom];

  for (let index = clearOpenings.length - 1; index >= 0; index -= 1) {
    const previous = levelBottoms[0];
    const nextBottom = previous - (2 * BOARD_THICKNESS + clearOpenings[index]);
    levelBottoms.unshift(nextBottom);
  }

  return levelBottoms;
}

function hasSharedFrameConflict(leftOpenings: number[], rightOpenings: number[], height: number) {
  const safeDistance = 2 * BOARD_THICKNESS;
  const leftLevels = deriveOpeningLevelBottoms(height, leftOpenings).filter((bottom) => bottom >= 0);
  const rightLevels = deriveOpeningLevelBottoms(height, rightOpenings).filter((bottom) => bottom >= 0);

  for (const leftBottom of leftLevels) {
    for (const rightBottom of rightLevels) {
      const delta = Math.abs(leftBottom - rightBottom);

      if (delta > 0.001 && delta < safeDistance) {
        return true;
      }
    }
  }

  return false;
}

function getHybridOpeningMax(
  height: number,
  sectionOpenings: number[],
  openingIndex: number,
  opposingOpenings: number[],
  step = 0.5,
) {
  const overflowMax = getAdjustableOpeningMax(
    height,
    sectionOpenings.length,
    sectionOpenings.reduce(
      (sum, opening, index) => (index === openingIndex ? sum : sum + opening),
      0,
    ),
  );

  const nextOpenings = [...sectionOpenings];

  for (let candidate = overflowMax; candidate >= BOARD_THICKNESS; candidate -= step) {
    nextOpenings[openingIndex] = Number(candidate.toFixed(3));
    if (!hasSharedFrameConflict(nextOpenings, opposingOpenings, height)) {
      return Number(candidate.toFixed(3));
    }
  }

  return BOARD_THICKNESS;
}

function sanitizeAdjustableOpenings(height: number, openings: number[]) {
  const nextOpenings = [...openings];

  for (let index = nextOpenings.length - 1; index >= 0; index -= 1) {
    const openingMax = getAdjustableOpeningMax(
      height,
      nextOpenings.length,
      nextOpenings.reduce(
        (sum, opening, openingIndex) => (openingIndex === index ? sum : sum + opening),
        0,
      ),
    );
    nextOpenings[index] = clampToRange(nextOpenings[index], BOARD_THICKNESS, openingMax);
  }

  return nextOpenings;
}

function sanitizeHybridSectionOpenings(
  height: number,
  sectionOpenings: number[],
  opposingOpenings: number[],
  mode: "overflow-only" | "shared-frame",
) {
  const nextOpenings = [...sectionOpenings];

  for (let index = nextOpenings.length - 1; index >= 0; index -= 1) {
    const openingMax =
      mode === "shared-frame"
        ? getHybridOpeningMax(height, nextOpenings, index, opposingOpenings)
        : getAdjustableOpeningMax(
            height,
            nextOpenings.length,
            nextOpenings.reduce(
              (sum, opening, openingIndex) => (openingIndex === index ? sum : sum + opening),
              0,
            ),
          );
    nextOpenings[index] = clampToRange(nextOpenings[index], BOARD_THICKNESS, openingMax);
  }

  return nextOpenings;
}

function sanitizeHybridOpenings(height: number, leftOpenings: number[], rightOpenings: number[]) {
  const boundedLeft = sanitizeHybridSectionOpenings(
    height,
    leftOpenings,
    rightOpenings,
    "overflow-only",
  );
  const boundedRight = sanitizeHybridSectionOpenings(
    height,
    rightOpenings,
    boundedLeft,
    "shared-frame",
  );

  return {
    left: boundedLeft,
    right: boundedRight,
  };
}

function getShelfModeLabel(locale: Locale, shelfMode: ShelfMode) {
  const labels: Record<Locale, Record<ShelfMode, string>> = {
    en: {
      fixed: "Fixed Shelf",
      adjustable: "Adjustable Shelf",
      hybrid: "Hybrid Shelf",
    },
    "zh-TW": {
      fixed: "固定層架",
      adjustable: "可調層架",
      hybrid: "混合層架",
    },
  };

  return labels[locale][shelfMode];
}

function getLocalizedShelfControlLabel(
  locale: Locale,
  key:
    | "shelfType"
    | "opening"
    | "shelfCount"
    | "addOpening"
    | "removeOpening"
    | "hybridScaffold"
    | "leftSection"
    | "rightSection"
    | "openingLength"
    | "sharedTopLevel",
) {
  const labels: Record<Locale, Record<string, string>> = {
    en: {
      shelfType: "Shelf Type",
      opening: "Opening",
      shelfCount: "Shelf count",
      addOpening: "Add opening",
      removeOpening: "Remove opening",
      hybridScaffold:
        "Hybrid shelf is scaffolded in this release and will follow after fixed and adjustable shelf stabilization.",
      leftSection: "Left section",
      rightSection: "Right section",
      openingLength: "Opening length",
      sharedTopLevel: "Top shelf is shared across both sections in this version.",
    },
    "zh-TW": {
      shelfType: "層架類型",
      opening: "層間淨空",
      shelfCount: "層板數",
      addOpening: "新增淨空",
      removeOpening: "移除最後一層淨空",
      hybridScaffold: "Hybrid Shelf 這一版先保留資料與介面骨架，等 Fixed / Adjustable 穩定後再完整開放。",
      leftSection: "左側區段",
      rightSection: "右側區段",
      sectionLength: "區段長度",
      sharedTopLevel: "這一版固定共用最上層層板。",
    },
  };

  return labels[locale][key] ?? labels[locale].sectionLength ?? labels.en[key];
}

function getPlannerGroupLabel(
  locale: Locale,
  key:
    | "overallSize"
    | "fixedShelfSetup"
    | "adjustableOpenings"
    | "sectionLengths"
    | "leftSectionOpenings"
    | "rightSectionOpenings",
) {
  const labels: Record<
    Locale,
    Record<
      | "overallSize"
      | "fixedShelfSetup"
      | "adjustableOpenings"
      | "sectionLengths"
      | "leftSectionOpenings"
      | "rightSectionOpenings",
      string
    >
  > = {
    en: {
      overallSize: "Overall Size",
      fixedShelfSetup: "Fixed Shelf Setup",
      adjustableOpenings: "Shelf Openings",
      sectionLengths: "Section Lengths",
      leftSectionOpenings: "Left Section Openings",
      rightSectionOpenings: "Right Section Openings",
    },
    "zh-TW": {
      overallSize: "整體尺寸",
      fixedShelfSetup: "固定層架設定",
      adjustableOpenings: "層間淨空",
      sectionLengths: "區段長度",
      leftSectionOpenings: "左側區段淨空",
      rightSectionOpenings: "右側區段淨空",
    },
  };

  return labels[locale][key];
}

const GALLERY_BUILDS: GalleryBuild[] = [
  {
    id: "entry-bench",
    title: {
      en: "Entry Bench",
      "zh-TW": "玄關長凳",
    },
    category: "bench",
    description: {
      en: "Compact hallway bench with a simple open base and generous clearance.",
      "zh-TW": "適合玄關與走道的緊湊長凳，底部開放、離地空間充足。",
    },
    imageSrc: entryBenchImage,
    inputs: {
      furnitureType: "bench",
      length: 24,
      depth: 14,
      height: 19,
      bottomRailClearance: 8,
    },
  },
  {
    id: "long-bench",
    title: {
      en: "Long Bench",
      "zh-TW": "長版長凳",
    },
    category: "bench",
    description: {
      en: "Longer seating span with one extra support frame to reduce flex.",
      "zh-TW": "較長的坐面配置，加入一組額外支撐框以降低撓曲。",
    },
    imageSrc: longBenchImage,
    inputs: {
      furnitureType: "bench",
      length: 60,
      depth: 14,
      height: 17.5,
      bottomRailClearance: 4.5,
    },
  },
  {
    id: "two-tier-shelf",
    title: {
      en: "Two-Tier Shelf",
      "zh-TW": "雙層層架",
    },
    category: "shelf",
    description: {
      en: "Open shelving preset for entry or workshop storage with comfortable lower clearance.",
      "zh-TW": "適合玄關或工作間的開放式層架，底部保留較大的使用淨空。",
    },
    imageSrc: twoTierShelfImage,
    inputs: {
      furnitureType: "shelf",
      shelfMode: "fixed",
      length: 51,
      depth: 17.5,
      height: 92,
      bottomRailClearance: 42.5,
      shelfCount: 2,
      frameMode: "p-frame",
    },
  },
  {
    id: "three-tier-shelf",
    title: {
      en: "Three-Tier Shelf",
      "zh-TW": "三層層架",
    },
    category: "shelf",
    description: {
      en: "Denser storage layout that still respects the fixed 2x4 frame system.",
      "zh-TW": "更高密度的收納配置，同時維持固定 2x4 結構系統。",
    },
    imageSrc: threeTierShelfImage,
    inputs: {
      furnitureType: "shelf",
      shelfMode: "fixed",
      length: 33,
      depth: 17.5,
      height: 92,
      bottomRailClearance: 13,
      shelfCount: 3,
      frameMode: "p-frame",
    },
  },
  {
    id: "adjustable-shelf",
    title: {
      en: "Adjustable Shelf",
      "zh-TW": "可調層架",
    },
    category: "shelf",
    description: {
      en: "Shelf openings are defined explicitly while the overall height stays fixed at the top shelf.",
      "zh-TW": "用明確層間淨空定義層架，最上層仍貼齊整體高度。",
    },
    imageSrc: threeTierShelfImage,
    inputs: {
      furnitureType: "shelf",
      shelfMode: "adjustable",
      length: 48,
      depth: 17.5,
      height: 72,
      bottomRailClearance: 16.5,
      clearOpenings: [14, 18],
      frameMode: "h-frame",
    },
  },
  {
    id: "hybrid-shelf",
    title: {
      en: "Hybrid Shelf",
      "zh-TW": "混合層架",
    },
    category: "shelf",
    description: {
      en: "Two side-by-side shelf sections share a center frame while keeping different opening patterns.",
      "zh-TW": "左右兩段層架共用中間 frame，但仍可各自保有不同層間配置。",
    },
    imageSrc: twoTierShelfImage,
    inputs: {
      furnitureType: "shelf",
      shelfMode: "hybrid",
      length: 56.5,
      depth: 17.5,
      height: 72,
      bottomRailClearance: 16.5,
      frameMode: "p-frame",
      sections: [
        { sectionLength: 36, clearOpenings: [14, 14] },
        { sectionLength: 24, clearOpenings: [18] },
      ],
    },
  },
];

const GALLERY_PROMO = {
  en: {
    eyebrow: "WHY 2x4",
    title: "Overbuilt, repairable, and weirdly fun to plan with.",
    body:
      "This tool is for people who look at a humble 2x4 and see a dependable building block, not just framing lumber. Houses trust it to hold up roofs. We can trust it to hold up benches, shelves, and all the everyday stuff that usually ends up on wobbly furniture.",
    body2:
      "I wanted a planner that thinks the way 2x4 projects actually work: outside dimensions first, repeated frames, simple cuts, predictable spans, clear stock usage, and a shopping list you can believe before you leave for the hardware store.",
  },
  "zh-TW": {
    eyebrow: "為什麼用 2x4 做家具？",
    title: "單純、耐用、能維修，而且設計起來意外地有趣。",
    body:
      "這個工具是做給這樣的人：看到一根普通 2x4，不會只想到建材，而是想到一個可靠、直接、耐操的家具模組。房子都靠它撐屋頂了，拿來做長椅、層架，還有那些每天都要承重的東西，其實非常合理。",
    body2:
      "我想做的是一個真的用 2x4 邏輯在思考的規劃器：先看外部尺寸，再推導重複框架、簡單切法、可預期的跨度、原材使用量，還有一份出門去五金行前就能先相信的採買清單。",
  },
} as const;

function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "zh-TW";
    }
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return saved === "en" || saved === "zh-TW" ? saved : "zh-TW";
  });
  const [pageMode, setPageMode] = useState<PageMode>("gallery");
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("bench");
  const [viewMode, setViewMode] = useState<ViewMode>("assembly");
  const [explodedAmount, setExplodedAmount] = useState(0);
  const [assemblyVisibility, setAssemblyVisibility] = useState<AssemblyVisibility>({
    boards: true,
    legs: true,
    rails: true,
  });
  const [length, setLength] = useState(72);
  const [depth, setDepth] = useState(14.5);
  const [height, setHeight] = useState(17.5);
  const [maxSpan, setMaxSpan] = useState(48);
  const [bottomRailClearance, setBottomRailClearance] = useState(6);
  const [shelfMode, setShelfMode] = useState<ShelfMode>("fixed");
  const [shelfCount, setShelfCount] = useState(3);
  const [shelfOpenings, setShelfOpenings] = useState<number[]>(getDefaultShelfOpenings(3));
  const [hybridLeftLength, setHybridLeftLength] = useState(getDefaultHybridSections().leftLength);
  const [hybridRightLength, setHybridRightLength] = useState(getDefaultHybridSections().rightLength);
  const [hybridLeftOpenings, setHybridLeftOpenings] = useState<number[]>(getDefaultHybridSections().leftOpenings);
  const [hybridRightOpenings, setHybridRightOpenings] = useState<number[]>(getDefaultHybridSections().rightOpenings);
  const [frameMode, setFrameMode] = useState<FrameMode>("h-frame");
  const [fillMode, setFillMode] = useState<FillMode>("solid");
  const [galleryPreview, setGalleryPreview] = useState<GalleryPreview | null>(null);
  const colorTheme: ColorTheme = "sunset";
  const t = UI_STRINGS[locale];
  const galleryPromo = GALLERY_PROMO[locale];
  const galleryPromoParagraphs =
    locale === "en"
      ? [
          "I built this because I genuinely think the humble 2x4 is one of the most underrated furniture materials on the planet.",
          "It is structural lumber. Houses trust it to hold up roofs. That does not automatically make every 2x4 project elegant, but it does mean the raw material starts with a kind of honest, overqualified strength that most store-bought flat-pack furniture can only cosplay.",
          "It is also refreshingly low drama to work with. You are usually dealing with cross cuts, repeated lengths, and pieces you can carry without wrestling a giant sheet across your garage like it is a boss battle. No giant plywood panels. No melamine dust storm. No moment where you realize you cut directly into the floor because you forgot a sacrificial board underneath.",
          "I also like that 2x4 furniture ages with a little dignity. If you screw into it, ding it, drag it, overload it, or let it pick up a few scars, it still feels like the same object. A drywall hole feels like a mistake. A beat-up 2x4 feels like field data.",
          "And then there is the practical part: 2x4s are cheap, available almost everywhere, and easy to replace. If a design works, great. If a design needs revision, you are not emotionally trapped by a pile of expensive sheet goods and exotic hardware. You just cut another board and keep iterating.",
          "There is also a materials philosophy here. A simple 2x4 build is basically wood plus screws. No laminated mystery layers. No plastic coating pretending to be wood grain. No glue-heavy panel products if you do not want them. Just a very understandable material system that is easy to inspect, easy to repair, and easy to explain.",
          "So this project is my nerdy attempt to make that system easier to use. I wanted a planner that helps you think in the native language of 2x4 builds: outer dimensions, repeated frames, predictable spans, cut lengths, stock usage, and a shopping list you can trust before you even leave the house.",
        ]
      : [
          "會做這個工具，是因為我覺得最不起眼的 2x4 木材，其實是全北美最被低估的家具材料之一。",
          "它本來就是結構用木料，是拿來撐整棟房子的屋頂的。這不代表用 2x4 做的東西就一定很精緻好看，但至少你一開始用的材料，就已經自帶一種很誠實、甚至有點「規格過剩」的強度——這點是大部分市售的平板組裝家具怎麼模仿都模仿不來的。",
          "而且用它來做簡易家具很「不麻煩」。大多時候你只需要做截面切、重複長度的裁切，而且每一塊木料你都可以輕鬆搬動，不用在車庫跟一整片4x8裡纏鬥、像在對付一隻完全不想配合你的巨大 NPC。沒有巨大夾板、沒有美耐板粉塵滿天飛，也不會發生那種「靠盃忘了墊底板，結果直接鋸地板」的崩潰瞬間。",
          "我也很喜歡 2x4 家具隨著使用慢慢「長出個性」的樣子。你在上面鎖螺絲、塗鴉、撞到、拖來拖去留下刮痕，它還是同一個東西。drywall 破一個洞會讓人覺得是強迫症不補不行，但沒有人會注意到滿是枝椏點的 2x4 又多了一個螺絲孔。",
          "再來是很實際的部分：2x4 便宜、好買，而且很好替換。如果設計成功，當然很好；如果設計要改，也不會被一堆昂貴板材和特殊五金綁住，也不用拿游標卡尺量半天，才崩潰發現長度是英制但螺絲是公制。我只要再切一根，然後繼續迭代。",
          "最後是這套系統有我鍾愛的系統哲學：簡單。樸素的 2x4 家具，基本上就是木頭加螺絲。沒有神祕的夾層。沒有假裝成木紋的塑膠表皮。也不用依賴大量膠合板材。它是一套非常容易理解、容易檢查、容易修理的材料系統。沒有甲醛、零揮發，還能反覆拆裝、重複利用。",
          "所以這個專案就是一個很工程宅的嘗試，想讓這套系統更好用一點。我想做的是一個會用 2x4 原生語言思考的規劃器：外部尺寸、重複框架、可預期的跨度、切料長度、原材使用量，還有一份在出門買料之前就能放心的採購清單。",
        ];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

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

    if (nextType === "bench") {
      setHeight(17.5);
      setMaxSpan(48);
      setBottomRailClearance(6);
      setShelfMode("fixed");
      setShelfCount(3);
      setShelfOpenings(getDefaultShelfOpenings(3));
      const hybridDefaults = getDefaultHybridSections();
      setHybridLeftLength(hybridDefaults.leftLength);
      setHybridRightLength(hybridDefaults.rightLength);
      setHybridLeftOpenings(hybridDefaults.leftOpenings);
      setHybridRightOpenings(hybridDefaults.rightOpenings);
      setFrameMode("h-frame");
      return;
    }

    setHeight(44);
    setMaxSpan(48);
    setBottomRailClearance(6);
    setShelfMode("fixed");
    setShelfCount(3);
    setShelfOpenings(getDefaultShelfOpenings(3));
    const hybridDefaults = getDefaultHybridSections();
    setHybridLeftLength(hybridDefaults.leftLength);
    setHybridRightLength(hybridDefaults.rightLength);
    setHybridLeftOpenings(hybridDefaults.leftOpenings);
    setHybridRightOpenings(hybridDefaults.rightOpenings);
    setFrameMode("h-frame");
  };

  const handleShelfModeChange = (nextMode: ShelfMode) => {
    setShelfMode(nextMode);

    if (nextMode === "fixed") {
      setShelfCount(3);
      setShelfOpenings(getDefaultShelfOpenings(3));
      return;
    }

    if (nextMode === "adjustable") {
      setShelfOpenings((current) => (current.length > 0 ? current : getDefaultShelfOpenings(3)));
      return;
    }

    if (nextMode === "hybrid") {
      const hybridDefaults = getDefaultHybridSections();
      setHybridLeftLength((current) => current || hybridDefaults.leftLength);
      setHybridRightLength((current) => current || hybridDefaults.rightLength);
      setHybridLeftOpenings((current) => (current.length > 0 ? current : hybridDefaults.leftOpenings));
      setHybridRightOpenings((current) => (current.length > 0 ? current : hybridDefaults.rightOpenings));
    }
  };

  const handleHeightChange = (nextValue: number) => {
    const nextHeight = Math.max(3.5, nextValue);

    if (furnitureType === "bench") {
      setHeight(nextHeight);
      return;
    }

    if (shelfMode === "adjustable") {
      const boundedOpenings = sanitizeAdjustableOpenings(nextHeight, shelfOpenings);
      setShelfOpenings(boundedOpenings);
      setShelfCount(boundedOpenings.length + 1);
      setHeight(nextHeight);
      return;
    }

    if (shelfMode === "hybrid") {
      const boundedHybridOpenings = sanitizeHybridOpenings(
        nextHeight,
        hybridLeftOpenings,
        hybridRightOpenings,
      );
      setHybridLeftOpenings(boundedHybridOpenings.left);
      setHybridRightOpenings(boundedHybridOpenings.right);
      setHeight(nextHeight);
      return;
    }

    setHeight(nextHeight);
  };

  const addShelfOpening = () => {
    setShelfOpenings((current) => {
      const nextMax = getAdjustableOpeningMax(
        height,
        current.length + 1,
        current.reduce((sum, opening) => sum + opening, 0),
      );

      if (nextMax <= BOARD_THICKNESS + 0.001) {
        return current;
      }

      return [...current, clampToRange(12, BOARD_THICKNESS, nextMax)];
    });
  };

  const removeShelfOpening = () => {
    setShelfOpenings((current) => (current.length > 1 ? current.slice(0, -1) : current));
  };

  const updateAdjustableOpening = (index: number, nextValue: number) => {
    setShelfOpenings((current) => {
      const nextOpenings = current.map((entry, entryIndex) =>
        entryIndex === index ? nextValue : entry,
      );
      return sanitizeAdjustableOpenings(height, nextOpenings);
    });
  };

  const updateHybridSectionOpenings = (section: HybridSectionId, nextOpenings: number[]) => {
    if (section === "left") {
      setHybridLeftOpenings(nextOpenings);
      return;
    }

    setHybridRightOpenings(nextOpenings);
  };

  const addHybridOpening = (section: HybridSectionId) => {
    const sectionOpenings = section === "left" ? hybridLeftOpenings : hybridRightOpenings;
    const opposingOpenings = section === "left" ? hybridRightOpenings : hybridLeftOpenings;
    const nextIndex = sectionOpenings.length;
    const provisionalOpenings = [...sectionOpenings, 12];
    const nextMax = getHybridOpeningMax(height, provisionalOpenings, nextIndex, opposingOpenings);

    if (nextMax <= BOARD_THICKNESS + 0.001) {
      return;
    }

    updateHybridSectionOpenings(
      section,
      [...sectionOpenings, clampToRange(12, BOARD_THICKNESS, nextMax)],
    );
  };

  const removeHybridOpening = (section: HybridSectionId) => {
    const openings = section === "left" ? hybridLeftOpenings : hybridRightOpenings;
    updateHybridSectionOpenings(section, openings.length > 1 ? openings.slice(0, -1) : openings);
  };

  const updateHybridOpening = (section: HybridSectionId, index: number, nextValue: number) => {
    const nextLeftOpenings =
      section === "left"
        ? hybridLeftOpenings.map((entry, entryIndex) => (entryIndex === index ? nextValue : entry))
        : hybridLeftOpenings;
    const nextRightOpenings =
      section === "right"
        ? hybridRightOpenings.map((entry, entryIndex) => (entryIndex === index ? nextValue : entry))
        : hybridRightOpenings;
    const boundedHybridOpenings = sanitizeHybridOpenings(height, nextLeftOpenings, nextRightOpenings);

    setHybridLeftOpenings(boundedHybridOpenings.left);
    setHybridRightOpenings(boundedHybridOpenings.right);
  };

  const updateHybridSectionLength = (section: HybridSectionId, nextOpeningLength: number) => {
    const boundedLength = Math.max(BOARD_WIDTH * 2, snapToInch(nextOpeningLength + 2 * BOARD_THICKNESS));

    if (section === "left") {
      setHybridLeftLength(boundedLength);
      return;
    }

    setHybridRightLength(boundedLength);
  };

  const updateShelfLength = (nextOpeningLength: number) => {
    setLength(Math.max(BOARD_WIDTH * 2, snapToInch(nextOpeningLength + 2 * BOARD_THICKNESS)));
  };

  const applyBuildPreset = (presetInputs: GalleryBuildInputs) => {
    setFurnitureType(presetInputs.furnitureType);
    setLength(presetInputs.length);
    setDepth(presetInputs.depth);
    setHeight(presetInputs.height);
    setMaxSpan(48);
    setBottomRailClearance(presetInputs.bottomRailClearance);
    if (presetInputs.furnitureType === "shelf") {
      setShelfMode(presetInputs.shelfMode);
      setFrameMode(presetInputs.frameMode);
      if (presetInputs.shelfMode === "fixed") {
        setShelfCount(presetInputs.shelfCount);
        setShelfOpenings(getDefaultShelfOpenings(presetInputs.shelfCount));
      } else if (presetInputs.shelfMode === "adjustable") {
        setShelfOpenings(presetInputs.clearOpenings);
        setShelfCount(presetInputs.clearOpenings.length + 1);
      } else {
        setHybridLeftLength(presetInputs.sections[0].sectionLength);
        setHybridRightLength(presetInputs.sections[1].sectionLength);
        setHybridLeftOpenings(presetInputs.sections[0].clearOpenings);
        setHybridRightOpenings(presetInputs.sections[1].clearOpenings);
      }
    } else {
      setShelfMode("fixed");
      setShelfCount(3);
      setShelfOpenings(getDefaultShelfOpenings(3));
      const hybridDefaults = getDefaultHybridSections();
      setHybridLeftLength(hybridDefaults.leftLength);
      setHybridRightLength(hybridDefaults.rightLength);
      setHybridLeftOpenings(hybridDefaults.leftOpenings);
      setHybridRightOpenings(hybridDefaults.rightOpenings);
      setFrameMode("h-frame");
    }
    setViewMode("assembly");
    setFillMode("solid");
    setPageMode("planner");
  };

  const inputs: AppInputs = useMemo(() => {
    if (furnitureType === "bench") {
      return {
        furnitureType,
        length,
        depth,
        height,
        maxSpan,
        bottomRailClearance,
      };
    }

    if (shelfMode === "fixed") {
      return {
        furnitureType,
        shelfMode,
        length,
        depth,
        height,
        maxSpan,
        bottomRailClearance,
        shelfCount,
        frameMode,
      };
    }

    if (shelfMode === "adjustable") {
      return {
        furnitureType,
        shelfMode,
        length,
        depth,
        height,
        maxSpan,
        bottomRailClearance,
        clearOpenings: shelfOpenings,
        frameMode,
      };
    }

    return {
      furnitureType,
      shelfMode,
      length: hybridLeftLength + hybridRightLength - BOARD_WIDTH,
      depth,
      height,
      maxSpan,
      bottomRailClearance,
      frameMode,
      sections: [
        {
          sectionLength: hybridLeftLength,
          clearOpenings: hybridLeftOpenings,
        },
        {
          sectionLength: hybridRightLength,
          clearOpenings: hybridRightOpenings,
        },
      ],
    };
  }, [
    bottomRailClearance,
    depth,
    frameMode,
    furnitureType,
    height,
    length,
    maxSpan,
    shelfCount,
    shelfMode,
    shelfOpenings,
    hybridLeftLength,
    hybridRightLength,
    hybridLeftOpenings,
    hybridRightOpenings,
  ]);

  const design = useMemo(() => deriveDesign(inputs), [inputs]);
  const effectiveInputs = design.normalizedInputs;
  const isBench = effectiveInputs.furnitureType === "bench";
  const effectiveFrameMode = effectiveInputs.furnitureType === "shelf" ? effectiveInputs.frameMode : undefined;
  const adjustableOpeningMaxes = useMemo(
    () =>
      shelfOpenings.map((_, index) =>
        getAdjustableOpeningMax(
          height,
          shelfOpenings.length,
          shelfOpenings.reduce(
            (sum, opening, openingIndex) => (openingIndex === index ? sum : sum + opening),
            0,
          ),
        ),
      ),
    [height, shelfOpenings],
  );
  const nextAdjustableOpeningMax = useMemo(
    () =>
      getAdjustableOpeningMax(
        height,
        shelfOpenings.length + 1,
        shelfOpenings.reduce((sum, opening) => sum + opening, 0),
      ),
    [height, shelfOpenings],
  );
  const canAddAdjustableOpening = nextAdjustableOpeningMax > BOARD_THICKNESS + 0.001;
  const hybridLeftOpeningMaxes = useMemo(
    () =>
      hybridLeftOpenings.map((_, index) =>
        getHybridOpeningMax(height, hybridLeftOpenings, index, hybridRightOpenings),
      ),
    [height, hybridLeftOpenings, hybridRightOpenings],
  );
  const hybridRightOpeningMaxes = useMemo(
    () =>
      hybridRightOpenings.map((_, index) =>
        getHybridOpeningMax(height, hybridRightOpenings, index, hybridLeftOpenings),
      ),
    [height, hybridLeftOpenings, hybridRightOpenings],
  );
  const nextHybridLeftOpeningMax = useMemo(
    () => getHybridOpeningMax(height, [...hybridLeftOpenings, 12], hybridLeftOpenings.length, hybridRightOpenings),
    [height, hybridLeftOpenings, hybridRightOpenings],
  );
  const nextHybridRightOpeningMax = useMemo(
    () => getHybridOpeningMax(height, [...hybridRightOpenings, 12], hybridRightOpenings.length, hybridLeftOpenings),
    [height, hybridLeftOpenings, hybridRightOpenings],
  );
  const canAddHybridLeftOpening = nextHybridLeftOpeningMax > BOARD_THICKNESS + 0.001;
  const canAddHybridRightOpening = nextHybridRightOpeningMax > BOARD_THICKNESS + 0.001;
  const boardUnitPrice = DEFAULT_BOARD_UNIT_PRICE;
  const screwUnitPrice = DEFAULT_SCREW_UNIT_PRICE;
  const boardLineTotal = design.stockPlan.length * boardUnitPrice;
  const screwsLineTotal = design.estimatedScrewCount * screwUnitPrice;
  const shoppingGrandTotal = boardLineTotal + screwsLineTotal;
  const stockSegmentStyles: Record<string, { fill: string; stroke: string }> = {
    "top-board": { fill: "#FF7B00", stroke: "#BF5C00" },
    "shelf-board": { fill: "#FF7B00", stroke: "#BF5C00" },
    "vertical-leg": { fill: "#B68A2E", stroke: "#8A6822" },
    "rear-leg": { fill: "#B68A2E", stroke: "#8A6822" },
    "side-rail": { fill: "#3A86FF", stroke: "#2B63BF" },
  };

  const ruleBadges = [
    fillTemplate(t.actual2x4, { thickness: BOARD_THICKNESS, width: BOARD_WIDTH }),
    fillTemplate(t.stockBoardLength, { length: STOCK_LENGTH }),
    fillTemplate(t.sawKerf, { kerf: SAW_KERF }),
    fillTemplate(t.maxSpanBadge, { value: formatInches(effectiveInputs.maxSpan) }),
    fillTemplate(t.bottomRailClearanceBadge, {
      value: formatInches(effectiveInputs.bottomRailClearance),
    }),
    isBench
      ? fillTemplate(t.topBoardCount, { count: design.boardCountPerLevel })
      : fillTemplate(t.shelfBoardCountPerLevel, { count: design.boardCountPerLevel }),
    !isBench
      ? fillTemplate(t.frameModeBadge, {
          mode: effectiveFrameMode === "h-frame" ? t.hFrame : t.pFrame,
        })
      : null,
  ].filter((badge): badge is string => Boolean(badge));

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

    if (!isBench && effectiveInputs.shelfMode === "fixed" && shelfCount !== effectiveInputs.shelfCount) {
      setShelfCount(effectiveInputs.shelfCount);
    }
    if (!isBench && effectiveInputs.shelfMode === "adjustable") {
      const nextOpenings = effectiveInputs.clearOpenings;
      if (
        shelfOpenings.length !== nextOpenings.length ||
        shelfOpenings.some((opening, index) => opening !== nextOpenings[index])
      ) {
        setShelfOpenings(nextOpenings);
      }
      if (shelfCount !== nextOpenings.length + 1) {
        setShelfCount(nextOpenings.length + 1);
      }
    }
    if (!isBench && effectiveInputs.shelfMode === "hybrid") {
      const [leftSection, rightSection] = effectiveInputs.sections;
      if (hybridLeftLength !== leftSection.sectionLength) {
        setHybridLeftLength(leftSection.sectionLength);
      }
      if (hybridRightLength !== rightSection.sectionLength) {
        setHybridRightLength(rightSection.sectionLength);
      }
      if (
        hybridLeftOpenings.length !== leftSection.clearOpenings.length ||
        hybridLeftOpenings.some((opening, index) => opening !== leftSection.clearOpenings[index])
      ) {
        setHybridLeftOpenings(leftSection.clearOpenings);
      }
      if (
        hybridRightOpenings.length !== rightSection.clearOpenings.length ||
        hybridRightOpenings.some((opening, index) => opening !== rightSection.clearOpenings[index])
      ) {
        setHybridRightOpenings(rightSection.clearOpenings);
      }
    }
    if (!isBench && frameMode !== effectiveInputs.frameMode) {
      setFrameMode(effectiveInputs.frameMode);
    }
  }, [
    bottomRailClearance,
    depth,
    effectiveInputs,
    frameMode,
    height,
    isBench,
    length,
    maxSpan,
    shelfCount,
    shelfOpenings,
    hybridLeftLength,
    hybridRightLength,
    hybridLeftOpenings,
    hybridRightOpenings,
  ]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">justuse2x4</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="app-header-actions">
          <div className="segmented app-language-toggle" aria-label={locale === "en" ? "Language" : "語言"}>
            {([
              { value: "en", label: UI_STRINGS.en.languageEnglish },
              { value: "zh-TW", label: UI_STRINGS["zh-TW"].languageTraditionalChinese },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                className={locale === option.value ? "active" : ""}
                onClick={() => setLocale(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="segmented app-mode-toggle" aria-label={locale === "en" ? "Page" : "頁面"}>
            {([
              { value: "planner", label: t.pagePlanner },
              { value: "gallery", label: t.pageGallery },
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
        </div>
      </header>

      {pageMode === "planner" ? (
      <main className="workspace">
        <aside className="panel panel-controls">
          <section className="panel-section">
            <div className="parameterization-bundles">
              <div className="parameterization-mode-bundle">
                <div className="parameterization-card parameterization-mode-card">
                  <div className="parameterization-mode-stack">
                  <IconToggle
                    ariaLabel={locale === "en" ? "Furniture Type" : "家具類型"}
                    options={[
                      { value: "bench", label: t.bench },
                      { value: "shelf", label: t.shelving },
                    ]}
                    value={furnitureType}
                    onChange={handleFurnitureTypeChange}
                    caption={locale === "en" ? "Furniture Type" : "家具選項"}
                  />
                  {!isBench ? (
                    <div className="parameterization-submode">
                      <IconToggle
                        ariaLabel={locale === "en" ? "Shelf Mode" : "Shelf Mode"}
                        options={[
                          { value: "fixed", label: getShelfModeLabel(locale, "fixed") },
                          { value: "adjustable", label: getShelfModeLabel(locale, "adjustable") },
                          { value: "hybrid", label: getShelfModeLabel(locale, "hybrid") },
                        ]}
                        value={shelfMode}
                        onChange={handleShelfModeChange}
                        caption={getLocalizedShelfControlLabel(locale, "shelfType")}
                      />
                      <IconToggle
                        ariaLabel={locale === "en" ? "Frame Mode" : "框架模式"}
                        options={[
                          { value: "h-frame", label: t.hFrame },
                          { value: "p-frame", label: t.pFrame },
                        ]}
                        value={frameMode}
                        onChange={setFrameMode}
                        caption={t.frameMode}
                      />
                    </div>
                  ) : null}
                  </div>
                </div>
              </div>

              <div className="parameterization-input-bundle">
                <div className="parameterization-card parameterization-input-card">
                  <h3>{t.parameterization}</h3>
                  <p className="muted">{t.parameterizationNote}</p>
                  <section className="planner-input-group">
                    <div className="planner-input-group-header">
                      <h4>{getPlannerGroupLabel(locale, "overallSize")}</h4>
                    </div>
                    <section className="field-grid">
                      <NumberField label={t.lengthIn} value={length} min={12} onChange={setLength} />
                      <NumberField label={t.depthIn} value={depth} min={3.5} onChange={setDepth} />
                      <NumberField label={t.heightIn} value={height} min={3.5} onChange={handleHeightChange} />
                      <NumberField label={t.maxSpanIn} value={maxSpan} min={6} step={6} onChange={setMaxSpan} />
                    </section>
                  </section>
                  {!isBench && shelfMode === "fixed" ? (
                    <section className="planner-input-group">
                      <div className="planner-input-group-header">
                        <h4>{getPlannerGroupLabel(locale, "fixedShelfSetup")}</h4>
                      </div>
                      <section className="field-grid">
                        <NumberField
                          label={t.shelfLevels}
                          value={shelfCount}
                          min={1}
                          step={1}
                          onChange={(nextValue) => {
                            const nextCount = Math.max(1, Math.round(nextValue));
                            setShelfCount(nextCount);
                            setShelfOpenings(getDefaultShelfOpenings(nextCount));
                          }}
                        />
                      </section>
                    </section>
                  ) : null}
                  {!isBench && shelfMode === "adjustable" ? (
                    <section className="planner-input-group">
                      <div className="planner-input-group-header">
                        <h4>{getPlannerGroupLabel(locale, "adjustableOpenings")}</h4>
                      </div>
                      <section className="field-grid">
                      {shelfOpenings.map((opening, index) => {
                        const openingMax = adjustableOpeningMaxes[index] ?? BOARD_THICKNESS;

                        return (
                          <NumberField
                            key={`opening-${index}`}
                            label={`${getLocalizedShelfControlLabel(locale, "opening")} ${index + 1}`}
                            value={opening}
                            min={BOARD_THICKNESS}
                            max={openingMax}
                            hint={getOpeningMaxHint(locale, openingMax)}
                            onChange={(nextValue) => {
                              updateAdjustableOpening(
                                index,
                                clampToRange(nextValue, BOARD_THICKNESS, openingMax),
                              );
                            }}
                          />
                        );
                      })}
                      <label className="field">
                        <span>{getLocalizedShelfControlLabel(locale, "shelfCount")}</span>
                        <input type="text" value={shelfOpenings.length + 1} readOnly />
                      </label>
                      </section>
                      <div className="planner-inline-actions">
                      <button
                        type="button"
                        className="gallery-load-pill"
                        onClick={addShelfOpening}
                        disabled={!canAddAdjustableOpening}
                        title={
                          canAddAdjustableOpening
                            ? getOpeningMaxHint(locale, nextAdjustableOpeningMax)
                            : locale === "en"
                              ? "Increase height or reduce existing openings to add another opening."
                              : "請先增加高度或減少既有淨空，才能再新增一層淨空。"
                        }
                      >
                        {getLocalizedShelfControlLabel(locale, "addOpening")}
                      </button>
                      <button
                        type="button"
                        className="gallery-load-pill"
                        onClick={removeShelfOpening}
                        disabled={shelfOpenings.length <= 1}
                      >
                        {getLocalizedShelfControlLabel(locale, "removeOpening")}
                      </button>
                      </div>
                    </section>
                  ) : null}
                  {!isBench && shelfMode === "hybrid" ? (
                    <>
                      <section className="planner-input-group">
                        <div className="planner-input-group-header">
                          <h4>{getPlannerGroupLabel(locale, "sectionLengths")}</h4>
                        </div>
                      <section className="field-grid">
                        <NumberField
                          label={getLocalizedShelfControlLabel(locale, "openingLength") + ` (${getLocalizedShelfControlLabel(locale, "leftSection")})`}
                          value={Math.max(BOARD_WIDTH, hybridLeftLength - 2 * BOARD_THICKNESS)}
                          min={BOARD_WIDTH}
                          step={1}
                          onChange={(nextValue) => updateHybridSectionLength("left", nextValue)}
                        />
                        <NumberField
                          label={getLocalizedShelfControlLabel(locale, "openingLength") + ` (${getLocalizedShelfControlLabel(locale, "rightSection")})`}
                          value={Math.max(BOARD_WIDTH, hybridRightLength - 2 * BOARD_THICKNESS)}
                          min={BOARD_WIDTH}
                          step={1}
                          onChange={(nextValue) => updateHybridSectionLength("right", nextValue)}
                        />
                      </section>
                      </section>
                      <section className="planner-input-group">
                        <div className="planner-input-group-header">
                          <h4>{getPlannerGroupLabel(locale, "adjustableOpenings")}</h4>
                        </div>
                      <section className="field-grid">
                        {hybridLeftOpenings.map((opening, index) => {
                          const openingMax = hybridLeftOpeningMaxes[index] ?? BOARD_THICKNESS;

                          return (
                            <NumberField
                              key={`hybrid-left-opening-${index}`}
                              label={`${getLocalizedShelfControlLabel(locale, "leftSection")} ${getLocalizedShelfControlLabel(locale, "opening")} ${index + 1}`}
                              value={opening}
                              min={BOARD_THICKNESS}
                              max={openingMax}
                              hint={getOpeningMaxHint(locale, openingMax)}
                              onChange={(nextValue) => {
                                updateHybridOpening(
                                  "left",
                                  index,
                                  clampToRange(nextValue, BOARD_THICKNESS, openingMax),
                                );
                              }}
                            />
                          );
                        })}
                        {hybridRightOpenings.map((opening, index) => {
                          const openingMax = hybridRightOpeningMaxes[index] ?? BOARD_THICKNESS;

                          return (
                            <NumberField
                              key={`hybrid-right-opening-${index}`}
                              label={`${getLocalizedShelfControlLabel(locale, "rightSection")} ${getLocalizedShelfControlLabel(locale, "opening")} ${index + 1}`}
                              value={opening}
                              min={BOARD_THICKNESS}
                              max={openingMax}
                              hint={getOpeningMaxHint(locale, openingMax)}
                              onChange={(nextValue) => {
                                updateHybridOpening(
                                  "right",
                                  index,
                                  clampToRange(nextValue, BOARD_THICKNESS, openingMax),
                                );
                              }}
                            />
                          );
                        })}
                      </section>
                      <div className="planner-inline-actions">
                        <button
                          type="button"
                          className="gallery-load-pill"
                          onClick={() => addHybridOpening("left")}
                          disabled={!canAddHybridLeftOpening}
                          title={
                            canAddHybridLeftOpening
                              ? getOpeningMaxHint(locale, nextHybridLeftOpeningMax)
                              : locale === "en"
                                ? "No more vertical room remains in the left section."
                                : "左側區段已沒有可用的垂直空間。"
                          }
                        >
                          {`${getLocalizedShelfControlLabel(locale, "addOpening")} (${getLocalizedShelfControlLabel(locale, "leftSection")})`}
                        </button>
                        <button
                          type="button"
                          className="gallery-load-pill"
                          onClick={() => removeHybridOpening("left")}
                          disabled={hybridLeftOpenings.length <= 1}
                        >
                          {`${getLocalizedShelfControlLabel(locale, "removeOpening")} (${getLocalizedShelfControlLabel(locale, "leftSection")})`}
                        </button>
                        <button
                          type="button"
                          className="gallery-load-pill"
                          onClick={() => addHybridOpening("right")}
                          disabled={!canAddHybridRightOpening}
                          title={
                            canAddHybridRightOpening
                              ? getOpeningMaxHint(locale, nextHybridRightOpeningMax)
                              : locale === "en"
                                ? "No more vertical room remains in the right section."
                                : "右側區段已沒有可用的垂直空間。"
                          }
                        >
                          {`${getLocalizedShelfControlLabel(locale, "addOpening")} (${getLocalizedShelfControlLabel(locale, "rightSection")})`}
                        </button>
                        <button
                          type="button"
                          className="gallery-load-pill"
                          onClick={() => removeHybridOpening("right")}
                          disabled={hybridRightOpenings.length <= 1}
                        >
                          {`${getLocalizedShelfControlLabel(locale, "removeOpening")} (${getLocalizedShelfControlLabel(locale, "rightSection")})`}
                        </button>
                      </div>
                      </section>
                      <p className="muted">{getLocalizedShelfControlLabel(locale, "sharedTopLevel")}</p>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="panel-section">
            <h3>{t.derivedSummary}</h3>
            <dl className="summary-grid">
              <div>
                <dt>{t.frameCount}</dt>
                <dd>{design.frameCount}</dd>
              </div>
              <div>
                <dt>{t.extraHFrames}</dt>
                <dd>{design.extraSupportHFrameCount}</dd>
              </div>
              <div>
                <dt>{t.boardsPerLevel}</dt>
                <dd>{design.boardCountPerLevel}</dd>
              </div>
              <div>
                <dt>{t.actualClearSpan}</dt>
                <dd>{formatInches(design.actualClearSpan)}</dd>
              </div>
              <div>
                <dt>{t.bottomRailClearance}</dt>
                <dd>{formatInches(effectiveInputs.bottomRailClearance)}</dd>
              </div>
            </dl>
          </section>
        </aside>

        <section className="panel panel-preview">
          <div className="panel-section panel-header-row">
            <div>
              <h2>{t.preview}</h2>
              <p className="muted">{t.previewNote}</p>
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
                    {mode === "solid" ? t.solid : t.seeThru}
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
                    {mode === "top"
                      ? t.top
                      : mode === "side"
                        ? t.side
                        : mode === "front"
                          ? t.front
                          : t.assembly}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PreviewCanvas
            design={design}
            viewMode={viewMode}
            fillMode={fillMode}
            colorTheme={colorTheme}
            issues={design.issues}
            locale={locale}
            explodedAmount={explodedAmount}
            onExplodedAmountChange={setExplodedAmount}
            assemblyVisibility={assemblyVisibility}
            onAssemblyVisibilityChange={setAssemblyVisibility}
            onAdjustableOpeningChange={updateAdjustableOpening}
            onHybridOpeningChange={updateHybridOpening}
            onShelfLengthChange={updateShelfLength}
            onHybridSectionLengthChange={updateHybridSectionLength}
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
            <h2>{t.materialOutput}</h2>
          </section>

          <section className="panel-section">
            <h3>{t.shoppingList}</h3>
            <div className="shopping-table-wrap">
              <table className="shopping-table">
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "36%" }} />
                  <col style={{ width: "14%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t.item}</th>
                    <th>{t.fullLength}</th>
                    <th>{t.unit}</th>
                    <th>{t.qty}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>2x4 x 8ft</td>
                    <td>96"</td>
                    <td>${boardUnitPrice.toFixed(2)} {t.perBoard}</td>
                    <td>{design.stockPlan.length}</td>
                  </tr>
                  <tr>
                    <td>{t.screws}</td>
                    <td>2-1/2 in</td>
                    <td>${screwUnitPrice.toFixed(2)} {t.perEach}</td>
                    <td>{design.estimatedScrewCount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="shopping-total-card">
              <div className="shopping-total-copy">
                <span className="shopping-total-label">{t.totalEstimate}</span>
                <span className="shopping-total-breakdown">
                  {t.boardsCostBreakdown} ${boardLineTotal.toFixed(2)} + {t.screwsCostBreakdown} ${screwsLineTotal.toFixed(2)}
                </span>
              </div>
              <strong>${shoppingGrandTotal.toFixed(2)}</strong>
            </div>
            <p className="material-note">{t.shoppingNote}</p>
            <p className="material-note">
              {t.pricingReferencePrefix} ${boardUnitPrice.toFixed(2)} {t.pricingReferenceMiddle}{" "}
              ${screwUnitPrice.toFixed(2)}{t.pricingReferenceSuffix}
            </p>
            <p className="material-note">
              {t.sources}{" "}
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
            <h3>{t.cutList}</h3>
            <table>
              <thead>
                <tr>
                  <th>{t.type}</th>
                  <th>{t.lengthColumn}</th>
                  <th>{t.qty}</th>
                </tr>
              </thead>
              <tbody>
                {design.parts.map((part, index) => (
                  <tr key={part.id ?? `${part.key}-${index}`}>
                    <td>
                      <span className="table-type-item">
                        <span
                          className="preview-legend-swatch"
                          style={
                            {
                              "--swatch-color":
                                part.key === "top-board" || part.key === "shelf-board"
                                  ? "#FF7B00"
                                  : part.key === "vertical-leg" || part.key === "rear-leg"
                                    ? "#B68A2E"
                                    : "#3A86FF",
                              backgroundColor:
                                part.key === "top-board" || part.key === "shelf-board"
                                  ? "#FF7B00"
                                  : part.key === "vertical-leg" || part.key === "rear-leg"
                                    ? "#B68A2E"
                                    : "#3A86FF",
                            } as CSSProperties
                          }
                        />
                        {getLocalizedPartLabel(locale, part.key, effectiveFrameMode, isBench)}
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
              <h3>{t.boardOptimization}</h3>
              <div className="board-optimization-legend" aria-label={t.boardOptimizationLegend}>
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles[isBench ? "top-board" : "shelf-board"].fill }}
                  />
                  {isBench ? t.topBoards : t.shelfBoards}
                </span>
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles["vertical-leg"].fill }}
                  />
                  {t.verticalLegs}
                </span>
                <span className="board-optimization-legend-item">
                  <span
                    className="board-optimization-legend-swatch"
                    style={{ backgroundColor: stockSegmentStyles["side-rail"].fill }}
                  />
                  {t.rails}
                </span>
                <span className="board-optimization-legend-item">
                  <span className="board-optimization-legend-swatch board-optimization-legend-waste" />
                  {t.waste}
                </span>
              </div>
            </div>
            <div className="board-stack">
              {design.stockPlan.map((board) => (
                <article key={board.boardIndex} className="board-card">
                  <header>
                    <div className="board-card-title">
                      <strong>{t.boardN} {board.boardIndex}</strong>
                      <span>{`96" ${t.fullBoard}`}</span>
                    </div>
                  </header>
                  <div className="board-visual" aria-label={`${t.boardN} ${board.boardIndex} ${t.cutLayout}`}>
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
                              title={`${getLocalizedPartLabel(locale, cut.partKey, effectiveFrameMode, isBench)} ${formatInches(cut.length)}`}
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
                              wasteLabel =
                                locale === "en"
                                  ? `${formatInches(board.waste)} ${t.waste.toLowerCase()}`
                                  : `${t.waste} ${formatInches(board.waste)}`;
                            } else if (wastePercent >= 10) {
                              wasteLabel = formatInches(board.waste);
                            }

                            return (
                              <div
                                className="board-visual-segment board-visual-waste"
                                style={{ width: `${wastePercent}%` }}
                                title={`${t.waste} ${formatInches(board.waste)}`}
                              >
                                {wasteLabel ? <span>{wasteLabel}</span> : null}
                              </div>
                            );
                          })()
                        ) : null}
                    </div>
                  </div>
                  <small>
                    {locale === "en"
                      ? `Used ${formatInches(board.usedLength)}, including ${board.kerfCount} saw cuts. Scrap: ${formatInches(board.waste)}`
                      : fillTemplate(t.usedIncludingKerfWaste, {
                          used: formatInches(board.usedLength),
                          kerfCount: board.kerfCount,
                          waste: formatInches(board.waste),
                        })}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel-section">
            <h3>{t.wasteSummary}</h3>
            <dl className="summary-grid">
              <div>
                <dt>{t.boardsNeeded}</dt>
                <dd>{design.stockPlan.length}</dd>
              </div>
              <div>
                <dt>{t.totalUsed}</dt>
                <dd>{formatInches(design.totalUsedLength)}</dd>
              </div>
              <div>
                <dt>{t.totalWaste}</dt>
                <dd>{formatInches(design.totalWaste)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </main>
      ) : (
        <main className="gallery-layout">
          <section className="panel panel-gallery">
            <section className="panel-section gallery-promo">
              <p className="gallery-promo-eyebrow">{galleryPromo.eyebrow}</p>
              <h2>{galleryPromo.title}</h2>
              {galleryPromoParagraphs.map((paragraph: string) => (
                <p key={paragraph} className="gallery-promo-body">{paragraph}</p>
              ))}
            </section>

            <section className="panel-section">
              <div className="panel-section-header">
                <h2>{t.buildGallery}</h2>
              </div>
              <p className="muted">{t.buildGalleryNote}</p>
            </section>

            <section className="gallery-grid">
              {GALLERY_BUILDS.map((build) => {
                const buildInputs = build.inputs;
                const shelfLevelsLabel =
                  buildInputs.furnitureType === "shelf"
                    ? `${t.levels} ${
                        buildInputs.shelfMode === "fixed"
                          ? buildInputs.shelfCount
                          : buildInputs.shelfMode === "adjustable"
                            ? buildInputs.clearOpenings.length + 1
                            : `${buildInputs.sections[0].clearOpenings.length + 1} / ${buildInputs.sections[1].clearOpenings.length + 1}`
                      }`
                    : null;
                const frameModeLabel =
                  buildInputs.furnitureType === "shelf"
                    ? `${t.frame} ${buildInputs.frameMode === "h-frame" ? t.hFrame : t.pFrame}`
                    : null;
                const shelfModeLabel =
                  buildInputs.furnitureType === "shelf"
                    ? getShelfModeLabel(locale, buildInputs.shelfMode)
                    : null;
                const buildTitle = build.title[locale];
                const buildDescription = build.description[locale];
                const categoryLabel = build.category === "bench" ? t.bench : t.shelving;

                return (
                  <article key={build.id} className="gallery-card">
                    <button
                      type="button"
                      className="gallery-image-button"
                      onClick={() => setGalleryPreview({ id: build.id, src: build.imageSrc, title: buildTitle })}
                      aria-label={fillTemplate(t.previewPhoto, { title: buildTitle })}
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
                          <p className="gallery-card-eyebrow">{categoryLabel}</p>
                          <h3>{buildTitle}</h3>
                        </div>
                        <div className="gallery-card-actions">
                          <span
                            className={`gallery-chip ${
                              build.category === "bench" ? "gallery-chip-bench" : "gallery-chip-shelving"
                            }`}
                          >
                            {categoryLabel}
                          </span>
                          <button
                            type="button"
                            className="gallery-load-pill"
                            onClick={() => applyBuildPreset(build.inputs)}
                          >
                            {t.loadThisBuild}
                          </button>
                        </div>
                      </div>
                      <p className="gallery-card-description">{buildDescription}</p>
                      <ul className="gallery-meta">
                        <li>{`${locale === "zh-TW" ? "長" : "L"} ${formatInches(buildInputs.length)}`}</li>
                        <li>{`${locale === "zh-TW" ? "深" : "D"} ${formatInches(buildInputs.depth)}`}</li>
                        <li>{`${locale === "zh-TW" ? "高" : "H"} ${formatInches(buildInputs.height)}`}</li>
                        <li>{`${t.clearance} ${formatInches(buildInputs.bottomRailClearance)}`}</li>
                        {shelfLevelsLabel ? <li>{shelfLevelsLabel}</li> : null}
                        {frameModeLabel ? <li>{frameModeLabel}</li> : null}
                        {shelfModeLabel ? <li>{shelfModeLabel}</li> : null}
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
          aria-label={fillTemplate(t.imagePreview, { title: galleryPreview.title })}
          onClick={() => setGalleryPreview(null)}
        >
          <div className="gallery-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <div className="gallery-lightbox-header">
              <p className="gallery-lightbox-caption">{galleryPreview.title}</p>
              <button
                type="button"
                className="gallery-lightbox-close"
                onClick={() => setGalleryPreview(null)}
                aria-label={t.closeImagePreview}
              >
                {t.close}
              </button>
            </div>
            <img src={galleryPreview.src} alt={galleryPreview.title} className="gallery-lightbox-image" />
            <div className="gallery-lightbox-actions">
              <button
                type="button"
                className="gallery-load-button"
                onClick={() => {
                  const selectedBuild = GALLERY_BUILDS.find((build) => build.id === galleryPreview.id);
                  if (selectedBuild) {
                    applyBuildPreset(selectedBuild.inputs);
                  }
                  setGalleryPreview(null);
                }}
              >
                {t.loadThisBuild}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <footer className="app-footer">
        {locale === "en"
          ? "© 2026 justuse2x4. Released under the MIT License."
          : "© 2026 justuse2x4．採用 MIT License 授權。"}
      </footer>
    </div>
  );
}

type PreviewProps = {
  design: DerivedDesign;
  viewMode: ViewMode;
  fillMode: FillMode;
  colorTheme: ColorTheme;
  issues: string[];
  locale: Locale;
  explodedAmount: number;
  onExplodedAmountChange: (value: number) => void;
  assemblyVisibility: AssemblyVisibility;
  onAssemblyVisibilityChange: (value: AssemblyVisibility) => void;
  onAdjustableOpeningChange: (index: number, nextValue: number) => void;
  onHybridOpeningChange: (section: HybridSectionId, index: number, nextValue: number) => void;
  onShelfLengthChange: (nextValue: number) => void;
  onHybridSectionLengthChange: (section: HybridSectionId, nextValue: number) => void;
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

type PrismEdgeMask = {
  hideRightFace?: boolean;
  hideTopLeftEdge?: boolean;
  hideTopRightEdge?: boolean;
  hideBackLeftEdge?: boolean;
  hideBackRightEdge?: boolean;
};

type OpeningHandle = {
  key: string;
  sectionId: string;
  section: HybridSectionId | "adjustable";
  openingIndex: number;
  x: number;
  centerHeight: number;
  openingHeight: number;
  lowerTop: number;
  upperBottom: number;
};

type SectionLengthHandle = {
  key: string;
  section: HybridSectionId | "single";
  startX: number;
  endX: number;
  centerX: number;
  guideY: number;
  openingLength: number;
};

type ActiveSectionLengthDrag = SectionLengthHandle & {
  startClientX: number;
  startOpeningLength: number;
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
  design,
  viewMode,
  fillMode,
  colorTheme,
  issues,
  locale,
  explodedAmount,
  onExplodedAmountChange,
  assemblyVisibility,
  onAssemblyVisibilityChange,
  onAdjustableOpeningChange,
  onHybridOpeningChange,
  onShelfLengthChange,
  onHybridSectionLengthChange,
}: PreviewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const t = UI_STRINGS[locale];
  const inputs = design.normalizedInputs;
  const [activeOpeningDrag, setActiveOpeningDrag] = useState<OpeningHandle | null>(null);
  const [activeSectionLengthDrag, setActiveSectionLengthDrag] = useState<ActiveSectionLengthDrag | null>(null);
  const primarySection = design.renderLayout.sections[0];
  const width = 760;
  const height = 540;
  const panelMargin = 52;
  const isAssemblyLikeView = viewMode === "assembly";
  const capsuleX = panelMargin;
  const capsuleY = 34;
  const capsuleWidth = width - panelMargin * 2;
  const capsuleHeight = height - capsuleY - 24;
  const annotationInsetLeft = 108;
  const annotationInsetTop = 40;
  const annotationInsetBottom = 124;
  const isBench = inputs.furnitureType === "bench";
  const frameCount = primarySection.frameCount;
  const framePositions = primarySection.framePositions;
  const actualClearSpan = primarySection.actualClearSpan;
  const shelfLevels = primarySection.levelBottoms.length;
  const explodeFactor = viewMode === "assembly" ? (explodedAmount / 100) * 5 : 0;
  const assemblySidebarWidth = 190;
  const effectiveAnnotationInsetLeft = isAssemblyLikeView ? 76 : annotationInsetLeft;
  const annotationInsetRight = isAssemblyLikeView ? assemblySidebarWidth + 28 : 92;
  const annotationFrameX = capsuleX + effectiveAnnotationInsetLeft;
  const annotationFrameY = capsuleY + annotationInsetTop;
  const annotationFrameWidth = capsuleWidth - effectiveAnnotationInsetLeft - annotationInsetRight;
  const annotationFrameHeight = capsuleHeight - annotationInsetTop - annotationInsetBottom;

  const boardCount =
    primarySection.boardCountPerLevel;

  const viewWidth =
    viewMode === "side"
      ? inputs.depth
      : isAssemblyLikeView
        ? inputs.length + inputs.depth * 0.72
        : inputs.length;
  const viewHeight =
    viewMode === "top"
      ? inputs.depth
      : isAssemblyLikeView
        ? inputs.height + inputs.depth * 0.44 + BOARD_THICKNESS
        : inputs.height;
  const assemblyScaleFactor = isAssemblyLikeView ? 0.94 : 1;
  const scale = Math.min(annotationFrameWidth / viewWidth, annotationFrameHeight / viewHeight) * assemblyScaleFactor;
  const contentWidth = viewWidth * scale;
  const contentHeight = viewHeight * scale;
  const assemblyObjectShiftX = isAssemblyLikeView ? -24 : 0;
  const assemblyObjectShiftY = isAssemblyLikeView ? 34 : 0;
  const originX = annotationFrameX + (annotationFrameWidth - contentWidth) / 2 + assemblyObjectShiftX;
  const originY = annotationFrameY + (annotationFrameHeight - contentHeight) / 2 + assemblyObjectShiftY;

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
  const assemblyUsesSolidStroke = isAssemblyLikeView && fillMode === "pattern";
  const boardLineColor = fillMode === "pattern" && !assemblyUsesSolidStroke ? boardColor : boardStroke;
  const legLineColor = fillMode === "pattern" && !assemblyUsesSolidStroke ? legColor : legStroke;
  const railLineColor = fillMode === "pattern" && !assemblyUsesSolidStroke ? railColor : railStroke;
  const supportLineColor =
    fillMode === "pattern" && !assemblyUsesSolidStroke ? supportColor : supportStroke;
  const boardFill = fillMode === "solid" ? boardColor : "url(#boardPattern)";
  const legFill = fillMode === "solid" ? legColor : "url(#legPattern)";
  const railFill = fillMode === "solid" ? railColor : "url(#railPattern)";
  const supportFill = fillMode === "solid" ? supportColor : "url(#supportPattern)";
  const materialStrokeWidth = fillMode === "pattern" ? 0.75 : 1.5;
  const bottomRailBottom = inputs.bottomRailClearance;
  const bottomRailTop = bottomRailBottom + BOARD_THICKNESS;
  const innerDepth = inputs.depth - 2 * BOARD_THICKNESS;
  const visibleLegHeight = isBench ? inputs.height - BOARD_THICKNESS : inputs.height;
  const assemblyLegHeight =
    inputs.furnitureType === "shelf" ? visibleLegHeight + BOARD_THICKNESS : visibleLegHeight;
  const sectionRadius = Math.max(2, Math.min(8, BOARD_THICKNESS * scale * 0.45));
  const shelfBoardOffsets = primarySection.boardOffsets;
  const shelfBoardGap = primarySection.boardGap;
  const topBoardGap =
    boardCount <= 1 ? 0 : Math.max(0, (inputs.depth - boardCount * BOARD_WIDTH) / (boardCount - 1));
  const topBoardSideOffsets = Array.from({ length: boardCount }, (_, index) => {
    return index * (BOARD_WIDTH + topBoardGap);
  });
  const sameLevelBoardGap = isBench ? topBoardGap : shelfBoardGap;
  const sameLevelBoardOffsets = isBench ? topBoardSideOffsets : shelfBoardOffsets;
  const rawWorldSections = design.layout.sections.map((section) => ({
    ...section,
    worldFramePositions: section.framePositions.map((position) => section.offsetX + position),
  }));
  const renderWorldSections = design.renderLayout.sections.map((section) => ({
    ...section,
    worldFramePositions: section.framePositions.map((position) => section.offsetX + position),
  }));
  const invalidLevelKeys = new Set(
    rawWorldSections.flatMap((section) => {
      const renderedSection = renderWorldSections.find(
        (candidate) => candidate.sectionId === section.sectionId,
      );
      const renderedLevels = new Set(
        (renderedSection?.levelBottoms ?? []).map((bottom) => bottom.toFixed(3)),
      );

      return section.levelBottoms
        .filter((bottom) => !renderedLevels.has(bottom.toFixed(3)))
        .map((bottom) => `${section.sectionId}-${bottom.toFixed(3)}`);
    }),
  );
  const uniqueWorldFramePositions = Array.from(
    new Set(
      rawWorldSections.flatMap((section) =>
        section.worldFramePositions.map((position) => position.toFixed(3)),
      ),
    ),
  )
    .map((position) => Number(position))
    .sort((a, b) => a - b);
  const uniqueFrameLevelPlacements = Array.from(
    new Map(
      rawWorldSections.flatMap((section) =>
        section.levelBottoms.flatMap((bottom) =>
          section.worldFramePositions.map((position) => [
            `${bottom.toFixed(3)}-${position.toFixed(3)}`,
            {
              bottom,
              position,
              invalid: invalidLevelKeys.has(`${section.sectionId}-${bottom.toFixed(3)}`),
            },
          ] as const),
        ),
      ),
    ).values(),
  );

  const frameLeftPositions = framePositions;
  const frontFramePositions = uniqueWorldFramePositions;

  const levelBottoms = primarySection.levelBottoms;
  const sideViewSections = rawWorldSections.map((section, index) => ({
    ...section,
    ghosted: inputs.furnitureType === "shelf" && inputs.shelfMode === "hybrid" && index > 0,
  }));
  const levelGap =
    !isBench && levelBottoms.length > 1
      ? Math.max(0, levelBottoms[1] - (levelBottoms[0] + 2 * BOARD_THICKNESS))
      : 0;
  const rearLegBaseHeight =
    !isBench && inputs.frameMode === "p-frame" && levelBottoms.length > 0
      ? bottomRailBottom
      : 0;
  const rearLegVisibleHeight = Math.max(0, visibleLegHeight - rearLegBaseHeight);
  const assemblyRearLegBaseHeight =
    rearLegBaseHeight + (!isBench && inputs.frameMode === "p-frame" ? BOARD_THICKNESS : 0);
  const assemblyRearLegHeight = Math.max(0, assemblyLegHeight - assemblyRearLegBaseHeight);
  const explodedBoardLift = viewMode === "assembly" ? BOARD_THICKNESS * 2 * explodeFactor : 0;
  const explodedRailLift = viewMode === "assembly" ? BOARD_THICKNESS * 0.9 * explodeFactor : 0;
  const explodedLowerRailDrop = viewMode === "assembly" ? BOARD_THICKNESS * 0.8 * explodeFactor : 0;
  const explodedFrontSpread = viewMode === "assembly" ? BOARD_THICKNESS * 1.1 * explodeFactor : 0;
  const explodedBackSpread = viewMode === "assembly" ? BOARD_THICKNESS * 1.1 * explodeFactor : 0;

  const screwColor = "#5f2f1f";
  const legendItems = isBench
    ? [
        { label: t.topBoards, color: boardColor, kind: "board" as const },
        { label: t.verticalLegs, color: legColor, kind: "leg" as const },
        { label: t.rails, color: railColor, kind: "rail" as const },
        { label: t.extraSupportFrames, color: supportColor, kind: "support" as const },
      ]
    : [
        { label: t.shelfBoards, color: boardColor, kind: "board" as const },
        { label: t.verticalLegs, color: legColor, kind: "leg" as const },
        { label: t.rails, color: railColor, kind: "rail" as const },
        { label: t.extraSupportFrames, color: supportColor, kind: "support" as const },
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
  const colorWithAlpha = (color: string, alpha: number) => {
    if (color.startsWith("#")) {
      const value = color.replace("#", "");
      const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const match = color.match(/\d+(\.\d+)?/g);
    if (!match || match.length < 3) {
      return color;
    }

    const [r, g, b] = match;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const assemblyPatternAlpha =
    isAssemblyLikeView && fillMode === "pattern"
      ? (faceColor: string) =>
          faceColor === railColor ? 1 : 0.5
      : () => 1;
  const invalidStrokeDasharray = "8 5";
  const invalidFillOpacity = 0.24;
  const invalidStrokeOpacity = 0.7;
  const ghostFillOpacity = 0.2;
  const ghostStrokeOpacity = 0.55;
  const ghostStrokeDasharray = "6 4";
  const geometryEpsilon = 0.001;
  const isInvalidShelfLevel = (sectionId: string, bottom: number) =>
    invalidLevelKeys.has(`${sectionId}-${bottom.toFixed(3)}`);
  const getLevelMaterialStyle = (fillColor: string, strokeColor: string, invalid: boolean) =>
    invalid
      ? {
          fill: colorWithAlpha("#c7c2ba", invalidFillOpacity),
          stroke: colorWithAlpha(strokeColor, invalidStrokeOpacity),
          strokeDasharray: invalidStrokeDasharray,
        }
      : {
          fill: fillColor,
          stroke: strokeColor,
          strokeDasharray: undefined,
        };
  const getGhostMaterialStyle = (fillColor: string, strokeColor: string) => ({
    fill: colorWithAlpha(fillColor, ghostFillOpacity),
    stroke: colorWithAlpha(strokeColor, ghostStrokeOpacity),
    strokeDasharray: ghostStrokeDasharray,
  });
  const valuesMatch = (left: number, right: number) => Math.abs(left - right) <= geometryEpsilon;
  const getShelfBoardEdgeMask = (
    section: (typeof rawWorldSections)[number],
    bottom: number,
    offset: number,
  ): PrismEdgeMask => {
    if (inputs.furnitureType !== "shelf" || inputs.shelfMode !== "hybrid") {
      return {};
    }

    const hasLeftNeighbor = rawWorldSections.some(
      (candidate) =>
        candidate.sectionId !== section.sectionId &&
        valuesMatch(candidate.offsetX + candidate.length, section.offsetX) &&
        candidate.levelBottoms.some((candidateBottom) => valuesMatch(candidateBottom, bottom)) &&
        candidate.boardOffsets.some((candidateOffset) => valuesMatch(candidateOffset, offset)),
    );
    const hasRightNeighbor = rawWorldSections.some(
      (candidate) =>
        candidate.sectionId !== section.sectionId &&
        valuesMatch(section.offsetX + section.length, candidate.offsetX) &&
        candidate.levelBottoms.some((candidateBottom) => valuesMatch(candidateBottom, bottom)) &&
        candidate.boardOffsets.some((candidateOffset) => valuesMatch(candidateOffset, offset)),
    );

    return {
      hideRightFace: hasRightNeighbor,
      hideTopLeftEdge: hasLeftNeighbor,
      hideTopRightEdge: hasRightNeighbor,
      hideBackLeftEdge: hasLeftNeighbor,
      hideBackRightEdge: hasRightNeighbor,
    };
  };
  const getMergedShelfBoardSpans = (bottom: number, offset: number) => {
    const segments = rawWorldSections
      .filter(
        (section) =>
          section.levelBottoms.some((levelBottom) => valuesMatch(levelBottom, bottom)) &&
          section.boardOffsets.some((boardOffset) => valuesMatch(boardOffset, offset)),
      )
      .map((section) => ({
        sectionId: section.sectionId,
        x: section.offsetX,
        width: section.length,
        invalid: isInvalidShelfLevel(section.sectionId, bottom),
      }))
      .sort((left, right) => left.x - right.x);

    return segments.reduce<
      { key: string; x: number; width: number; invalid: boolean; sectionIds: string[] }[]
    >((merged, segment) => {
      const previous = merged[merged.length - 1];

      if (previous && segment.x <= previous.x + previous.width + geometryEpsilon) {
        previous.width = Math.max(previous.width, segment.x + segment.width - previous.x);
        previous.invalid = previous.invalid || segment.invalid;
        previous.sectionIds.push(segment.sectionId);
        previous.key = previous.sectionIds.join("-");
        return merged;
      }

      merged.push({
        key: segment.sectionId,
        x: segment.x,
        width: segment.width,
        invalid: segment.invalid,
        sectionIds: [segment.sectionId],
      });
      return merged;
    }, []);
  };
  const openingHandles = useMemo<OpeningHandle[]>(() => {
    if (inputs.furnitureType !== "shelf" || inputs.shelfMode === "fixed") {
      return [];
    }

    const sectionOpenings =
      inputs.shelfMode === "adjustable"
        ? [{ sectionId: "shelf-main", section: "adjustable" as const, openings: inputs.clearOpenings }]
        : [
            { sectionId: "left", section: "left" as const, openings: inputs.sections[0].clearOpenings },
            { sectionId: "right", section: "right" as const, openings: inputs.sections[1].clearOpenings },
          ];

    return sectionOpenings.flatMap(({ sectionId, section, openings }) => {
      const layoutSection = rawWorldSections.find((candidate) => candidate.sectionId === sectionId);

      if (!layoutSection) {
        return [];
      }

      return openings
        .map((opening, openingIndex) => {
          const lowerBottom = layoutSection.levelBottoms[openingIndex];
          const upperBottom = layoutSection.levelBottoms[openingIndex + 1];

          if (!Number.isFinite(lowerBottom) || !Number.isFinite(upperBottom)) {
            return null;
          }

          return {
            key: `${sectionId}-${openingIndex}`,
            sectionId,
            section,
            openingIndex,
            x: layoutSection.offsetX + layoutSection.length / 2,
            centerHeight: upperBottom - opening / 2,
            openingHeight: opening,
            lowerTop: lowerBottom + 2 * BOARD_THICKNESS,
            upperBottom,
          };
        })
        .filter((handle): handle is OpeningHandle => Boolean(handle));
    });
  }, [inputs, rawWorldSections]);

  const sectionLengthHandles = useMemo<SectionLengthHandle[]>(() => {
    if (viewMode !== "front" || inputs.furnitureType !== "shelf") {
      return [];
    }

    const guideY = Math.min(yBottom(0) + 34, capsuleY + capsuleHeight - 42);

    if (inputs.shelfMode !== "hybrid") {
      const openingLength = Math.max(BOARD_WIDTH, inputs.length - 2 * BOARD_THICKNESS);

      return [
        {
          key: "section-length-single",
          section: "single",
          startX: BOARD_THICKNESS,
          endX: inputs.length - BOARD_THICKNESS,
          centerX: inputs.length / 2,
          guideY,
          openingLength,
        },
      ];
    }

    return rawWorldSections
      .filter(
        (section): section is (typeof rawWorldSections)[number] & { sectionId: HybridSectionId } =>
          section.sectionId === "left" || section.sectionId === "right",
      )
      .map((section) => ({
        key: `section-length-${section.sectionId}`,
        section: section.sectionId,
        startX: section.offsetX + BOARD_THICKNESS,
        endX: section.offsetX + section.length - BOARD_THICKNESS,
        centerX: section.offsetX + section.length / 2,
        guideY,
        openingLength: Math.max(BOARD_WIDTH, section.length - 2 * BOARD_THICKNESS),
      }));
  }, [capsuleHeight, capsuleY, inputs, rawWorldSections, viewMode, yBottom]);

  useEffect(() => {
    if (!activeOpeningDrag) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const svg = svgRef.current;

      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const svgY = ((event.clientY - rect.top) / rect.height) * height;
      const centerHeight = (originY + contentHeight - svgY) / scale;
      const nextOpening = Math.max(
        BOARD_THICKNESS,
        snapToHalfInch(2 * (activeOpeningDrag.upperBottom - centerHeight)),
      );

      if (activeOpeningDrag.section === "adjustable") {
        onAdjustableOpeningChange(activeOpeningDrag.openingIndex, nextOpening);
        return;
      }

      onHybridOpeningChange(activeOpeningDrag.section, activeOpeningDrag.openingIndex, nextOpening);
    };

    const stopDragging = () => setActiveOpeningDrag(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [
    activeOpeningDrag,
    contentHeight,
    height,
    onAdjustableOpeningChange,
    onHybridOpeningChange,
    originY,
    scale,
  ]);

  useEffect(() => {
    if (!activeSectionLengthDrag) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const svg = svgRef.current;

      if (!svg) {
        return;
      }

      const rect = svg.getBoundingClientRect();
      const worldDeltaX = ((event.clientX - activeSectionLengthDrag.startClientX) / rect.width) * width / scale;
      const steppedDeltaX = Math.trunc(worldDeltaX);
      const nextOpeningLength = Math.max(
        BOARD_WIDTH,
        activeSectionLengthDrag.startOpeningLength + steppedDeltaX,
      );

      if (activeSectionLengthDrag.section === "single") {
        onShelfLengthChange(nextOpeningLength);
        return;
      }

      onHybridSectionLengthChange(activeSectionLengthDrag.section, nextOpeningLength);
    };

    const stopDragging = () => setActiveSectionLengthDrag(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [activeSectionLengthDrag, onHybridSectionLengthChange, onShelfLengthChange, scale, width]);

  const assemblySkewX = 0.52;
  const assemblySkewY = 0.28;
  const assemblyProject = (px: number, py: number, pz: number) => ({
    x: originX + (px + pz * assemblySkewX) * scale,
    y: originY + contentHeight - py * scale - pz * assemblySkewY * scale,
  });
  const assemblyFrontBottomLeft = assemblyProject(0, 0, inputs.depth);
  const assemblyControlWidth = 184;
  const assemblyControlX = capsuleX + capsuleWidth - assemblySidebarWidth + (assemblySidebarWidth - assemblyControlWidth) / 2;
  const assemblyControlHeight = 252;
  const assemblyControlY = capsuleY + (capsuleHeight - assemblyControlHeight) / 2 - 18;

  const renderAxisHandle = (centerX: number, centerY: number, axis: "x" | "y") => {
    const arm = 4.75;
    const arrow = 2.5;

    return (
      <g className="drag-handle-icon" aria-hidden="true">
        {axis === "x" ? (
          <>
            <line x1={centerX - arm} y1={centerY} x2={centerX + arm} y2={centerY} />
            <path
              d={`M ${centerX - arm - arrow} ${centerY} L ${centerX - arm} ${centerY - arrow} L ${centerX - arm} ${centerY + arrow} Z`}
            />
            <path
              d={`M ${centerX + arm + arrow} ${centerY} L ${centerX + arm} ${centerY - arrow} L ${centerX + arm} ${centerY + arrow} Z`}
            />
          </>
        ) : (
          <>
            <line x1={centerX} y1={centerY - arm} x2={centerX} y2={centerY + arm} />
            <path
              d={`M ${centerX} ${centerY - arm - arrow} L ${centerX - arrow} ${centerY - arm} L ${centerX + arrow} ${centerY - arm} Z`}
            />
            <path
              d={`M ${centerX} ${centerY + arm + arrow} L ${centerX - arrow} ${centerY + arm} L ${centerX + arrow} ${centerY + arm} Z`}
            />
          </>
        )}
      </g>
    );
  };

  const renderPrism = (
    key: string,
    prism: { x: number; y: number; z: number; width: number; height: number; depth: number },
    faceColor: string,
    edgeColor: string,
    invalid = false,
    edgeMask: PrismEdgeMask = {},
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
    const alpha = assemblyPatternAlpha(faceColor);
    const horizontalFaceFill = invalid
      ? colorWithAlpha("#c7c2ba", invalidFillOpacity)
      : colorWithAlpha(tintColor(faceColor, 0.2), alpha);
    const backFaceFill = invalid
      ? colorWithAlpha("#c7c2ba", invalidFillOpacity)
      : colorWithAlpha(tintColor(faceColor, 0.08), alpha);
    const faces = [
      {
        id: "right",
        points: [backBottomRight, frontBottomRight, frontTopRight, backTopRight],
        fill: colorWithAlpha(tintColor(faceColor, -0.12), alpha),
        hidden: edgeMask.hideRightFace,
      },
      {
        id: "top",
        points: [backBottomLeft, backBottomRight, backTopRight, backTopLeft],
        fill: backFaceFill,
      },
      {
        id: "back",
        points: [frontTopLeft, frontTopRight, backTopRight, backTopLeft],
        fill: horizontalFaceFill,
      },
    ];
    const seamMasks = [
      edgeMask.hideTopLeftEdge
        ? {
            id: "top-left",
            p1: frontTopLeft,
            p2: backTopLeft,
            color: horizontalFaceFill,
          }
        : null,
      edgeMask.hideTopRightEdge
        ? {
            id: "top-right",
            p1: frontTopRight,
            p2: backTopRight,
            color: horizontalFaceFill,
          }
        : null,
      edgeMask.hideBackLeftEdge
        ? {
            id: "back-left",
            p1: backBottomLeft,
            p2: backTopLeft,
            color: backFaceFill,
          }
        : null,
      edgeMask.hideBackRightEdge
        ? {
            id: "back-right",
            p1: backBottomRight,
            p2: backTopRight,
            color: backFaceFill,
          }
        : null,
    ].filter((mask): mask is { id: string; p1: { x: number; y: number }; p2: { x: number; y: number }; color: string } => Boolean(mask));

    return (
      <g key={key}>
        {faces.map((face) => (
          face.hidden ? null : (
          <polygon
            key={`${key}-${face.id}`}
            points={facePoints(face.points)}
            fill={invalid ? colorWithAlpha("#c7c2ba", invalidFillOpacity) : face.fill}
            stroke={invalid ? colorWithAlpha(edgeColor, invalidStrokeOpacity) : edgeColor}
            strokeWidth={materialStrokeWidth}
            strokeDasharray={invalid ? invalidStrokeDasharray : undefined}
          />
          )
        ))}
        {seamMasks.map((mask) => (
          <line
            key={`${key}-mask-${mask.id}`}
            x1={mask.p1.x}
            y1={mask.p1.y}
            x2={mask.p2.x}
            y2={mask.p2.y}
            stroke={mask.color}
            strokeWidth={materialStrokeWidth + 1.25}
            strokeLinecap="round"
          />
        ))}
      </g>
    );
  };
  const offsetPrism = (
    prism: { x: number; y: number; z: number; width: number; height: number; depth: number },
    offsets: { x?: number; y?: number; z?: number },
  ) => ({
    ...prism,
    x: prism.x + (offsets.x ?? 0),
    y: prism.y + (offsets.y ?? 0),
    z: prism.z + (offsets.z ?? 0),
  });

  return (
    <div className="preview-canvas">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={locale === "en" ? `${viewMode} view` : `${t.preview}${t[viewMode]}`}>
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
            {frontFramePositions.map((left, index) => (
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

            {isBench
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
              : rawWorldSections.flatMap((section) =>
                  section.boardOffsets.map((offset, index) => (
                    <rect
                      key={`top-shelf-board-${section.sectionId}-${index}`}
                      x={x(section.offsetX)}
                      y={yTop(offset)}
                      width={section.length * scale}
                      height={BOARD_WIDTH * scale}
                      fill={boardFill}
                      stroke={boardLineColor}
                      strokeWidth={materialStrokeWidth}
                    />
                  )),
                )}

            {frontFramePositions.map((left, index) => {
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
              label={fillTemplate(t.lengthLabel, { value: formatInches(inputs.length) })}
              textY={topFarDimTextY}
            />
            {showClearSpanDimension ? (
              <DimensionLine
                x1={x(BOARD_WIDTH)}
                y1={topNearDimY}
                x2={x(BOARD_WIDTH + actualClearSpan)}
                y2={topNearDimY}
                label={fillTemplate(t.clearSpanLabel, { value: formatInches(actualClearSpan) })}
                textY={topNearDimTextY}
              />
            ) : null}
            <DimensionLine
              x1={leftDimX}
              y1={yTop(0)}
              x2={leftDimX}
              y2={yTop(inputs.depth)}
              label={fillTemplate(t.depthLabel, { value: formatInches(inputs.depth) })}
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
              {t.floorZero}
            </text>

            <rect
              x={x(0)}
              y={yBottom(isBench ? inputs.height - BOARD_THICKNESS : inputs.height)}
              width={BOARD_THICKNESS * scale}
              height={(isBench ? inputs.height - BOARD_THICKNESS : inputs.height) * scale}
              fill={legFill}
              stroke={legLineColor}
              strokeWidth={materialStrokeWidth}
            />
            <rect
              x={x(inputs.depth - BOARD_THICKNESS)}
              y={yBottom(
                isBench
                  ? inputs.height - BOARD_THICKNESS
                  : rearLegBaseHeight + rearLegVisibleHeight,
              )}
              width={BOARD_THICKNESS * scale}
              height={(isBench ? inputs.height - BOARD_THICKNESS : rearLegVisibleHeight) * scale}
              fill={legFill}
              stroke={legLineColor}
              strokeWidth={materialStrokeWidth}
            />

            {isBench ? (
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
                {sideViewSections.flatMap((section, sectionIndex) =>
                  section.levelBottoms.map((bottom, index) => {
                    const invalid = isInvalidShelfLevel(section.sectionId, bottom);
                    const railStyle = invalid
                      ? getLevelMaterialStyle(railFill, railLineColor, true)
                      : section.ghosted
                        ? getGhostMaterialStyle(railFill, railLineColor)
                        : getLevelMaterialStyle(railFill, railLineColor, false);
                    const boardStyle = invalid
                      ? getLevelMaterialStyle(boardFill, boardLineColor, true)
                      : section.ghosted
                        ? getGhostMaterialStyle(boardFill, boardLineColor)
                        : getLevelMaterialStyle(boardFill, boardLineColor, false);

                    return (
                      <g key={`shelf-level-${section.sectionId}-${index}`}>
                        <rect
                          x={x(BOARD_THICKNESS)}
                          y={yBottom(bottom + BOARD_THICKNESS)}
                          width={(inputs.depth - 2 * BOARD_THICKNESS) * scale}
                          height={BOARD_THICKNESS * scale}
                          fill={railStyle.fill}
                          stroke={railStyle.stroke}
                          strokeWidth={materialStrokeWidth}
                          strokeDasharray={railStyle.strokeDasharray}
                        />
                        {shelfBoardOffsets.map((offset, boardIndex) => (
                          <rect
                            key={`shelf-board-${section.sectionId}-${index}-${boardIndex}`}
                            x={x(offset)}
                            y={yBottom(bottom + 2 * BOARD_THICKNESS)}
                            width={BOARD_WIDTH * scale}
                            height={BOARD_THICKNESS * scale}
                            rx={sectionRadius}
                            ry={sectionRadius}
                            fill={boardStyle.fill}
                            stroke={boardStyle.stroke}
                            strokeWidth={materialStrokeWidth}
                            strokeDasharray={boardStyle.strokeDasharray}
                          />
                        ))}
                        {!section.ghosted
                          ? [
                              renderScrewMark(
                                x(BOARD_THICKNESS),
                                yBottom(bottom + BOARD_THICKNESS / 2),
                                `shelf-side-left-${sectionIndex}-${index}`,
                              ),
                              renderScrewMark(
                                x(inputs.depth - BOARD_THICKNESS),
                                yBottom(bottom + BOARD_THICKNESS / 2),
                                `shelf-side-right-${sectionIndex}-${index}`,
                              ),
                            ]
                          : null}
                      </g>
                    );
                  }),
                )}
              </>
            )}

            {sameLevelBoardGap > 0.001 && sameLevelBoardOffsets.length > 1 ? (
              <DimensionLine
                x1={x(sameLevelBoardOffsets[0] + BOARD_WIDTH)}
                y1={Math.max(capsuleY + 26, yBottom(inputs.height) - 18)}
                x2={x(sameLevelBoardOffsets[1])}
                y2={Math.max(capsuleY + 26, yBottom(inputs.height) - 18)}
                label={fillTemplate(t.boardGapLabel, { value: formatInches(sameLevelBoardGap) })}
                textY={Math.max(capsuleY + 16, yBottom(inputs.height) - 28)}
              />
            ) : null}

            <DimensionLine
              x1={x(0)}
              y1={showClearSpanDimension ? lowerFarDimY + 28 : lowerFarDimY}
              x2={xRight}
              y2={showClearSpanDimension ? lowerFarDimY + 28 : lowerFarDimY}
              label={fillTemplate(t.depthLabel, { value: formatInches(inputs.depth) })}
              textY={showClearSpanDimension ? lowerFarDimTextY + 28 : lowerFarDimTextY}
            />
            <DimensionLine
              x1={leftDimX}
              y1={yBottom(0)}
              x2={leftDimX}
              y2={yBottom(inputs.height)}
              label={fillTemplate(t.heightLabel, { value: formatInches(inputs.height) })}
              textX={leftDimX - 12}
              textY={originY + contentHeight / 2 - 10}
              textAnchor="end"
            />
            <DimensionLine
              x1={x(BOARD_THICKNESS)}
              y1={showClearSpanDimension ? lowerNearDimY + 28 : lowerNearDimY}
              x2={x(inputs.depth - BOARD_THICKNESS)}
              y2={showClearSpanDimension ? lowerNearDimY + 28 : lowerNearDimY}
              label={fillTemplate(t.railLabel, { value: formatInches(inputs.depth - 2 * BOARD_THICKNESS) })}
              textY={showClearSpanDimension ? lowerNearDimTextY + 28 : lowerNearDimTextY}
            />
            <DimensionLine
              x1={rightDimX}
              y1={yBottom(0)}
              x2={rightDimX}
              y2={yBottom(bottomRailBottom)}
              label={fillTemplate(t.clearanceLabel, { value: formatInches(bottomRailBottom) })}
              textX={rightDimX + 12}
              textY={yBottom(bottomRailBottom / 2) - 10}
              textAnchor="start"
            />
            {!isBench && levelGap > 0.001 ? (
              <DimensionLine
                x1={Math.min(capsuleX + capsuleWidth - 24, rightDimX + 40)}
                y1={yBottom(levelBottoms[0] + 2 * BOARD_THICKNESS)}
                x2={Math.min(capsuleX + capsuleWidth - 24, rightDimX + 40)}
                y2={yBottom(levelBottoms[1])}
                label={fillTemplate(t.levelGapLabel, { value: formatInches(levelGap) })}
                textX={Math.min(capsuleX + capsuleWidth - 12, rightDimX + 52)}
                textY={(yBottom(levelBottoms[0] + 2 * BOARD_THICKNESS) + yBottom(levelBottoms[1])) / 2 - 10}
                textAnchor="start"
              />
            ) : null}
          </>
        ) : null}

        {isAssemblyLikeView ? (
          <>
            {isBench ? (
              <>
                {assemblyVisibility.legs
                  ? frameLeftPositions.map((left, index) =>
                      renderPrism(
                        `assembly-back-leg-${index}`,
                        offsetPrism({
                          x: left,
                          y: 0,
                          z: inputs.depth - BOARD_THICKNESS,
                          width: BOARD_WIDTH,
                          height: assemblyLegHeight,
                          depth: BOARD_THICKNESS,
                        }, { z: explodedBackSpread }),
                        index === 0 || index === frameCount - 1 ? legColor : supportColor,
                        index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                      ),
                    )
                  : null}
                {assemblyVisibility.rails
                  ? frameLeftPositions.map((left, index) => (
                      <g key={`assembly-bench-rails-${index}`}>
                        {renderPrism(
                          `assembly-top-rail-${index}`,
                          offsetPrism({
                            x: left,
                            y: inputs.height - 2 * BOARD_THICKNESS,
                            z: BOARD_THICKNESS,
                            width: BOARD_WIDTH,
                            height: BOARD_THICKNESS,
                            depth: inputs.depth - 2 * BOARD_THICKNESS,
                          }, { y: explodedRailLift }),
                          railColor,
                          railLineColor,
                        )}
                        {renderPrism(
                          `assembly-bottom-rail-${index}`,
                          offsetPrism({
                            x: left,
                            y: bottomRailBottom,
                            z: BOARD_THICKNESS,
                            width: BOARD_WIDTH,
                            height: BOARD_THICKNESS,
                            depth: inputs.depth - 2 * BOARD_THICKNESS,
                          }, { y: -explodedLowerRailDrop }),
                          railColor,
                          railLineColor,
                        )}
                      </g>
                    ))
                  : null}
                {assemblyVisibility.legs
                  ? frameLeftPositions.map((left, index) =>
                      renderPrism(
                        `assembly-front-leg-${index}`,
                        offsetPrism({
                          x: left,
                          y: 0,
                          z: 0,
                          width: BOARD_WIDTH,
                          height: assemblyLegHeight,
                          depth: BOARD_THICKNESS,
                        }, { z: -explodedFrontSpread }),
                        index === 0 || index === frameCount - 1 ? legColor : supportColor,
                        index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                      ),
                    )
                  : null}
                {assemblyVisibility.boards
                  ? [...topBoardSideOffsets].reverse().map((offset, boardIndex) =>
                      renderPrism(
                        `assembly-top-board-${boardIndex}`,
                        offsetPrism({
                          x: 0,
                          y: inputs.height - BOARD_THICKNESS,
                          z: offset,
                          width: inputs.length,
                          height: BOARD_THICKNESS,
                          depth: BOARD_WIDTH,
                        }, { y: explodedBoardLift }),
                        boardColor,
                        boardLineColor,
                      ),
                    )
                  : null}
              </>
            ) : (
              <>
                {(() => {
                  const renderSectionShelfRails = (
                    section: (typeof rawWorldSections)[number],
                    bottom: number,
                    levelIndex: number,
                  ) => {
                    const invalid = isInvalidShelfLevel(section.sectionId, bottom);

                    return (
                      <g key={`assembly-shelf-rails-${section.sectionId}-${levelIndex}`}>
                        {assemblyVisibility.rails
                          ? section.worldFramePositions.map((left, frameIndex) =>
                              renderPrism(
                                `assembly-shelf-rail-${section.sectionId}-${levelIndex}-${frameIndex}`,
                                offsetPrism({
                                  x: left,
                                  y: bottom + BOARD_THICKNESS,
                                  z: BOARD_THICKNESS,
                                  width: BOARD_WIDTH,
                                  height: BOARD_THICKNESS,
                                  depth: inputs.depth - 2 * BOARD_THICKNESS,
                                }, { y: explodedRailLift }),
                                railColor,
                                railLineColor,
                                invalid,
                              ),
                            )
                          : null}
                      </g>
                    );
                  };

                  const renderSectionShelfBoards = (
                    section: (typeof rawWorldSections)[number],
                    bottom: number,
                    levelIndex: number,
                  ) => (
                    <g key={`assembly-shelf-boards-${section.sectionId}-${levelIndex}`}>
                      {assemblyVisibility.boards
                        ? [...section.boardOffsets].reverse().flatMap((offset, boardIndex) => {
                            const mergedSpans = getMergedShelfBoardSpans(bottom, offset);
                            const owningSpan = mergedSpans.find((span) =>
                              span.sectionIds.includes(section.sectionId),
                            );

                            if (!owningSpan || owningSpan.sectionIds[0] !== section.sectionId) {
                              return [];
                            }

                            return renderPrism(
                              `assembly-shelf-board-${owningSpan.key}-${levelIndex}-${boardIndex}`,
                              offsetPrism({
                                x: owningSpan.x,
                                y: bottom + 2 * BOARD_THICKNESS,
                                z: offset,
                                width: owningSpan.width,
                                height: BOARD_THICKNESS,
                                depth: BOARD_WIDTH,
                              }, { y: explodedBoardLift }),
                              boardColor,
                              boardLineColor,
                              owningSpan.invalid,
                            );
                          })
                        : null}
                    </g>
                  );

                  return (
                    <>
                      {assemblyVisibility.legs
                        ? frontFramePositions.map((left, index) =>
                            renderPrism(
                              `assembly-shelf-back-leg-${index}`,
                              offsetPrism({
                                x: left,
                                y: assemblyRearLegBaseHeight,
                                z: inputs.depth - BOARD_THICKNESS,
                                width: BOARD_WIDTH,
                                height: assemblyRearLegHeight,
                                depth: BOARD_THICKNESS,
                              }, { z: explodedBackSpread }),
                              index === 0 || index === frameCount - 1 ? legColor : supportColor,
                              index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                            ),
                          )
                        : null}
                      {rawWorldSections.flatMap((section) =>
                        section.levelBottoms.map((bottom, levelIndex) =>
                          renderSectionShelfRails(section, bottom, levelIndex),
                        ),
                      )}
                      {rawWorldSections.flatMap((section) =>
                        section.levelBottoms.map((bottom, levelIndex) =>
                          renderSectionShelfBoards(section, bottom, levelIndex),
                        ),
                      )}
                      {assemblyVisibility.legs
                        ? frontFramePositions.map((left, index) =>
                            renderPrism(
                              `assembly-shelf-front-leg-${index}`,
                              offsetPrism({
                                x: left,
                                y: 0,
                                z: 0,
                                width: BOARD_WIDTH,
                                height: assemblyLegHeight,
                                depth: BOARD_THICKNESS,
                              }, { z: -explodedFrontSpread }),
                              index === 0 || index === frameCount - 1 ? legColor : supportColor,
                              index === 0 || index === frameCount - 1 ? legLineColor : supportLineColor,
                            ),
                          )
                        : null}
                    </>
                  );
                })()}
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
              {t.floorZero}
            </text>

            {isBench
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
              : uniqueFrameLevelPlacements.map(({ bottom, position, invalid }, placementIndex) => {
                  const railStyle = getLevelMaterialStyle(railFill, railLineColor, invalid);

                  return (
                    <rect
                      key={`front-shelf-rail-${placementIndex}`}
                      x={x(position)}
                      y={yBottom(bottom + BOARD_THICKNESS)}
                      width={BOARD_WIDTH * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={railStyle.fill}
                      stroke={railStyle.stroke}
                      strokeWidth={materialStrokeWidth}
                      strokeDasharray={railStyle.strokeDasharray}
                    />
                  )})}

            {!isBench
              ? rawWorldSections.flatMap((section) =>
                  section.levelBottoms.map((bottom, index) => {
                    const invalid = isInvalidShelfLevel(section.sectionId, bottom);
                    const boardStyle = getLevelMaterialStyle(boardFill, boardLineColor, invalid);

                    return (
                    <rect
                      key={`front-shelf-${section.sectionId}-${index}`}
                      x={x(section.offsetX)}
                      y={yBottom(bottom + 2 * BOARD_THICKNESS)}
                      width={section.length * scale}
                      height={BOARD_THICKNESS * scale}
                      fill={boardStyle.fill}
                      stroke={boardStyle.stroke}
                      strokeWidth={materialStrokeWidth}
                      strokeDasharray={boardStyle.strokeDasharray}
                    />
                  )}),
                )
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

            {isBench ? (
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

            {isBench
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
              : uniqueFrameLevelPlacements.map(({ bottom, position }, placementIndex) =>
                    renderScrewMark(
                      x(position + BOARD_WIDTH / 2),
                      yBottom(bottom + BOARD_THICKNESS / 2),
                      `front-shelf-${placementIndex}`,
                    ),
                  )}

            {inputs.furnitureType === "shelf" && inputs.shelfMode !== "fixed"
              ? openingHandles.map((handle) => (
                  <g
                    key={`opening-handle-${handle.key}`}
                    className="opening-handle"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      setActiveOpeningDrag(handle);
                    }}
                    style={{ cursor: "ns-resize" }}
                  >
                    <g className="opening-dimension" aria-hidden="true">
                      <line
                        x1={x(handle.x) + 18}
                        y1={yBottom(handle.lowerTop)}
                        x2={x(handle.x) + 18}
                        y2={yBottom(handle.upperBottom)}
                      />
                      <line
                        x1={x(handle.x) + 13}
                        y1={yBottom(handle.lowerTop)}
                        x2={x(handle.x) + 23}
                        y2={yBottom(handle.lowerTop)}
                      />
                      <line
                        x1={x(handle.x) + 13}
                        y1={yBottom(handle.upperBottom)}
                        x2={x(handle.x) + 23}
                        y2={yBottom(handle.upperBottom)}
                      />
                      <text
                        x={x(handle.x) + 24}
                        y={(yBottom(handle.lowerTop) + yBottom(handle.upperBottom)) / 2 - 4}
                        textAnchor="start"
                      >
                        {formatInches(handle.openingHeight)}
                      </text>
                    </g>
                    {renderAxisHandle(x(handle.x), yBottom(handle.centerHeight), "y")}
                    <circle
                      cx={x(handle.x)}
                      cy={yBottom(handle.centerHeight)}
                      r={15}
                      fill="transparent"
                    />
                  </g>
                ))
              : null}

            {sectionLengthHandles.map((handle) => (
              <g
                key={handle.key}
                className="opening-handle section-length-handle"
                onPointerDown={(event) => {
                  event.preventDefault();
                  setActiveSectionLengthDrag({
                    ...handle,
                    startClientX: event.clientX,
                    startOpeningLength: handle.openingLength,
                  });
                }}
                style={{ cursor: "ew-resize" }}
              >
                <g className="opening-dimension section-length-dimension" aria-hidden="true">
                  <line x1={x(handle.startX)} y1={handle.guideY} x2={x(handle.endX)} y2={handle.guideY} />
                  <line x1={x(handle.startX)} y1={handle.guideY - 5} x2={x(handle.startX)} y2={handle.guideY + 5} />
                  <line x1={x(handle.endX)} y1={handle.guideY - 5} x2={x(handle.endX)} y2={handle.guideY + 5} />
                  <text x={x(handle.centerX)} y={handle.guideY - 10} textAnchor="middle">
                    {formatInches(handle.openingLength)}
                  </text>
                </g>
                {renderAxisHandle(x(handle.centerX), handle.guideY, "x")}
                <circle cx={x(handle.centerX)} cy={handle.guideY} r={16} fill="transparent" />
              </g>
            ))}

            <DimensionLine
              x1={x(0)}
              y1={lowerFarDimY}
              x2={xRight}
              y2={lowerFarDimY}
              label={fillTemplate(t.lengthLabel, { value: formatInches(inputs.length) })}
              textY={lowerFarDimTextY}
            />
            <DimensionLine
              x1={leftDimX}
              y1={yBottom(0)}
              x2={leftDimX}
              y2={yBottom(inputs.height)}
              label={fillTemplate(t.heightLabel, { value: formatInches(inputs.height) })}
              textX={leftDimX - 12}
              textY={originY + contentHeight / 2 - 10}
              textAnchor="end"
            />
          </>
        ) : null}

        {isAssemblyLikeView ? (
          <>
            {viewMode === "assembly" ? (
              <foreignObject
                x={assemblyControlX}
                y={assemblyControlY}
                width={assemblyControlWidth}
                height={assemblyControlHeight}
              >
                <div className="svg-control-card">
                  <fieldset className="assembly-visibility-controls">
                    <legend>{t.dimensions}</legend>
                    <div className="assembly-dimension-list">
                      <span>{fillTemplate(t.heightLabel, { value: formatAssemblyDimension(inputs.height) })}</span>
                      <span>{fillTemplate(t.lengthLabel, { value: formatAssemblyDimension(inputs.length) })}</span>
                      <span>{fillTemplate(t.depthLabel, { value: formatAssemblyDimension(inputs.depth) })}</span>
                    </div>
                  </fieldset>
                  <fieldset className="assembly-visibility-controls">
                    <legend>{t.showHide}</legend>
                    <label>
                      <input
                        type="checkbox"
                        checked={assemblyVisibility.boards}
                        onChange={(event) =>
                          onAssemblyVisibilityChange({
                            ...assemblyVisibility,
                            boards: event.target.checked,
                          })
                        }
                      />
                      <span>{t.boards}</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={assemblyVisibility.legs}
                        onChange={(event) =>
                          onAssemblyVisibilityChange({
                            ...assemblyVisibility,
                            legs: event.target.checked,
                          })
                        }
                      />
                      <span>{t.legs}</span>
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={assemblyVisibility.rails}
                        onChange={(event) =>
                          onAssemblyVisibilityChange({
                            ...assemblyVisibility,
                            rails: event.target.checked,
                          })
                        }
                      />
                      <span>{t.rails}</span>
                    </label>
                  </fieldset>
                  <label className="explode-slider">
                    <span>{t.explodeAmount}</span>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      step={5}
                      value={explodedAmount}
                      onChange={(event) => onExplodedAmountChange(Number(event.target.value))}
                    />
                  </label>
                </div>
              </foreignObject>
            ) : null}
          </>
        ) : null}

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
          <span>{t.screws}</span>
        </div>
      </div>

      {issues.length > 0 ? (
        <div className="preview-warning-block" role="status" aria-live="polite">
          <strong>{t.buildConstraintWarning}</strong>
          {issues.map((issue, index) => (
            <span key={`preview-issue-${index}`}>{issue}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default App;
