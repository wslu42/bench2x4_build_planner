export const BOARD_THICKNESS = 1.5;
export const BOARD_WIDTH = 3.5;
export const STOCK_LENGTH = 96;
export const SAW_KERF = 0.125;

export type FurnitureType = "bench" | "shelf";
export type ShelfMode = "fixed" | "adjustable" | "hybrid";
export type FrameMode = "h-frame" | "p-frame";
export type ViewMode = "top" | "side" | "front" | "assembly";

export type CommonInputs = {
  depth: number;
  height: number;
  maxSpan: number;
  bottomRailClearance: number;
};

export type BenchInputs = CommonInputs & {
  furnitureType: "bench";
  length: number;
};

export type FixedShelfInputs = CommonInputs & {
  furnitureType: "shelf";
  shelfMode: "fixed";
  length: number;
  shelfCount: number;
  frameMode: FrameMode;
};

export type AdjustableShelfInputs = CommonInputs & {
  furnitureType: "shelf";
  shelfMode: "adjustable";
  length: number;
  clearOpenings: number[];
  frameMode: FrameMode;
};

export type HybridShelfSectionInputs = {
  sectionLength: number;
  clearOpenings: number[];
};

export type HybridShelfInputs = CommonInputs & {
  furnitureType: "shelf";
  shelfMode: "hybrid";
  length: number;
  frameMode: FrameMode;
  sections: [HybridShelfSectionInputs, HybridShelfSectionInputs];
};

export type ShelfInputs = FixedShelfInputs | AdjustableShelfInputs | HybridShelfInputs;
export type AppInputs = BenchInputs | ShelfInputs;

export type PartGroup =
  | "top-board"
  | "shelf-board"
  | "vertical-leg"
  | "rear-leg"
  | "side-rail";

export type Part = {
  id?: string;
  key: PartGroup;
  label: string;
  purpose: string;
  length: number;
  quantity: number;
  color: string;
};

export type StockCut = {
  partKey: string;
  label: string;
  length: number;
};

export type StockBoardPlan = {
  boardIndex: number;
  cuts: StockCut[];
  kerfCount: number;
  usedLength: number;
  waste: number;
};

export type DerivedSectionLayout = {
  sectionId: string;
  offsetX: number;
  length: number;
  frameCount: number;
  framePositions: number[];
  actualClearSpan: number;
  levelBottoms: number[];
  boardCountPerLevel: number;
  boardGap: number;
  boardOffsets: number[];
};

export type DerivedLayout = {
  sections: DerivedSectionLayout[];
  totalLength: number;
};

export type ValidationIssueCode =
  | "section-overflow"
  | "shared-frame-conflict"
  | "layout-overlap"
  | "input-clamp"
  | "stock-overflow";

export type ValidationIssue = {
  code: ValidationIssueCode;
  message: string;
  sectionId?: string;
};

export type DerivedDesign = {
  normalizedInputs: AppInputs;
  frameCount: number;
  extraSupportHFrameCount: number;
  framePositions: number[];
  actualClearSpan: number;
  estimatedScrewCount: number;
  sideRailLength: number;
  legVerticalLength: number;
  rearLegLength: number;
  boardCountPerLevel: number;
  shelfLevelCount: number;
  issues: string[];
  parts: Part[];
  stockPlan: StockBoardPlan[];
  totalWaste: number;
  totalUsedLength: number;
  layout: DerivedLayout;
  renderLayout: DerivedLayout;
  validationIssues: ValidationIssue[];
  layoutStatus: "valid" | "invalid";
};

function clampNumber(value: number, min: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(value, min);
}

function roundWholeNumber(value: number, min: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.round(value));
}

function normalizeOpening(value: number) {
  if (!Number.isFinite(value)) {
    return BOARD_THICKNESS;
  }

  return Math.max(BOARD_THICKNESS, Math.round(value * 1000) / 1000);
}

export function deriveFrameLayout(length: number, maxSpan: number) {
  const safeLength = Math.max(length, BOARD_WIDTH * 2);
  const safeMaxSpan = Math.max(maxSpan, 1);
  let frameCount = 2;

  while (frameCount * BOARD_WIDTH + (frameCount - 1) * safeMaxSpan < safeLength) {
    frameCount += 1;
  }

  const actualClearSpan =
    frameCount <= 1 ? 0 : Math.max(0, (safeLength - frameCount * BOARD_WIDTH) / (frameCount - 1));
  const framePositions = Array.from({ length: frameCount }, (_, index) => {
    return index * (BOARD_WIDTH + actualClearSpan);
  });

  return {
    frameCount,
    framePositions,
    actualClearSpan,
  };
}

function getShelfBoardCount(depth: number) {
  return Math.max(1, Math.floor((depth - 2 * BOARD_THICKNESS) / BOARD_WIDTH));
}

function getBenchBoardCount(depth: number) {
  return Math.max(1, Math.floor(depth / BOARD_WIDTH));
}

function getBoardOffsets(depth: number, boardCount: number, insetFromEdges: boolean) {
  const availableDepth = insetFromEdges ? depth - 2 * BOARD_THICKNESS : depth;
  const startOffset = insetFromEdges ? BOARD_THICKNESS : 0;
  const boardGap =
    boardCount <= 1 ? 0 : Math.max(0, (availableDepth - boardCount * BOARD_WIDTH) / (boardCount - 1));
  const boardOffsets = Array.from({ length: boardCount }, (_, index) => {
    return startOffset + index * (BOARD_WIDTH + boardGap);
  });

  return {
    boardGap,
    boardOffsets,
  };
}

function deriveFixedShelfLevelBottoms(height: number, bottomRailClearance: number, shelfCount: number) {
  if (shelfCount <= 1) {
    return [Math.max(0, height - 2 * BOARD_THICKNESS)];
  }

  const firstBottom = bottomRailClearance;
  const lastBottom = height - 2 * BOARD_THICKNESS;
  const step = (lastBottom - firstBottom) / (shelfCount - 1);

  return Array.from({ length: shelfCount }, (_, index) => firstBottom + step * index);
}

function deriveAdjustableShelfLevelBottoms(height: number, clearOpenings: number[]) {
  const highestRailBottom = Math.max(0, height - 2 * BOARD_THICKNESS);
  const levelBottoms = [highestRailBottom];

  for (let index = clearOpenings.length - 1; index >= 0; index -= 1) {
    const previous = levelBottoms[0];
    const nextBottom = previous - (2 * BOARD_THICKNESS + clearOpenings[index]);
    levelBottoms.unshift(nextBottom);
  }

  return levelBottoms;
}

function addIssue(
  issues: string[],
  validationIssues: ValidationIssue[],
  issue: ValidationIssue,
) {
  issues.push(issue.message);
  validationIssues.push(issue);
}

function expandParts(parts: Part[]): StockCut[] {
  return parts.flatMap((part) =>
    Array.from({ length: part.quantity }, () => ({
      partKey: part.key,
      label: part.label,
      length: part.length,
    })),
  );
}

function optimizeStock(parts: Part[]): StockBoardPlan[] {
  const cuts = expandParts(parts).sort((a, b) => b.length - a.length);
  const boards: StockBoardPlan[] = [];

  for (const cut of cuts) {
    let placed = false;

    for (const board of boards) {
      const projectedKerfCount = board.cuts.length;
      const projectedUsed =
        board.cuts.reduce((sum, entry) => sum + entry.length, 0) +
        cut.length +
        projectedKerfCount * SAW_KERF;

      if (projectedUsed <= STOCK_LENGTH) {
        board.cuts.push(cut);
        placed = true;
        break;
      }
    }

    if (!placed) {
      boards.push({
        boardIndex: boards.length + 1,
        cuts: [cut],
        kerfCount: 0,
        usedLength: 0,
        waste: 0,
      });
    }
  }

  return boards.map((board) => {
    const kerfCount = Math.max(0, board.cuts.length - 1);
    const usedLength =
      board.cuts.reduce((sum, entry) => sum + entry.length, 0) +
      kerfCount * SAW_KERF;
    const waste = Math.max(0, STOCK_LENGTH - usedLength);

    return {
      ...board,
      kerfCount,
      usedLength,
      waste,
    };
  });
}

function normalizeBenchInputs(inputs: BenchInputs, issues: string[]): BenchInputs {
  const safeLength = clampNumber(inputs.length, BOARD_WIDTH * 2);
  const safeDepth = clampNumber(inputs.depth, 2 * BOARD_THICKNESS + 0.5);
  const safeHeight = clampNumber(inputs.height, 3 * BOARD_THICKNESS);
  const safeMaxSpan = clampNumber(inputs.maxSpan, 1);
  const baseBottomRailClearance = clampNumber(inputs.bottomRailClearance, 0);
  const maxBottomRailClearance = Math.max(0, safeHeight - 3 * BOARD_THICKNESS);
  const safeBottomRailClearance = Math.min(baseBottomRailClearance, maxBottomRailClearance);

  if (safeLength !== inputs.length) {
    issues.push(`Length was clamped to ${safeLength}" to keep the frame geometry valid.`);
  }
  if (safeDepth !== inputs.depth) {
    issues.push(`Depth was clamped to ${safeDepth}" to keep rail length and board layout valid.`);
  }
  if (safeHeight !== inputs.height) {
    issues.push(`Height was clamped to ${safeHeight}" to avoid impossible rail and leg geometry.`);
  }
  if (safeMaxSpan !== inputs.maxSpan) {
    issues.push(`Max span was clamped to ${safeMaxSpan}".`);
  }
  if (safeBottomRailClearance !== inputs.bottomRailClearance) {
    issues.push(`Bottom rail clearance was clamped to ${safeBottomRailClearance}" for the current structure.`);
  }

  return {
    furnitureType: "bench",
    length: safeLength,
    depth: safeDepth,
    height: safeHeight,
    maxSpan: safeMaxSpan,
    bottomRailClearance: safeBottomRailClearance,
  };
}

function normalizeFixedShelfInputs(inputs: FixedShelfInputs, issues: string[]): FixedShelfInputs {
  const safeLength = clampNumber(inputs.length, BOARD_WIDTH * 2);
  const safeDepth = clampNumber(inputs.depth, 2 * BOARD_THICKNESS + BOARD_WIDTH);
  const safeHeight = clampNumber(inputs.height, 2 * BOARD_THICKNESS);
  const safeMaxSpan = clampNumber(inputs.maxSpan, 1);
  const roundedShelfCount = roundWholeNumber(inputs.shelfCount, 1);
  const maxFeasibleShelfCount = Math.max(1, Math.floor(safeHeight / (2 * BOARD_THICKNESS)));
  const safeShelfCount = Math.min(roundedShelfCount, maxFeasibleShelfCount);
  const baseBottomRailClearance = clampNumber(inputs.bottomRailClearance, 0);
  const maxBottomRailClearance =
    safeShelfCount <= 1
      ? Math.max(0, safeHeight - 2 * BOARD_THICKNESS)
      : Math.max(0, safeHeight - safeShelfCount * 2 * BOARD_THICKNESS);
  const safeBottomRailClearance = Math.min(baseBottomRailClearance, maxBottomRailClearance);

  if (safeLength !== inputs.length) {
    issues.push(`Length was clamped to ${safeLength}" to keep the frame geometry valid.`);
  }
  if (safeDepth !== inputs.depth) {
    issues.push(`Depth was clamped to ${safeDepth}" to keep rail length and board layout valid.`);
  }
  if (safeHeight !== inputs.height) {
    issues.push(`Height was clamped to ${safeHeight}" to avoid impossible rail and leg geometry.`);
  }
  if (safeMaxSpan !== inputs.maxSpan) {
    issues.push(`Max span was clamped to ${safeMaxSpan}".`);
  }
  if (roundedShelfCount !== inputs.shelfCount) {
    issues.push(`Shelf count was rounded to ${roundedShelfCount}.`);
  }
  if (safeShelfCount !== roundedShelfCount) {
    issues.push(`Shelf count was clamped to ${safeShelfCount} for the current height.`);
  }
  if (safeBottomRailClearance !== inputs.bottomRailClearance) {
    issues.push(`Bottom rail clearance was clamped to ${safeBottomRailClearance}" for the current structure.`);
  }

  return {
    furnitureType: "shelf",
    shelfMode: "fixed",
    length: safeLength,
    depth: safeDepth,
    height: safeHeight,
    maxSpan: safeMaxSpan,
    bottomRailClearance: safeBottomRailClearance,
    shelfCount: safeShelfCount,
    frameMode: inputs.frameMode,
  };
}

function normalizeAdjustableShelfInputs(inputs: AdjustableShelfInputs, issues: string[]): AdjustableShelfInputs {
  const safeLength = clampNumber(inputs.length, BOARD_WIDTH * 2);
  const safeDepth = clampNumber(inputs.depth, 2 * BOARD_THICKNESS + BOARD_WIDTH);
  const safeHeight = clampNumber(inputs.height, 2 * BOARD_THICKNESS);
  const safeMaxSpan = clampNumber(inputs.maxSpan, 1);
  const normalizedOpenings = (inputs.clearOpenings.length > 0 ? inputs.clearOpenings : [12, 12]).map(normalizeOpening);
  const levelBottoms = deriveAdjustableShelfLevelBottoms(safeHeight, normalizedOpenings);
  const derivedBottomRailClearance = Math.max(0, levelBottoms[0]);

  if (safeLength !== inputs.length) {
    issues.push(`Length was clamped to ${safeLength}" to keep the frame geometry valid.`);
  }
  if (safeDepth !== inputs.depth) {
    issues.push(`Depth was clamped to ${safeDepth}" to keep rail length and board layout valid.`);
  }
  if (safeHeight !== inputs.height) {
    issues.push(`Height was clamped to ${safeHeight}" to avoid impossible rail and leg geometry.`);
  }
  if (safeMaxSpan !== inputs.maxSpan) {
    issues.push(`Max span was clamped to ${safeMaxSpan}".`);
  }
  if (normalizedOpenings.some((opening, index) => opening !== inputs.clearOpenings[index])) {
    issues.push(`Shelf openings were normalized to valid values.`);
  }
  if (Math.abs(derivedBottomRailClearance - inputs.bottomRailClearance) > 0.001) {
    issues.push(`Bottom rail clearance was adjusted to ${derivedBottomRailClearance}" to honor the specified shelf openings and total height.`);
  }
  if (levelBottoms[0] < 0) {
    issues.push(`Specified shelf openings exceed the available height. Reduce one or more openings or increase height.`);
  }

  return {
    furnitureType: "shelf",
    shelfMode: "adjustable",
    length: safeLength,
    depth: safeDepth,
    height: safeHeight,
    maxSpan: safeMaxSpan,
    bottomRailClearance: derivedBottomRailClearance,
    clearOpenings: normalizedOpenings,
    frameMode: inputs.frameMode,
  };
}

function normalizeHybridShelfInputs(inputs: HybridShelfInputs, issues: string[]): HybridShelfInputs {
  const safeDepth = clampNumber(inputs.depth, 2 * BOARD_THICKNESS + BOARD_WIDTH);
  const safeHeight = clampNumber(inputs.height, 2 * BOARD_THICKNESS);
  const safeMaxSpan = clampNumber(inputs.maxSpan, 1);
  const normalizedSections = inputs.sections.map((section) => ({
    sectionLength: clampNumber(section.sectionLength, BOARD_WIDTH * 2),
    clearOpenings: (section.clearOpenings.length > 0 ? section.clearOpenings : [12]).map(normalizeOpening),
  })) as [HybridShelfSectionInputs, HybridShelfSectionInputs];
  const levelBottoms = normalizedSections.map((section) =>
    deriveAdjustableShelfLevelBottoms(safeHeight, section.clearOpenings),
  );
  const derivedBottomRailClearance = Math.max(0, Math.min(...levelBottoms.map((sectionLevels) => sectionLevels[0] ?? 0)));
  const derivedLength = normalizedSections[0].sectionLength + normalizedSections[1].sectionLength - BOARD_WIDTH;

  if (Math.abs(derivedBottomRailClearance - inputs.bottomRailClearance) > 0.001) {
    issues.push(`Bottom rail clearance was adjusted to ${derivedBottomRailClearance}" to honor the hybrid section openings and total height.`);
  }

  return {
    furnitureType: "shelf",
    shelfMode: "hybrid",
    length: derivedLength,
    depth: safeDepth,
    height: safeHeight,
    maxSpan: safeMaxSpan,
    bottomRailClearance: derivedBottomRailClearance,
    frameMode: inputs.frameMode,
    sections: normalizedSections,
  };
}

function normalizeInputs(inputs: AppInputs, issues: string[]): AppInputs {
  if (inputs.furnitureType === "bench") {
    return normalizeBenchInputs(inputs, issues);
  }

  if (inputs.shelfMode === "fixed") {
    return normalizeFixedShelfInputs(inputs, issues);
  }

  if (inputs.shelfMode === "adjustable") {
    return normalizeAdjustableShelfInputs(inputs, issues);
  }

  return normalizeHybridShelfInputs(inputs, issues);
}

function deriveBenchLayout(inputs: BenchInputs): DerivedLayout {
  const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(inputs.length, inputs.maxSpan);
  const boardCountPerLevel = getBenchBoardCount(inputs.depth);
  const { boardGap, boardOffsets } = getBoardOffsets(inputs.depth, boardCountPerLevel, false);

  return {
    totalLength: inputs.length,
    sections: [
      {
        sectionId: "bench-main",
        offsetX: 0,
        length: inputs.length,
        frameCount,
        framePositions,
        actualClearSpan,
        levelBottoms: [],
        boardCountPerLevel,
        boardGap,
        boardOffsets,
      },
    ],
  };
}

function deriveShelfLayout(inputs: ShelfInputs): DerivedLayout {
  if (inputs.shelfMode === "hybrid") {
    let offsetX = 0;
    const sections = inputs.sections.map((section, index) => {
      const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(section.sectionLength, inputs.maxSpan);
      const boardCountPerLevel = getShelfBoardCount(inputs.depth);
      const { boardGap, boardOffsets } = getBoardOffsets(inputs.depth, boardCountPerLevel, true);
      const levelBottoms = deriveAdjustableShelfLevelBottoms(inputs.height, section.clearOpenings);
      const layout: DerivedSectionLayout = {
        sectionId: index === 0 ? "left" : "right",
        offsetX,
        length: section.sectionLength,
        frameCount,
        framePositions,
        actualClearSpan,
        levelBottoms,
        boardCountPerLevel,
        boardGap,
        boardOffsets,
      };
      offsetX += section.sectionLength - BOARD_WIDTH;
      return layout;
    });

    return {
      totalLength:
        sections.length === 2
          ? sections[0].length + sections[1].length - BOARD_WIDTH
          : sections.reduce((sum, section) => sum + section.length, 0),
      sections,
    };
  }

  const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(inputs.length, inputs.maxSpan);
  const boardCountPerLevel = getShelfBoardCount(inputs.depth);
  const { boardGap, boardOffsets } = getBoardOffsets(inputs.depth, boardCountPerLevel, true);
  const levelBottoms =
    inputs.shelfMode === "fixed"
      ? deriveFixedShelfLevelBottoms(inputs.height, inputs.bottomRailClearance, inputs.shelfCount)
      : deriveAdjustableShelfLevelBottoms(inputs.height, inputs.clearOpenings);

  return {
    totalLength: inputs.length,
    sections: [
      {
        sectionId: "shelf-main",
        offsetX: 0,
        length: inputs.length,
        frameCount,
        framePositions,
        actualClearSpan,
        levelBottoms,
        boardCountPerLevel,
        boardGap,
        boardOffsets,
      },
    ],
  };
}

function deriveLayout(inputs: AppInputs) {
  if (inputs.furnitureType === "bench") {
    return deriveBenchLayout(inputs);
  }

  return deriveShelfLayout(inputs);
}

function validateAndSanitizeLayout(
  inputs: AppInputs,
  layout: DerivedLayout,
  issues: string[],
): { renderLayout: DerivedLayout; validationIssues: ValidationIssue[]; layoutStatus: "valid" | "invalid" } {
  const validationIssues: ValidationIssue[] = [];

  if (inputs.furnitureType === "bench") {
    return {
      renderLayout: layout,
      validationIssues,
      layoutStatus: "valid",
    };
  }

  const maxRailBottom = Math.max(0, inputs.height - 2 * BOARD_THICKNESS);
  const sanitizedSections = layout.sections.map((section) => {
    const validLevels = section.levelBottoms.filter((bottom) => bottom >= 0 && bottom <= maxRailBottom);

    if (validLevels.length !== section.levelBottoms.length) {
      addIssue(issues, validationIssues, {
        code: "section-overflow",
        sectionId: section.sectionId,
        message:
          section.sectionId === "shelf-main"
            ? `Shelf openings exceed the available height. Reduce one or more openings or increase height.`
            : `${section.sectionId} section exceeds the available height. Reduce one or more openings or increase height.`,
      });
    }

    return {
      ...section,
      levelBottoms: validLevels,
    };
  });

  if (inputs.shelfMode === "hybrid" && sanitizedSections.length === 2) {
    const [leftSection, rightSection] = sanitizedSections;
    const safeDistance = 2 * BOARD_THICKNESS;
    const conflictingRightLevels = new Set<number>();

    for (const leftBottom of leftSection.levelBottoms) {
      for (const rightBottom of rightSection.levelBottoms) {
        const delta = Math.abs(leftBottom - rightBottom);

        if (delta > 0.001 && delta < safeDistance) {
          conflictingRightLevels.add(rightBottom);
        }
      }
    }

    if (conflictingRightLevels.size > 0) {
      addIssue(issues, validationIssues, {
        code: "shared-frame-conflict",
        sectionId: "right",
        message: `Hybrid shelf levels conflict at the shared center frame. Align those levels or increase the vertical separation.`,
      });

      sanitizedSections[1] = {
        ...rightSection,
        levelBottoms: rightSection.levelBottoms.filter((bottom) => !conflictingRightLevels.has(bottom)),
      };
    }
  }

  return {
    renderLayout: {
      ...layout,
      sections: sanitizedSections,
    },
    validationIssues,
    layoutStatus: validationIssues.length > 0 ? "invalid" : "valid",
  };
}

function deriveParts(inputs: AppInputs, layout: DerivedLayout, issues: string[]) {
  const primarySection = layout.sections[0];
  const sideRailLength = inputs.depth - 2 * BOARD_THICKNESS;
  const legVerticalLength = inputs.furnitureType === "bench" ? inputs.height - BOARD_THICKNESS : inputs.height;
  const shelfLevelCount =
    inputs.furnitureType === "shelf"
      ? layout.sections.reduce((max, section) => Math.max(max, section.levelBottoms.length), 0)
      : 1;
  const rearLegLength =
    inputs.furnitureType === "shelf" && inputs.frameMode === "p-frame"
      ? Math.max(0, inputs.height - inputs.bottomRailClearance)
      : legVerticalLength;

  if (inputs.furnitureType === "bench") {
    const upperRailBottom = inputs.height - 2 * BOARD_THICKNESS;
    const lowerRailTop = inputs.bottomRailClearance + BOARD_THICKNESS;

    if (lowerRailTop > upperRailBottom) {
      issues.push(`Bench rails overlap vertically. Reduce bottom rail clearance or increase height.`);
    }

    const parts: Part[] = [
      {
        key: "top-board",
        label: "Top Boards",
        purpose: "Top surface boards",
        length: primarySection.length,
        quantity: primarySection.boardCountPerLevel,
        color: "#d97706",
      },
      {
        key: "vertical-leg",
        label: "Vertical Legs",
        purpose: "H-frame vertical legs",
        length: legVerticalLength,
        quantity: 2 * primarySection.frameCount,
        color: "#0f766e",
      },
      {
        key: "side-rail",
        label: "Side Rails",
        purpose: "Upper and lower H-frame rails",
        length: sideRailLength,
        quantity: 2 * primarySection.frameCount,
        color: "#2563eb",
      },
    ];

    return {
      parts,
      sideRailLength,
      legVerticalLength,
      rearLegLength,
      boardCountPerLevel: primarySection.boardCountPerLevel,
      shelfLevelCount,
    };
  }

  for (const section of layout.sections) {
    if (section.levelBottoms.length > 1) {
      for (let index = 0; index < section.levelBottoms.length - 1; index += 1) {
        const opening = section.levelBottoms[index + 1] - (section.levelBottoms[index] + 2 * BOARD_THICKNESS);
        if (opening < 0) {
          issues.push(`Shelf levels overlap vertically. Reduce one or more shelf openings or increase height.`);
          break;
        }
      }
    }
  }

  const totalShelfBoards = layout.sections.reduce(
    (sum, section) => sum + section.boardCountPerLevel * section.levelBottoms.length,
    0,
  );
  const sharedFrameCount = inputs.shelfMode === "hybrid" ? Math.max(0, layout.sections.length - 1) : 0;
  const totalFrames =
    layout.sections.reduce((sum, section) => sum + section.frameCount, 0) - sharedFrameCount;
  const sharedLevelBottoms =
    inputs.shelfMode === "hybrid" && layout.sections.length === 2
      ? layout.sections[0].levelBottoms.filter((bottom) =>
          layout.sections[1].levelBottoms.some((candidate) => Math.abs(candidate - bottom) < 0.001),
        )
      : [];
  const totalShelfRails =
    layout.sections.reduce(
      (sum, section) => sum + 2 * section.frameCount * section.levelBottoms.length,
      0,
    ) - sharedLevelBottoms.length * 2;
  const shelfBoardParts: Part[] =
    inputs.shelfMode === "hybrid"
      ? layout.sections.map((section) => ({
          id: `shelf-board-${section.sectionId}`,
          key: "shelf-board" as const,
          label: `Shelf Boards (${section.sectionId})`,
          purpose: `Shelf boards for the ${section.sectionId} section`,
          length: section.length,
          quantity: section.boardCountPerLevel * section.levelBottoms.length,
          color: "#d97706",
        }))
      : [
          {
            key: "shelf-board",
            label: "Shelf Boards",
            purpose: "Continuous shelf boards across full length",
            length: primarySection.length,
            quantity: totalShelfBoards,
            color: "#d97706",
          },
        ];

  const parts: Part[] = [
    ...shelfBoardParts,
    {
      key: "vertical-leg",
      label: inputs.frameMode === "p-frame" ? "Front Legs" : "Vertical Legs",
      purpose: inputs.frameMode === "p-frame" ? "Full-height front legs" : "H-frame vertical legs",
      length: legVerticalLength,
      quantity: inputs.frameMode === "p-frame" ? totalFrames : 2 * totalFrames,
      color: "#0f766e",
    },
    ...(inputs.frameMode === "p-frame"
      ? [
          {
            key: "rear-leg" as const,
            label: "Rear Legs",
            purpose: "Inset rear legs starting at the lowest shelf board",
            length: rearLegLength,
            quantity: totalFrames,
            color: "#0f766e",
          },
        ]
      : []),
    {
      key: "side-rail",
      label: "Side Rails",
      purpose: "Shelf support rails per level",
      length: sideRailLength,
      quantity: totalShelfRails,
      color: "#2563eb",
    },
  ];

  return {
    parts,
    sideRailLength,
    legVerticalLength,
    rearLegLength,
    boardCountPerLevel: primarySection.boardCountPerLevel,
    shelfLevelCount,
  };
}

export function deriveDesign(inputs: AppInputs): DerivedDesign {
  const issues: string[] = [];
  const normalizedInputs = normalizeInputs(inputs, issues);
  const layout = deriveLayout(normalizedInputs);
  const { renderLayout, validationIssues, layoutStatus } = validateAndSanitizeLayout(
    normalizedInputs,
    layout,
    issues,
  );
  const primarySection = layout.sections[0];
  const {
    parts,
    sideRailLength,
    legVerticalLength,
    rearLegLength,
    boardCountPerLevel,
    shelfLevelCount,
  } = deriveParts(normalizedInputs, layout, issues);
  const oversizedParts = parts.filter((part) => part.length > STOCK_LENGTH);

  if (oversizedParts.length > 0) {
    addIssue(issues, validationIssues, {
      code: "stock-overflow",
      message: `Some cut lengths exceed the 96" stock board length and cannot be produced as single-piece cuts.`,
    });
  }

  const stockPlan = optimizeStock(parts);
  const totalWaste = stockPlan.reduce((sum, board) => sum + board.waste, 0);
  const totalUsedLength = stockPlan.reduce((sum, board) => sum + board.usedLength, 0);
  const estimatedScrewCount = parts
    .filter((part) => part.key === "side-rail")
    .reduce((sum, part) => sum + part.quantity, 0) * 4;

  return {
    normalizedInputs,
    frameCount: primarySection.frameCount,
    extraSupportHFrameCount: Math.max(0, primarySection.frameCount - 2),
    framePositions: primarySection.framePositions,
    actualClearSpan: primarySection.actualClearSpan,
    estimatedScrewCount,
    sideRailLength,
    legVerticalLength,
    rearLegLength,
    boardCountPerLevel,
    shelfLevelCount,
    issues,
    parts,
    stockPlan,
    totalWaste,
    totalUsedLength,
    layout,
    renderLayout,
    validationIssues,
    layoutStatus,
  };
}

export function formatInches(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded}"`;
}
