const MINI_BUILD_LIMIT = 80;

export const BUILDING_MINIMUMS = {
  house: 520,
  tower: 150,
  castle: 650,
  bridge: 120,
  barn: 520,
  treehouse: 240,
  megaCastle: 1000,
  dragonKeep: 1500,
  grandPalace: 3000,
  mountainTemple: 5000
};

export const BLOCK_COUNT_LIMITS = {
  min: 25,
  max: 10000,
  default: BUILDING_MINIMUMS.house,
  miniMaximum: MINI_BUILD_LIMIT
};

export const BUILDING_TYPES = [
  { id: "house", label: "House", minimumBlocks: BUILDING_MINIMUMS.house },
  { id: "tower", label: "Tower", minimumBlocks: BUILDING_MINIMUMS.tower },
  { id: "castle", label: "Castle", minimumBlocks: BUILDING_MINIMUMS.castle },
  { id: "bridge", label: "Bridge", minimumBlocks: BUILDING_MINIMUMS.bridge },
  { id: "barn", label: "Barn", minimumBlocks: BUILDING_MINIMUMS.barn },
  { id: "treehouse", label: "Treehouse", minimumBlocks: BUILDING_MINIMUMS.treehouse },
  { id: "megaCastle", label: "Mega Castle", minimumBlocks: BUILDING_MINIMUMS.megaCastle },
  { id: "dragonKeep", label: "Dragon Keep", minimumBlocks: BUILDING_MINIMUMS.dragonKeep },
  { id: "grandPalace", label: "Grand Palace", minimumBlocks: BUILDING_MINIMUMS.grandPalace },
  { id: "mountainTemple", label: "Mountain Temple", minimumBlocks: BUILDING_MINIMUMS.mountainTemple }
];

export const BUILDING_VARIATIONS = {
  house: [
    { id: "gableCottage", label: "Gable Cottage" },
    { id: "porchHouse", label: "Porch House" },
    { id: "tallTownhouse", label: "Tall Townhouse" },
    { id: "wideRanch", label: "Wide Ranch" },
    { id: "courtyardHouse", label: "Courtyard House" }
  ],
  tower: [
    { id: "roundWatchtower", label: "Round Watchtower" },
    { id: "squareWizardTower", label: "Square Wizard Tower" },
    { id: "twinSpire", label: "Twin Spire" },
    { id: "beaconTower", label: "Beacon Tower" },
    { id: "ruinedTower", label: "Ruined Tower" }
  ],
  castle: [
    { id: "classicKeep", label: "Classic Keep" },
    { id: "moatCastle", label: "Moat Castle" },
    { id: "hilltopCastle", label: "Hilltop Castle" },
    { id: "twinGateCastle", label: "Twin Gate Castle" },
    { id: "courtyardCastle", label: "Courtyard Castle" }
  ],
  bridge: [
    { id: "archedStone", label: "Arched Stone" },
    { id: "coveredBridge", label: "Covered Bridge" },
    { id: "suspensionSpan", label: "Suspension Span" },
    { id: "canalBridge", label: "Canal Bridge" },
    { id: "multiArchViaduct", label: "Multi-Arch Viaduct" }
  ],
  barn: [
    { id: "redGableBarn", label: "Red Gable Barn" },
    { id: "longStable", label: "Long Stable" },
    { id: "siloBarn", label: "Silo Barn" },
    { id: "hayloftBarn", label: "Hayloft Barn" },
    { id: "farmyardBarn", label: "Farmyard Barn" }
  ],
  treehouse: [
    { id: "singleTreeCabin", label: "Single Tree Cabin" },
    { id: "twinTreeBridge", label: "Twin Tree Bridge" },
    { id: "spiralStairTreehouse", label: "Spiral Stair Treehouse" },
    { id: "canopyLodge", label: "Canopy Lodge" },
    { id: "platformVillage", label: "Platform Village" }
  ],
  megaCastle: [
    { id: "walledCitadel", label: "Walled Citadel" },
    { id: "moatFortress", label: "Moat Fortress" },
    { id: "mountainCitadel", label: "Mountain Citadel" },
    { id: "spiralKeep", label: "Spiral Keep" },
    { id: "castleVillage", label: "Castle Village" }
  ],
  dragonKeep: [
    { id: "emberKeep", label: "Ember Keep" },
    { id: "twinDragonGate", label: "Twin Dragon Gate" },
    { id: "courtyardRoost", label: "Courtyard Roost" },
    { id: "firelineFortress", label: "Fireline Fortress" },
    { id: "dragonBridgeKeep", label: "Dragon Bridge Keep" }
  ],
  grandPalace: [
    { id: "symmetricPalace", label: "Symmetric Palace" },
    { id: "courtyardPalace", label: "Courtyard Palace" },
    { id: "gardenPalace", label: "Garden Palace" },
    { id: "canalPalace", label: "Canal Palace" },
    { id: "terracedPalace", label: "Terraced Palace" }
  ],
  mountainTemple: [
    { id: "steppedPyramid", label: "Stepped Pyramid" },
    { id: "cliffTemple", label: "Cliff Temple" },
    { id: "twinStairTemple", label: "Twin Stair Temple" },
    { id: "waterfallTemple", label: "Waterfall Temple" },
    { id: "summitMonastery", label: "Summit Monastery" }
  ]
};

const TYPE_IDS = new Set(BUILDING_TYPES.map((type) => type.id));
const MINI_TYPE_IDS = new Set(["house", "tower", "castle", "bridge", "barn", "treehouse"]);
const SCALE_ATTEMPTS = [0.22, 0.32, 0.42, 0.55, 0.7, 0.86, 1, 1.18, 1.38, 1.62, 1.9, 2.24, 2.72, 3.28, 3.95];

class BlockPlan {
  constructor() {
    this.blocks = [];
    this.index = new Map();
  }

  add(x, y, z, material) {
    const block = {
      x: Math.round(x),
      y: Math.round(y),
      z: Math.round(z),
      material
    };
    const key = `${block.x},${block.y},${block.z}`;
    const existing = this.index.get(key);

    if (existing) {
      existing.material = material;
      existing.removed = false;
      return existing;
    }

    this.index.set(key, block);
    this.blocks.push(block);
    return block;
  }

  remove(x, y, z) {
    const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
    const existing = this.index.get(key);

    if (existing) {
      existing.removed = true;
      this.index.delete(key);
    }
  }

  toBlocks() {
    return this.blocks.filter((block) => !block.removed);
  }
}

export function getBuildingMinimum(type = "house") {
  const normalizedType = TYPE_IDS.has(type) ? type : "house";
  return BUILDING_MINIMUMS[normalizedType];
}

export function getBuildingVariations(type = "house") {
  const normalizedType = TYPE_IDS.has(type) ? type : "house";
  return BUILDING_VARIATIONS[normalizedType].map((variation) => ({ ...variation }));
}

export function resolveBuildVariation({ type = "house", seed = 1, variation } = {}) {
  const normalizedType = TYPE_IDS.has(type) ? type : "house";
  const variations = BUILDING_VARIATIONS[normalizedType];
  const matched = variations.find((candidate) => candidate.id === variation);

  if (matched) return { ...matched };

  const parsedSeed = Number.isFinite(Number(seed)) ? Math.abs(Math.trunc(Number(seed))) : 1;
  return { ...variations[parsedSeed % variations.length] };
}

export function normalizeBuildTarget({ type = "house", targetBlocks = BLOCK_COUNT_LIMITS.default, allowMini = false } = {}) {
  const normalizedType = TYPE_IDS.has(type) ? type : "house";
  const parsed = Number.parseInt(targetBlocks, 10);
  const clamped = Number.isFinite(parsed)
    ? clamp(parsed, BLOCK_COUNT_LIMITS.min, BLOCK_COUNT_LIMITS.max)
    : BLOCK_COUNT_LIMITS.default;
  const useMiniRange = allowMini && MINI_TYPE_IDS.has(normalizedType) && clamped <= MINI_BUILD_LIMIT;
  const presetMinimum = useMiniRange ? BLOCK_COUNT_LIMITS.min : getBuildingMinimum(normalizedType);

  return clamp(Math.max(clamped, presetMinimum), BLOCK_COUNT_LIMITS.min, BLOCK_COUNT_LIMITS.max);
}

export function generateBuild({ type = "house", targetBlocks = BLOCK_COUNT_LIMITS.default, seed = 1, allowMini = false, variation } = {}) {
  const normalizedType = TYPE_IDS.has(type) ? type : "house";
  const cleanTarget = normalizeBuildTarget({ type: normalizedType, targetBlocks, allowMini });
  const useMiniRange = allowMini && cleanTarget <= MINI_BUILD_LIMIT && Boolean(miniGenerators[normalizedType]);
  const presetMinimum = useMiniRange ? BLOCK_COUNT_LIMITS.min : getBuildingMinimum(normalizedType);
  const resolvedVariation = resolveBuildVariation({ type: normalizedType, seed, variation });

  if (useMiniRange) {
    const plan = new BlockPlan();
    const rng = createRng(seed);
    miniGenerators[normalizedType](plan, rng);
    padMiniPlan(plan, cleanTarget, rng);
    return plan.toBlocks().slice(0, cleanTarget).map((block) => ({ ...block }));
  }

  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  SCALE_ATTEMPTS.forEach((scale, index) => {
    const plan = new BlockPlan();
    const rng = createRng(seed + index * 9973);
    const scaledBudget = Math.max(20, Math.round(cleanTarget * scale));

    generators[normalizedType](plan, scaledBudget, rng, resolvedVariation);

    const blocks = plan.toBlocks();
    const belowMinimumPenalty = blocks.length < presetMinimum ? (presetMinimum - blocks.length) * 10000 : 0;
    const overGlobalCapPenalty = blocks.length > BLOCK_COUNT_LIMITS.max ? (blocks.length - BLOCK_COUNT_LIMITS.max) * 10000 : 0;
    const score = Math.abs(blocks.length - cleanTarget) + belowMinimumPenalty + overGlobalCapPenalty;
    if (!best || score < bestScore) {
      best = blocks;
      bestScore = score;
    }
  });

  return best.map((block) => ({ ...block }));
}

const generators = {
  house: generateHouse,
  tower: generateTower,
  castle: generateCastle,
  bridge: generateBridge,
  barn: generateBarn,
  treehouse: generateTreehouse,
  megaCastle: generateMegaCastle,
  dragonKeep: generateDragonKeep,
  grandPalace: generateGrandPalace,
  mountainTemple: generateMountainTemple
};

const miniGenerators = {
  house: generateMiniHouse,
  tower: generateMiniTower,
  castle: generateMiniCastle,
  bridge: generateMiniBridge,
  barn: generateMiniBarn,
  treehouse: generateMiniTreehouse
};

function generateMiniHouse(plan) {
  addCuboid(plan, -1, 1, 0, 0, -1, 1, "plank");
  addMiniPerimeter(plan, 1, 1, 1, "wood", [[0, -1]]);
  addMiniPerimeter(plan, 1, 1, 2, "wood");
  plan.add(0, 3, -1, "roof");
  plan.add(0, 3, 0, "roof");
  plan.add(0, 3, 1, "roof");
  plan.add(-1, 2, 0, "glass");
  plan.add(1, 2, 0, "glass");
  plan.add(0, 1, -1, "dark");
}

function generateMiniTower(plan) {
  addCuboid(plan, -1, 1, 0, 0, -1, 1, "stone");
  addMiniPerimeter(plan, 1, 1, 1, "stone", [[0, -1]]);
  addMiniPerimeter(plan, 1, 1, 2, "stone");
  plan.add(0, 3, 0, "wood");
  addMiniPerimeter(plan, 1, 1, 3, "stone", [
    [0, -1],
    [0, 1]
  ]);
  plan.add(0, 4, 0, "roof");
  plan.add(1, 4, 0, "roof");
}

function generateMiniCastle(plan) {
  addMiniPerimeter(plan, 2, 2, 0, "stone");
  plan.add(0, 0, -2, "dark");
  [
    [-2, -2],
    [2, -2],
    [-2, 2],
    [2, 2]
  ].forEach(([x, z]) => plan.add(x, 1, z, "stone"));
  [
    [0, -2],
    [-2, 0],
    [2, 0],
    [0, 2]
  ].forEach(([x, z]) => plan.add(x, 1, z, "stone"));
  plan.add(0, 1, 0, "path");
  plan.add(0, 2, 0, "roof");
  plan.add(1, 2, 0, "roof");
  addMiniPerimeter(plan, 1, 1, 1, "stone", [
    [0, -1],
    [0, 1]
  ]);
}

function generateMiniBridge(plan) {
  for (let z = -3; z <= 3; z += 1) {
    for (let x = -1; x <= 1; x += 1) {
      plan.add(x, 2, z, "plank");
    }
  }
  [-3, -1, 1, 3].forEach((z) => {
    plan.add(-1, 3, z, "wood");
    plan.add(1, 3, z, "wood");
  });
  addCuboid(plan, -2, 2, 0, 0, -3, 3, "water");
  plan.add(-1, 1, -2, "stone");
  plan.add(1, 1, -2, "stone");
  plan.add(-1, 1, 2, "stone");
  plan.add(1, 1, 2, "stone");
}

function generateMiniBarn(plan) {
  addCuboid(plan, -1, 1, 0, 0, -1, 1, "hay");
  addMiniPerimeter(plan, 1, 1, 1, "red", [[0, -1]]);
  addMiniPerimeter(plan, 1, 1, 2, "red");
  plan.add(0, 3, -1, "roof");
  plan.add(0, 3, 0, "roof");
  plan.add(0, 3, 1, "roof");
  plan.add(-1, 2, -1, "white");
  plan.add(1, 2, -1, "white");
  plan.add(0, 1, -1, "dark");
}

function generateMiniTreehouse(plan) {
  addCuboid(plan, 0, 0, 0, 4, 0, 0, "wood");
  addCuboid(plan, -1, 1, 5, 5, -1, 1, "plank");
  addMiniPerimeter(plan, 1, 1, 6, "wood", [[0, -1]]);
  plan.add(0, 7, 0, "roof");
  plan.add(-1, 7, 0, "leaf");
  plan.add(1, 7, 0, "leaf");
  plan.add(0, 7, -1, "leaf");
  plan.add(0, 7, 1, "leaf");
  plan.add(2, 5, 0, "leaf");
  plan.add(-2, 5, 0, "leaf");
}

function addMiniPerimeter(plan, hx, hz, y, material, skips = []) {
  const skipKeys = new Set(skips.map(([x, z]) => `${x},${z}`));

  for (let x = -hx; x <= hx; x += 1) {
    for (let z = -hz; z <= hz; z += 1) {
      const edge = Math.abs(x) === hx || Math.abs(z) === hz;
      if (edge && !skipKeys.has(`${x},${z}`)) {
        plan.add(x, y, z, material);
      }
    }
  }
}

function padMiniPlan(plan, target, rng) {
  const materialCycle = ["path", "flower", "grass", "plank", "stone"];
  let radius = 2;
  let materialIndex = Math.floor(rng() * materialCycle.length);

  while (plan.toBlocks().length < target && radius < 12) {
    for (let x = -radius; x <= radius; x += 1) {
      for (let z = -radius; z <= radius; z += 1) {
        if (Math.abs(x) !== radius && Math.abs(z) !== radius) continue;
        const material = materialCycle[materialIndex % materialCycle.length];
        materialIndex += 1;
        plan.add(x, 0, z, material);
        if (plan.toBlocks().length >= target) return;
      }
    }

    radius += 1;
  }
}

function generateHouse(plan, budget, rng, variation) {
  const id = variation.id;
  const widthScale = id === "wideRanch" ? 2.35 : id === "tallTownhouse" ? 1.45 : id === "courtyardHouse" ? 2.05 : 1.9;
  const depthScale = id === "wideRanch" ? 0.58 : id === "courtyardHouse" ? 0.9 : id === "tallTownhouse" ? 0.68 : 0.75 + rng() * 0.2;
  const width = odd(clamp(Math.round(Math.cbrt(budget) * widthScale), 3, 61));
  const depth = odd(clamp(Math.round(width * depthScale), 3, 55));
  const heightBoost = id === "tallTownhouse" ? 4 : id === "wideRanch" ? -1 : 0;
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.72) + heightBoost, 2, 24);
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);

  addCuboid(plan, -hx, hx, 0, 0, -hz, hz, "plank");

  for (let y = 1; y <= wallHeight; y += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      for (let z = -hz; z <= hz; z += 1) {
        const edge = Math.abs(x) === hx || Math.abs(z) === hz;
        const doorway = z === -hz && Math.abs(x) <= 0 && y <= 2;
        if (!edge || doorway) continue;

        const sideWindow = y === 2 && Math.abs(x) === hx && Math.abs(z) <= Math.max(0, hz - 2);
        const frontWindow = y === 2 && Math.abs(z) === hz && Math.abs(x) === Math.max(1, hx - 1);
        plan.add(x, y, z, sideWindow || frontWindow ? "glass" : "wood");
      }
    }
  }

  addClosedGableRoof(plan, hx, hz, wallHeight, "roof");

  addCuboid(plan, hx - 1, hx - 1, wallHeight + 1, wallHeight + 3, hz - 1, hz - 1, "stone");
  plan.add(0, 1, -hz, "dark");
  plan.add(-hx - 1, 0, -hz - 1, "flower");
  plan.add(hx + 1, 0, -hz - 1, "flower");

  if (id === "porchHouse") {
    addCuboid(plan, -Math.max(1, hx - 2), Math.max(1, hx - 2), 0, 0, -hz - 4, -hz - 1, "plank");
    [-hx + 1, hx - 1].forEach((x) => addCuboid(plan, x, x, 1, 3, -hz - 4, -hz - 4, "wood"));
    addCuboid(plan, -hx + 1, hx - 1, 4, 4, -hz - 4, -hz - 1, "roof");
    addCuboid(plan, -1, 1, 0, 0, -hz - 8, -hz - 5, "path");
  } else if (id === "tallTownhouse") {
    for (let y = 3; y < wallHeight; y += 3) {
      plan.add(-hx, y, 0, "glass");
      plan.add(hx, y, 0, "glass");
      plan.add(0, y, hz, "glass");
    }
    addCuboid(plan, -hx - 1, -hx - 1, wallHeight + 1, wallHeight + 5, hz - 1, hz - 1, "stone");
  } else if (id === "wideRanch") {
    const wingDepth = Math.max(2, Math.floor(hz * 0.7));
    addCuboid(plan, hx + 1, hx + 5, 0, 0, -wingDepth, wingDepth, "plank");
    addBoxShell(plan, hx + 1, hx + 5, 1, Math.max(2, wallHeight - 1), -wingDepth, wingDepth, "wood");
    addCuboid(plan, hx, hx + 6, wallHeight, wallHeight, -wingDepth - 1, wingDepth + 1, "roof");
    plan.add(hx + 3, 1, -wingDepth, "dark");
  } else if (id === "courtyardHouse") {
    const courtZ = -hz - 5;
    addCuboid(plan, -hx, hx, 0, 0, courtZ, -hz - 2, "path");
    addCuboid(plan, -hx, -hx, 1, 2, courtZ, -hz - 2, "wood");
    addCuboid(plan, hx, hx, 1, 2, courtZ, -hz - 2, "wood");
    addCuboid(plan, -hx, hx, 1, 1, courtZ, courtZ, "leaf");
    addCuboid(plan, -2, 2, 0, 0, courtZ + 1, courtZ + 2, "water");
  } else {
    addCuboid(plan, -1, 1, 0, 0, -hz - 6, -hz - 2, "path");
    plan.add(-hx - 2, 0, 0, "leaf");
    plan.add(hx + 2, 0, 0, "leaf");
  }
}

function generateTower(plan, budget, rng, variation) {
  const id = variation.id;

  if (id === "squareWizardTower") {
    const half = clamp(Math.round(Math.sqrt(budget) / 7), 2, 10);
    const height = clamp(Math.round(budget / Math.max(16, half * half * 3.4)), 7, 74);
    addBoxShell(plan, -half, half, 0, height, -half, half, "stone");
    for (let y = 3; y < height; y += 4) {
      plan.add(-half, y, 0, "glass");
      plan.add(half, y, 0, "glass");
      plan.add(0, y, -half, "glass");
      plan.add(0, y, half, "glass");
    }
    addLayeredFlatRoof(plan, -half - 1, half + 1, height + 1, -half - 1, half + 1, 3);
    addCuboid(plan, 0, 0, height + 4, height + 7, 0, 0, "roof");
    plan.add(0, 1, -half, "dark");
    return;
  }

  if (id === "twinSpire") {
    const radius = clamp(Math.round(Math.sqrt(budget) / 7.8), 1, 8);
    const height = clamp(Math.round(budget / Math.max(18, radius * radius * 3.9)), 6, 54);
    const offset = radius + 3;
    [-offset, offset].forEach((cx) => {
      addRoundTower(plan, cx, 0, radius, height, "stone");
      addCuboid(plan, cx, cx, height + 2, height + 5, 0, 0, "roof");
    });
    addBridgeLine(plan, -offset, 0, offset, 0, Math.max(3, Math.floor(height * 0.55)), "plank");
    addCuboid(plan, -1, 1, 0, 0, -2, 2, "path");
    return;
  }

  const radius = clamp(Math.round(Math.sqrt(budget) / (id === "beaconTower" ? 6.4 : 5.4)), 2, 14);
  const height = clamp(Math.round(budget / Math.max(14, radius * radius * (id === "ruinedTower" ? 1.95 : 1.65))), 5, 72);

  addDisc(plan, 0, 0, radius, 0, "stone", true);

  for (let y = 1; y <= height; y += 1) {
    forEachDiscCell(radius, (x, z, edge) => {
      if (!edge) return;
      const doorway = z === -radius && Math.abs(x) <= 1 && y <= 2;
      if (doorway) return;

      const isWindow = y > 2 && y % 4 === 0 && ((Math.abs(x) === radius && z === 0) || (Math.abs(z) === radius && x === 0));
      plan.add(x, y, z, isWindow ? "glass" : "stone");
    });
  }

  forEachDiscCell(radius + 1, (x, z, edge) => {
    if (edge && (Math.abs(x + z) % 2 === 0 || Math.abs(x) === radius + 1 || Math.abs(z) === radius + 1)) {
      plan.add(x, height + 1, z, "stone");
    }
  });

  addCuboid(plan, 0, 0, height + 2, height + 5, 0, 0, "wood");
  plan.add(1, height + 5, 0, "roof");
  plan.add(2, height + 5, 0, "roof");

  if (id === "beaconTower") {
    addCuboid(plan, -1, 1, height + 2, height + 4, -1, 1, "glass");
    addCuboid(plan, 0, 0, height + 5, height + 9, 0, 0, "roof");
    addCuboid(plan, -radius - 2, radius + 2, 0, 0, -radius - 2, radius + 2, "path");
  } else if (id === "ruinedTower") {
    for (let y = Math.max(3, Math.floor(height * 0.42)); y <= height + 1; y += 2) {
      plan.remove(radius, y, 0);
      plan.remove(radius - 1, y, 1);
      plan.remove(0, y, -radius);
      plan.remove(-1, y, -radius);
    }
    addCuboid(plan, radius + 1, radius + 4, 0, 0, 1, 3, "stone");
    addCuboid(plan, -radius - 4, -radius - 1, 0, 0, -3, -1, "stone");
    plan.add(radius + 2, 1, 2, "leaf");
  } else {
    addCuboid(plan, -1, 1, 0, 0, -radius - 5, -radius - 2, "path");
  }
}

function generateCastle(plan, budget, rng, variation) {
  const id = variation.id;
  const width = odd(clamp(Math.round(Math.cbrt(budget) * (id === "courtyardCastle" ? 2.7 : 2.45)), 7, 65));
  const depth = odd(clamp(Math.round(width * (id === "hilltopCastle" ? 0.68 : 0.74 + rng() * 0.14)), 5, 59));
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.68) + (id === "hilltopCastle" ? 1 : 0), 3, 22);
  const towerRadius = clamp(Math.round(width / 8), 1, 7);
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);

  if (id === "hilltopCastle") {
    for (let y = 0; y <= 1; y += 1) {
      addCuboid(plan, -hx - 2 + y, hx + 2 - y, y, y, -hz - 2 + y, hz + 2 - y, y === 1 ? "grass" : "dirt");
    }
  }

  addCuboid(plan, -hx + 1, hx - 1, 0, 0, -hz + 1, hz - 1, "path");

  if (id === "moatCastle") {
    addCuboid(plan, -hx - 4, hx + 4, 0, 0, -hz - 4, -hz - 2, "water");
    addCuboid(plan, -hx - 4, hx + 4, 0, 0, hz + 2, hz + 4, "water");
    addCuboid(plan, -hx - 4, -hx - 2, 0, 0, -hz - 4, hz + 4, "water");
    addCuboid(plan, hx + 2, hx + 4, 0, 0, -hz - 4, hz + 4, "water");
    addCuboid(plan, -1, 1, 0, 0, -hz - 5, -hz - 1, "plank");
  }

  for (let y = 1; y <= wallHeight; y += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      for (let z = -hz; z <= hz; z += 1) {
        const edge = Math.abs(x) === hx || Math.abs(z) === hz;
        const gate = z === -hz && Math.abs(x) <= 1 && y <= 3;
        if (!edge || gate) continue;
        plan.add(x, y, z, "stone");
      }
    }
  }

  for (let x = -hx; x <= hx; x += 2) {
    plan.add(x, wallHeight + 1, -hz, "stone");
    plan.add(x, wallHeight + 1, hz, "stone");
  }
  for (let z = -hz; z <= hz; z += 2) {
    plan.add(-hx, wallHeight + 1, z, "stone");
    plan.add(hx, wallHeight + 1, z, "stone");
  }

  [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz]
  ].forEach(([cx, cz]) => addRoundTower(plan, cx, cz, towerRadius, wallHeight + 3, "stone"));

  const keepWidth = Math.max(5, odd(Math.floor(width * 0.36)));
  const keepDepth = Math.max(5, odd(Math.floor(depth * 0.34)));
  addBoxShell(plan, -Math.floor(keepWidth / 2), Math.floor(keepWidth / 2), 1, wallHeight + 2, -Math.floor(keepDepth / 2), Math.floor(keepDepth / 2), "stone");
  addCuboid(plan, -1, 1, wallHeight + 3, wallHeight + 3, -1, 1, "roof");
  plan.add(0, 1, -hz, "dark");

  if (id === "twinGateCastle") {
    [-3, 3].forEach((cx) => addRoundTower(plan, cx, -hz - 2, Math.max(1, towerRadius), wallHeight + 4, "stone"));
    addCuboid(plan, -3, 3, wallHeight + 2, wallHeight + 3, -hz - 2, -hz - 2, "stone");
  } else if (id === "courtyardCastle") {
    addCuboid(plan, -2, 2, 0, 0, -hz + 2, hz - 2, "path");
    addCuboid(plan, -hx + 3, -hx + 5, 1, 2, 0, 0, "leaf");
    addCuboid(plan, hx - 5, hx - 3, 1, 2, 0, 0, "leaf");
    addCuboid(plan, -2, 2, 0, 0, 1, 3, "water");
  } else if (id === "classicKeep") {
    addCuboid(plan, 0, 0, wallHeight + 4, wallHeight + 7, 0, 0, "wood");
    plan.add(1, wallHeight + 7, 0, "flower");
  }
}

function generateBridge(plan, budget, rng, variation) {
  const id = variation.id;
  const length = odd(clamp(Math.round(Math.sqrt(budget) * (id === "multiArchViaduct" ? 1.62 : 1.42)), 7, 175));
  const width = odd(clamp(Math.round(Math.cbrt(budget) * (id === "canalBridge" ? 1.4 : 1.05)), 3, 35));
  const hx = Math.floor(width / 2);
  const hl = Math.floor(length / 2);
  const deckY = clamp(Math.round(Math.cbrt(budget) * (id === "suspensionSpan" ? 0.55 : 0.45)), 3, 8);

  addCuboid(plan, -hx - 1, hx + 1, 0, 0, -hl, hl, "water");

  for (let z = -hl; z <= hl; z += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      const curve = Math.round(Math.sin(((z + hl) / length) * Math.PI) * 1.5);
      const deckMaterial = id === "archedStone" || id === "multiArchViaduct" ? "stone" : "plank";
      plan.add(x, deckY + curve, z, deckMaterial);
      if (Math.abs(x) === hx && z % 2 === 0) {
        plan.add(x, deckY + curve + 1, z, "wood");
      }
    }
  }

  for (let z = -hl; z <= hl; z += 4) {
    const curve = Math.round(Math.sin(((z + hl) / length) * Math.PI) * 1.5);
    addCuboid(plan, -hx, -hx, 1, deckY + curve, z, z, "wood");
    addCuboid(plan, hx, hx, 1, deckY + curve, z, z, "wood");
  }

  for (let z = -hl + 1; z <= hl - 1; z += 1) {
    const arch = Math.max(0, Math.round(Math.sin(((z + hl) / length) * Math.PI) * deckY));
    plan.add(-hx - 1, arch, z, "stone");
    plan.add(hx + 1, arch, z, "stone");
  }

  if (id === "coveredBridge") {
    for (let z = -hl; z <= hl; z += 1) {
      const curve = Math.round(Math.sin(((z + hl) / length) * Math.PI) * 1.5);
      addCuboid(plan, -hx, -hx, deckY + curve + 2, deckY + curve + 3, z, z, "red");
      addCuboid(plan, hx, hx, deckY + curve + 2, deckY + curve + 3, z, z, "red");
      if (z % 3 === 0) {
        plan.add(-hx, deckY + curve + 3, z, "glass");
        plan.add(hx, deckY + curve + 3, z, "glass");
      }
      addCuboid(plan, -hx - 1, hx + 1, deckY + curve + 4, deckY + curve + 4, z, z, "roof");
    }
  } else if (id === "suspensionSpan") {
    [-Math.floor(hl * 0.45), Math.floor(hl * 0.45)].forEach((z) => {
      addCuboid(plan, -hx - 2, -hx - 2, deckY, deckY + 8, z, z, "stone");
      addCuboid(plan, hx + 2, hx + 2, deckY, deckY + 8, z, z, "stone");
    });
    for (let z = -hl; z <= hl; z += 2) {
      const cable = deckY + 5 + Math.round(Math.sin(((z + hl) / length) * Math.PI) * 3);
      plan.add(-hx - 2, cable, z, "wood");
      plan.add(hx + 2, cable, z, "wood");
    }
  } else if (id === "canalBridge") {
    addCuboid(plan, -hx - 3, -hx - 2, 1, deckY - 1, -hl, hl, "stone");
    addCuboid(plan, hx + 2, hx + 3, 1, deckY - 1, -hl, hl, "stone");
    for (let z = -hl; z <= hl; z += 5) {
      addCuboid(plan, -hx - 4, hx + 4, 0, 0, z, z, "path");
    }
  } else if (id === "multiArchViaduct") {
    for (let z = -hl; z <= hl; z += Math.max(5, Math.floor(length / 7))) {
      addCuboid(plan, -hx - 2, hx + 2, 1, deckY - 1, z, z, "stone");
    }
  }
}

function generateBarn(plan, budget, rng, variation) {
  const id = variation.id;
  const width = odd(clamp(Math.round(Math.cbrt(budget) * (id === "longStable" ? 2.35 : 1.9)), 5, 61));
  const depth = odd(clamp(Math.round(width * (id === "longStable" ? 0.62 : 0.95)), 5, 57));
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.68) + (id === "hayloftBarn" ? 1 : 0), 3, 22);
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);

  addCuboid(plan, -hx, hx, 0, 0, -hz, hz, "hay");

  for (let y = 1; y <= wallHeight; y += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      for (let z = -hz; z <= hz; z += 1) {
        const edge = Math.abs(x) === hx || Math.abs(z) === hz;
        if (!edge) continue;
        const bigDoor = z === -hz && Math.abs(x) <= 1 && y <= 3;
        if (bigDoor) continue;
        const trim = x === 0 || y === wallHeight || (Math.abs(x) === hx && Math.abs(z) === hz);
        plan.add(x, y, z, trim ? "white" : "red");
      }
    }
  }

  addClosedGableRoof(plan, hx, hz, wallHeight, "roof");

  addCuboid(plan, -hx - 2, -hx - 1, 0, 1, hz - 1, hz, "hay");
  addCuboid(plan, hx + 1, hx + 2, 0, 1, hz - 1, hz, "hay");
  plan.add(0, 1, -hz, "dark");

  if (id === "longStable") {
    for (let x = -hx + 3; x <= hx - 3; x += 4) {
      addCuboid(plan, x, x, 1, Math.max(2, wallHeight - 1), -hz, -hz, "white");
      plan.add(x + 1, 1, -hz, "dark");
    }
    addCuboid(plan, -hx, hx, 0, 0, -hz - 4, -hz - 1, "path");
  } else if (id === "siloBarn") {
    addRoundTower(plan, hx + 5, hz - 2, Math.max(2, Math.floor(hx / 5)), wallHeight + 4, "stone");
    addDisc(plan, hx + 5, hz - 2, Math.max(3, Math.floor(hx / 5) + 1), wallHeight + 5, "roof", true);
  } else if (id === "hayloftBarn") {
    addCuboid(plan, -2, 2, wallHeight - 1, wallHeight + 1, -hz, -hz, "dark");
    addCuboid(plan, -hx + 2, hx - 2, Math.max(2, wallHeight - 2), Math.max(2, wallHeight - 2), -hz + 1, hz - 1, "hay");
  } else if (id === "farmyardBarn") {
    addFence(plan, -hx - 7, hx + 7, -hz - 8, -hz - 3, 1, "wood");
    addCuboid(plan, -hx - 5, -hx - 1, 0, 0, -hz - 6, -hz - 4, "hay");
    addCuboid(plan, hx + 1, hx + 5, 0, 0, -hz - 6, -hz - 4, "grass");
  }
}

function generateTreehouse(plan, budget, rng, variation) {
  const id = variation.id;

  if (id === "twinTreeBridge") {
    const trunkHeight = clamp(Math.round(Math.cbrt(budget) * 1.1), 5, 26);
    const platform = odd(clamp(Math.round(Math.cbrt(budget) * 1.3), 5, 31));
    const hp = Math.floor(platform / 2);
    const offset = hp + 5;
    [-offset, offset].forEach((cx) => {
      addCuboid(plan, cx - 1, cx + 1, 0, trunkHeight, -1, 1, "wood");
      addCuboid(plan, cx - hp, cx + hp, trunkHeight, trunkHeight, -hp, hp, "plank");
      addBoxShell(plan, cx - hp + 1, cx + hp - 1, trunkHeight + 1, trunkHeight + 4, -hp + 1, hp - 1, "wood");
      addCuboid(plan, cx - hp, cx + hp, trunkHeight + 5, trunkHeight + 5, -hp, hp, "roof");
      addLeafBlob(plan, cx, trunkHeight + 4, 0, hp);
    });
    addBridgeLine(plan, -offset, 0, offset, 0, trunkHeight + 1, "plank");
    return;
  }

  if (id === "platformVillage") {
    const trunkHeight = clamp(Math.round(Math.cbrt(budget) * 1.2), 5, 28);
    const platformHalf = clamp(Math.round(Math.cbrt(budget) * 0.52), 2, 8);
    const cabinHalf = Math.max(1, platformHalf - 1);
    const offset = platformHalf * 3 + 3;
    const centers = [
      [0, 0, trunkHeight],
      [offset, platformHalf + 2, trunkHeight - 1],
      [-offset, platformHalf + 1, trunkHeight + 1]
    ];
    if (budget > 1400) centers.push([platformHalf + 2, -offset, trunkHeight + 2]);
    if (budget > 2600) centers.push([-platformHalf - 2, -offset - 1, trunkHeight]);
    if (budget > 5200) centers.push([offset + platformHalf + 2, -platformHalf - 1, trunkHeight + 3]);

    addCuboid(plan, -1, 1, 0, trunkHeight + 1, -1, 1, "wood");
    centers.forEach(([cx, cz, y], index) => {
      addCuboid(plan, cx - platformHalf, cx + platformHalf, y, y, cz - platformHalf, cz + platformHalf, "plank");
      addBoxShell(plan, cx - cabinHalf, cx + cabinHalf, y + 1, y + 3, cz - cabinHalf, cz + cabinHalf, index % 2 ? "wood" : "plank");
      addCuboid(plan, cx - platformHalf, cx + platformHalf, y + 4, y + 4, cz - platformHalf, cz + platformHalf, "roof");
      addLeafBlob(plan, cx, y + 3, cz, platformHalf + 1);
    });
    centers.slice(1).forEach(([cx, cz, y]) => addBridgeLine(plan, 0, 0, cx, cz, Math.min(y, trunkHeight + 2), "plank"));
    return;
  }

  const trunkHeight = clamp(Math.round(Math.cbrt(budget) * 1.35), 5, 32);
  const platform = odd(clamp(Math.round(Math.cbrt(budget) * (id === "canopyLodge" ? 1.35 : 1.65)), 5, 49));
  const cabin = Math.max(3, odd(platform - 2));
  const hp = Math.floor(platform / 2);
  const hc = Math.floor(cabin / 2);

  addCuboid(plan, -1, 1, 0, trunkHeight, -1, 1, "wood");
  addCuboid(plan, -hp, hp, trunkHeight, trunkHeight, -hp, hp, "plank");

  for (let y = trunkHeight + 1; y <= trunkHeight + 4; y += 1) {
    for (let x = -hc; x <= hc; x += 1) {
      for (let z = -hc; z <= hc; z += 1) {
        const edge = Math.abs(x) === hc || Math.abs(z) === hc;
        const door = z === -hc && x === 0 && y <= trunkHeight + 2;
        if (!edge || door) continue;
        const window = y === trunkHeight + 2 && Math.abs(x) === hc && z === 0;
        plan.add(x, y, z, window ? "glass" : "wood");
      }
    }
  }

  for (let layer = 0; layer < 2; layer += 1) {
    addCuboid(plan, -hc - 1 + layer, hc + 1 - layer, trunkHeight + 5 + layer, trunkHeight + 5 + layer, -hc - 1, hc + 1, "roof");
  }

  const leafRadius = Math.max(3, hp + 1);
  for (let y = trunkHeight + 2; y <= trunkHeight + 7; y += 1) {
    const radius = leafRadius - Math.max(0, y - (trunkHeight + 4));
    forEachDiscCell(radius, (x, z) => {
      if (Math.abs(x) <= hc && Math.abs(z) <= hc && y <= trunkHeight + 5) return;
      if ((x + z + y) % 3 !== 0) plan.add(x, y, z, "leaf");
    });
  }

  for (let y = 1; y < trunkHeight; y += 1) {
    if (id === "spiralStairTreehouse") {
      const step = y % 4;
      const positions = [
        [2, -2],
        [2, 2],
        [-2, 2],
        [-2, -2]
      ];
      const [x, z] = positions[step];
      plan.add(x, y, z, "plank");
      plan.add(x, y, z === -2 ? z - 1 : z + 1, "wood");
    } else {
      plan.add(2, y, -2, "plank");
    }
  }

  if (id === "canopyLodge") {
    addLeafBlob(plan, 0, trunkHeight + 7, 0, leafRadius);
    addCuboid(plan, -1, 1, trunkHeight + 5, trunkHeight + 5, -1, 1, "leaf");
  } else if (id === "singleTreeCabin") {
    addCuboid(plan, -1, 1, 0, 0, -hp - 5, -hp - 2, "path");
  }
}

function generateMegaCastle(plan, budget, rng, variation) {
  const id = variation.id;
  const width = odd(clamp(Math.round(Math.sqrt(budget) * (id === "castleVillage" ? 0.82 : 0.72)), 19, 81));
  const depth = odd(clamp(Math.round(width * (id === "mountainCitadel" ? 0.7 : 0.78 + rng() * 0.08)), 17, 69));
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.72), 5, 22);
  const towerRadius = clamp(Math.round(width / 12), 2, 7);
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);

  if (id === "mountainCitadel") {
    addCuboid(plan, -hx - 5, -hx - 1, 0, 2, -hz - 4, -hz, "stone");
    addCuboid(plan, hx + 1, hx + 5, 0, 2, -hz - 4, -hz, "stone");
    addCuboid(plan, -hx - 4, -hx, 0, 1, hz, hz + 4, "grass");
    addCuboid(plan, hx, hx + 4, 0, 1, hz, hz + 4, "grass");
  }

  addCuboid(plan, -hx + 2, hx - 2, 0, 0, -hz + 2, hz - 2, "path");

  if (id === "moatFortress") {
    addCuboid(plan, -hx - 3, hx + 3, 0, 0, -hz - 3, -hz - 3, "water");
    addCuboid(plan, -hx - 3, hx + 3, 0, 0, hz + 3, hz + 3, "water");
    addCuboid(plan, -hx - 3, -hx - 3, 0, 0, -hz - 3, hz + 3, "water");
    addCuboid(plan, hx + 3, hx + 3, 0, 0, -hz - 3, hz + 3, "water");
    addCuboid(plan, -2, 2, 0, 0, -hz - 4, -hz - 1, "plank");
  }

  for (let y = 1; y <= wallHeight; y += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      for (let z = -hz; z <= hz; z += 1) {
        const edge = Math.abs(x) === hx || Math.abs(z) === hz;
        const gate = z === -hz && Math.abs(x) <= 2 && y <= 4;
        if (edge && !gate) plan.add(x, y, z, "stone");
      }
    }
  }

  addCrenellations(plan, -hx, hx, -hz, hz, wallHeight + 1, "stone", 2);

  [
    [-hx, -hz],
    [hx, -hz],
    [-hx, hz],
    [hx, hz]
  ].forEach(([cx, cz]) => addRoundTower(plan, cx, cz, towerRadius, wallHeight + 6, "stone"));

  addBoxShell(plan, -5, 5, 1, wallHeight + 1, -hz - 3, -hz + 1, "stone");
  addCuboid(plan, -2, 2, 1, 3, -hz - 3, -hz - 3, "dark");
  addCrenellations(plan, -6, 6, -hz - 4, -hz + 1, wallHeight + 2, "stone", 2);

  const keepHalfX = Math.max(3, Math.floor(width * 0.18));
  const keepHalfZ = Math.max(3, Math.floor(depth * 0.15));
  const keepHeight = wallHeight + clamp(Math.round(Math.cbrt(budget) * 0.42), 4, 12);
  addBoxShell(plan, -keepHalfX, keepHalfX, 1, keepHeight, -keepHalfZ, keepHalfZ, "stone");
  addCrenellations(plan, -keepHalfX, keepHalfX, -keepHalfZ, keepHalfZ, keepHeight + 1, "stone", 2);
  addCuboid(plan, -Math.max(1, keepHalfX - 1), Math.max(1, keepHalfX - 1), keepHeight + 2, keepHeight + 2, -Math.max(1, keepHalfZ - 1), Math.max(1, keepHalfZ - 1), "roof");

  if (id === "spiralKeep") {
    for (let y = 2; y <= keepHeight + 6; y += 1) {
      const angle = y * 0.8;
      const x = Math.round(Math.cos(angle) * (keepHalfX + 2));
      const z = Math.round(Math.sin(angle) * (keepHalfZ + 2));
      plan.add(x, y, z, y % 3 === 0 ? "roof" : "stone");
    }
    addCuboid(plan, 0, 0, keepHeight + 3, keepHeight + 9, 0, 0, "roof");
  } else if (id === "castleVillage") {
    for (let x = -hx + 6; x <= hx - 6; x += 8) {
      const z = hz - 6 - (Math.abs(x) % 3);
      addBoxShell(plan, x - 2, x + 2, 1, 3, z - 2, z + 2, "wood");
      addCuboid(plan, x - 3, x + 3, 4, 4, z - 3, z + 3, "roof");
    }
  } else if (id === "walledCitadel") {
    addCrenellations(plan, -keepHalfX - 5, keepHalfX + 5, -keepHalfZ - 5, keepHalfZ + 5, wallHeight, "stone", 2);
  }

  for (let x = -hx + 4; x <= hx - 4; x += 6) {
    plan.add(x, 2, -hz, "glass");
    plan.add(x, 2, hz, "glass");
  }
  for (let z = -hz + 4; z <= hz - 4; z += 6) {
    plan.add(-hx, 2, z, "glass");
    plan.add(hx, 2, z, "glass");
  }
}

function generateDragonKeep(plan, budget, rng, variation) {
  const id = variation.id;
  const width = odd(clamp(Math.round(Math.sqrt(budget) * (id === "dragonBridgeKeep" ? 0.68 : 0.62)), 27, 83));
  const depth = odd(clamp(Math.round(width * (id === "firelineFortress" ? 0.88 : 0.72 + rng() * 0.08)), 23, 71));
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.68), 6, 21);
  const towerRadius = clamp(Math.round(width / 13), 2, 6);
  const keepHalfX = Math.max(4, Math.floor(width * 0.16));
  const keepHalfZ = Math.max(4, Math.floor(depth * 0.16));
  const keepHeight = wallHeight + clamp(Math.round(Math.cbrt(budget) * 0.46), 5, 14);

  addCuboid(plan, -hx - 2, hx + 2, 0, 0, -hz - 2, -hz - 2, "path");
  addCuboid(plan, -hx - 2, hx + 2, 0, 0, hz + 2, hz + 2, "path");
  addCuboid(plan, -hx - 2, -hx - 2, 0, 0, -hz - 2, hz + 2, "path");
  addCuboid(plan, hx + 2, hx + 2, 0, 0, -hz - 2, hz + 2, "path");
  addCuboid(plan, -hx + 2, hx - 2, 1, 1, -2, 2, "plank");
  addCuboid(plan, -2, 2, 1, 1, -hz + 2, hz - 2, "plank");

  if (id === "dragonBridgeKeep") {
    addCuboid(plan, -4, 4, 0, 0, -hz - 14, -hz - 3, "plank");
    addCuboid(plan, -6, -5, 1, 2, -hz - 13, -hz - 4, "stone");
    addCuboid(plan, 5, 6, 1, 2, -hz - 13, -hz - 4, "stone");
  }

  if (id === "firelineFortress") {
    addCuboid(plan, -hx - 4, hx + 4, 0, 0, -hz - 4, -hz - 3, "water");
    addCuboid(plan, -hx - 4, hx + 4, 0, 0, hz + 3, hz + 4, "water");
  }

  for (let y = 2; y <= wallHeight; y += 1) {
    for (let x = -hx; x <= hx; x += 1) {
      for (let z = -hz; z <= hz; z += 1) {
        const edge = Math.abs(x) === hx || Math.abs(z) === hz;
        const gate = z === -hz && Math.abs(x) <= 2 && y <= 5;
        if (edge && !gate) plan.add(x, y, z, "stone");
      }
    }
  }

  addCrenellations(plan, -hx, hx, -hz, hz, wallHeight + 1, "stone", id === "firelineFortress" ? 1 : 2);

  const towerCenters =
    id === "twinDragonGate"
      ? [
          [-hx, -hz],
          [hx, -hz],
          [-hx, hz],
          [hx, hz],
          [-6, -hz - 2],
          [6, -hz - 2]
        ]
      : [
          [-hx, -hz],
          [hx, -hz],
          [-hx, hz],
          [hx, hz]
        ];

  towerCenters.forEach(([cx, cz], index) => {
    const localRadius = index >= 4 ? Math.max(1, towerRadius - 1) : towerRadius;
    const localHeight = index >= 4 ? wallHeight + 3 : wallHeight + 6 + (index % 2);
    addRoundTower(plan, cx, cz, localRadius, localHeight, "stone");
    addDisc(plan, cx, cz, localRadius + 1, localHeight + 1, index < 2 ? "red" : "roof", true);
  });

  addBoxShell(plan, -5, 5, 2, wallHeight + 3, -hz - 3, -hz + 1, "stone");
  addCuboid(plan, -2, 2, 2, 5, -hz - 3, -hz - 3, "dark");
  addCrenellations(plan, -6, 6, -hz - 4, -hz + 1, wallHeight + 4, "stone", 2);
  addDragonHead(plan, 0, wallHeight + 6, -hz - 5, 1);

  if (id === "courtyardRoost") {
    addCuboid(plan, -keepHalfX - 6, keepHalfX + 6, 2, 2, -keepHalfZ - 6, keepHalfZ + 6, "grass");
    addFence(plan, -keepHalfX - 7, keepHalfX + 7, -keepHalfZ - 7, keepHalfZ + 7, 3, "wood");
  }

  addBoxShell(plan, -keepHalfX, keepHalfX, 2, keepHeight, -keepHalfZ, keepHalfZ, "stone");
  addCrenellations(plan, -keepHalfX, keepHalfX, -keepHalfZ, keepHalfZ, keepHeight + 1, "stone", 2);
  addLayeredFlatRoof(plan, -keepHalfX - 1, keepHalfX + 1, keepHeight + 2, -keepHalfZ - 1, keepHalfZ + 1, 3);

  if (id === "emberKeep") {
    addCuboid(plan, -2, 2, keepHeight + 5, keepHeight + 5, -2, 2, "red");
    addCuboid(plan, 0, 0, keepHeight + 6, keepHeight + 10, 0, 0, "roof");
  } else if (id === "twinDragonGate") {
    addDragonHead(plan, -6, wallHeight + 8, -hz - 5, -1);
    addDragonHead(plan, 6, wallHeight + 8, -hz - 5, 1);
  } else if (id === "dragonBridgeKeep") {
    addBridgeLine(plan, 0, -hz - 14, 0, -hz, 1, "plank");
    addDragonSpine(plan, 0, 2, -hz - 12, 0, -hz - 4, "red");
  }

  const spineZ = id === "firelineFortress" ? 0 : hz - 5;
  addDragonSpine(plan, -Math.max(5, keepHalfX + 2), wallHeight + 2, spineZ, Math.max(5, keepHalfX + 2), spineZ, "roof");

  for (let x = -hx + 4; x <= hx - 4; x += 6) {
    plan.add(x, 4, -hz, "glass");
    plan.add(x, 4, hz, "glass");
  }
  for (let z = -hz + 4; z <= hz - 4; z += 6) {
    plan.add(-hx, 4, z, "glass");
    plan.add(hx, 4, z, "glass");
  }

  for (let x = -hx + 5; x <= hx - 5; x += 10) {
    plan.add(x, wallHeight + 2, -hz, "red");
    plan.add(x, wallHeight + 3, -hz, "hay");
  }
}

function generateGrandPalace(plan, budget, rng, variation) {
  const id = variation.id;
  const width = odd(clamp(Math.round(Math.sqrt(budget) * (id === "terracedPalace" ? 0.66 : 0.72)), 31, 95));
  const depth = odd(clamp(Math.round(width * (id === "canalPalace" ? 0.68 : 0.56)), 21, 59));
  const wallHeight = clamp(Math.round(Math.cbrt(budget) * 0.58), 6, 20);
  const hx = Math.floor(width / 2);
  const hz = Math.floor(depth / 2);
  const wingHalfX = Math.max(7, Math.floor(width * 0.18));
  const centerHalfX = Math.max(5, Math.floor(width * 0.13));
  const wingHalfZ = Math.max(6, Math.floor(depth * 0.3));

  addCuboid(plan, -hx, hx, 0, 0, -hz, hz, "path");

  if (id === "canalPalace") {
    addCuboid(plan, -hx - 4, -hx - 2, 0, 0, -hz, hz + 5, "water");
    addCuboid(plan, hx + 2, hx + 4, 0, 0, -hz, hz + 5, "water");
    addCuboid(plan, -hx + 2, hx - 2, 0, 0, hz + 3, hz + 5, "water");
  }

  addCuboid(plan, -centerHalfX, centerHalfX, 1, 1, -hz + 3, hz - 2, "plank");
  addBoxShell(plan, -centerHalfX, centerHalfX, 2, wallHeight + 2, -hz + 3, hz - 2, "white");

  [-1, 1].forEach((side) => {
    const cx0 = side < 0 ? -hx + 3 : hx - wingHalfX * 2 - 3;
    const cx1 = side < 0 ? -hx + wingHalfX * 2 + 3 : hx - 3;
    addCuboid(plan, cx0, cx1, 1, 1, -wingHalfZ, wingHalfZ, "plank");
    addBoxShell(plan, cx0, cx1, 2, wallHeight, -wingHalfZ, wingHalfZ, "white");
    addLayeredFlatRoof(plan, cx0 - 1, cx1 + 1, wallHeight + 1, -wingHalfZ - 1, wingHalfZ + 1, 3);
  });

  addLayeredFlatRoof(plan, -centerHalfX - 2, centerHalfX + 2, wallHeight + 3, -hz + 1, hz, 4);

  for (let x = -hx + 5; x <= hx - 5; x += 4) {
    addCuboid(plan, x, x, 1, wallHeight + 1, -hz - 1, -hz - 1, "white");
    if (Math.abs(x) > centerHalfX + 2) plan.add(x, wallHeight + 2, -hz - 1, "roof");
  }

  for (let z = -hz + 6; z <= hz - 6; z += 5) {
    plan.add(-centerHalfX, 4, z, "glass");
    plan.add(centerHalfX, 4, z, "glass");
  }

  addCuboid(plan, -3, 3, 2, 2, -hz - 2, -hz - 2, "dark");
  addCuboid(plan, -2, 2, 3, 5, -hz - 2, -hz - 2, "glass");
  addCuboid(plan, -hx + 5, hx - 5, 1, 1, hz + 2, hz + 2, "water");
  for (let x = -hx + 7; x <= hx - 7; x += 8) {
    plan.add(x, 1, hz + 3, "flower");
    plan.add(x + 1, 1, hz + 3, "leaf");
  }

  if (id === "courtyardPalace") {
    addCuboid(plan, -centerHalfX - 4, centerHalfX + 4, 1, 1, -4, 4, "path");
    addCuboid(plan, -3, 3, 1, 1, -2, 2, "water");
    addFence(plan, -centerHalfX - 5, centerHalfX + 5, -6, 6, 2, "white");
  } else if (id === "gardenPalace") {
    for (let x = -hx + 8; x <= hx - 8; x += 8) {
      addCuboid(plan, x - 1, x + 1, 1, 2, hz + 4, hz + 6, "leaf");
      plan.add(x, 1, hz + 7, "flower");
    }
    addCuboid(plan, -hx + 3, hx - 3, 1, 1, hz + 8, hz + 8, "path");
  } else if (id === "terracedPalace") {
    for (let y = 1; y <= 4; y += 1) {
      addCuboid(plan, -hx + y * 3, hx - y * 3, y, y, hz + 1 + y * 2, hz + 2 + y * 2, y % 2 ? "path" : "grass");
    }
  }
}

function generateMountainTemple(plan, budget, rng, variation) {
  const id = variation.id;
  const baseHalf = clamp(Math.round(Math.sqrt(budget) * (id === "cliffTemple" ? 0.34 : 0.4)), 18, 48);
  const layers = clamp(Math.round(Math.cbrt(budget) * (id === "summitMonastery" ? 0.62 : 0.52)), 7, 16);
  const shrinkEvery = id === "cliffTemple" ? 1 : 2;

  for (let y = 0; y < layers; y += 1) {
    const inset = Math.floor(y * shrinkEvery);
    const hx = Math.max(5, baseHalf - inset);
    const zScale = id === "cliffTemple" ? 0.62 : 0.78;
    const hz = Math.max(5, Math.round(baseHalf * zScale) - inset);
    const material = y < 2 ? "dirt" : y % 3 === 0 ? "grass" : "stone";
    addCuboid(plan, -hx, hx, y, y, -hz, hz, material);
  }

  const topY = layers;
  const platformHalfX = Math.max(8, baseHalf - layers * shrinkEvery - 1);
  const platformHalfZ = Math.max(7, Math.round(baseHalf * 0.78) - layers * shrinkEvery - 1);
  addCuboid(plan, -platformHalfX, platformHalfX, topY, topY, -platformHalfZ, platformHalfZ, "path");

  for (let step = 0; step <= topY; step += 1) {
    const z = -Math.round(baseHalf * 0.78) - 1 + step * 2;
    addCuboid(plan, -2, 2, step, step, z, z + 1, "plank");
  }

  const templeHalfX = Math.max(5, Math.floor(platformHalfX * 0.62));
  const templeHalfZ = Math.max(4, Math.floor(platformHalfZ * 0.62));
  const templeHeight = topY + clamp(Math.round(Math.cbrt(budget) * 0.48), 5, 14);
  addCuboid(plan, -templeHalfX, templeHalfX, topY + 1, topY + 1, -templeHalfZ, templeHalfZ, "plank");

  for (let x = -templeHalfX; x <= templeHalfX; x += Math.max(3, Math.floor(templeHalfX / 3))) {
    addCuboid(plan, x, x, topY + 2, templeHeight, -templeHalfZ, -templeHalfZ, "white");
    addCuboid(plan, x, x, topY + 2, templeHeight, templeHalfZ, templeHalfZ, "white");
  }
  for (let z = -templeHalfZ; z <= templeHalfZ; z += Math.max(3, Math.floor(templeHalfZ / 2))) {
    addCuboid(plan, -templeHalfX, -templeHalfX, topY + 2, templeHeight, z, z, "white");
    addCuboid(plan, templeHalfX, templeHalfX, topY + 2, templeHeight, z, z, "white");
  }

  addBoxShell(plan, -Math.max(2, templeHalfX - 3), Math.max(2, templeHalfX - 3), topY + 2, templeHeight - 1, -Math.max(2, templeHalfZ - 2), Math.max(2, templeHalfZ - 2), "stone");
  addLayeredFlatRoof(plan, -templeHalfX - 2, templeHalfX + 2, templeHeight + 1, -templeHalfZ - 2, templeHalfZ + 2, 4);
  plan.add(0, templeHeight + 5, 0, "roof");
  plan.add(1, templeHeight + 5, 0, "roof");
  plan.add(-1, templeHeight + 5, 0, "roof");

  if (id === "twinStairTemple") {
    for (let step = 0; step <= topY; step += 1) {
      const z = Math.round(baseHalf * 0.78) + 1 - step * 2;
      addCuboid(plan, -2, 2, step, step, z - 1, z, "plank");
    }
  } else if (id === "waterfallTemple") {
    addCuboid(plan, templeHalfX + 3, templeHalfX + 5, topY + 1, templeHeight + 1, -1, 1, "water");
    addCuboid(plan, templeHalfX + 5, templeHalfX + 8, 0, topY, -1, 1, "water");
  } else if (id === "summitMonastery") {
    [-templeHalfX - 7, templeHalfX + 7].forEach((cx) => {
      addBoxShell(plan, cx - 3, cx + 3, topY + 1, topY + 5, -3, 3, "white");
      addLayeredFlatRoof(plan, cx - 4, cx + 4, topY + 6, -4, 4, 3);
    });
  } else if (id === "cliffTemple") {
    addCuboid(plan, -baseHalf - 5, -baseHalf - 1, 0, layers + 2, -platformHalfZ, platformHalfZ, "stone");
    addBridgeLine(plan, -baseHalf - 4, 0, -templeHalfX, 0, topY + 1, "plank");
  }
}

function addCrenellations(plan, x0, x1, z0, z1, y, material, spacing = 2) {
  for (let x = x0; x <= x1; x += spacing) {
    plan.add(x, y, z0, material);
    plan.add(x, y, z1, material);
  }
  for (let z = z0; z <= z1; z += spacing) {
    plan.add(x0, y, z, material);
    plan.add(x1, y, z, material);
  }
}

function addDragonHead(plan, cx, cy, cz, facing = 1) {
  addCuboid(plan, cx - 1, cx + 1, cy, cy + 1, cz, cz + facing, "red");
  plan.add(cx - 1, cy + 2, cz, "roof");
  plan.add(cx + 1, cy + 2, cz, "roof");
  plan.add(cx, cy + 1, cz + facing * 2, "red");
  plan.add(cx - 1, cy + 1, cz + facing * 2, "hay");
  plan.add(cx + 1, cy + 1, cz + facing * 2, "hay");
  plan.add(cx - 1, cy + 1, cz + facing, "glass");
  plan.add(cx + 1, cy + 1, cz + facing, "glass");
}

function addDragonSpine(plan, x0, y, z0, x1, z1, material) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0), 1);

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const z = Math.round(z0 + (z1 - z0) * t);
    plan.add(x, y, z, material);
    if (step % 2 === 0) plan.add(x, y + 1, z, "roof");
  }
}

function addBridgeLine(plan, x0, z0, x1, z1, y, material) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
  for (let step = 0; step <= steps; step += 1) {
    const t = steps === 0 ? 0 : step / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const z = Math.round(z0 + (z1 - z0) * t);
    plan.add(x, y, z, material);
    plan.add(x + 1, y, z, material);
    plan.add(x - 1, y, z, material);
  }
}

function addFence(plan, x0, x1, z0, z1, y, material) {
  for (let x = x0; x <= x1; x += 2) {
    plan.add(x, y, z0, material);
    plan.add(x, y, z1, material);
  }
  for (let z = z0; z <= z1; z += 2) {
    plan.add(x0, y, z, material);
    plan.add(x1, y, z, material);
  }
}

function addLeafBlob(plan, cx, cy, cz, radius) {
  for (let y = -2; y <= 2; y += 1) {
    const layerRadius = Math.max(1, radius - Math.abs(y));
    forEachDiscCell(layerRadius, (x, z) => {
      if ((x + z + y) % 5 !== 0) plan.add(cx + x, cy + y, cz + z, "leaf");
    });
  }
}

function addLayeredFlatRoof(plan, x0, x1, y, z0, z1, layers) {
  for (let layer = 0; layer < layers; layer += 1) {
    addCuboid(plan, x0 + layer, x1 - layer, y + layer, y + layer, z0 + layer, z1 - layer, "roof");
  }
}

function addRoundTower(plan, cx, cz, radius, height, material) {
  addDisc(plan, cx, cz, radius, 0, material, true);
  for (let y = 1; y <= height; y += 1) {
    forEachDiscCell(radius, (x, z, edge) => {
      if (edge) plan.add(cx + x, y, cz + z, material);
    });
  }
  forEachDiscCell(radius + 1, (x, z, edge) => {
    if (edge && Math.abs(x + z) % 2 === 0) plan.add(cx + x, height + 1, cz + z, material);
  });
}

function addBoxShell(plan, x0, x1, y0, y1, z0, z1, material) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      for (let z = z0; z <= z1; z += 1) {
        if (x === x0 || x === x1 || z === z0 || z === z1 || y === y0 || y === y1) {
          plan.add(x, y, z, material);
        }
      }
    }
  }
}

function addClosedGableRoof(plan, hx, hz, wallHeight, material) {
  const eaveX = hx + 1;
  const z0 = -hz - 1;
  const z1 = hz + 1;

  for (let layer = 0; layer <= eaveX; layer += 1) {
    const xEdge = eaveX - layer;
    const y = wallHeight + 1 + layer;

    for (let z = z0; z <= z1; z += 1) {
      addRoofPlaneStrip(plan, -xEdge, y, z, material, 1);
      addRoofPlaneStrip(plan, xEdge, y, z, material, -1);
    }
  }

  [z0, z1].forEach((z) => {
    for (let layer = 0; layer <= eaveX; layer += 1) {
      const xEdge = eaveX - layer;
      const y = wallHeight + 1 + layer;
      for (let x = -xEdge; x <= xEdge; x += 1) {
        plan.add(x, y, z, material);
      }
    }
  });
}

function addRoofPlaneStrip(plan, x, y, z, material, inwardStep) {
  plan.add(x, y, z, material);

  if (x !== 0) {
    plan.add(x + inwardStep, y, z, material);
  }
}

function addCuboid(plan, x0, x1, y0, y1, z0, z1, material) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      for (let z = z0; z <= z1; z += 1) {
        plan.add(x, y, z, material);
      }
    }
  }
}

function addDisc(plan, cx, cz, radius, y, material, filled = false) {
  forEachDiscCell(radius, (x, z, edge) => {
    if (filled || edge) plan.add(cx + x, y, cz + z, material);
  });
}

function forEachDiscCell(radius, callback) {
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const distance = Math.sqrt(x * x + z * z);
      if (distance <= radius + 0.35) {
        callback(x, z, distance >= radius - 0.95);
      }
    }
  }
}

function createRng(seed) {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function odd(value) {
  const rounded = Math.max(1, Math.round(value));
  return rounded % 2 === 0 ? rounded + 1 : rounded;
}
