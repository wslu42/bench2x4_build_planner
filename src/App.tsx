import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  BOARD_THICKNESS,
  BOARD_WIDTH,
  deriveDesign,
  deriveFrameLayout,
  formatInches,
  SAW_KERF,
  STOCK_LENGTH,
  type AppInputs,
  type FrameMode,
  type FurnitureType,
  type ShelvingInputs,
  type TopSurfaceInputs,
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
type GalleryBuildInputs = Omit<TopSurfaceInputs, "maxSpan"> | Omit<ShelvingInputs, "maxSpan">;
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

type FieldProps = {
  label: string;
  value: number;
  min: number;
  step?: number;
  onChange: (nextValue: number) => void;
};

type IconToggleProps<T extends string> = {
  ariaLabel: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  caption?: string;
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
    bottomRailClearanceIn: "Bottom Rail Height (in)",
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
    bottomRailClearance: "Bottom rail height",
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
    bottomRailClearanceBadge: "Bottom rail height: {value}",
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
    bottomRailClearanceIn: "底部橫檔離地（英吋）",
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
    bottomRailClearance: "底部橫檔離地",
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
    bottomRailClearanceBadge: "底部橫檔離地：{value}",
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
  isTopSurface?: boolean,
) {
  const t = UI_STRINGS[locale];
  switch (partKey) {
    case "top-board":
      return t.topBoards;
    case "shelf-board":
      return t.shelfBoards;
    case "vertical-leg":
      return !isTopSurface && frameMode === "p-frame" ? t.frontLegs : t.verticalLegs;
    case "rear-leg":
      return t.rearLegs;
    case "side-rail":
      return t.sideRails;
    default:
      return partKey;
  }
}

const GALLERY_BUILDS: GalleryBuild[] = [
  {
    id: "entry-bench",
    title: {
      en: "Entry Bench",
      "zh-TW": "玄關長凳",
    },
    category: "top-surface",
    description: {
      en: "Compact hallway bench with a simple open base and generous clearance.",
      "zh-TW": "適合玄關與走道的緊湊長凳，底部開放、離地空間充足。",
    },
    imageSrc: entryBenchImage,
    inputs: {
      furnitureType: "top-surface",
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
    category: "top-surface",
    description: {
      en: "Longer seating span with one extra support frame to reduce flex.",
      "zh-TW": "較長的坐面配置，加入一組額外支撐框以降低撓曲。",
    },
    imageSrc: longBenchImage,
    inputs: {
      furnitureType: "top-surface",
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
    category: "shelving",
    description: {
      en: "Open shelving preset for entry or workshop storage with comfortable lower clearance.",
      "zh-TW": "適合玄關或工作間的開放式層架，底部保留較大的使用淨空。",
    },
    imageSrc: twoTierShelfImage,
    inputs: {
      furnitureType: "shelving",
      length: 51,
      depth: 17.5,
      height: 92,
      bottomRailClearance: 42.5,
      shelfLevelCount: 2,
      frameMode: "p-frame",
    },
  },
  {
    id: "three-tier-shelf",
    title: {
      en: "Three-Tier Shelf",
      "zh-TW": "三層層架",
    },
    category: "shelving",
    description: {
      en: "Denser storage layout that still respects the fixed 2x4 frame system.",
      "zh-TW": "更高密度的收納配置，同時維持固定 2x4 結構系統。",
    },
    imageSrc: threeTierShelfImage,
    inputs: {
      furnitureType: "shelving",
      length: 33,
      depth: 17.5,
      height: 92,
      bottomRailClearance: 13,
      shelfLevelCount: 3,
      frameMode: "p-frame",
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
  const [furnitureType, setFurnitureType] = useState<FurnitureType>("top-surface");
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
  const [shelfLevelCount, setShelfLevelCount] = useState(3);
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
          "而且用它來做簡易家具很「不麻煩」。大多時候你只需要做截面切、重複長度的裁切，而且每一塊木料你都可以輕鬆搬動，不用在車庫跟一整片4x8裡纏鬥、像在對付一隻完全不想配合你的巨大 NPC。沒有巨大夾板、沒有美耐板粉塵滿天飛，也不會發生那種「靠盃忘了墊底板結果直接鋸到地板」的崩潰瞬間。",
          "我也很喜歡 2x4 做出來的家具，會隨著使用慢慢「長出個性」。你在上面鎖螺絲、撞到、拖來拖去、超載，甚至留下刮痕，它還是同一個東西。drywall 破一個洞會讓人覺得是強迫症不補不行，但沒有人會注意到滿是枝椏點的 2x4 又多了一個螺絲孔。",
          "再來是很實際的部分：2x4 便宜、好買，而且很好替換。如果設計成功，當然很好；如果設計要改，也不會被一堆昂貴板材和特殊五金綁住，也不用拿游標卡尺量半天，才發現裡面混了公制跟英制螺絲。只要再切一根，然後繼續迭代。",
          "最後是這套系統有我鍾愛的工程哲學：簡單。樸素的 2x4 家具，基本上就是木頭加螺絲。沒有神祕的夾層。沒有假裝成木紋的塑膠表皮。也不用依賴大量膠合板材。它是一套非常容易理解、容易檢查、容易修理的材料系統。沒有甲醛、零揮發，還能反覆拆裝、重複利用。",
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

    if (nextType === "top-surface") {
      setHeight(17.5);
      setMaxSpan(48);
      setBottomRailClearance(6);
      setFrameMode("h-frame");
      return;
    }

    setHeight(44);
    setMaxSpan(48);
    setBottomRailClearance(6);
    setFrameMode("h-frame");
  };

  const applyBuildPreset = (presetInputs: GalleryBuildInputs) => {
    setFurnitureType(presetInputs.furnitureType);
    setLength(presetInputs.length);
    setDepth(presetInputs.depth);
    setHeight(presetInputs.height);
    setMaxSpan(48);
    setBottomRailClearance(presetInputs.bottomRailClearance);
    setShelfLevelCount(
      presetInputs.furnitureType === "shelving" ? presetInputs.shelfLevelCount : 3,
    );
    setFrameMode(presetInputs.furnitureType === "shelving" ? presetInputs.frameMode : "h-frame");
    setViewMode("assembly");
    setFillMode("solid");
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
      frameMode,
    };
  }, [
    bottomRailClearance,
    depth,
    frameMode,
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
    isTopSurface
      ? fillTemplate(t.topBoardCount, { count: design.boardCountPerLevel })
      : fillTemplate(t.shelfBoardCountPerLevel, { count: design.boardCountPerLevel }),
    !isTopSurface
      ? fillTemplate(t.frameModeBadge, {
          mode: frameMode === "h-frame" ? t.hFrame : t.pFrame,
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

    if (!isTopSurface && shelfLevelCount !== effectiveInputs.shelfLevelCount) {
      setShelfLevelCount(effectiveInputs.shelfLevelCount);
    }
    if (!isTopSurface && frameMode !== effectiveInputs.frameMode) {
      setFrameMode(effectiveInputs.frameMode);
    }
  }, [
    bottomRailClearance,
    depth,
    effectiveInputs,
    frameMode,
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
                      { value: "top-surface", label: t.bench },
                      { value: "shelving", label: t.shelving },
                    ]}
                    value={furnitureType}
                    onChange={handleFurnitureTypeChange}
                    caption={locale === "en" ? "Furniture Type" : "家具選項"}
                  />
                  {!isTopSurface ? (
                    <div className="parameterization-submode">
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
                  <section className="field-grid">
                    <NumberField label={t.lengthIn} value={length} min={12} onChange={setLength} />
                    <NumberField label={t.depthIn} value={depth} min={3.5} onChange={setDepth} />
                    <NumberField label={t.heightIn} value={height} min={3.5} onChange={setHeight} />
                    <NumberField label={t.maxSpanIn} value={maxSpan} min={6} step={6} onChange={setMaxSpan} />
                    <NumberField
                      label={t.bottomRailClearanceIn}
                      value={bottomRailClearance}
                      min={0}
                      onChange={setBottomRailClearance}
                    />
                    {!isTopSurface ? (
                      <NumberField
                        label={t.shelfLevels}
                        value={shelfLevelCount}
                        min={1}
                        step={1}
                        onChange={setShelfLevelCount}
                      />
                    ) : null}
                  </section>
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
            inputs={effectiveInputs}
            viewMode={viewMode}
            fillMode={fillMode}
            colorTheme={colorTheme}
            issues={design.issues}
            locale={locale}
            explodedAmount={explodedAmount}
            onExplodedAmountChange={setExplodedAmount}
            assemblyVisibility={assemblyVisibility}
            onAssemblyVisibilityChange={setAssemblyVisibility}
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
                        {getLocalizedPartLabel(locale, part.key, frameMode, isTopSurface)}
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
                    style={{ backgroundColor: stockSegmentStyles[isTopSurface ? "top-board" : "shelf-board"].fill }}
                  />
                  {isTopSurface ? t.topBoards : t.shelfBoards}
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
                              title={`${getLocalizedPartLabel(locale, cut.partKey, frameMode, isTopSurface)} ${formatInches(cut.length)}`}
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
                  buildInputs.furnitureType === "shelving"
                    ? `${t.levels} ${buildInputs.shelfLevelCount}`
                    : null;
                const frameModeLabel =
                  buildInputs.furnitureType === "shelving"
                    ? `${t.frame} ${buildInputs.frameMode === "h-frame" ? t.hFrame : t.pFrame}`
                    : null;
                const buildTitle = build.title[locale];
                const buildDescription = build.description[locale];
                const categoryLabel = build.category === "top-surface" ? t.bench : t.shelving;

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
                              build.category === "top-surface" ? "gallery-chip-bench" : "gallery-chip-shelving"
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
    </div>
  );
}

type PreviewProps = {
  inputs: AppInputs;
  viewMode: ViewMode;
  fillMode: FillMode;
  colorTheme: ColorTheme;
  issues: string[];
  locale: Locale;
  explodedAmount: number;
  onExplodedAmountChange: (value: number) => void;
  assemblyVisibility: AssemblyVisibility;
  onAssemblyVisibilityChange: (value: AssemblyVisibility) => void;
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
  locale,
  explodedAmount,
  onExplodedAmountChange,
  assemblyVisibility,
  onAssemblyVisibilityChange,
}: PreviewProps) {
  const t = UI_STRINGS[locale];
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
  const isTopSurface = inputs.furnitureType === "top-surface";
  const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(
    inputs.length,
    inputs.maxSpan,
  );
  const shelfLevels = inputs.furnitureType === "shelving" ? inputs.shelfLevelCount : 1;
  const explodeFactor = viewMode === "assembly" ? (explodedAmount / 100) * 5 : 0;
  const assemblySidebarWidth = 190;
  const effectiveAnnotationInsetLeft = isAssemblyLikeView ? 76 : annotationInsetLeft;
  const annotationInsetRight = isAssemblyLikeView ? assemblySidebarWidth + 28 : 92;
  const annotationFrameX = capsuleX + effectiveAnnotationInsetLeft;
  const annotationFrameY = capsuleY + annotationInsetTop;
  const annotationFrameWidth = capsuleWidth - effectiveAnnotationInsetLeft - annotationInsetRight;
  const annotationFrameHeight = capsuleHeight - annotationInsetTop - annotationInsetBottom;

  const boardCount =
    inputs.furnitureType === "top-surface"
      ? Math.max(1, Math.floor(inputs.depth / BOARD_WIDTH))
      : Math.max(1, Math.floor((inputs.depth - 2 * BOARD_THICKNESS) / BOARD_WIDTH));

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
  const visibleLegHeight = isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height;
  const assemblyLegHeight =
    inputs.furnitureType === "shelving" ? visibleLegHeight + BOARD_THICKNESS : visibleLegHeight;
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
  const rearLegBaseHeight =
    !isTopSurface && inputs.frameMode === "p-frame" && levelBottoms.length > 0
      ? bottomRailBottom
      : 0;
  const rearLegVisibleHeight = Math.max(0, visibleLegHeight - rearLegBaseHeight);
  const assemblyRearLegBaseHeight =
    rearLegBaseHeight + (!isTopSurface && inputs.frameMode === "p-frame" ? BOARD_THICKNESS : 0);
  const assemblyRearLegHeight = Math.max(0, assemblyLegHeight - assemblyRearLegBaseHeight);
  const explodedBoardLift = viewMode === "assembly" ? BOARD_THICKNESS * 2 * explodeFactor : 0;
  const explodedRailLift = viewMode === "assembly" ? BOARD_THICKNESS * 0.9 * explodeFactor : 0;
  const explodedLowerRailDrop = viewMode === "assembly" ? BOARD_THICKNESS * 0.8 * explodeFactor : 0;
  const explodedFrontSpread = viewMode === "assembly" ? BOARD_THICKNESS * 1.1 * explodeFactor : 0;
  const explodedBackSpread = viewMode === "assembly" ? BOARD_THICKNESS * 1.1 * explodeFactor : 0;

  const screwColor = "#5f2f1f";
  const legendItems = isTopSurface
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
    const alpha = assemblyPatternAlpha(faceColor);
    const faces = [
      {
        id: "right",
        points: [backBottomRight, frontBottomRight, frontTopRight, backTopRight],
        fill: colorWithAlpha(tintColor(faceColor, -0.12), alpha),
      },
      {
        id: "top",
        points: [backBottomLeft, backBottomRight, backTopRight, backTopLeft],
        fill: colorWithAlpha(tintColor(faceColor, 0.08), alpha),
      },
      {
        id: "back",
        points: [frontTopLeft, frontTopRight, backTopRight, backTopLeft],
        fill: colorWithAlpha(tintColor(faceColor, 0.2), alpha),
      },
    ];

    return (
      <g key={key}>
        {faces.map((face) => (
          <polygon
            key={`${key}-${face.id}`}
            points={facePoints(face.points)}
            fill={face.fill}
            stroke={edgeColor}
            strokeWidth={materialStrokeWidth}
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
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={locale === "en" ? `${viewMode} view` : `${t.preview}${t[viewMode]}`}>
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
              y={yBottom(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height)}
              width={BOARD_THICKNESS * scale}
              height={(isTopSurface ? inputs.height - BOARD_THICKNESS : inputs.height) * scale}
              fill={legFill}
              stroke={legLineColor}
              strokeWidth={materialStrokeWidth}
            />
            <rect
              x={x(inputs.depth - BOARD_THICKNESS)}
              y={yBottom(
                isTopSurface
                  ? inputs.height - BOARD_THICKNESS
                  : rearLegBaseHeight + rearLegVisibleHeight,
              )}
              width={BOARD_THICKNESS * scale}
              height={(isTopSurface ? inputs.height - BOARD_THICKNESS : rearLegVisibleHeight) * scale}
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
            {!isTopSurface && levelGap > 0.001 ? (
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
            {isTopSurface ? (
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
                  const topLevelIndex = levelBottoms.length - 1;
                  const renderShelfLevel = (bottom: number, levelIndex: number) => (
                    <g key={`assembly-shelf-level-${levelIndex}`}>
                      {assemblyVisibility.rails
                        ? frameLeftPositions.map((left, frameIndex) =>
                            renderPrism(
                              `assembly-shelf-rail-${levelIndex}-${frameIndex}`,
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
                            ),
                          )
                        : null}
                      {assemblyVisibility.boards
                        ? [...shelfBoardOffsets].reverse().map((offset, boardIndex) =>
                            renderPrism(
                              `assembly-shelf-board-${levelIndex}-${boardIndex}`,
                              offsetPrism({
                                x: 0,
                                y: bottom + 2 * BOARD_THICKNESS,
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
                    </g>
                  );

                  return (
                    <>
                      {assemblyVisibility.legs
                        ? frameLeftPositions.map((left, index) =>
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
                      {levelBottoms
                        .slice(0, Math.max(0, topLevelIndex))
                        .map((bottom, levelIndex) => renderShelfLevel(bottom, levelIndex))}
                      {topLevelIndex >= 0 ? renderShelfLevel(levelBottoms[topLevelIndex], topLevelIndex) : null}
                      {assemblyVisibility.legs
                        ? frameLeftPositions.map((left, index) =>
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
              label={fillTemplate(t.lengthLabel, { value: formatInches(inputs.length) })}
              textY={lowerFarDimTextY}
            />
            {showClearSpanDimension ? (
              <DimensionLine
                x1={x(BOARD_WIDTH)}
                y1={lowerNearDimY}
                x2={x(BOARD_WIDTH + actualClearSpan)}
                y2={lowerNearDimY}
                label={fillTemplate(t.clearSpanLabel, { value: formatInches(actualClearSpan) })}
                textY={lowerNearDimTextY}
              />
            ) : null}
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

        {issues.length > 0 ? (
          <g
            className="svg-warning-pill"
            transform={`translate(${capsuleX + 18}, ${capsuleY + 16})`}
          >
            <rect x="0" y="0" rx="10" ry="10" width="190" height="28" />
            <text x="95" y="18" textAnchor="middle">
              {t.buildConstraintWarning}
            </text>
          </g>
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
    </div>
  );
}

export default App;
