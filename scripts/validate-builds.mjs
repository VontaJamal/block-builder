import {
  BLOCK_COUNT_LIMITS,
  BUILDING_MINIMUMS,
  BUILDING_TYPES,
  BUILDING_VARIATIONS,
  generateBuild,
  getBuildingMinimum,
  getBuildingVariations
} from "../src/builders.js";

const requiredMinimums = {
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
const megaShapeMinimums = {
  megaCastle: { width: 25, depth: 21, height: 11 },
  dragonKeep: { width: 29, depth: 23, height: 14 },
  grandPalace: { width: 31, depth: 19, height: 10 },
  mountainTemple: { width: 35, depth: 27, height: 14 }
};
const validMaterials = new Set(["grass", "dirt", "stone", "wood", "plank", "roof", "glass", "leaf", "water", "red", "white", "hay", "path", "dark", "flower"]);
let failures = 0;

if (BLOCK_COUNT_LIMITS.max !== 10000) {
  console.error(`Expected max block limit to be 10000, received ${BLOCK_COUNT_LIMITS.max}`);
  failures += 1;
}

if (BUILDING_MINIMUMS.skyFortress || BUILDING_VARIATIONS.skyFortress || BUILDING_TYPES.some((type) => type.id === "skyFortress")) {
  console.error("Sky Fortress should be replaced by Dragon Keep, not kept as an available preset");
  failures += 1;
}

for (const { id } of BUILDING_TYPES) {
  const presetMinimum = requiredMinimums[id];
  const variations = getBuildingVariations(id);
  const targets = [...new Set([25, presetMinimum, id === "house" ? 350 : null, 3000, 5000, BLOCK_COUNT_LIMITS.max].filter(Boolean))];
  const signatures = new Map();

  if (!presetMinimum || BUILDING_MINIMUMS[id] !== presetMinimum || getBuildingMinimum(id) !== presetMinimum) {
    console.error(`Missing required minimum for ${id}`);
    failures += 1;
    continue;
  }

  if (BUILDING_VARIATIONS[id]?.length !== 5 || variations.length !== 5) {
    console.error(`Expected exactly five variations for ${id}`);
    failures += 1;
    continue;
  }

  for (const variation of variations) {
    for (const targetBlocks of targets) {
      const blocks = generateBuild({ type: id, targetBlocks, seed: 12345, variation: variation.id });
      const keys = new Set(blocks.map((block) => `${block.x},${block.y},${block.z}`));
      const invalid = blocks.find(
        (block) =>
          !Number.isFinite(block.x) ||
          !Number.isFinite(block.y) ||
          !Number.isFinite(block.z) ||
          typeof block.material !== "string" ||
          !validMaterials.has(block.material)
      );

      const effectiveTarget = Math.max(targetBlocks, presetMinimum);
      const [minimum, maximum] = allowedRange(effectiveTarget);
      const missingAutoRaise = targetBlocks < presetMinimum && blocks.length < presetMinimum;

      if (
        blocks.length === 0 ||
        invalid ||
        keys.size !== blocks.length ||
        blocks.length > BLOCK_COUNT_LIMITS.max ||
        missingAutoRaise ||
        blocks.length < minimum ||
        blocks.length > maximum
      ) {
        console.error(`Invalid build for ${id}/${variation.id} at ${targetBlocks}: ${blocks.length} blocks`);
        console.error(`Expected ${minimum}-${maximum} blocks, preset minimum ${presetMinimum}`);
        failures += 1;
      } else {
        console.log(`${id.padEnd(14)} ${variation.id.padEnd(22)} target ${String(targetBlocks).padStart(5)} -> ${blocks.length} blocks`);
      }

      if (targetBlocks === presetMinimum || targetBlocks === 3000 || targetBlocks === 5000) {
        const key = targetBlocks === presetMinimum ? "minimum" : targetBlocks === 3000 ? "medium" : "large";
        const set = signatures.get(key) ?? new Set();
        set.add(buildSignature(blocks));
        signatures.set(key, set);
      }

      if (id === "house" && targetBlocks === 350 && !hasClosedGableRoof(blocks)) {
        console.error(`House variation ${variation.id} at 350 should auto-raise and include a closed roof with center coverage`);
        failures += 1;
      }

      if (id === "dragonKeep" && Math.min(...blocks.map((block) => block.y)) < 0) {
        console.error(`Dragon Keep variation ${variation.id} at ${targetBlocks} should be grounded at y >= 0`);
        failures += 1;
      }

      if (targetBlocks === presetMinimum && megaShapeMinimums[id] && !hasExpectedMegaShape(blocks, megaShapeMinimums[id])) {
        console.error(`Mega silhouette for ${id}/${variation.id} at minimum is too small`);
        failures += 1;
      }
    }

    const resolved = generateBuild({ type: id, targetBlocks: presetMinimum, seed: 98765, variation: variation.id });
    if (!resolved.length) {
      console.error(`Variation ${id}/${variation.id} could not be generated directly`);
      failures += 1;
    }
  }

  for (const [sizeName, set] of signatures) {
    if (set.size < 4) {
      console.error(`Expected at least four distinct ${sizeName} signatures for ${id}, received ${set.size}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

function allowedRange(effectiveTarget) {
  if (effectiveTarget <= 150) return [Math.floor(effectiveTarget * 0.65), Math.ceil(effectiveTarget * 2.4)];
  if (effectiveTarget <= 650) return [Math.floor(effectiveTarget * 0.75), Math.ceil(effectiveTarget * 1.9)];
  if (effectiveTarget <= 1500) return [Math.floor(effectiveTarget * 0.75), Math.ceil(effectiveTarget * 2.1)];
  if (effectiveTarget <= 5000) return [Math.floor(effectiveTarget * 0.72), Math.ceil(effectiveTarget * 1.8)];
  return [Math.floor(effectiveTarget * 0.75), BLOCK_COUNT_LIMITS.max];
}

function hasClosedGableRoof(blocks) {
  const allRoofBlocks = blocks.filter((block) => block.material === "roof");
  if (!allRoofBlocks.length) return false;

  const minRoofY = Math.min(...allRoofBlocks.map((block) => block.y));
  const roofBlocks = allRoofBlocks.filter((block) => block.y > minRoofY);
  if (!roofBlocks.length) return false;

  const zValues = roofBlocks.map((block) => block.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const zSpan = maxZ - minZ + 1;
  const centerCoverage = new Set(
    roofBlocks.filter((block) => Math.abs(block.x) <= 1).map((block) => block.z)
  );
  const frontCap = roofBlocks.filter((block) => block.z === minZ);
  const backCap = roofBlocks.filter((block) => block.z === maxZ);
  const capHasTriangularFill = (capBlocks) =>
    capBlocks.some((block) => block.x === 0) && new Set(capBlocks.map((block) => block.y)).size >= 3;

  return (
    zSpan >= 5 &&
    centerCoverage.size >= Math.max(5, zSpan - 1) &&
    capHasTriangularFill(frontCap) &&
    capHasTriangularFill(backCap)
  );
}

function hasExpectedMegaShape(blocks, expected) {
  const box = measureBuild(blocks);

  return box.width >= expected.width && box.depth >= expected.depth && box.height >= expected.height;
}

function buildSignature(blocks) {
  const box = measureBuild(blocks);
  const materialCounts = blocks.reduce((counts, block) => {
    counts[block.material] = (counts[block.material] ?? 0) + 1;
    return counts;
  }, {});
  const materialSummary = ["stone", "wood", "plank", "roof", "glass", "water", "leaf", "red", "white", "hay", "path"].map(
    (material) => Math.round((materialCounts[material] ?? 0) / 20)
  );
  const elevatedBlocks = blocks.filter((block) => block.y > box.height * 0.55).length;

  return [
    box.width,
    box.height,
    box.depth,
    Math.round(blocks.length / 20),
    Math.round(elevatedBlocks / 20),
    materialSummary.join(":")
  ].join("|");
}

function measureBuild(blocks) {
  const xs = blocks.map((block) => block.x);
  const ys = blocks.map((block) => block.y);
  const zs = blocks.map((block) => block.z);

  return {
    width: Math.max(...xs) - Math.min(...xs) + 1,
    height: Math.max(...ys) - Math.min(...ys) + 1,
    depth: Math.max(...zs) - Math.min(...zs) + 1
  };
}
