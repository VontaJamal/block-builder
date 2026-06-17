import "./styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createIcons, Hammer, Pause, Play, RotateCcw, Shuffle, SlidersHorizontal, Volume2, VolumeX } from "lucide";
import {
  BLOCK_COUNT_LIMITS,
  BUILDING_TYPES,
  generateBuild,
  getBuildingMinimum,
  normalizeBuildTarget,
  resolveBuildVariation
} from "./builders.js";

const canvas = document.querySelector("#scene");
const appShell = document.querySelector(".app-shell");
const stage = document.querySelector(".stage");
const buildingType = document.querySelector("#buildingType");
const blockCount = document.querySelector("#blockCount");
const speedSlider = document.querySelector("#speedSlider");
const speedValue = document.querySelector("#speedValue");
const builderForm = document.querySelector("#builderForm");
const buildButton = document.querySelector("#buildButton");
const pauseButton = document.querySelector("#pauseButton");
const resetButton = document.querySelector("#resetButton");
const randomizeButton = document.querySelector("#randomizeButton");
const workbenchPanel = document.querySelector(".workbench");
const watchToggle = document.querySelector("#watchToggle");
const soundToggle = document.querySelector("#soundToggle");
const statusPill = document.querySelector("#statusPill");
const currentLabel = document.querySelector("#currentLabel");
const blockProgress = document.querySelector("#blockProgress");
const buildPercent = document.querySelector("#buildPercent");
const progressFill = document.querySelector("#progressFill");
const presetStat = document.querySelector("#presetStat");
const plannedStat = document.querySelector("#plannedStat");
const placedStat = document.querySelector("#placedStat");
const stateStat = document.querySelector("#stateStat");
const diagnosticsNode = document.createElement("script");
diagnosticsNode.type = "application/json";
diagnosticsNode.id = "builderDiagnostics";
diagnosticsNode.hidden = true;
document.body.append(diagnosticsNode);

const iconSet = { Hammer, Pause, Play, RotateCcw, Shuffle, SlidersHorizontal, Volume2, VolumeX };
populateBuildingOptions();
createIcons({ icons: iconSet });

const DEFAULT_BLOCKS = BLOCK_COUNT_LIMITS.default;
const MAX_CATCH_UP_SECONDS = 1.25;
const MAX_BLOCKS_PER_FRAME = 160;
const POP_DURATION = 260;
const POP_START_SCALE = 0.22;
const CINEMATIC_MANUAL_HOLD = 4200;
const CINEMATIC_COMPLETE_SWEEP = 6200;
const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
const AMBIENT_VOLUME = 0.14;
const AMBIENT_DUCKED_VOLUME = 0.05;
const AMBIENT_FADE_SECONDS = 0.9;
const LOFI_BPM = 78;
const LOFI_STEP_SECONDS = 60 / LOFI_BPM / 2;
const LOFI_SWING = 0.11;
const AMBIENT_CHORD_SECONDS = LOFI_STEP_SECONDS * 16;
const AMBIENT_RELEASE_SECONDS = AMBIENT_CHORD_SECONDS + 1.2;
const AMBIENT_CHORDS = [
  [196, 261.63, 329.63, 392, 493.88],
  [220, 277.18, 329.63, 440, 554.37],
  [174.61, 261.63, 349.23, 440, 523.25],
  [196, 246.94, 293.66, 392, 493.88]
];

const state = {
  queue: [],
  instanceGroups: new Map(),
  activeInstances: [],
  seed: Math.floor(Math.random() * 900000) + 1000,
  speed: Number(speedSlider.value),
  placed: 0,
  running: false,
  paused: false,
  accumulator: 0,
  currentVariation: null,
  cinematic: {
    active: false,
    mode: "idle",
    center: new THREE.Vector3(),
    size: new THREE.Vector3(),
    minY: 0,
    radius: 10,
    angle: 0,
    startedAt: 0,
    completedAt: 0,
    manualUntil: 0
  },
  audio: {
    context: null,
    master: null,
    filter: null,
    delay: null,
    feedback: null,
    wet: null,
    chordTimer: null,
    beatTimer: null,
    chordIndex: 0,
    beatStep: 0,
    noiseBuffer: null,
    playing: false,
    muted: false,
    supported: Boolean(AudioContextCtor),
    activeNodes: new Set()
  }
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed8f6);
scene.fog = new THREE.Fog(0x9ed8f6, 90, 300);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 600);
camera.position.set(18, 16, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.autoRotateSpeed = 0.28;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 8;
controls.maxDistance = 220;
controls.target.set(0, 4, 0);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x52764b, 2.1);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffffff, 2.35);
sun.position.set(-18, 28, 16);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -120;
sun.shadow.camera.right = 120;
sun.shadow.camera.top = 120;
sun.shadow.camera.bottom = -120;
scene.add(sun);

const stageGroup = new THREE.Group();
scene.add(stageGroup);

const ground = createGround();
scene.add(ground);

const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
const blockMaterials = createMaterials();
const blockTransform = new THREE.Object3D();
const cinematicCameraTarget = new THREE.Vector3();
const cinematicLookTarget = new THREE.Vector3();
const cinematicSunTarget = new THREE.Vector3();
normalizeBlockCount();
const ghostBuild = generateBuild({ type: "house", targetBlocks: DEFAULT_BLOCKS, seed: state.seed });

frameBuild(ghostBuild, false);
updateMeta("Ready");
updateSoundButton();

[buildButton, randomizeButton, soundToggle].filter(Boolean).forEach((button) => {
  button.addEventListener("pointerdown", primeAudioForGesture, { passive: true });
});

builderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startBuild(false);
});

pauseButton.addEventListener("click", () => {
  if (!state.queue.length || state.placed >= state.queue.length) return;
  state.paused = !state.paused;
  state.running = !state.paused;
  if (state.paused) {
    setAmbientVolume(AMBIENT_DUCKED_VOLUME, 0.6);
  } else {
    startAmbientMusic();
  }
  setPauseButton();
  updateMeta(state.paused ? "Paused" : "Building");
  anchorMobileTray();
});

resetButton.addEventListener("click", () => {
  setWatchMode(false);
  clearBuild();
  stopAmbientMusic();
  state.queue = [];
  state.running = false;
  state.paused = false;
  updateMeta("Ready");
  setPauseButton();
  frameBuild(getPreviewBuild(), true);
  anchorMobileTray();
});

randomizeButton.addEventListener("click", () => {
  state.seed = Math.floor(Math.random() * 900000) + 1000;
  startBuild(true);
});

watchToggle.addEventListener("click", () => {
  const isWatching = appShell.classList.contains("watch-mode");
  if (isWatching) {
    setWatchMode(false);
  } else if (state.queue.length || state.cinematic.active) {
    setWatchMode(true);
  }
});

soundToggle.addEventListener("click", () => {
  if (!state.audio.supported) return;

  state.audio.muted = !state.audio.muted;

  if (state.audio.muted) {
    stopAmbientMusic(0.65);
  } else if (state.queue.length || state.cinematic.active) {
    startAmbientMusic();
  } else {
    updateSoundButton();
    publishDiagnostics();
  }
});

buildingType.addEventListener("change", () => {
  syncBlockCountLimits();
  if (!state.running && !state.paused) normalizeBlockCount();
  updateMeta(state.running ? "Building" : state.paused ? "Paused" : "Ready");
});

blockCount.addEventListener("change", () => {
  normalizeBlockCount();
  updateMeta(state.running ? "Building" : state.paused ? "Paused" : "Ready");
});

speedSlider.addEventListener("input", () => {
  state.speed = Number(speedSlider.value);
  speedValue.textContent = state.speed;
});

["pointerdown", "wheel"].forEach((eventName) => {
  renderer.domElement.addEventListener(
    eventName,
    () => {
      if (state.cinematic.active) {
        state.cinematic.manualUntil = performance.now() + CINEMATIC_MANUAL_HOLD;
      }
    },
    { passive: true }
  );
});

window.addEventListener("resize", resizeRenderer);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appShell.classList.contains("watch-mode")) {
    setWatchMode(false);
  }
});

let lastFrameTime = 0;
let lastBuildTickTime = performance.now();
let lastDiagnosticsAt = 0;
renderer.setAnimationLoop(() => {
  const now = performance.now();
  const delta = lastFrameTime ? Math.min(Math.max((now - lastFrameTime) / 1000, 0), 0.08) : 0;
  lastFrameTime = now;
  const cinematicMoved = updateCinematicCamera(now, delta);
  controls.autoRotate = !cinematicMoved && state.running && !state.paused;
  controls.update();
  updateBlockPop(now);

  renderer.render(scene, camera);

  if (now - lastDiagnosticsAt > 250) {
    lastDiagnosticsAt = now;
    publishDiagnostics();
  }
});

window.setInterval(() => {
  const now = performance.now();
  const delta = Math.min(Math.max((now - lastBuildTickTime) / 1000, 0), MAX_CATCH_UP_SECONDS);
  lastBuildTickTime = now;
  advanceBuild(delta, now);
}, 100);

function ensureAudioGraph() {
  const audio = state.audio;
  if (!audio.supported) return false;
  if (audio.context) return true;

  const context = new AudioContextCtor();
  const master = context.createGain();
  const filter = context.createBiquadFilter();
  const delay = context.createDelay(2);
  const feedback = context.createGain();
  const wet = context.createGain();

  master.gain.value = 0.0001;
  filter.type = "lowpass";
  filter.frequency.value = 1850;
  filter.Q.value = 0.28;
  delay.delayTime.value = 0.34;
  feedback.gain.value = 0.16;
  wet.gain.value = 0.1;

  filter.connect(master);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(wet);
  wet.connect(master);
  master.connect(context.destination);

  audio.context = context;
  audio.master = master;
  audio.filter = filter;
  audio.delay = delay;
  audio.feedback = feedback;
  audio.wet = wet;
  audio.noiseBuffer = createNoiseBuffer(context);

  return true;
}

function primeAudioForGesture() {
  if (state.audio.muted || !ensureAudioGraph() || state.audio.context.state !== "suspended") return;
  state.audio.context.resume().catch(() => {});
}

function startAmbientMusic() {
  const audio = state.audio;
  if (audio.muted || !ensureAudioGraph()) {
    updateSoundButton();
    publishDiagnostics();
    return;
  }

  if (audio.context.state === "suspended") {
    audio.context
      .resume()
      .then(() => publishDiagnostics())
      .catch(() => publishDiagnostics());
  }

  audio.playing = true;
  setAmbientVolume(state.paused ? AMBIENT_DUCKED_VOLUME : AMBIENT_VOLUME, 0.85);

  if (audio.chordTimer === null) {
    scheduleAmbientChord(audio.activeNodes.size === 0);
  }

  if (audio.beatTimer === null) {
    scheduleLofiBeat(true);
  }

  updateSoundButton();
  publishDiagnostics();
}

function stopAmbientMusic(fadeSeconds = AMBIENT_FADE_SECONDS) {
  const audio = state.audio;
  audio.playing = false;

  if (audio.chordTimer !== null) {
    window.clearTimeout(audio.chordTimer);
    audio.chordTimer = null;
  }

  if (audio.beatTimer !== null) {
    window.clearTimeout(audio.beatTimer);
    audio.beatTimer = null;
  }

  if (!audio.context || !audio.master) {
    updateSoundButton();
    publishDiagnostics();
    return;
  }

  const now = audio.context.currentTime;
  const fadeTime = Math.max(0.05, fadeSeconds);
  audio.master.gain.cancelScheduledValues(now);
  audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), now);
  audio.master.gain.linearRampToValueAtTime(0.0001, now + fadeTime);

  audio.activeNodes.forEach(({ source, gain }) => {
    try {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);
      source.stop(now + fadeTime + 0.18);
    } catch {
      // Sources can already have a scheduled stop; the fade is still applied.
    }
  });

  updateSoundButton();
  publishDiagnostics();
}

function scheduleAmbientChord(immediate = false) {
  const audio = state.audio;

  if (audio.chordTimer !== null) {
    window.clearTimeout(audio.chordTimer);
    audio.chordTimer = null;
  }

  if (!audio.playing || audio.muted || !audio.context) return;

  audio.chordTimer = window.setTimeout(
    () => {
      audio.chordTimer = null;
      playAmbientChord();
      scheduleAmbientChord(false);
    },
    immediate ? 0 : AMBIENT_CHORD_SECONDS * 1000
  );
}

function scheduleLofiBeat(immediate = false) {
  const audio = state.audio;

  if (audio.beatTimer !== null) {
    window.clearTimeout(audio.beatTimer);
    audio.beatTimer = null;
  }

  if (!audio.playing || audio.muted || !audio.context) return;

  const swing = audio.beatStep % 2 ? LOFI_SWING : -LOFI_SWING * 0.45;
  const delay = immediate ? 0 : LOFI_STEP_SECONDS * (1 + swing) * 1000;
  audio.beatTimer = window.setTimeout(() => {
    audio.beatTimer = null;
    playLofiBeat(audio.beatStep);
    audio.beatStep = (audio.beatStep + 1) % 16;
    scheduleLofiBeat(false);
  }, delay);
}

function playAmbientChord() {
  const audio = state.audio;
  if (!audio.playing || audio.muted || !audio.context || !audio.filter) return;

  const context = audio.context;
  const now = context.currentTime + 0.02;
  const chord = AMBIENT_CHORDS[audio.chordIndex % AMBIENT_CHORDS.length];
  audio.chordIndex += 1;

  chord.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const peak = 0.024 / (index + 1.12);
    const sustain = 0.01 / (index + 1.2);

    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.detune.setValueAtTime((index - 2) * 2.6, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.45 + index * 0.06);
    gain.gain.setTargetAtTime(sustain, now + 2.9, 1.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + AMBIENT_RELEASE_SECONDS);

    oscillator.connect(gain);
    gain.connect(audio.filter);
    oscillator.start(now);
    oscillator.stop(now + AMBIENT_RELEASE_SECONDS + 0.25);
    trackAudioNode(oscillator, gain);
  });

  [
    [1, 0.86],
    [3, 2.35],
    [2, 4.2],
    [4, 5.48]
  ].forEach(([chordIndex, offset], noteIndex) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + offset;
    const frequency = chord[chordIndex] * (noteIndex % 2 ? 1.5 : 2);

    oscillator.type = noteIndex % 2 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.detune.setValueAtTime(noteIndex * 1.2 - 2, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.014, start + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

    oscillator.connect(gain);
    gain.connect(audio.filter);
    oscillator.start(start);
    oscillator.stop(start + 1.05);
    trackAudioNode(oscillator, gain);
  });
}

function playLofiBeat(step) {
  const audio = state.audio;
  if (!audio.playing || audio.muted || !audio.context || !audio.master) return;

  const context = audio.context;
  const now = context.currentTime + 0.01;

  if ([0, 7, 10].includes(step)) {
    playKick(now, step === 0 ? 0.085 : 0.05);
  }

  if ([4, 12].includes(step)) {
    playNoiseHit(now, 0.18, 0.036, "snare");
  }

  if (step % 2 === 1 || step === 6 || step === 14) {
    playNoiseHit(now, 0.045, step % 4 === 1 ? 0.013 : 0.009, "hat");
  }
}

function playKick(start, volume) {
  const audio = state.audio;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(86, start);
  oscillator.frequency.exponentialRampToValueAtTime(42, start + 0.22);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);

  oscillator.connect(gain);
  gain.connect(audio.master);
  oscillator.start(start);
  oscillator.stop(start + 0.36);
  trackAudioNode(oscillator, gain);
}

function playNoiseHit(start, duration, volume, kind) {
  const audio = state.audio;
  if (!audio.noiseBuffer) return;

  const source = audio.context.createBufferSource();
  const tone = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();

  source.buffer = audio.noiseBuffer;
  tone.type = kind === "hat" ? "highpass" : "bandpass";
  tone.frequency.value = kind === "hat" ? 5600 : 1350;
  tone.Q.value = kind === "hat" ? 0.5 : 0.85;

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  source.connect(tone);
  tone.connect(gain);
  gain.connect(audio.master);
  source.start(start);
  source.stop(start + duration + 0.02);
  trackAudioNode(source, gain);
}

function trackAudioNode(source, gain) {
  const entry = { source, gain };
  state.audio.activeNodes.add(entry);

  source.onended = () => {
    state.audio.activeNodes.delete(entry);
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // Nodes may already be disconnected during rapid mute/reset cycles.
    }
  };
}

function setAmbientVolume(volume, fadeSeconds = AMBIENT_FADE_SECONDS) {
  const audio = state.audio;
  if (!audio.context || !audio.master || audio.muted) return;

  const now = audio.context.currentTime;
  const target = Math.max(0.0001, volume);
  audio.master.gain.cancelScheduledValues(now);
  audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), now);
  audio.master.gain.linearRampToValueAtTime(target, now + Math.max(0.05, fadeSeconds));
}

function updateSoundButton() {
  if (!soundToggle) return;

  const unavailable = !state.audio.supported;
  const muted = unavailable || state.audio.muted;
  soundToggle.disabled = unavailable;
  soundToggle.classList.toggle("is-muted", muted);
  soundToggle.setAttribute("aria-pressed", String(!muted));
  soundToggle.setAttribute("aria-label", unavailable ? "Sound unavailable" : muted ? "Sound off" : "Sound on");
  soundToggle.innerHTML = muted
    ? '<i data-lucide="volume-x" aria-hidden="true"></i><span>Sound</span>'
    : '<i data-lucide="volume-2" aria-hidden="true"></i><span>Sound</span>';
  createIcons({ icons: iconSet });
}

function publishDiagnostics() {
  diagnosticsNode.textContent = JSON.stringify(getDiagnostics());
}

function getDiagnostics() {
  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const samplePoints = [
    [Math.floor(width * 0.22), Math.floor(height * 0.3)],
    [Math.floor(width * 0.5), Math.floor(height * 0.5)],
    [Math.floor(width * 0.72), Math.floor(height * 0.58)],
    [Math.floor(width * 0.54), Math.floor(height * 0.76)]
  ];
  const pixels = samplePoints.map(([x, y]) => {
    const pixel = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return Array.from(pixel);
  });
  const rect = (selector) => {
    const element = document.querySelector(selector);
    if (!element) return null;
    const bounds = element.getBoundingClientRect();
    return {
      x: Math.round(bounds.x),
      y: Math.round(bounds.y),
      width: Math.round(bounds.width),
      height: Math.round(bounds.height)
    };
  };

  return {
    canvas: { width, height },
    pixels,
    uniquePixels: new Set(pixels.map((pixel) => pixel.join(","))).size,
    placed: state.placed,
    total: state.queue.length,
    running: state.running,
    paused: state.paused,
    cinematic: {
      active: state.cinematic.active,
      mode: state.cinematic.mode
    },
    audio: {
      supported: state.audio.supported,
      muted: state.audio.muted,
      playing: state.audio.playing,
      contextState: state.audio.context?.state ?? "closed"
    },
    variationId: state.currentVariation?.id ?? null,
    variationLabel: state.currentVariation?.label ?? null,
    watchMode: appShell.classList.contains("watch-mode"),
    controlsOpen: !appShell.classList.contains("watch-mode"),
    canWatch: appShell.classList.contains("can-watch"),
    hudLabel: currentLabel.textContent,
    statusLabel: statusPill.textContent,
    percent: state.queue.length ? Math.round((state.placed / state.queue.length) * 100) : 0,
    status: statusPill.textContent,
    progress: blockProgress.textContent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    layout: {
      stage: rect(".stage"),
      workbench: rect(".workbench"),
      watchToggle: rect(".watch-toggle"),
      soundToggle: rect(".sound-toggle"),
      hud: rect(".stage-hud"),
      overflowX: document.documentElement.scrollWidth > window.innerWidth
    }
  };
}

window.__blockBuilderDiagnostics = getDiagnostics;

function startBuild(randomized) {
  clearBuild();
  const targetBlocks = normalizeBlockCount();
  const type = buildingType.value;

  if (!randomized) {
    state.seed += 17;
  }

  state.currentVariation = resolveBuildVariation({ type, seed: state.seed });
  state.queue = generateBuild({ type, targetBlocks, seed: state.seed, variation: state.currentVariation.id });
  state.placed = 0;
  state.accumulator = 0;
  state.running = true;
  state.paused = false;
  prepareInstanceGroups(state.queue);
  startCinematic(state.queue, performance.now());
  startAmbientMusic();
  setWatchMode(true);
  lastFrameTime = performance.now();
  lastBuildTickTime = performance.now();

  frameBuild(state.queue, true);
  setPauseButton();
  placeBlocks(1, performance.now());
  anchorMobileTray();
}

function advanceBuild(delta, time = performance.now()) {
  if (!state.running || state.paused) return;

  state.accumulator += delta * state.speed;
  const blocksToPlace = Math.min(Math.floor(state.accumulator), MAX_BLOCKS_PER_FRAME);

  if (blocksToPlace > 0) {
    state.accumulator -= blocksToPlace;
    placeBlocks(blocksToPlace, time);
  }
}

function placeBlocks(count, time = performance.now()) {
  const limit = Math.min(state.placed + count, state.queue.length);
  const touchedGroups = new Set();

  for (let index = state.placed; index < limit; index += 1) {
    const block = state.queue[index];
    const materialName = blockMaterials[block.material] ? block.material : "stone";
    const group = state.instanceGroups.get(materialName);

    if (!group) continue;

    const instanceIndex = group.next;
    group.next += 1;
    group.mesh.count = Math.max(group.mesh.count, group.next);
    setBlockInstance(group, instanceIndex, block, POP_START_SCALE);
    state.activeInstances.push({ block, birth: time, group, index: instanceIndex });
    touchedGroups.add(group);
  }

  touchedGroups.forEach((group) => {
    group.mesh.instanceMatrix.needsUpdate = true;
  });
  state.placed = limit;

  if (state.placed >= state.queue.length) {
    state.running = false;
    state.paused = false;
    completeCinematic(time);
    updateMeta("Complete");
    setPauseButton();
  } else {
    updateMeta("Building");
  }
}

function updateBlockPop(time) {
  if (!state.activeInstances.length) return;

  const stillAnimating = [];
  const touchedGroups = new Set();

  state.activeInstances.forEach((instance) => {
    const progress = clamp((time - instance.birth) / POP_DURATION, 0, 1);
    const eased = easeOutBack(progress);
    const scale = POP_START_SCALE + (1 - POP_START_SCALE) * eased;
    setBlockInstance(instance.group, instance.index, instance.block, Math.min(scale, 1.08));
    touchedGroups.add(instance.group);

    if (progress >= 1) {
      setBlockInstance(instance.group, instance.index, instance.block, 1);
    } else {
      stillAnimating.push(instance);
    }
  });

  state.activeInstances = stillAnimating;
  touchedGroups.forEach((group) => {
    group.mesh.instanceMatrix.needsUpdate = true;
  });
}

function clearBuild() {
  state.instanceGroups.forEach((group) => {
    const mesh = group.mesh;
    stageGroup.remove(mesh);
  });
  state.instanceGroups = new Map();
  state.activeInstances = [];
  state.placed = 0;
  state.accumulator = 0;
  state.currentVariation = null;
  stopCinematic();
}

function setWatchMode(active) {
  appShell.classList.toggle("watch-mode", active);
  updateWatchToggle();
  workbenchPanel.setAttribute("aria-hidden", active ? "true" : "false");

  if (active && document.activeElement instanceof HTMLElement && workbenchPanel.contains(document.activeElement)) {
    document.activeElement.blur();
  }

  resizeRenderer();
  requestAnimationFrame(() => {
    resizeRenderer();
    frameBuild(state.queue.length ? state.queue : getPreviewBuild(), true);
    publishDiagnostics();
  });
}

function updateWatchToggle() {
  const isWatching = appShell.classList.contains("watch-mode");
  const canWatch = state.queue.length > 0 || state.cinematic.active;
  const visible = isWatching || canWatch;

  appShell.classList.toggle("can-watch", visible);
  watchToggle.setAttribute("aria-hidden", visible ? "false" : "true");
  watchToggle.setAttribute("aria-expanded", isWatching ? "false" : "true");
  watchToggle.tabIndex = visible ? 0 : -1;
  watchToggle.innerHTML = isWatching
    ? '<i data-lucide="sliders-horizontal" aria-hidden="true"></i><span>Controls</span>'
    : '<i data-lucide="sliders-horizontal" aria-hidden="true"></i><span>Watch</span>';
  createIcons({ icons: iconSet });
}

function setPauseButton() {
  pauseButton.disabled = !state.queue.length || state.placed >= state.queue.length;
  pauseButton.innerHTML = state.paused
    ? '<i data-lucide="play" aria-hidden="true"></i><span>Resume</span>'
    : '<i data-lucide="pause" aria-hidden="true"></i><span>Pause</span>';
  createIcons({ icons: iconSet });
}

function populateBuildingOptions() {
  const currentValue = buildingType.value || "house";
  buildingType.replaceChildren(
    ...BUILDING_TYPES.map((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = type.label;
      return option;
    })
  );

  buildingType.value = BUILDING_TYPES.some((type) => type.id === currentValue) ? currentValue : "house";
}

function prepareInstanceGroups(blocks) {
  const countsByMaterial = new Map();

  blocks.forEach((block) => {
    const materialName = blockMaterials[block.material] ? block.material : "stone";
    countsByMaterial.set(materialName, (countsByMaterial.get(materialName) ?? 0) + 1);
  });

  countsByMaterial.forEach((count, materialName) => {
    const mesh = new THREE.InstancedMesh(blockGeometry, blockMaterials[materialName], count);
    mesh.count = 0;
    mesh.castShadow = materialName !== "water" && materialName !== "glass";
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    stageGroup.add(mesh);
    state.instanceGroups.set(materialName, { mesh, next: 0 });
  });
}

function setBlockInstance(group, index, block, scale) {
  blockTransform.position.set(block.x, block.y + 0.5, block.z);
  blockTransform.rotation.set(0, 0, 0);
  blockTransform.scale.setScalar(scale);
  blockTransform.updateMatrix();
  group.mesh.setMatrixAt(index, blockTransform.matrix);
}

function startCinematic(blocks, time) {
  if (!blocks.length) return;

  const box = getBuildBox(blocks);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 10);

  state.cinematic.active = true;
  state.cinematic.mode = "building";
  state.cinematic.center.copy(center);
  state.cinematic.size.copy(size);
  state.cinematic.minY = box.min.y;
  state.cinematic.radius = radius;
  state.cinematic.angle = Math.atan2(camera.position.z - center.z, camera.position.x - center.x);
  state.cinematic.startedAt = time;
  state.cinematic.completedAt = 0;
  state.cinematic.manualUntil = 0;
  stage.classList.add("is-cinematic");
  stage.classList.remove("is-cinematic-complete");
}

function completeCinematic(time) {
  if (!state.cinematic.active) return;

  state.cinematic.mode = "complete";
  state.cinematic.completedAt = time;
  stage.classList.add("is-cinematic-complete");
}

function stopCinematic() {
  state.cinematic.active = false;
  state.cinematic.mode = "idle";
  stage.classList.remove("is-cinematic", "is-cinematic-complete");
}

function updateCinematicCamera(time, delta) {
  const cinematic = state.cinematic;
  if (!cinematic.active || state.paused || time < cinematic.manualUntil) return false;

  const total = Math.max(1, state.queue.length);
  const progress = clamp(state.placed / total, 0, 1);
  const easedProgress = easeInOutCubic(progress);
  const elapsed = Math.max(0, time - cinematic.startedAt);
  const completeElapsed = cinematic.completedAt ? time - cinematic.completedAt : 0;
  const completeProgress = cinematic.mode === "complete" ? clamp(completeElapsed / CINEMATIC_COMPLETE_SWEEP, 0, 1) : 0;
  const completeEase = easeInOutCubic(completeProgress);
  const orbit = cinematic.angle + elapsed * 0.00017 + easedProgress * Math.PI * 0.72 + completeEase * Math.PI * 0.32;
  const distance = cinematic.radius * (1.48 - easedProgress * 0.28 - completeEase * 0.12) + 8;
  const focusY = cinematic.minY + Math.max(2, cinematic.size.y * (0.2 + easedProgress * 0.38));
  const finalLift = cinematic.size.y * 0.2 * completeEase;
  const height =
    cinematic.center.y +
    cinematic.radius * (0.5 + easedProgress * 0.34 + completeEase * 0.14) +
    Math.sin(time * 0.0011) * Math.max(0.35, cinematic.radius * 0.012) +
    5;

  cinematicLookTarget.set(cinematic.center.x, focusY + finalLift, cinematic.center.z);
  cinematicCameraTarget.set(
    cinematic.center.x + Math.cos(orbit) * distance,
    height,
    cinematic.center.z + Math.sin(orbit) * distance
  );

  const cameraEase = delta ? clamp(delta * 2.8, 0.035, 0.12) : 0.06;
  const targetEase = delta ? clamp(delta * 3.3, 0.045, 0.14) : 0.075;
  camera.position.lerp(cinematicCameraTarget, cameraEase);
  controls.target.lerp(cinematicLookTarget, targetEase);

  cinematicSunTarget.set(Math.cos(orbit - 0.8) * 34, 30 + Math.sin(time * 0.00055) * 3, Math.sin(orbit - 0.8) * 26);
  sun.position.lerp(cinematicSunTarget, 0.015);
  hemiLight.intensity = 2.08 + Math.sin(time * 0.001) * 0.05;

  return true;
}

function updateMeta(status) {
  const total = state.queue.length;
  const typeLabel = BUILDING_TYPES.find((type) => type.id === buildingType.value)?.label ?? "House";
  const displayLabel = state.currentVariation ? `${typeLabel} - ${state.currentVariation.label}` : typeLabel;
  const percent = total ? Math.round((state.placed / total) * 100) : 0;

  currentLabel.textContent = displayLabel;
  statusPill.textContent = total ? `${status} ${percent}%` : status;
  statusPill.dataset.status = status.toLowerCase();
  presetStat.textContent = typeLabel;
  plannedStat.textContent = total || blockCount.value;
  placedStat.textContent = state.placed;
  stateStat.textContent = status;
  blockProgress.textContent = `${state.placed} / ${total} blocks`;
  buildPercent.textContent = `${percent}%`;
  progressFill.style.width = `${percent}%`;
  buildButton.disabled = false;
  updateWatchToggle();
  publishDiagnostics();
}

function normalizeBlockCount() {
  syncBlockCountLimits();
  const normalized = normalizeBuildTarget({
    type: buildingType.value,
    targetBlocks: blockCount.value
  });
  blockCount.value = normalized;
  return normalized;
}

function syncBlockCountLimits() {
  blockCount.min = getBuildingMinimum(buildingType.value);
  blockCount.max = BLOCK_COUNT_LIMITS.max;
}

function getPreviewBuild() {
  return generateBuild({
    type: buildingType.value,
    targetBlocks: normalizeBlockCount(),
    seed: state.seed
  });
}

function anchorMobileTray() {
  if (!window.matchMedia("(max-width: 820px)").matches) return;

  requestAnimationFrame(() => {
    workbenchPanel.scrollTop = 0;
  });
  window.setTimeout(() => {
    workbenchPanel.scrollTop = 0;
  }, 80);
}

function frameBuild(blocks, animated) {
  if (!blocks.length) return;

  const box = getBuildBox(blocks);

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 10);
  const targetPosition = new THREE.Vector3(center.x + radius * 1.15, center.y + radius * 0.78 + 5, center.z + radius * 1.18);

  controls.target.lerp(new THREE.Vector3(center.x, Math.max(2, center.y * 0.7), center.z), animated ? 0.6 : 1);
  camera.position.lerp(targetPosition, animated ? 0.6 : 1);
  controls.update();
}

function getBuildBox(blocks) {
  const box = new THREE.Box3();
  blocks.forEach((block) => {
    box.expandByPoint(new THREE.Vector3(block.x, block.y, block.z));
  });
  return box;
}

function createGround() {
  const size = 280;
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x69b55b,
    map: createPixelTexture("#66b55b", ["#5aa04f", "#79c66d", "#4f8d45"], 4),
    roughness: 0.95
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  mesh.receiveShadow = true;
  return mesh;
}

function createMaterials() {
  const materialSpecs = {
    grass: ["#62b957", ["#4e9a48", "#79ce6b", "#3f823d"]],
    dirt: ["#8d6543", ["#744f32", "#a17650", "#5d412c"]],
    stone: ["#8b9295", ["#6f777a", "#a7adaf", "#555d60"]],
    wood: ["#9b6439", ["#714727", "#b9824c", "#5d371f"]],
    plank: ["#c99556", ["#a9793f", "#d9aa70", "#8d5d30"]],
    roof: ["#2f8f8b", ["#246f72", "#44aaa3", "#1e5c5f"]],
    glass: ["#78c9e8", ["#b8ecff", "#4ca6ce", "#ffffff"], true],
    leaf: ["#3c9d45", ["#2d7a35", "#54b65d", "#21602a"]],
    water: ["#4d98d8", ["#2f79bf", "#74bbed", "#b9e8ff"], true],
    red: ["#b94234", ["#942d27", "#d75d4e", "#7c241f"]],
    white: ["#f2f4e7", ["#d7dacb", "#ffffff", "#c2c7b8"]],
    hay: ["#d8b84d", ["#b9962e", "#f0d16a", "#9c7621"]],
    path: ["#a8895f", ["#806846", "#c6a878", "#6d5639"]],
    dark: ["#2e2b28", ["#191715", "#4a4540", "#5d513f"]],
    flower: ["#e85d75", ["#ffd166", "#e85d75", "#7bd389"]]
  };

  return Object.fromEntries(
    Object.entries(materialSpecs).map(([name, [base, accents, transparent]]) => [
      name,
      new THREE.MeshStandardMaterial({
        color: base,
        map: createPixelTexture(base, accents, name.length),
        roughness: 0.82,
        metalness: 0,
        transparent: Boolean(transparent),
        opacity: transparent ? 0.72 : 1
      })
    ])
  );
}

function createPixelTexture(base, accents, seedOffset) {
  const size = 64;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size;
  const context = canvasTexture.getContext("2d");
  const rng = seededNoise(seedOffset + base.length * 31);

  context.fillStyle = base;
  context.fillRect(0, 0, size, size);

  for (let i = 0; i < 90; i += 1) {
    const swatch = accents[Math.floor(rng() * accents.length)];
    context.fillStyle = swatch;
    const block = 4 + Math.floor(rng() * 8);
    const x = Math.floor(rng() * (size / block)) * block;
    const y = Math.floor(rng() * (size / block)) * block;
    context.globalAlpha = 0.18 + rng() * 0.18;
    context.fillRect(x, y, block, block);
  }

  context.globalAlpha = 0.28;
  context.strokeStyle = "#172018";
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, size - 3, size - 3);
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

function createNoiseBuffer(context) {
  const sampleCount = context.sampleRate;
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const samples = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    samples[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function seededNoise(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1103515245 + 12345) >>> 0;
    return state / 4294967296;
  };
}

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}
