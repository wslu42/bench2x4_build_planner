export const BOARD_THICKNESS = 1.5;
export const BOARD_WIDTH = 3.5;
export const STOCK_LENGTH = 96;
export const SAW_KERF = 0.125;

export type FurnitureType = "top-surface" | "shelving";
export type ViewMode = "top" | "side" | "front" | "assembly";

export type CommonInputs = {
  length: number;
  depth: number;
  height: number;
  maxSpan: number;
  bottomRailClearance: number;
};

export type TopSurfaceInputs = CommonInputs & {
  furnitureType: "top-surface";
};

export type ShelvingInputs = CommonInputs & {
  furnitureType: "shelving";
  shelfLevelCount: number;
};

export type AppInputs = TopSurfaceInputs | ShelvingInputs;

export type PartGroup =
  | "top-board"
  | "shelf-board"
  | "vertical-leg"
  | "side-rail";

export type Part = {
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

export type DerivedDesign = {
  normalizedInputs: AppInputs;
  frameCount: number;
  extraSupportHFrameCount: number;
  framePositions: number[];
  actualClearSpan: number;
  estimatedScrewCount: number;
  sideRailLength: number;
  legVerticalLength: number;
  boardCountPerLevel: number;
  shelfLevelCount: number;
  issues: string[];
  parts: Part[];
  stockPlan: StockBoardPlan[];
  totalWaste: number;
  totalUsedLength: number;
};

function clampNumber(value: number, min: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(value, min);
}

function roundShelfLevels(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.round(value));
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

export function deriveDesign(inputs: AppInputs): DerivedDesign {
  const issues: string[] = [];
  const safeLength = clampNumber(inputs.length, BOARD_WIDTH * 2);
  const minDepth =
    inputs.furnitureType === "shelving"
      ? 2 * BOARD_THICKNESS + BOARD_WIDTH
      : 2 * BOARD_THICKNESS + 0.5;
  const safeDepth = clampNumber(inputs.depth, minDepth);
  const minHeight = inputs.furnitureType === "top-surface" ? 3 * BOARD_THICKNESS : 2 * BOARD_THICKNESS;
  const safeHeight = clampNumber(inputs.height, minHeight);
  const safeMaxSpan = clampNumber(inputs.maxSpan, 1);
  const roundedShelfLevelCount =
    inputs.furnitureType === "shelving" ? roundShelfLevels(inputs.shelfLevelCount) : 1;
  const maxFeasibleShelfLevels =
    inputs.furnitureType === "shelving" ? Math.max(1, Math.floor(safeHeight / (2 * BOARD_THICKNESS))) : 1;
  const safeShelfLevelCount =
    inputs.furnitureType === "shelving"
      ? Math.min(roundedShelfLevelCount, maxFeasibleShelfLevels)
      : 1;

  const baseBottomRailClearance = clampNumber(inputs.bottomRailClearance, 0);
  const maxBottomRailClearance =
    inputs.furnitureType === "top-surface"
      ? Math.max(0, safeHeight - 3 * BOARD_THICKNESS)
      : safeShelfLevelCount <= 1
        ? Math.max(0, safeHeight - 2 * BOARD_THICKNESS)
        : Math.max(0, safeHeight - safeShelfLevelCount * 2 * BOARD_THICKNESS);
  const safeBottomRailClearance = Math.min(baseBottomRailClearance, maxBottomRailClearance);

  if (safeLength !== inputs.length) {
    issues.push(
      `Length was clamped to ${safeLength}" to keep the frame geometry valid.`,
    );
  }

  if (safeDepth !== inputs.depth) {
    issues.push(
      `Depth was clamped to ${safeDepth}" to keep rail length and board layout valid.`,
    );
  }

  if (safeHeight !== inputs.height) {
    issues.push(
      `Height was clamped to ${safeHeight}" to avoid impossible rail and leg geometry.`,
    );
  }

  if (safeMaxSpan !== inputs.maxSpan) {
    issues.push(`Max span was clamped to ${safeMaxSpan}".`);
  }

  if (inputs.furnitureType === "shelving" && roundedShelfLevelCount !== inputs.shelfLevelCount) {
    issues.push(`Shelf levels were rounded to ${roundedShelfLevelCount}.`);
  }

  if (inputs.furnitureType === "shelving" && safeShelfLevelCount !== roundedShelfLevelCount) {
    issues.push(
      `Shelf levels were clamped to ${safeShelfLevelCount} for the current height.`,
    );
  }

  if (safeBottomRailClearance !== inputs.bottomRailClearance) {
    issues.push(
      `Bottom rail clearance was clamped to ${safeBottomRailClearance}" for the current structure.`,
    );
  }

  const normalizedInputs: AppInputs =
    inputs.furnitureType === "top-surface"
      ? {
          furnitureType: "top-surface",
          length: safeLength,
          depth: safeDepth,
          height: safeHeight,
          maxSpan: safeMaxSpan,
          bottomRailClearance: safeBottomRailClearance,
        }
      : {
          furnitureType: "shelving",
          length: safeLength,
          depth: safeDepth,
          height: safeHeight,
          maxSpan: safeMaxSpan,
          bottomRailClearance: safeBottomRailClearance,
          shelfLevelCount: safeShelfLevelCount,
        };

  const { frameCount, framePositions, actualClearSpan } = deriveFrameLayout(
    normalizedInputs.length,
    normalizedInputs.maxSpan,
  );
  const extraSupportHFrameCount = Math.max(0, frameCount - 2);
  const sideRailLength = normalizedInputs.depth - 2 * BOARD_THICKNESS;
  const shelfLevelCount =
    normalizedInputs.furnitureType === "shelving" ? normalizedInputs.shelfLevelCount : 1;
  const boardCountPerLevel =
    normalizedInputs.furnitureType === "top-surface"
      ? Math.max(1, Math.floor(normalizedInputs.depth / BOARD_WIDTH))
      : Math.max(1, Math.floor((normalizedInputs.depth - 2 * BOARD_THICKNESS) / BOARD_WIDTH));
  const legVerticalLength =
    normalizedInputs.furnitureType === "top-surface"
      ? normalizedInputs.height - BOARD_THICKNESS
      : normalizedInputs.height;

  if (normalizedInputs.furnitureType === "shelving") {
    const highestRailBottom = normalizedInputs.height - 2 * BOARD_THICKNESS;

    if (normalizedInputs.bottomRailClearance > highestRailBottom) {
      issues.push(
        `Bottom rail clearance is too large for the current height. Maximum valid value is ${highestRailBottom}".`,
      );
    } else if (normalizedInputs.shelfLevelCount > 1) {
      const railBottomStep =
        (highestRailBottom - normalizedInputs.bottomRailClearance) / (normalizedInputs.shelfLevelCount - 1);

      if (railBottomStep < 2 * BOARD_THICKNESS) {
        issues.push(
          `Shelf levels overlap vertically. Reduce bottom rail clearance, reduce shelf levels, or increase height.`,
        );
      }
    }
  } else {
    const upperRailBottom = normalizedInputs.height - 2 * BOARD_THICKNESS;
    const lowerRailTop = normalizedInputs.bottomRailClearance + BOARD_THICKNESS;

    if (lowerRailTop > upperRailBottom) {
      issues.push(
        `Bench rails overlap vertically. Reduce bottom rail clearance or increase height.`,
      );
    }
  }

  const parts: Part[] =
    normalizedInputs.furnitureType === "top-surface"
      ? [
          {
            key: "top-board",
            label: "Top Boards",
            purpose: "Top surface boards",
            length: normalizedInputs.length,
            quantity: boardCountPerLevel,
            color: "#d97706",
          },
          {
            key: "vertical-leg",
            label: "Vertical Legs",
            purpose: "H-frame vertical legs",
            length: legVerticalLength,
            quantity: 2 * frameCount,
            color: "#0f766e",
          },
          {
            key: "side-rail",
            label: "Side Rails",
            purpose: "Upper and lower H-frame rails",
            length: sideRailLength,
            quantity: 2 * frameCount,
            color: "#2563eb",
          },
        ]
      : [
          {
            key: "shelf-board",
            label: "Shelf Boards",
            purpose: "Continuous shelf boards across full length",
            length: normalizedInputs.length,
            quantity: boardCountPerLevel * shelfLevelCount,
            color: "#d97706",
          },
          {
            key: "vertical-leg",
            label: "Vertical Legs",
            purpose: "H-frame vertical legs",
            length: legVerticalLength,
            quantity: 2 * frameCount,
            color: "#0f766e",
          },
          {
            key: "side-rail",
            label: "Side Rails",
            purpose: "Shelf support rails per level",
            length: sideRailLength,
            quantity: 2 * frameCount * shelfLevelCount,
            color: "#2563eb",
          },
        ];

  const oversizedParts = parts.filter((part) => part.length > STOCK_LENGTH);

  if (oversizedParts.length > 0) {
    issues.push(
      `Some cut lengths exceed the 96" stock board length and cannot be produced as single-piece cuts.`,
    );
  }

  const stockPlan = optimizeStock(parts);
  const totalWaste = stockPlan.reduce((sum, board) => sum + board.waste, 0);
  const totalUsedLength = stockPlan.reduce((sum, board) => sum + board.usedLength, 0);
  const sideRailPart = parts.find((part) => part.key === "side-rail");
  const estimatedScrewCount = (sideRailPart?.quantity ?? 0) * 4;

  return {
    normalizedInputs,
    frameCount,
    extraSupportHFrameCount,
    framePositions,
    actualClearSpan,
    estimatedScrewCount,
    sideRailLength,
    legVerticalLength,
    boardCountPerLevel,
    shelfLevelCount,
    issues,
    parts,
    stockPlan,
    totalWaste,
    totalUsedLength,
  };
}

export function formatInches(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return `${rounded}"`;
}
