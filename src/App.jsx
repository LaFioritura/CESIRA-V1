import React, { useEffect, useMemo, useRef, useState } from 'react';

const MAX_STEPS = 64;
const DEFAULT_STEPS = 16;
const DEFAULT_BPM = 112;
const LANE_KEYS = ['kick', 'snare', 'hat', 'bass', 'synth'];
const PAGE_SIZE = 16;

const drumPresets = [
  { name: 'Kick Melt', type: 'kick' },
  { name: 'Kick Rubber', type: 'kick2' },
  { name: 'Snare Dust', type: 'snare' },
  { name: 'Snare Glass', type: 'snare2' },
  { name: 'Hat Tin', type: 'hat' },
  { name: 'Hat Steam', type: 'hat2' },
  { name: 'Clap Fog', type: 'clap' },
  { name: 'Tom Oil', type: 'tom' },
  { name: 'Metal Ping', type: 'metal' },
  { name: 'Noise Burst', type: 'noise' },
  { name: 'Kick Velvet', type: 'kick' },
  { name: 'Kick Asphalt', type: 'kick2' },
  { name: 'Snare Paper', type: 'snare' },
  { name: 'Hat Razor', type: 'hat2' },
  { name: 'Clap Static', type: 'clap' },
  { name: 'Metal Spray', type: 'metal' },
];

const bassPresets = [
  { name: 'Sub Worm', mode: 'sub' },
  { name: 'Grit Mono', mode: 'grit' },
  { name: 'FM Swamp', mode: 'fm' },
  { name: 'Pulse Root', mode: 'pulse' },
  { name: 'Broken Tube', mode: 'tube' },
  { name: 'Drone Heel', mode: 'drone' },
  { name: 'Wet Rubber', mode: 'wet' },
  { name: 'Fold Bass', mode: 'fold' },
  { name: 'Saw Mud', mode: 'saw' },
  { name: 'Bit Spine', mode: 'bit' },
  { name: 'Sub Resin', mode: 'sub' },
  { name: 'Mono Soot', mode: 'grit' },
  { name: 'FM Tar', mode: 'fm' },
  { name: 'Pulse Coal', mode: 'pulse' },
  { name: 'Wet Iron', mode: 'wet' },
  { name: 'Saw Heel', mode: 'saw' },
];

const synthPresets = [
  { name: 'Toy Glass', mode: 'glass' },
  { name: 'Gummy Pad', mode: 'pad' },
  { name: 'Chrome Mist', mode: 'mist' },
  { name: 'Bent Lead', mode: 'lead' },
  { name: 'Tiny Choir', mode: 'choir' },
  { name: 'Wobble Bell', mode: 'bell' },
  { name: 'Plastic Bloom', mode: 'bloom' },
  { name: 'Fold Star', mode: 'star' },
  { name: 'Noir Air', mode: 'air' },
  { name: 'FM Candy', mode: 'candy' },
  { name: 'Glass Thread', mode: 'glass' },
  { name: 'Mist Tape', mode: 'mist' },
  { name: 'Lead Bubble', mode: 'lead' },
  { name: 'Choir Toy', mode: 'choir' },
  { name: 'Bell Smoke', mode: 'bell' },
  { name: 'Air Bloom', mode: 'air' },
];

const fxScenes = [
  { name: 'Clean Glow', drive: 0.05, filter: 1.0, width: 0.18, delay: 0.08 },
  { name: 'Tape Jelly', drive: 0.15, filter: 0.86, width: 0.28, delay: 0.14 },
  { name: 'Lo-Fi Milk', drive: 0.25, filter: 0.72, width: 0.24, delay: 0.18 },
  { name: 'Metal Dream', drive: 0.32, filter: 0.92, width: 0.42, delay: 0.1 },
  { name: 'Crushed Air', drive: 0.42, filter: 0.62, width: 0.1, delay: 0.22 },
  { name: 'Room Spill', drive: 0.18, filter: 0.88, width: 0.48, delay: 0.16 },
  { name: 'Warp Bloom', drive: 0.36, filter: 0.77, width: 0.4, delay: 0.24 },
  { name: 'Deep Plastic', drive: 0.22, filter: 0.68, width: 0.28, delay: 0.2 },
  { name: 'Neon Rust', drive: 0.48, filter: 0.58, width: 0.31, delay: 0.12 },
  { name: 'Ghost Machine', drive: 0.28, filter: 0.81, width: 0.56, delay: 0.26 },
  { name: 'Bright Spill', drive: 0.1, filter: 0.95, width: 0.52, delay: 0.09 },
  { name: 'Mud Halo', drive: 0.31, filter: 0.55, width: 0.16, delay: 0.2 },
  { name: 'Stereo Melt', drive: 0.24, filter: 0.9, width: 0.62, delay: 0.18 },
  { name: 'Glass Spill', drive: 0.18, filter: 0.98, width: 0.46, delay: 0.28 },
  { name: 'Narrow Burn', drive: 0.44, filter: 0.52, width: 0.08, delay: 0.14 },
  { name: 'Toy Chamber', drive: 0.2, filter: 0.84, width: 0.36, delay: 0.22 },
];

const bassNotes = ['C2', 'D2', 'E2', 'G2', 'A2', 'C3', 'D3', 'E3', 'G3', 'A3'];
const synthNotes = ['C4', 'D4', 'Eb4', 'G4', 'A4', 'C5', 'D5', 'Eb5', 'G5', 'A5'];
const noteToFreq = {
  C2: 65.41,
  Db2: 69.3,
  D2: 73.42,
  Eb2: 77.78,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  Ab2: 103.83,
  A2: 110.0,
  Bb2: 116.54,
  C3: 130.81,
  Db3: 138.59,
  D3: 146.83,
  Eb3: 155.56,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  Db4: 277.18,
  D4: 293.66,
  Eb4: 311.13,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  Ab4: 415.3,
  A4: 440.0,
  Bb4: 466.16,
  C5: 523.25,
  Db5: 554.37,
  D5: 587.33,
  Eb5: 622.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

const ROOTS = ['C', 'D', 'Eb', 'F', 'G', 'A'];
const MODES = {
  minor: { bass: ['C2', 'D2', 'Eb2', 'G2', 'A2', 'C3', 'D3', 'Eb3'], synth: ['C4', 'D4', 'Eb4', 'G4', 'A4', 'C5', 'D5', 'Eb5'] },
  phrygian: { bass: ['C2', 'Db2', 'Eb2', 'G2', 'Ab2', 'C3', 'Db3', 'Eb3'], synth: ['C4', 'Db4', 'Eb4', 'G4', 'Ab4', 'C5', 'Db5', 'Eb5'] },
  dorian: { bass: ['C2', 'D2', 'Eb2', 'G2', 'Bb2', 'C3', 'D3', 'F3'], synth: ['C4', 'D4', 'Eb4', 'G4', 'Bb4', 'C5', 'D5', 'F5'] },
  chroma: { bass: ['C2', 'Db2', 'Eb2', 'E2', 'G2', 'Ab2', 'A2', 'C3'], synth: ['C4', 'Db4', 'Eb4', 'E4', 'G4', 'Ab4', 'A4', 'C5'] },
};

const GROOVE_MAP = {
  steady: { kickBias: 0.22, snareBias: 0.16, hatBias: 0.58, bassBias: 0.22, synthBias: 0.12 },
  broken: { kickBias: 0.28, snareBias: 0.14, hatBias: 0.46, bassBias: 0.28, synthBias: 0.18 },
  bunker: { kickBias: 0.34, snareBias: 0.1, hatBias: 0.34, bassBias: 0.24, synthBias: 0.14 },
  float: { kickBias: 0.16, snareBias: 0.12, hatBias: 0.5, bassBias: 0.18, synthBias: 0.28 },
};

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function makeGloss(bg) {
  return {
    background: bg,
    boxShadow: '0 16px 40px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
  };
}

function makeEmptyLane() {
  return Array.from({ length: MAX_STEPS }, () => false);
}

function makeEmptyNotes(defaultNote = 'C2') {
  return Array.from({ length: MAX_STEPS }, () => defaultNote);
}

function makePatternTemplate(stepCount = DEFAULT_STEPS) {
  const pattern = {
    kick: makeEmptyLane(),
    snare: makeEmptyLane(),
    hat: makeEmptyLane(),
    bass: makeEmptyLane(),
    synth: makeEmptyLane(),
  };

  [0, 8, 12, 24, 32, 40, 56].forEach((i) => {
    if (i < stepCount) pattern.kick[i] = true;
  });
  [4, 12, 20, 28, 36, 44, 52, 60].forEach((i) => {
    if (i < stepCount) pattern.snare[i] = true;
  });
  for (let i = 0; i < stepCount; i += 2) pattern.hat[i] = true;
  [0, 3, 7, 10, 13, 18, 22, 29, 33, 39, 46, 53].forEach((i) => {
    if (i < stepCount) pattern.bass[i] = true;
  });
  [2, 6, 11, 14, 19, 27, 35, 43, 50, 58].forEach((i) => {
    if (i < stepCount) pattern.synth[i] = true;
  });

  return pattern;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function seededChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rotateArray(arr, steps) {
  return arr.map((_, i) => arr[(i - steps + arr.length) % arr.length]);
}

function chooseMode(chaos) {
  if (chaos > 0.78) return 'chroma';
  if (chaos > 0.56) return seededChoice(['minor', 'phrygian']);
  return seededChoice(['minor', 'dorian', 'phrygian']);
}

function chooseGroove(density, chaos) {
  if (density > 0.68 && chaos > 0.45) return 'bunker';
  if (chaos > 0.62) return 'broken';
  if (density < 0.38) return 'float';
  return 'steady';
}

function buildNoteLanes(stepCount, modeName, grooveName, chaos) {
  const mode = MODES[modeName] || MODES.minor;
  const groove = GROOVE_MAP[grooveName] || GROOVE_MAP.steady;
  const bassLine = makeEmptyNotes(mode.bass[0]);
  const synthLine = makeEmptyNotes(mode.synth[0]);
  const anchorBass = [0, 0, 2, 0, 4, 0, 2, 0];
  const anchorSynth = chaos > 0.58 ? [4, 2, 6, 4, 1, 4, 6, 2] : [4, 2, 4, 6, 1, 4, 2, 4];

  for (let i = 0; i < stepCount; i++) {
    const phrase = Math.floor(i / 8) % anchorBass.length;
    const motion = (i % 4 === 3 && Math.random() < groove.bassBias) ? 1 : 0;
    const bassIndex = (anchorBass[phrase] + motion + (Math.random() < chaos * 0.18 ? 1 : 0)) % mode.bass.length;
    const synthIndex = (anchorSynth[phrase] + (i % 8 === 6 ? 1 : 0) + (Math.random() < chaos * 0.24 ? 2 : 0)) % mode.synth.length;
    bassLine[i] = mode.bass[bassIndex];
    synthLine[i] = mode.synth[synthIndex];
  }

  if (chaos > 0.66) {
    return {
      bassLine: rotateArray(bassLine, Math.floor(Math.random() * 3)),
      synthLine: rotateArray(synthLine, Math.floor(Math.random() * 5)),
    };
  }

  return { bassLine, synthLine };
}

function chooseLaneLengths(density, chaos, grooveName) {
  const banks = {
    steady: [
      { kick: 16, snare: 16, hat: 16, bass: 32, synth: 32, section: 'pulse-cell' },
      { kick: 32, snare: 16, hat: 32, bass: 32, synth: 48, section: 'night-drive' },
      { kick: 16, snare: 32, hat: 16, bass: 48, synth: 64, section: 'slow-rise' },
    ],
    broken: [
      { kick: 32, snare: 16, hat: 32, bass: 32, synth: 48, section: 'fracture-loop' },
      { kick: 32, snare: 32, hat: 48, bass: 32, synth: 64, section: 'split-engine' },
      { kick: 16, snare: 48, hat: 32, bass: 48, synth: 32, section: 'off-axis' },
    ],
    bunker: [
      { kick: 16, snare: 32, hat: 16, bass: 32, synth: 48, section: 'pressure-room' },
      { kick: 32, snare: 16, hat: 32, bass: 16, synth: 64, section: 'steel-corridor' },
      { kick: 16, snare: 16, hat: 48, bass: 32, synth: 64, section: 'locked-floor' },
    ],
    float: [
      { kick: 32, snare: 32, hat: 48, bass: 32, synth: 64, section: 'mist-window' },
      { kick: 16, snare: 48, hat: 32, bass: 48, synth: 64, section: 'ghost-hall' },
      { kick: 16, snare: 32, hat: 48, bass: 32, synth: 48, section: 'soft-tilt' },
    ],
  };

  const selected = seededChoice(banks[grooveName] || banks.steady);
  const allowed = [16, 32, 48, 64];
  const snap = (v) => allowed.reduce((best, candidate) => {
    return Math.abs(candidate - v) < Math.abs(best - v) ? candidate : best;
  }, allowed[0]);
  const nudge = chaos > 0.72 ? 8 : density > 0.64 ? 0 : -4;

  return {
    kick: snap(clamp(selected.kick + nudge, 16, MAX_STEPS)),
    snare: snap(clamp(selected.snare + nudge, 16, MAX_STEPS)),
    hat: snap(clamp(selected.hat + nudge, 16, MAX_STEPS)),
    bass: snap(clamp(selected.bass + nudge, 16, MAX_STEPS)),
    synth: snap(clamp(selected.synth + nudge, 16, MAX_STEPS)),
    section: selected.section,
  };
}

function getGrooveAccent(profile, lane, stepIndex, amount) {
  const pos = stepIndex % 16;
  const a = clamp(amount, 0, 1);
  const maps = {
    steady: {
      kick: [1.2,1,0.92,0.96,1,0.94,0.98,0.96,1.18,0.98,0.92,0.96,1.02,0.96,0.98,0.96],
      snare:[0.92,0.9,0.92,0.9,1.16,0.92,0.92,0.9,0.92,0.9,0.92,0.9,1.12,0.92,0.92,0.9],
      hat:  [0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.06,0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.08],
      bass: [1.1,0.96,0.98,1.02,0.96,0.94,1,1.04,1.08,0.96,0.98,1.02,0.96,0.94,1,1.04],
      synth:[0.96,1,1.04,1,0.96,1,1.08,1,0.96,1,1.04,1,0.96,1,1.12,1],
    },
    broken: {
      kick: [1.22,0.88,1.04,0.84,0.96,1.06,0.9,1.02,1.14,0.86,1.08,0.82,0.94,1.04,0.9,1.06],
      snare:[0.88,0.94,0.9,1,1.12,0.9,0.96,0.9,0.88,1,0.9,0.96,1.1,0.88,1,0.92],
      hat:  [0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.12,0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.16],
      bass: [1.06,0.94,1.1,0.88,1,0.94,1.08,0.9,1.04,0.94,1.1,0.88,1,0.94,1.08,0.92],
      synth:[0.92,1.04,1.12,0.9,0.94,1.08,1.14,0.88,0.92,1.04,1.1,0.9,0.94,1.08,1.16,0.86],
    },
    bunker: {
      kick: [1.28,0.92,0.94,0.9,1.02,0.92,0.94,0.9,1.24,0.92,0.94,0.9,1.04,0.92,0.94,0.9],
      snare:[0.9,0.9,0.92,0.9,1.08,0.9,0.92,0.9,0.9,0.9,0.92,0.9,1.06,0.9,0.92,0.9],
      hat:  [0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.04,0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.06],
      bass: [1.16,0.94,0.96,1,1.04,0.94,0.96,1.02,1.14,0.94,0.96,1,1.06,0.94,0.96,1.04],
      synth:[0.9,0.98,1.02,0.96,0.9,0.98,1.06,0.96,0.9,0.98,1.02,0.96,0.9,0.98,1.1,0.96],
    },
    float: {
      kick: [1.12,0.98,0.96,1,1.04,0.98,0.96,1,1.1,0.98,0.96,1,1.02,0.98,0.96,1],
      snare:[0.94,0.98,0.96,1,1.06,0.98,0.96,1,0.94,0.98,0.96,1,1.08,0.98,0.96,1],
      hat:  [0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.06,0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.08],
      bass: [1.04,0.98,1,1.02,1.04,0.98,1,1.04,1.02,0.98,1,1.02,1.06,0.98,1,1.04],
      synth:[1,1.04,1.08,1.02,1,1.04,1.1,1.02,1,1.04,1.08,1.02,1,1.04,1.12,1.02],
    },
  };
  const table = (maps[profile] || maps.steady)[lane] || maps.steady.kick;
  const raw = table[pos] || 1;
  return 1 + (raw - 1) * a;
}

function buildFreestylePattern(stepCount, laneStepCounts, density, chaos, currentPresets, options = {}) {
  const grooveName = chooseGroove(density, chaos);
  const modeName = chooseMode(chaos);
  const autoLength = options.autoLength ?? true;
  const generatedLengths = autoLength ? chooseLaneLengths(density, chaos, grooveName) : { ...laneStepCounts, section: 'manual-grid' };
  const effectiveLaneLengths = {
    kick: generatedLengths.kick || laneStepCounts.kick || stepCount,
    snare: generatedLengths.snare || laneStepCounts.snare || stepCount,
    hat: generatedLengths.hat || laneStepCounts.hat || stepCount,
    bass: generatedLengths.bass || laneStepCounts.bass || stepCount,
    synth: generatedLengths.synth || laneStepCounts.synth || stepCount,
  };
  const masterLength = Math.max(...Object.values(effectiveLaneLengths));

  const p = {
    kick: makeEmptyLane(),
    snare: makeEmptyLane(),
    hat: makeEmptyLane(),
    bass: makeEmptyLane(),
    synth: makeEmptyLane(),
  };

  const groove = GROOVE_MAP[grooveName];
  const { bassLine, synthLine } = buildNoteLanes(masterLength, modeName, grooveName, chaos);
  const bar = 16;
  const phraseShape = seededChoice(['anchor', 'stagger', 'mirror', 'fall']);

  for (const lane of LANE_KEYS) {
    const laneLength = effectiveLaneLengths[lane] || masterLength;
    for (let i = 0; i < laneLength; i++) {
      const pos = i % bar;
      const strong = pos === 0 || pos === 8;
      const backbeat = pos === 4 || pos === 12;
      const offbeat = pos % 2 === 1;
      const phraseBlock = Math.floor(i / 8) % 4;
      const phraseWeight = phraseShape === 'anchor'
        ? [1, 0.75, 0.92, 0.68][phraseBlock]
        : phraseShape === 'stagger'
          ? [0.72, 1, 0.66, 0.94][phraseBlock]
          : phraseShape === 'mirror'
            ? [1, 0.78, 0.78, 1][phraseBlock]
            : [1, 0.9, 0.68, 0.56][phraseBlock];

      if (lane === 'kick') {
        const chance = (groove.kickBias + density * 0.18 + (strong ? 0.2 : 0)) * phraseWeight;
        if (strong || Math.random() < chance) p.kick[i] = true;
      } else if (lane === 'snare') {
        const chance = (groove.snareBias + density * 0.08 + (backbeat ? 0.26 : 0)) * (1.06 - phraseWeight * 0.18);
        if (backbeat || Math.random() < chance) p.snare[i] = true;
      } else if (lane === 'hat') {
        const chance = (!offbeat ? groove.hatBias - 0.08 + density * 0.2 : groove.hatBias + density * 0.16) * (0.82 + phraseWeight * 0.22);
        if (Math.random() < chance) p.hat[i] = true;
      } else if (lane === 'bass') {
        const chance = (pos === 0 || pos === 3 || pos === 7 ? 0.94 : groove.bassBias + density * 0.14) * (0.8 + phraseWeight * 0.26);
        if (Math.random() < chance) p.bass[i] = true;
      } else if (lane === 'synth') {
        const chance = (pos === 2 || pos === 6 || pos === 10 ? 0.72 : groove.synthBias + density * 0.1) * (0.7 + phraseWeight * 0.34);
        if ((Math.random() < chance && !strong) || (phraseBlock === 3 && Math.random() < 0.18 + chaos * 0.16)) p.synth[i] = true;
      }
    }
  }

  for (let i = 0; i < effectiveLaneLengths.kick; i += 16) p.kick[i] = true;
  for (let i = 0; i < effectiveLaneLengths.snare; i += 16) {
    if (i + 4 < effectiveLaneLengths.snare) p.snare[i + 4] = true;
    if (i + 12 < effectiveLaneLengths.snare) p.snare[i + 12] = true;
  }

  const mutationPasses = Math.max(2, Math.floor(chaos * 10));
  for (let m = 0; m < mutationPasses; m++) {
    const lane = seededChoice(LANE_KEYS);
    const laneLength = effectiveLaneLengths[lane] || masterLength;
    const pos = Math.floor(Math.random() * laneLength);
    if (lane === 'hat') {
      p.hat[pos] = !p.hat[pos];
      if (chaos > 0.52 && pos + 2 < laneLength && Math.random() < 0.34) p.hat[pos + 2] = true;
    } else if (lane === 'kick') {
      if (pos % 4 !== 0) p.kick[pos] = Math.random() < 0.42 + chaos * 0.22;
    } else if (lane === 'bass') {
      p.bass[pos] = !p.bass[pos];
      if (Math.random() < 0.34) bassLine[pos] = seededChoice(MODES[modeName].bass);
    } else if (lane === 'synth') {
      p.synth[pos] = !p.synth[pos];
      if (Math.random() < 0.4) synthLine[pos] = seededChoice(MODES[modeName].synth);
    } else {
      p.snare[pos] = !p.snare[pos] && pos % 4 !== 0;
    }
  }

  for (let i = effectiveLaneLengths.bass; i < MAX_STEPS; i++) bassLine[i] = bassLine[Math.max(0, i % Math.max(1, effectiveLaneLengths.bass))];
  for (let i = effectiveLaneLengths.synth; i < MAX_STEPS; i++) synthLine[i] = synthLine[Math.max(0, i % Math.max(1, effectiveLaneLengths.synth))];

  return {
    patterns: p,
    bassLine,
    synthLine,
    laneLengths: effectiveLaneLengths,
    sectionProfile: generatedLengths.section || 'manual-grid',
    harmonicProfile: modeName,
    grooveProfile: grooveName,
    drumPreset: Math.floor((Math.random() * drumPresets.length + currentPresets.drumPreset * 0.35) % drumPresets.length),
    bassPreset: Math.floor((Math.random() * bassPresets.length + currentPresets.bassPreset * 0.35) % bassPresets.length),
    synthPreset: Math.floor((Math.random() * synthPresets.length + currentPresets.synthPreset * 0.35) % synthPresets.length),
    fxPreset: Math.floor(Math.random() * fxScenes.length),
  };
}

export default function PocketDriftLab() {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stutterOn, setStutterOn] = useState(false);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [stepCount, setStepCount] = useState(DEFAULT_STEPS);
  const [laneStepCounts, setLaneStepCounts] = useState({ kick: DEFAULT_STEPS, snare: DEFAULT_STEPS, hat: DEFAULT_STEPS, bass: DEFAULT_STEPS, synth: DEFAULT_STEPS });
  const [step, setStep] = useState(0);
  const [page, setPage] = useState(0);
  const [patterns, setPatterns] = useState(() => makePatternTemplate(DEFAULT_STEPS));
  const [drumPreset, setDrumPreset] = useState(0);
  const [bassPreset, setBassPreset] = useState(0);
  const [synthPreset, setSynthPreset] = useState(0);
  const [fxPreset, setFxPreset] = useState(1);
  const [swing, setSwing] = useState(0.08);
  const [master, setMaster] = useState(0.82);
  const [recState, setRecState] = useState('idle');
  const [recordings, setRecordings] = useState([]);
  const [density, setDensity] = useState(0.44);
  const [chaos, setChaos] = useState(0.42);
  const [tone, setTone] = useState(0.64);
  const [noise, setNoise] = useState(0.34);
  const [space, setSpace] = useState(0.34);
  const [activeLane, setActiveLane] = useState('kick');
  const [statusText, setStatusText] = useState('Ready to drift.');
  const [recordMime, setRecordMime] = useState('audio/webm');
  const [laneVolumes, setLaneVolumes] = useState({ kick: 0.95, snare: 0.82, hat: 0.48, bass: 0.9, synth: 0.78 });
  const [compressAmount, setCompressAmount] = useState(0.52);
  const [resonance, setResonance] = useState(0.34);
  const [bassLfo, setBassLfo] = useState(0.38);
  const [synthLfo, setSynthLfo] = useState(0.42);
  const [drumDecay, setDrumDecay] = useState(0.46);
  const [bassWave, setBassWave] = useState('auto');
  const [synthWave, setSynthWave] = useState('auto');
  const [bassCutoff, setBassCutoff] = useState(0.58);
  const [synthCutoff, setSynthCutoff] = useState(0.68);
  const [bassSubAmount, setBassSubAmount] = useState(0.72);
  const [synthAttack, setSynthAttack] = useState(0.12);
  const [synthRelease, setSynthRelease] = useState(0.52);
  const [stutterBurst, setStutterBurst] = useState(3);
  const [bassLine, setBassLine] = useState(() => makeEmptyNotes('C2'));
  const [synthLine, setSynthLine] = useState(() => makeEmptyNotes('C4'));
  const [harmonicProfile, setHarmonicProfile] = useState('minor');
  const [grooveProfile, setGrooveProfile] = useState('steady');
  const [sectionProfile, setSectionProfile] = useState('pulse-cell');
  const [laneFx, setLaneFx] = useState({
    kick: { drive: 0.18, tone: 0.56, echo: 0.0, crush: 0.0, pan: -0.02 },
    snare: { drive: 0.12, tone: 0.62, echo: 0.08, crush: 0.0, pan: 0.0 },
    hat: { drive: 0.08, tone: 0.84, echo: 0.04, crush: 0.04, pan: 0.18 },
    bass: { drive: 0.16, tone: 0.42, echo: 0.02, crush: 0.0, pan: -0.07 },
    synth: { drive: 0.14, tone: 0.72, echo: 0.16, crush: 0.0, pan: 0.08 },
  });
  const [noteEditLane, setNoteEditLane] = useState('bass');
  const [humanize, setHumanize] = useState(0.08);
  const [macroKnob, setMacroKnob] = useState(0.28);
  const [grooveAmount, setGrooveAmount] = useState(0.42);
  const [sceneSlots, setSceneSlots] = useState([null, null, null, null]);
  const [currentScene, setCurrentScene] = useState(null);
  const [projectName, setProjectName] = useState('CESIRA Session');
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [metronomeLevel, setMetronomeLevel] = useState(0.42);
  const [projectSlots, setProjectSlots] = useState([null, null, null, null]);
  const [currentProjectSlot, setCurrentProjectSlot] = useState(null);

  const audioRef = useRef(null);
  const clockRef = useRef(null);
  const stepRef = useRef(0);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingsRef = useRef([]);
  const bpmRef = useRef(bpm);
  const swingRef = useRef(swing);
  const stepCountRef = useRef(stepCount);
  const laneStepCountsRef = useRef(laneStepCounts);
  const patternsRef = useRef(patterns);
  const bassLineRef = useRef(bassLine);
  const synthLineRef = useRef(synthLine);
  const laneFxRef = useRef(laneFx);
  const macroKnobRef = useRef(macroKnob);
  const grooveAmountRef = useRef(grooveAmount);
  const grooveProfileRef = useRef(grooveProfile);
  const harmonicProfileRef = useRef(harmonicProfile);
  const humanizeRef = useRef(humanize);
  const stutterOnRef = useRef(stutterOn);
  const stutterBurstRef = useRef(stutterBurst);
  const isPlayingRef = useRef(false);
  const importInputRef = useRef(null);

  const laneLabels = useMemo(
    () => [
      { key: 'kick', label: 'K', long: 'Kick' },
      { key: 'snare', label: 'S', long: 'Snare' },
      { key: 'hat', label: 'H', long: 'Hat' },
      { key: 'bass', label: 'B', long: 'Bass' },
      { key: 'synth', label: 'Y', long: 'Synth' },
    ],
    []
  );

  const totalPages = Math.ceil(stepCount / PAGE_SIZE);
  const visibleStart = page * PAGE_SIZE;
  const visibleEnd = Math.min(stepCount, visibleStart + PAGE_SIZE);
  const visibleIndices = Array.from({ length: visibleEnd - visibleStart }, (_, i) => visibleStart + i);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { swingRef.current = swing; }, [swing]);
  useEffect(() => { stepCountRef.current = stepCount; }, [stepCount]);
  useEffect(() => { laneStepCountsRef.current = laneStepCounts; }, [laneStepCounts]);
  useEffect(() => { patternsRef.current = patterns; }, [patterns]);
  useEffect(() => {
    const maxSteps = Math.max(...Object.values(laneStepCounts));
    setStepCount(maxSteps);
    stepCountRef.current = maxSteps;
    setPage((prev) => clamp(prev, 0, Math.ceil(maxSteps / PAGE_SIZE) - 1));
    if (stepRef.current >= maxSteps) {
      stepRef.current = 0;
      setStep(0);
    }
  }, [laneStepCounts]);
  useEffect(() => { bassLineRef.current = bassLine; }, [bassLine]);
  useEffect(() => { synthLineRef.current = synthLine; }, [synthLine]);
  useEffect(() => { laneFxRef.current = laneFx; }, [laneFx]);
  useEffect(() => { macroKnobRef.current = macroKnob; }, [macroKnob]);
  useEffect(() => { grooveAmountRef.current = grooveAmount; }, [grooveAmount]);
  useEffect(() => { grooveProfileRef.current = grooveProfile; }, [grooveProfile]);
  useEffect(() => { harmonicProfileRef.current = harmonicProfile; }, [harmonicProfile]);
  useEffect(() => { humanizeRef.current = humanize; }, [humanize]);
  useEffect(() => { stutterOnRef.current = stutterOn; }, [stutterOn]);
  useEffect(() => { stutterBurstRef.current = stutterBurst; }, [stutterBurst]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { recordingsRef.current = recordings; }, [recordings]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('cesira-project-autoload');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.projectName) setProjectName(parsed.projectName);
      }
      const slotsRaw = window.localStorage.getItem('cesira-project-slots');
      if (slotsRaw) {
        const parsedSlots = JSON.parse(slotsRaw);
        if (Array.isArray(parsedSlots)) setProjectSlots(parsedSlots.slice(0, 4));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('cesira-project-slots', JSON.stringify(projectSlots));
    } catch {}
  }, [projectSlots]);

  useEffect(() => {
    return () => {
      if (clockRef.current) clearTimeout(clockRef.current);
      if (audioRef.current?.ctx?.state && audioRef.current.ctx.state !== 'closed') {
        audioRef.current.ctx.close().catch(() => {});
      }
      recordingsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  const flashAccent = () => {
    const el = document.getElementById('pdl-shell');
    if (!el) return;
    el.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.006)' }, { transform: 'scale(1)' }],
      { duration: 180, easing: 'ease-out' }
    );
  };

  const setDriveCurve = (node, amount = 0.2) => {
    const k = 2 + amount * 120;
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    node.curve = curve;
    node.oversample = '4x';
  };

  const initAudio = async () => {
    if (audioRef.current) {
      await audioRef.current.ctx.resume();
      setIsReady(true);
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      setStatusText('Web Audio non supportato in questo browser.');
      return;
    }

    const ctx = new AudioCtx({ sampleRate: 48000 });
    const inputBus = ctx.createGain();
    const preDrive = ctx.createWaveShaper();
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 18000;
    toneFilter.Q.value = 0.7;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const leftDelay = ctx.createDelay(0.5);
    const rightDelay = ctx.createDelay(0.5);
    const feedback = ctx.createGain();
    const toneEcho = ctx.createBiquadFilter();
    toneEcho.type = 'lowpass';
    toneEcho.frequency.value = 6800;
    const output = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const dest = ctx.createMediaStreamDestination();

    inputBus.connect(preDrive);
    preDrive.connect(toneFilter);
    toneFilter.connect(compressor);
    compressor.connect(dry);
    compressor.connect(splitter);
    splitter.connect(leftDelay, 0);
    splitter.connect(rightDelay, 1);
    rightDelay.connect(toneEcho);
    toneEcho.connect(feedback);
    feedback.connect(leftDelay);
    leftDelay.connect(merger, 0, 0);
    rightDelay.connect(merger, 0, 1);
    merger.connect(wet);
    dry.connect(output);
    wet.connect(output);
    output.connect(limiter);
    limiter.connect(analyser);
    limiter.connect(ctx.destination);
    limiter.connect(dest);

    audioRef.current = {
      ctx,
      inputBus,
      preDrive,
      toneFilter,
      compressor,
      limiter,
      dry,
      wet,
      leftDelay,
      rightDelay,
      feedback,
      output,
      analyser,
      dest,
    };

    setDriveCurve(preDrive, fxScenes[fxPreset].drive);
    setIsReady(true);
    setStatusText('Audio online.');
    applyFxScene(fxPreset, false, ctx.currentTime);
  };

  const applyFxScene = (idx, flash = true, nowTime) => {
    setFxPreset(idx);
    const audio = audioRef.current;
    if (!audio) return;
    const fx = fxScenes[idx];
    const now = nowTime ?? audio.ctx.currentTime;
    const macro = macroKnobRef.current;
    setDriveCurve(audio.preDrive, fx.drive + noise * 0.12 + macro * 0.1);
    audio.toneFilter.frequency.cancelScheduledValues(now);
    audio.toneFilter.frequency.linearRampToValueAtTime(1800 + 14500 * fx.filter * tone + macro * 1800, now + 0.03);
    audio.leftDelay.delayTime.cancelScheduledValues(now);
    audio.rightDelay.delayTime.cancelScheduledValues(now);
    audio.leftDelay.delayTime.linearRampToValueAtTime(0.02 + fx.delay * 0.18 + space * 0.02 + macro * 0.01, now + 0.03);
    audio.rightDelay.delayTime.linearRampToValueAtTime(0.03 + fx.delay * 0.23 + space * 0.04 + macro * 0.015, now + 0.03);
    audio.feedback.gain.cancelScheduledValues(now);
    audio.feedback.gain.linearRampToValueAtTime(clamp(0.12 + space * 0.2 + fx.delay * 0.3 + macro * 0.08, 0.08, 0.56), now + 0.03);
    audio.wet.gain.cancelScheduledValues(now);
    audio.dry.gain.cancelScheduledValues(now);
    audio.wet.gain.linearRampToValueAtTime(clamp(fx.width * 0.4 + space * 0.22 + macro * 0.08, 0.06, 0.5), now + 0.03);
    audio.dry.gain.linearRampToValueAtTime(clamp(0.96 - fx.width * 0.18 - macro * 0.06, 0.64, 1), now + 0.03);
    audio.output.gain.cancelScheduledValues(now);
    audio.output.gain.linearRampToValueAtTime(master, now + 0.03);
    if (flash) flashAccent();
  };

  useEffect(() => {
    if (!audioRef.current) return;
    applyFxScene(fxPreset, false);
  }, [fxPreset, tone, space, noise]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.output.gain.setTargetAtTime(master, audio.ctx.currentTime, 0.02);
  }, [master]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.ctx.currentTime;
    audio.compressor.threshold.setTargetAtTime(-8 - compressAmount * 22, now, 0.03);
    audio.compressor.ratio.setTargetAtTime(1.8 + compressAmount * 8.5, now, 0.03);
    audio.compressor.attack.setTargetAtTime(0.002 + (1 - compressAmount) * 0.025, now, 0.03);
    audio.compressor.release.setTargetAtTime(0.08 + compressAmount * 0.28, now, 0.03);
    audio.compressor.knee.setTargetAtTime(8 + compressAmount * 22, now, 0.03);
  }, [compressAmount]);

  const connectToBus = (node, panAmount = 0) => {
    const audio = audioRef.current;
    const panner = audio.ctx.createStereoPanner();
    panner.pan.value = panAmount;
    node.connect(panner);
    panner.connect(audio.inputBus);
    return panner;
  };

  const attachCleanup = (sourceNode, nodes = [], durationMs = 1200) => {
    const cleanup = () => {
      [sourceNode, ...nodes].forEach((n) => {
        try { n.disconnect(); } catch {}
      });
    };
    sourceNode.onended = cleanup;
    window.setTimeout(cleanup, durationMs);
  };

  const resolveDrumFxLane = (type) => {
    if (type === 'kick' || type === 'kick2' || type === 'tom') return 'kick';
    if (type === 'snare' || type === 'snare2' || type === 'clap') return 'snare';
    return 'hat';
  };

  const routeLaneFx = (sourceNode, lane) => {
    const audio = audioRef.current;
    const macro = macroKnobRef.current;
    const fx = laneFxRef.current[lane] || { drive: 0, tone: 0.7, echo: 0, crush: 0, pan: 0 };
    const localDrive = audio.ctx.createWaveShaper();
    const localTone = audio.ctx.createBiquadFilter();
    const laneGain = audio.ctx.createGain();
    const echo = audio.ctx.createDelay(0.4);
    const echoGain = audio.ctx.createGain();
    const echoTone = audio.ctx.createBiquadFilter();
    const panner = audio.ctx.createStereoPanner();
    const echoPan = audio.ctx.createStereoPanner();

    setDriveCurve(localDrive, clamp(fx.drive + macro * 0.12, 0, 1));
    localTone.type = lane === 'hat' ? 'highpass' : 'lowpass';
    localTone.frequency.value = lane === 'hat' ? 1200 + fx.tone * 9000 + macro * 900 : 180 + fx.tone * 7800 + macro * 1200;
    localTone.Q.value = 0.5 + fx.crush * 2.2 + macro * 0.4;
    echo.delayTime.value = 0.04 + fx.echo * 0.22;
    echoGain.gain.value = clamp((fx.echo + macro * 0.08) * 0.26, 0, 0.38);
    echoTone.type = 'lowpass';
    echoTone.frequency.value = 1800 + fx.tone * 5200;
    laneGain.gain.value = 1 - fx.crush * 0.16;
    panner.pan.value = fx.pan;
    echoPan.pan.value = fx.pan * 0.7;

    sourceNode.connect(localDrive);
    localDrive.connect(localTone);
    localTone.connect(laneGain);
    laneGain.connect(panner);
    panner.connect(audio.inputBus);

    if (fx.echo > 0.001 || macro > 0.05) {
      laneGain.connect(echo);
      echo.connect(echoTone);
      echoTone.connect(echoGain);
      echoGain.connect(echoPan);
      echoPan.connect(audio.inputBus);
    }

    return [localDrive, localTone, laneGain, echo, echoGain, echoTone, panner, echoPan];
  };

  const rampEnv = (param, now, attack, decay, peak, end = 0.0001) => {
    param.cancelScheduledValues(now);
    param.setValueAtTime(0.0001, now);
    param.exponentialRampToValueAtTime(Math.max(0.0001, peak), now + Math.max(0.001, attack));
    param.exponentialRampToValueAtTime(Math.max(0.0001, end), now + Math.max(0.002, attack + decay));
  };

  const createNoiseBuffer = (lengthSeconds = 0.25, amount = 1) => {
    const audio = audioRef.current;
    const buffer = audio.ctx.createBuffer(1, Math.floor(audio.ctx.sampleRate * lengthSeconds), audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * amount;
    return buffer;
  };

  const safeStartStop = (node, start, stop) => {
    try { node.start(start); } catch {}
    try { node.stop(stop); } catch {}
  };

  const pickWave = (mode, family) => {
    if (family === 'bass' && bassWave !== 'auto') return bassWave;
    if (family === 'synth' && synthWave !== 'auto') return synthWave;
    return mode;
  };

  const playDrum = async (presetIndex = drumPreset, accent = 1) => {
    await initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    const p = drumPresets[presetIndex];
    const now = audio.ctx.currentTime + 0.002;
    const noiseBuffer = createNoiseBuffer(0.28, 0.28 + noise * 0.75);

    if (p.type.startsWith('kick')) {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      const shaper = audio.ctx.createWaveShaper();
      setDriveCurve(shaper, 0.18 + noise * 0.22);
      osc.type = p.type === 'kick' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(p.type === 'kick' ? 118 : 94, now);
      osc.frequency.exponentialRampToValueAtTime(44, now + 0.16);
      rampEnv(gain.gain, now, 0.001, 0.12 + drumDecay * 0.28, 0.98 * accent);
      osc.connect(shaper);
      shaper.connect(gain);
      const fxNodes = routeLaneFx(gain, 'kick');
      attachCleanup(osc, [gain, shaper, ...fxNodes], 700);
      safeStartStop(osc, now, now + 0.3);
      return;
    }

    if (p.type === 'tom') {
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(88, now + 0.18);
      rampEnv(gain.gain, now, 0.001, 0.1 + drumDecay * 0.24, 0.82 * accent);
      osc.connect(gain);
      const fxNodes = routeLaneFx(gain, resolveDrumFxLane('tom'));
      attachCleanup(osc, [gain, ...fxNodes], 700);
      safeStartStop(osc, now, now + 0.26);
      return;
    }

    const src = audio.ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = audio.ctx.createBiquadFilter();
    const gain = audio.ctx.createGain();
    const pan = p.type.includes('hat') ? 0.18 : p.type === 'metal' ? -0.14 : 0;

    switch (p.type) {
      case 'snare':
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        rampEnv(gain.gain, now, 0.001, 0.08 + drumDecay * 0.18, 0.7 * accent);
        break;
      case 'snare2':
        filter.type = 'highpass';
        filter.frequency.value = 1400;
        rampEnv(gain.gain, now, 0.001, 0.05 + drumDecay * 0.14, 0.58 * accent);
        break;
      case 'hat':
        filter.type = 'highpass';
        filter.frequency.value = 6400;
        rampEnv(gain.gain, now, 0.001, 0.015 + drumDecay * 0.07, 0.36 * accent);
        break;
      case 'hat2':
        filter.type = 'highpass';
        filter.frequency.value = 8200;
        rampEnv(gain.gain, now, 0.001, 0.01 + drumDecay * 0.045, 0.3 * accent);
        break;
      case 'clap':
        filter.type = 'bandpass';
        filter.frequency.value = 2200;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.58 * accent, now + 0.004);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
        gain.gain.linearRampToValueAtTime(0.34 * accent, now + 0.065);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.16);
        break;
      case 'metal':
        filter.type = 'bandpass';
        filter.frequency.value = 4700;
        rampEnv(gain.gain, now, 0.001, 0.03 + drumDecay * 0.14, 0.33 * accent);
        break;
      default:
        filter.type = 'bandpass';
        filter.frequency.value = 2600;
        rampEnv(gain.gain, now, 0.001, 0.08 + drumDecay * 0.18, 0.46 * accent);
        break;
    }

    src.playbackRate.value = 0.96 + Math.random() * 0.1;
    src.connect(filter);
    filter.connect(gain);
    const fxNodes = routeLaneFx(gain, resolveDrumFxLane(p.type));
    attachCleanup(src, [filter, gain, ...fxNodes], 900);
    safeStartStop(src, now, now + 0.24);
  };

  const playBass = async (presetIndex = bassPreset, note = bassNotes[bassPreset], accent = 1) => {
    await initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    const p = bassPresets[presetIndex];
    const now = audio.ctx.currentTime + 0.002;
    const f = noteToFreq[note] || 110;
    const bassShape = pickWave(p.mode, 'bass');

    const osc1 = audio.ctx.createOscillator();
    const osc2 = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    const filter = audio.ctx.createBiquadFilter();
    const sub = audio.ctx.createGain();
    const toneGain = audio.ctx.createGain();
    const lfo = audio.ctx.createOscillator();
    const lfoGain = audio.ctx.createGain();

    osc1.type = bassShape === 'sine' ? 'sine' : bassShape === 'triangle' ? 'triangle' : bassShape === 'square' ? 'square' : ['sub', 'tube', 'wet'].includes(p.mode) ? 'sine' : ['pulse', 'bit'].includes(p.mode) ? 'square' : 'sawtooth';
    osc2.type = bassShape === 'triangle' ? 'triangle' : bassShape === 'square' ? 'square' : p.mode === 'fm' ? 'triangle' : 'sawtooth';
    osc1.frequency.setValueAtTime(f, now);
    osc2.frequency.setValueAtTime(f * (p.mode === 'fm' ? 2.01 : 1.01), now);
    sub.gain.value = bassSubAmount * (p.mode === 'sub' ? 1.0 : 0.46);
    toneGain.gain.value = 0.18 + noise * 0.18;
    filter.type = p.mode === 'bit' ? 'highpass' : 'lowpass';
    filter.frequency.setValueAtTime(60 + bassCutoff * 2400 + tone * 1100 + presetIndex * 18, now);
    filter.Q.value = 0.6 + resonance * 8 + (p.mode === 'grit' ? 0.8 : 0);
    lfo.frequency.value = 0.4 + bassLfo * 10;
    lfoGain.gain.value = 1 + bassLfo * 16 + (p.mode === 'drone' ? 4 : 0);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    rampEnv(gain.gain, now, 0.003, p.mode === 'drone' ? 0.74 : 0.32, 0.82 * accent);
    osc1.connect(sub);
    osc2.connect(toneGain);
    sub.connect(filter);
    toneGain.connect(filter);
    filter.connect(gain);
    const fxNodes = routeLaneFx(gain, 'bass');
    attachCleanup(osc1, [osc2, lfo, sub, toneGain, filter, gain, lfoGain, ...fxNodes], 1200);

    safeStartStop(osc1, now, now + 0.58);
    safeStartStop(osc2, now, now + 0.58);
    safeStartStop(lfo, now, now + 0.58);
  };

  const playSynth = async (presetIndex = synthPreset, note = synthNotes[synthPreset], accent = 1) => {
    await initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    const p = synthPresets[presetIndex];
    const now = audio.ctx.currentTime + 0.002;
    const f = noteToFreq[note] || 440;
    const synthShape = pickWave(p.mode, 'synth');

    const oscA = audio.ctx.createOscillator();
    const oscB = audio.ctx.createOscillator();
    const mix = audio.ctx.createGain();
    const filter = audio.ctx.createBiquadFilter();
    const amp = audio.ctx.createGain();
    const vibr = audio.ctx.createOscillator();
    const vibrGain = audio.ctx.createGain();
    const noiseNode = audio.ctx.createBufferSource();
    const noiseGain = audio.ctx.createGain();

    noiseNode.buffer = createNoiseBuffer(0.7, noise);
    oscA.type = synthShape === 'sine' ? 'sine' : synthShape === 'triangle' ? 'triangle' : synthShape === 'square' ? 'square' : ['glass', 'bell', 'air'].includes(p.mode) ? 'triangle' : ['lead', 'star'].includes(p.mode) ? 'square' : 'sawtooth';
    oscB.type = synthShape === 'square' ? 'square' : synthShape === 'sine' ? 'sine' : ['pad', 'choir', 'mist'].includes(p.mode) ? 'sine' : 'triangle';
    oscA.frequency.value = f;
    oscB.frequency.value = f * (['bell', 'star', 'candy'].includes(p.mode) ? 1.5 : 1.01);
    filter.type = ['air', 'mist'].includes(p.mode) ? 'bandpass' : 'lowpass';
    filter.frequency.value = 180 + synthCutoff * 7600 + tone * 2200 + presetIndex * 24;
    filter.Q.value = 0.8 + resonance * 7 + (p.mode === 'bell' ? 1.6 : p.mode === 'glass' ? 0.8 : 0);
    vibr.frequency.value = 0.5 + synthLfo * 11;
    vibrGain.gain.value = 1 + synthLfo * 12 + (['lead', 'star'].includes(p.mode) ? 2 : 0);
    noiseGain.gain.value = ['mist', 'air', 'choir'].includes(p.mode) ? 0.18 + noise * 0.16 : 0.03;

    vibr.connect(vibrGain);
    vibrGain.connect(oscA.frequency);
    vibrGain.connect(oscB.frequency);
    oscA.connect(mix);
    oscB.connect(mix);
    noiseNode.connect(noiseGain);
    noiseGain.connect(mix);
    mix.connect(filter);
    filter.connect(amp);
    const fxNodes = routeLaneFx(amp, 'synth');
    attachCleanup(oscA, [oscB, vibr, noiseNode, mix, filter, amp, vibrGain, noiseGain, ...fxNodes], 1800);

    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(0.54 * accent, now + (0.005 + synthAttack * 0.18));
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + synthRelease * 1.25 + space * 0.42);

    safeStartStop(oscA, now, now + 1.4);
    safeStartStop(oscB, now, now + 1.4);
    safeStartStop(noiseNode, now, now + 1.4);
    safeStartStop(vibr, now, now + 1.4);
  };

  const playMetronome = async (isDownbeat = false) => {
    await initAudio();
    const audio = audioRef.current;
    if (!audio || !metronomeOn) return;
    const now = audio.ctx.currentTime + 0.001;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isDownbeat ? 1760 : 1320, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08 * metronomeLevel, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    osc.connect(gain);
    gain.connect(audio.inputBus);
    attachCleanup(osc, [gain], 120);
    safeStartStop(osc, now, now + 0.06);
  };

  const triggerLane = async (lane, accent = 1, forcedIndex = null) => {
    setActiveLane(lane);
    const level = laneVolumes[lane] ?? 1;
    const scaledAccent = accent * level;
    const laneLength = laneStepCountsRef.current[lane] || stepCountRef.current;
    const currentIndex = forcedIndex ?? (stepRef.current % laneLength);
    if (lane === 'kick') return playDrum(Math.min(drumPreset, 1), scaledAccent);
    if (lane === 'snare') return playDrum(drumPreset < 2 ? 2 : drumPreset < 4 ? drumPreset : drumPreset % 2 === 0 ? 12 : 3, scaledAccent);
    if (lane === 'hat') return playDrum(drumPreset < 4 ? 4 : drumPreset < 6 ? drumPreset : drumPreset % 2 === 0 ? 13 : 5, scaledAccent);
    if (lane === 'bass') return playBass(bassPreset, bassLineRef.current[currentIndex] || bassNotes[bassPreset % bassNotes.length], scaledAccent);
    if (lane === 'synth') return playSynth(synthPreset, synthLineRef.current[currentIndex] || synthNotes[synthPreset % synthNotes.length], scaledAccent);
  };

  const stopClock = () => {
    if (clockRef.current) clearTimeout(clockRef.current);
    clockRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
  };

  const scheduleNextTick = () => {
    const baseMs = (60 / bpmRef.current) * 1000 / 4;
    const nextIndex = (stepRef.current + 1) % stepCountRef.current;
    const isOdd = nextIndex % 2 === 1;
    const swingOffset = isOdd ? baseMs * swingRef.current : -baseMs * swingRef.current * 0.5;
    clockRef.current = window.setTimeout(runStep, Math.max(26, baseMs + swingOffset));
  };

  const runStep = async () => {
    if (!isPlayingRef.current) return;

    const current = stepRef.current;
    setStep(current);
    const currentPage = Math.floor(current / PAGE_SIZE);
    setPage(currentPage);

    if (metronomeOn && current % 4 === 0) {
      playMetronome(current % 16 === 0);
    }

    const accent = current % 4 === 0 ? 1 : 0.86;
    const livePatterns = patternsRef.current;

    for (const lane of LANE_KEYS) {
      const laneLength = laneStepCountsRef.current[lane] || stepCountRef.current;
      const laneIndex = current % laneLength;

      if (livePatterns[lane][laneIndex]) {
        const jitterMs = Math.floor((Math.random() - 0.5) * humanizeRef.current * 42);
        const grooveAccent = getGrooveAccent(grooveProfileRef.current, lane, laneIndex, grooveAmountRef.current);
        const macroAccent = 1 + macroKnobRef.current * 0.18;
        const finalAccent = accent * grooveAccent * macroAccent;
        window.setTimeout(() => triggerLane(lane, finalAccent, laneIndex), Math.max(0, jitterMs + 1));

        if (stutterOnRef.current && Math.random() < 0.18) {
          for (let i = 1; i < stutterBurstRef.current; i++) {
            window.setTimeout(() => triggerLane(lane, 0.7 * grooveAccent, laneIndex), i * 40 + Math.max(0, jitterMs));
          }
        }
      }
    }

    stepRef.current = (current + 1) % stepCountRef.current;

    if (isPlayingRef.current) {
      scheduleNextTick();
    }
  };

  const togglePlay = async () => {
    await initAudio();
    if (!audioRef.current) return;

    if (isPlayingRef.current) {
      stopClock();
      setStatusText('Stopped.');
      return;
    }

    if (audioRef.current.ctx.state === 'suspended') {
      await audioRef.current.ctx.resume();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);
    setStatusText('Running.');

    // 🔥 FIX: ensure loop scheduling starts properly
    runStep();
  };

  const toggleCell = (lane, idx) => {
    if (idx >= laneStepCounts[lane]) return;
    setPatterns((prev) => ({
      ...prev,
      [lane]: prev[lane].map((value, i) => (i === idx ? !value : value)),
    }));
  };

  const clearAll = () => {
    stopClock();
    setStep(0);
    stepRef.current = 0;
    setPatterns({
      kick: makeEmptyLane(),
      snare: makeEmptyLane(),
      hat: makeEmptyLane(),
      bass: makeEmptyLane(),
      synth: makeEmptyLane(),
    });
    setBassLine(makeEmptyNotes('C2'));
    setSynthLine(makeEmptyNotes('C4'));
    setLaneStepCounts({ kick: DEFAULT_STEPS, snare: DEFAULT_STEPS, hat: DEFAULT_STEPS, bass: DEFAULT_STEPS, synth: DEFAULT_STEPS });
    setSectionProfile('pulse-cell');
    setHarmonicProfile('minor');
    setGrooveProfile('steady');
    setStatusText('Pattern cleared.');
  };

  const handleStepCount = (nextCount) => {
    const safeCount = clamp(nextCount, 16, MAX_STEPS);
    setLaneStepCounts({ kick: safeCount, snare: safeCount, hat: safeCount, bass: safeCount, synth: safeCount });
    setStatusText(`${safeCount} step attivi su tutte le lane.`);
  };

  const setLaneStepCount = (lane, nextCount) => {
    const safeCount = clamp(nextCount, 16, MAX_STEPS);
    setLaneStepCounts((prev) => ({ ...prev, [lane]: safeCount }));
    setStatusText(`${lane.toUpperCase()} length set to ${safeCount}.`);
  };

  const randomize = () => {
    const freestyle = buildFreestylePattern(stepCount, laneStepCounts, density, chaos, { drumPreset, bassPreset, synthPreset }, { autoLength: true });
    setLaneStepCounts(freestyle.laneLengths);
    setPatterns(freestyle.patterns);
    setBassLine(freestyle.bassLine);
    setSynthLine(freestyle.synthLine);
    setSectionProfile(freestyle.sectionProfile);
    setHarmonicProfile(freestyle.harmonicProfile);
    setGrooveProfile(freestyle.grooveProfile);
    setDrumPreset(freestyle.drumPreset);
    setBassPreset(freestyle.bassPreset);
    setSynthPreset(freestyle.synthPreset);
    setFxPreset(freestyle.fxPreset);
    setStatusText(`Freestyle composed · ${freestyle.sectionProfile} · ${freestyle.grooveProfile} · ${freestyle.harmonicProfile}`);
    flashAccent();
  };

  const applySnapshot = (snap, label = 'Project loaded.') => {
    if (!snap) return;
    stopClock();
    if (snap.projectName) setProjectName(snap.projectName);
    if (typeof snap.bpm === 'number') setBpm(snap.bpm);
    if (typeof snap.swing === 'number') setSwing(snap.swing);
    if (typeof snap.density === 'number') setDensity(snap.density);
    if (typeof snap.chaos === 'number') setChaos(snap.chaos);
    if (typeof snap.tone === 'number') setTone(snap.tone);
    if (typeof snap.noise === 'number') setNoise(snap.noise);
    if (typeof snap.space === 'number') setSpace(snap.space);
    if (typeof snap.master === 'number') setMaster(snap.master);
    if (typeof snap.compressAmount === 'number') setCompressAmount(snap.compressAmount);
    if (typeof snap.resonance === 'number') setResonance(snap.resonance);
    if (typeof snap.bassLfo === 'number') setBassLfo(snap.bassLfo);
    if (typeof snap.synthLfo === 'number') setSynthLfo(snap.synthLfo);
    if (typeof snap.drumDecay === 'number') setDrumDecay(snap.drumDecay);
    if (typeof snap.bassCutoff === 'number') setBassCutoff(snap.bassCutoff);
    if (typeof snap.synthCutoff === 'number') setSynthCutoff(snap.synthCutoff);
    if (typeof snap.bassSubAmount === 'number') setBassSubAmount(snap.bassSubAmount);
    if (typeof snap.synthAttack === 'number') setSynthAttack(snap.synthAttack);
    if (typeof snap.synthRelease === 'number') setSynthRelease(snap.synthRelease);
    if (typeof snap.stutterBurst === 'number') setStutterBurst(snap.stutterBurst);
    if (typeof snap.stutterOn === 'boolean') setStutterOn(snap.stutterOn);
    if (typeof snap.macroKnob === 'number') setMacroKnob(snap.macroKnob);
    if (typeof snap.grooveAmount === 'number') setGrooveAmount(snap.grooveAmount);
    if (typeof snap.metronomeOn === 'boolean') setMetronomeOn(snap.metronomeOn);
    if (typeof snap.metronomeLevel === 'number') setMetronomeLevel(snap.metronomeLevel);
    if (snap.harmonicProfile) setHarmonicProfile(snap.harmonicProfile);
    if (snap.grooveProfile) setGrooveProfile(snap.grooveProfile);
    if (snap.sectionProfile) setSectionProfile(snap.sectionProfile);
    if (snap.bassWave) setBassWave(snap.bassWave);
    if (snap.synthWave) setSynthWave(snap.synthWave);
    if (typeof snap.drumPreset === 'number') setDrumPreset(snap.drumPreset);
    if (typeof snap.bassPreset === 'number') setBassPreset(snap.bassPreset);
    if (typeof snap.synthPreset === 'number') setSynthPreset(snap.synthPreset);
    if (typeof snap.fxPreset === 'number') setFxPreset(snap.fxPreset);
    if (snap.laneStepCounts) setLaneStepCounts(snap.laneStepCounts);
    if (snap.patterns) setPatterns(snap.patterns);
    if (snap.bassLine) setBassLine(snap.bassLine);
    if (snap.synthLine) setSynthLine(snap.synthLine);
    if (snap.laneFx) setLaneFx(snap.laneFx);
    if (snap.laneVolumes) setLaneVolumes(snap.laneVolumes);
    setStatusText(label);
  };

  const serializeScene = () => ({
    bpm, swing, density, chaos, tone, noise, space, master,
    compressAmount, resonance, bassLfo, synthLfo, drumDecay,
    bassWave, synthWave, bassCutoff, synthCutoff, bassSubAmount,
    synthAttack, synthRelease, stutterBurst, stutterOn,
    macroKnob, grooveAmount, harmonicProfile, grooveProfile, sectionProfile,
    drumPreset, bassPreset, synthPreset, fxPreset,
    laneStepCounts, patterns, bassLine, synthLine, laneFx, laneVolumes,
    projectName, metronomeOn, metronomeLevel,
  });

  const saveScene = (slot) => {
    const snap = serializeScene();
    setSceneSlots((prev) => prev.map((item, idx) => idx === slot ? snap : item));
    setCurrentScene(slot);
    setStatusText(`Scene ${slot + 1} saved.`);
  };

  const loadScene = (slot) => {
    const snap = sceneSlots[slot];
    if (!snap) {
      setStatusText(`Scene ${slot + 1} empty.`);
      return;
    }
    applySnapshot(snap, `Scene ${slot + 1} loaded.`);
    setCurrentScene(slot);
  };

  const saveProjectLocal = () => {
    try {
      const snap = serializeScene();
      window.localStorage.setItem('cesira-project-autoload', JSON.stringify(snap));
      setStatusText('Project saved locally.');
    } catch {
      setStatusText('Local save failed.');
    }
  };

  const loadProjectLocal = () => {
    try {
      const raw = window.localStorage.getItem('cesira-project-autoload');
      if (!raw) {
        setStatusText('No local project found.');
        return;
      }
      applySnapshot(JSON.parse(raw), 'Project loaded from local save.');
    } catch {
      setStatusText('Local load failed.');
    }
  };

  const saveProjectSlot = (slot) => {
    try {
      const snap = serializeScene();
      const item = {
        label: projectName || `Project ${slot + 1}`,
        stamp: new Date().toLocaleString(),
        data: snap,
      };
      setProjectSlots((prev) => prev.map((entry, idx) => idx === slot ? item : entry));
      setCurrentProjectSlot(slot);
      setStatusText(`Project slot ${slot + 1} saved.`);
    } catch {
      setStatusText('Project slot save failed.');
    }
  };

  const loadProjectSlot = (slot) => {
    const item = projectSlots[slot];
    if (!item?.data) {
      setStatusText(`Project slot ${slot + 1} empty.`);
      return;
    }
    applySnapshot(item.data, `Project slot ${slot + 1} loaded.`);
    setCurrentProjectSlot(slot);
  };

  const clearProjectSlot = (slot) => {
    setProjectSlots((prev) => prev.map((entry, idx) => idx === slot ? null : entry));
    if (currentProjectSlot === slot) setCurrentProjectSlot(null);
    setStatusText(`Project slot ${slot + 1} cleared.`);
  };

  const exportProjectJson = () => {
    try {
      const snap = serializeScene();
      const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (projectName || 'cesira-session').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
      a.href = url;
      a.download = `${safeName || 'cesira-session'}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 500);
      setStatusText('Project exported as JSON.');
    } catch {
      setStatusText('Project export failed.');
    }
  };

  const importProjectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const snap = JSON.parse(text);
      applySnapshot(snap, 'Project imported.');
    } catch {
      setStatusText('Project import failed.');
    } finally {
      if (event.target) event.target.value = '';
    }
  };

  const renderTransportSummary = () => `${Math.round(bpm)} BPM · ${stepCount} step · ${grooveProfile.toUpperCase()} · ${harmonicProfile.toUpperCase()}`;

  const downloadRecording = (item) => {
    const a = document.createElement('a');
    a.href = item.url;
    a.download = item.name;
    a.click();
  };

  const startRecording = async () => {
    await initAudio();
    const audio = audioRef.current;
    if (!audio || recState === 'recording') return;

    const preferred = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
    ];
    const mime = preferred.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported?.(type)) || '';

    chunksRef.current = [];
    const recorder = mime ? new MediaRecorder(audio.dest.stream, { mimeType: mime }) : new MediaRecorder(audio.dest.stream);
    recorderRef.current = recorder;
    setRecordMime(mime || 'audio/webm');

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const finalType = mime || recorder.mimeType || 'audio/webm';
      const ext = finalType.includes('mp4') ? 'm4a' : 'webm';
      const blob = new Blob(chunksRef.current, { type: finalType });
      const url = URL.createObjectURL(blob);
      setRecordings((prev) => [
        { url, name: `pocket-drift-take-${prev.length + 1}.${ext}` },
        ...prev.slice(0, 5),
      ]);
      setRecState('idle');
      setStatusText('Recording saved.');
    };

    recorder.start();
    setRecState('recording');
    setStatusText('Recording...');
  };

  const stopRecording = () => {
    if (recorderRef.current && recState === 'recording') {
      recorderRef.current.stop();
      setRecState('stopping');
      setStatusText('Finalizing take...');
    }
  };

  const jumpPage = (dir) => {
    setPage((prev) => clamp(prev + dir, 0, totalPages - 1));
  };

  const getLaneNotePool = (lane) => {
    const mode = MODES[harmonicProfileRef.current] || MODES.minor;
    if (lane === 'bass') {
      return mode.bass;
    }
    if (lane === 'synth') {
      return mode.synth;
    }
    return [];
  };

  const setStepNote = (lane, idx, note) => {
    if (lane === 'bass') {
      if (idx >= laneStepCounts.bass || !patterns.bass[idx]) return;
      setBassLine((prev) => prev.map((value, i) => (i === idx ? note : value)));
      setStatusText(`Bass note set on step ${idx + 1}: ${note}`);
      return;
    }
    if (lane === 'synth') {
      if (idx >= laneStepCounts.synth || !patterns.synth[idx]) return;
      setSynthLine((prev) => prev.map((value, i) => (i === idx ? note : value)));
      setStatusText(`Synth note set on step ${idx + 1}: ${note}`);
    }
  };

  const randomizeLaneNotes = (lane) => {
    const pool = getLaneNotePool(lane);
    if (!pool.length) return;
    if (lane === 'bass') {
      let changed = false;
      setBassLine((prev) => prev.map((value, i) => {
        if (i < laneStepCounts.bass && patterns.bass[i]) {
          const next = seededChoice(pool);
          if (next !== value) changed = true;
          return next;
        }
        return value;
      }));
      setStatusText(changed ? 'Bass notes randomized.' : 'Bass notes held by current harmony.');
      return;
    }
    let changed = false;
    setSynthLine((prev) => prev.map((value, i) => {
      if (i < laneStepCounts.synth && patterns.synth[i]) {
        const next = seededChoice(pool);
        if (next !== value) changed = true;
        return next;
      }
      return value;
    }));
    setStatusText(changed ? 'Synth notes randomized.' : 'Synth notes held by current harmony.');
  };

  const shiftLaneNotes = (lane, direction = 1) => {
    const pool = getLaneNotePool(lane);
    if (!pool.length) return;

    if (lane === 'bass') {
      let changed = false;
      setBassLine((prev) => prev.map((value, i) => {
        if (i >= laneStepCounts.bass || !patterns.bass[i]) return value;
        const at = pool.indexOf(value);
        const next = pool[at === -1 ? 0 : (at + direction + pool.length) % pool.length];
        if (next !== value) changed = true;
        return next;
      }));
      setStatusText(changed ? `Bass notes shifted ${direction > 0 ? 'up' : 'down'}.` : 'No active bass notes to shift.');
      return;
    }

    let changed = false;
    setSynthLine((prev) => prev.map((value, i) => {
      if (i >= laneStepCounts.synth || !patterns.synth[i]) return value;
      const at = pool.indexOf(value);
      const next = pool[at === -1 ? 0 : (at + direction + pool.length) % pool.length];
      if (next !== value) changed = true;
      return next;
    }));
    setStatusText(changed ? `Synth notes shifted ${direction > 0 ? 'up' : 'down'}.` : 'No active synth notes to shift.');
  };

  const fillLane = (lane, amount) => {
    setPatterns((prev) => {
      const next = { ...prev, [lane]: [...prev[lane]] };
      for (let i = 0; i < laneStepCounts[lane]; i++) {
        next[lane][i] = Math.random() < amount;
      }
      return next;
    });
    setStatusText(`${lane.toUpperCase()} filled.`);
  };

  const rotateLane = (lane, direction = 1) => {
    setPatterns((prev) => {
      const laneLength = laneStepCounts[lane];
      const source = prev[lane].slice(0, laneLength);
      const shifted = source.map((_, i) => source[(i - direction + laneLength) % laneLength]);
      const next = { ...prev, [lane]: [...prev[lane]] };
      for (let i = 0; i < laneLength; i++) next[lane][i] = shifted[i];
      return next;
    });
    setStatusText(`${lane.toUpperCase()} rotated.`);
  };

  const mutateLane = (lane) => {
    setPatterns((prev) => {
      const next = { ...prev, [lane]: [...prev[lane]] };
      const laneLength = laneStepCounts[lane];
      const flips = Math.max(2, Math.floor(laneLength * (0.05 + chaos * 0.08)));
      for (let i = 0; i < flips; i++) {
        const pos = Math.floor(Math.random() * laneLength);
        next[lane][pos] = !next[lane][pos];
      }
      return next;
    });
    setStatusText(`${lane.toUpperCase()} mutated.`);
  };

  const autoJam = () => {
    const freestyle = buildFreestylePattern(stepCount, laneStepCounts, clamp(density + 0.08, 0.1, 0.95), clamp(chaos + 0.12, 0, 1), { drumPreset, bassPreset, synthPreset }, { autoLength: true });
    setLaneStepCounts(freestyle.laneLengths);
    setPatterns(freestyle.patterns);
    setBassLine(freestyle.bassLine);
    setSynthLine(freestyle.synthLine);
    setSectionProfile(freestyle.sectionProfile);
    setHarmonicProfile(freestyle.harmonicProfile);
    setGrooveProfile(freestyle.grooveProfile);
    setDrumPreset(freestyle.drumPreset);
    setBassPreset(freestyle.bassPreset);
    setSynthPreset(freestyle.synthPreset);
    setFxPreset(freestyle.fxPreset);
    setTone(clamp(0.35 + Math.random() * 0.55, 0.1, 1));
    setNoise(clamp(0.14 + Math.random() * 0.62, 0, 1));
    setSpace(clamp(0.12 + Math.random() * 0.58, 0, 1));
    setSwing(clamp(Math.random() * 0.18, 0, 0.25));
    setBassCutoff(clamp(0.2 + Math.random() * 0.65, 0, 1));
    setSynthCutoff(clamp(0.28 + Math.random() * 0.62, 0, 1));
    setBassSubAmount(clamp(0.35 + Math.random() * 0.65, 0.1, 1));
    setSynthAttack(clamp(Math.random() * 0.45, 0, 1));
    setSynthRelease(clamp(0.2 + Math.random() * 0.75, 0, 1));
    setLaneFx((prev) => ({
      kick: { ...prev.kick, drive: clamp(0.08 + Math.random() * 0.3, 0, 1), tone: clamp(0.3 + Math.random() * 0.45, 0, 1), echo: 0 },
      snare: { ...prev.snare, drive: clamp(0.06 + Math.random() * 0.22, 0, 1), tone: clamp(0.42 + Math.random() * 0.38, 0, 1), echo: clamp(Math.random() * 0.16, 0, 1) },
      hat: { ...prev.hat, tone: clamp(0.6 + Math.random() * 0.35, 0, 1), crush: clamp(Math.random() * 0.22, 0, 1) },
      bass: { ...prev.bass, drive: clamp(0.08 + Math.random() * 0.28, 0, 1), tone: clamp(0.2 + Math.random() * 0.4, 0, 1), echo: clamp(Math.random() * 0.08, 0, 1) },
      synth: { ...prev.synth, drive: clamp(0.06 + Math.random() * 0.24, 0, 1), tone: clamp(0.46 + Math.random() * 0.4, 0, 1), echo: clamp(0.08 + Math.random() * 0.22, 0, 1) },
    }));
    setStatusText(`Auto Jam composed · ${freestyle.sectionProfile} · ${freestyle.grooveProfile} · ${freestyle.harmonicProfile}`);
    flashAccent();
  };

  const triggerStutter = () => {
    const lane = activeLane;
    const burst = Math.max(2, stutterBurst);
    for (let i = 0; i < burst; i++) {
      window.setTimeout(() => {
        triggerLane(lane, i === 0 ? 1 : 0.78);
      }, i * 55);
    }
    setStatusText(`${lane.toUpperCase()} stutter x${burst}.`);
    flashAccent();
  };

  const BigKnob = ({ label, value, setValue, min = 0, max = 1, step = 0.01, formatter }) => (
    <div
      className="rounded-3xl border border-white/10 p-4"
      style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.9), rgba(30,41,59,0.82))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 30px rgba(0,0,0,0.24)' }}
    >
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-emerald-400"
      />
      <div className="mt-2 text-sm font-semibold text-white">{formatter ? formatter(value) : Number(value).toFixed(2)}</div>
    </div>
  );

  const PresetStrip = ({ title, items, active, onSelect, onPreview }) => (
    <div
      className="rounded-[28px] border border-white/10 p-4"
      style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,41,59,0.88))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 40px rgba(0,0,0,0.22)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {items.map((item, idx) => (
          <button
            key={item.name}
            onClick={() => onSelect(idx)}
            onDoubleClick={() => onPreview(idx)}
            className={classNames(
              'rounded-2xl border px-3 py-3 text-left text-xs font-semibold transition',
              active === idx
                ? 'border-emerald-400 bg-emerald-400 text-slate-950 shadow-lg'
                : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
            )}
          >
            <div>{item.name}</div>
            <div className="mt-1 opacity-60">#{idx + 1}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.08),_transparent_22%),linear-gradient(180deg,_#0f172a,_#111827)] p-4 text-slate-100 md:p-6 font-medium" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <div
        id="pdl-shell"
        className="mx-auto max-w-7xl rounded-[38px] border border-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-6"
        style={makeGloss('linear-gradient(145deg, rgba(15,23,42,0.94), rgba(17,24,39,0.88))')}
      >
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-[260px]">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-200">
               CESIRA V 1.0
            </div>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white outline-none"
              placeholder="Project name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <button onClick={togglePlay} className="rounded-2xl border border-emerald-400/20 bg-emerald-500 px-4 py-3 text-slate-950 shadow-lg transition hover:scale-[1.02]">
              <div className="flex items-center justify-center gap-2"> {isPlaying ? 'Stop' : 'Play'}</div>
            </button>
            <button onClick={randomize} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 shadow-lg">
              <div className="flex items-center justify-center gap-2">Freestyle</div>
            </button>
            <button
              onClick={recState === 'recording' ? stopRecording : startRecording}
              className={classNames(
                'rounded-2xl border border-white/10 px-4 py-3 font-semibold shadow-lg',
                recState === 'recording' ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-200'
              )}
            >
              <div className="flex items-center justify-center gap-2">
                 {recState === 'recording' ? 'Stop Rec' : 'Record'}
              </div>
            </button>
            <button onClick={clearAll} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 shadow-lg">
              <div className="flex items-center justify-center gap-2">Clear</div>
            </button>
            <button onClick={saveProjectLocal} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 shadow-lg">
              <div className="flex items-center justify-center gap-2">Save</div>
            </button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.7fr,1fr]">
          <div className="rounded-[28px] border border-white/10 p-4" style={makeGloss('linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,41,59,0.9))')}>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Freestyle grid</div>
                <div className="text-lg font-bold">5 lanes · {stepCount} step</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[16, 32, 48, 64].map((size) => (
                  <button
                    key={size}
                    onClick={() => handleStepCount(size)}
                    className={classNames(
                      'rounded-2xl border px-3 py-2 text-sm font-bold transition',
                      stepCount === size ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-200'
                    )}
                  >
                    {size}
                  </button>
                ))}
                <div className="rounded-2xl bg-black/20 px-3 py-2 text-sm font-extrabold tracking-[0.08em] text-white">Step {step + 1} / {stepCount}</div>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <button onClick={() => jumpPage(-1)} className="rounded-xl bg-white/5 p-2 text-slate-200 shadow-sm disabled:opacity-40" disabled={page === 0}>←</button>
              <div className="text-sm font-extrabold tracking-[0.08em] text-white">Page {page + 1} / {totalPages} · step {visibleStart + 1}–{visibleEnd}</div>
              <button onClick={() => jumpPage(1)} className="rounded-xl bg-white/5 p-2 text-slate-200 shadow-sm disabled:opacity-40" disabled={page >= totalPages - 1}>→</button>
            </div>

            <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-slate-200">
              Groove: <span className="uppercase text-emerald-300">{grooveProfile}</span> · Harmonic: <span className="uppercase text-cyan-300">{harmonicProfile}</span> · Section: <span className="uppercase text-amber-300">{sectionProfile}</span>
            </div>
            <div className="space-y-3 overflow-x-auto pb-1">
              {laneLabels.map(({ key, label, long }) => (
                <div key={key} className="grid min-w-[780px] grid-cols-[72px,1fr] items-center gap-3">
                  <div className="space-y-2">
                    <button
                      onClick={() => triggerLane(key, 1)}
                      className={classNames(
                        'w-full rounded-2xl border border-white/10 px-3 py-3 text-sm font-black shadow-sm transition',
                        activeLane === key ? 'bg-emerald-400 text-slate-950' : 'bg-white/5 text-slate-200 hover:bg-white/10'
                      )}
                    >
                      {label}
                    </button>
                    <div className="text-center text-[9px] font-medium uppercase tracking-[0.28em] text-slate-500">{long}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {[16, 32, 48, 64].map((size) => (
                        <button
                          key={`${key}-len-${size}`}
                          onClick={() => setLaneStepCount(key, size)}
                          className={classNames(
                            'rounded-lg border px-1 py-1 text-[9px] font-bold',
                            laneStepCounts[key] === size ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-300'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-16 gap-2">
                    {visibleIndices.map((idx) => {
                      const on = patterns[key][idx];
                      const isActiveStep = step === idx && isPlaying;
                      const isAccent = idx % 4 === 0;
                      return (
                        <button
                          key={`${key}-${idx}`}
                          onClick={() => toggleCell(key, idx)}
                          className={classNames(
                            'h-11 rounded-xl border transition',
                            idx >= laneStepCounts[key] ? 'opacity-30 cursor-not-allowed bg-white/30' : '',
                            isActiveStep ? 'scale-[1.05] border-emerald-400 ring-2 ring-emerald-300' : isAccent ? 'border-slate-300' : 'border-white/10',
                            on ? 'bg-emerald-400 text-slate-950 shadow-md' : 'bg-white/5 hover:bg-white/10'
                          )}
                        >
                          <span className="text-[10px] font-extrabold tracking-[0.06em] opacity-80">{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <BigKnob label="BPM" value={bpm} setValue={setBpm} min={70} max={170} step={1} formatter={(v) => `${Math.round(v)} BPM`} />
            <BigKnob label="Swing" value={swing} setValue={setSwing} min={0} max={0.25} step={0.01} />
            <BigKnob label="Density" value={density} setValue={setDensity} min={0.1} max={0.9} step={0.01} />
            <BigKnob label="Chaos" value={chaos} setValue={setChaos} min={0} max={1} step={0.01} />
            <BigKnob label="Humanize" value={humanize} setValue={setHumanize} min={0} max={0.3} step={0.01} />
            <BigKnob label="Macro" value={macroKnob} setValue={setMacroKnob} min={0} max={1} step={0.01} />
            <BigKnob label="Groove" value={grooveAmount} setValue={setGrooveAmount} min={0} max={1} step={0.01} />
            <BigKnob label="Master" value={master} setValue={setMaster} min={0.1} max={1} step={0.01} />
            <BigKnob label="Tone" value={tone} setValue={setTone} min={0.1} max={1} step={0.01} />
            <BigKnob label="Noise" value={noise} setValue={setNoise} min={0} max={1} step={0.01} />
            <BigKnob label="Space" value={space} setValue={setSpace} min={0} max={1} step={0.01} />
            <BigKnob label="Compressor" value={compressAmount} setValue={setCompressAmount} min={0} max={1} step={0.01} />
            <BigKnob label="Resonance" value={resonance} setValue={setResonance} min={0} max={1} step={0.01} />
            <BigKnob label="Bass LFO" value={bassLfo} setValue={setBassLfo} min={0} max={1} step={0.01} />
            <BigKnob label="Synth LFO" value={synthLfo} setValue={setSynthLfo} min={0} max={1} step={0.01} />
            <BigKnob label="Drum Decay" value={drumDecay} setValue={setDrumDecay} min={0.1} max={1} step={0.01} />
            <BigKnob label="Bass Cutoff" value={bassCutoff} setValue={setBassCutoff} min={0} max={1} step={0.01} />
            <BigKnob label="Synth Cutoff" value={synthCutoff} setValue={setSynthCutoff} min={0} max={1} step={0.01} />
            <BigKnob label="Bass Sub" value={bassSubAmount} setValue={setBassSubAmount} min={0.1} max={1} step={0.01} />
            <BigKnob label="Synth Attack" value={synthAttack} setValue={setSynthAttack} min={0} max={1} step={0.01} />
            <BigKnob label="Synth Release" value={synthRelease} setValue={setSynthRelease} min={0} max={1} step={0.01} />
            <div className="rounded-3xl border border-white/10 p-4 backdrop-blur-xl" style={makeGloss('linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.46))')}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Bass Wave</div>
              <div className="grid grid-cols-2 gap-2">
                {['auto','sine','triangle','square','sawtooth'].map((wave) => (
                  <button key={`bass-${wave}`} onClick={() => setBassWave(wave)} className={classNames('rounded-2xl border px-3 py-2 text-xs font-bold', bassWave === wave ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-200')}>
                    {wave}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 p-4 backdrop-blur-xl" style={makeGloss('linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.46))')}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Synth Wave</div>
              <div className="grid grid-cols-2 gap-2">
                {['auto','sine','triangle','square','sawtooth'].map((wave) => (
                  <button key={`synth-${wave}`} onClick={() => setSynthWave(wave)} className={classNames('rounded-2xl border px-3 py-2 text-xs font-bold', synthWave === wave ? 'border-emerald-400 bg-emerald-400 text-slate-950' : 'border-white/10 bg-white/5 text-slate-200')}>
                    {wave}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 p-4 backdrop-blur-xl" style={makeGloss('linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.46))')}>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Status</div>
              <div className="space-y-2 text-sm text-slate-200">
                <div className="flex justify-between"><span>Audio</span><span className="font-bold">{isReady ? 'Ready' : 'Tap Play'}</span></div>
                <div className="flex justify-between"><span>Recorder</span><span className="font-bold">{recState}</span></div>
                <div className="flex justify-between"><span>FX Scene</span><span className="font-bold">{fxScenes[fxPreset].name}</span></div>
                <div className="flex justify-between"><span>Lane</span><span className="font-bold uppercase">{activeLane}</span></div>
                <div className="flex justify-between"><span>Bass Wave</span><span className="font-bold uppercase">{bassWave}</span></div>
                <div className="flex justify-between"><span>Synth Wave</span><span className="font-bold uppercase">{synthWave}</span></div>
                <div className="flex justify-between"><span>Stutter</span><span className="font-bold uppercase">{stutterOn ? `x${stutterBurst}` : 'off'}</span></div>
                <div className="flex justify-between"><span>Groove</span><span className="font-bold uppercase">{grooveProfile}</span></div>
                <div className="flex justify-between"><span>Harmony</span><span className="font-bold uppercase">{harmonicProfile}</span></div>
                <div className="flex justify-between"><span>Section</span><span className="font-bold uppercase">{sectionProfile}</span></div>
                <div className="flex justify-between"><span>Limiter</span><span className="font-bold uppercase">on</span></div>
                <div className="mt-3 rounded-2xl bg-white/5 p-3 text-xs font-semibold text-slate-300">{statusText}</div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Scenes</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[0,1,2,3].map((slot) => (
                      <div key={`scene-${slot}`} className={classNames('rounded-xl border p-2', currentScene === slot ? 'border-emerald-400/60 bg-emerald-400/10' : sceneSlots[slot] ? 'border-cyan-400/30 bg-cyan-400/5' : 'border-white/10 bg-white/5')}>
                        <div className="mb-2 text-[11px] font-extrabold tracking-[0.08em] text-white">S{slot + 1}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => loadScene(slot)}
                            disabled={!sceneSlots[slot]}
                            className={classNames('rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em]', sceneSlots[slot] ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-white/5 text-slate-500 opacity-50 cursor-not-allowed')}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => saveScene(slot)}
                            className="rounded-lg bg-emerald-400 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-[28px] border border-white/10 p-4" style={makeGloss('linear-gradient(135deg, rgba(17,24,39,0.94), rgba(30,41,59,0.9))')}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Quick performance</div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <button onClick={() => setMetronomeOn((v) => !v)} className={classNames('rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em]', metronomeOn ? 'bg-emerald-400 text-slate-950' : 'bg-black/20 text-slate-200')}>Metro</button>
                <input type="range" min={0} max={1} step={0.01} value={metronomeLevel} onChange={(e) => setMetronomeLevel(Number(e.target.value))} className="w-20 accent-emerald-400" />
              </div>
              <div className="flex gap-2">
                <button onClick={autoJam} className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white shadow">Auto Jam</button>
                <button onClick={randomize} className="rounded-2xl bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200 shadow">Compose</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <button onClick={() => triggerLane('kick', 1)} className="rounded-2xl bg-white/5 px-4 py-5 font-bold shadow">Kick</button>
              <button onClick={() => triggerLane('snare', 1)} className="rounded-2xl bg-white/5 px-4 py-5 font-bold shadow">Snare</button>
              <button onClick={() => triggerLane('hat', 1)} className="rounded-2xl bg-white/5 px-4 py-5 font-bold shadow">Hat</button>
              <button onClick={() => triggerLane('bass', 1)} className="rounded-2xl bg-white/5 px-4 py-5 font-bold shadow">Bass</button>
              <button onClick={() => triggerLane('synth', 1)} className="rounded-2xl bg-white/5 px-4 py-5 font-bold shadow">Synth</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              {laneLabels.map(({ key, long }) => (
                <button key={key} onClick={() => fillLane(key, clamp(density + 0.12, 0.15, 0.95))} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200">
                  Fill {long}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              <button onClick={() => rotateLane(activeLane, 1)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">Rotate lane</button>
              <button onClick={() => mutateLane(activeLane)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">Mutate lane</button>
              <button onClick={() => rotateLane(activeLane, -1)} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-200">Rotate back</button>
              <button onClick={triggerStutter} className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white">Stutter</button>
            </div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Live retrig</div>
                <button onClick={() => setStutterOn((v) => !v)} className={classNames('rounded-2xl px-3 py-2 text-xs font-bold uppercase tracking-[0.14em]', stutterOn ? 'bg-emerald-400 text-slate-950' : 'bg-white/5 text-slate-200')}>
                  {stutterOn ? 'Armed' : 'Arm'}
                </button>
              </div>
              <input type="range" min={2} max={8} step={1} value={stutterBurst} onChange={(e) => setStutterBurst(Number(e.target.value))} className="w-full accent-emerald-400" />
              <div className="mt-2 text-sm font-semibold text-slate-200">Burst {stutterBurst} · premi Stutter per retrigger live sulla lane attiva</div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
  <div className="mb-3 flex items-center justify-between">
    <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Note editor</div>
    <div className="flex gap-2">
      {['bass','synth'].map((lane) => (
        <button key={lane} onClick={() => setNoteEditLane(lane)} className={classNames('rounded-xl px-3 py-1 text-xs font-bold', noteEditLane===lane?'bg-emerald-400 text-slate-950':'bg-white/5 text-slate-200')}>
          {lane}
        </button>
      ))}
    </div>
  </div>

  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
    {visibleIndices.map((idx)=>{
      const laneOn = noteEditLane==='bass'
        ? (idx < laneStepCounts.bass && patterns.bass[idx])
        : (idx < laneStepCounts.synth && patterns.synth[idx]);

      const currentNote = noteEditLane==='bass' ? bassLine[idx] : synthLine[idx];
      const pool = getLaneNotePool(noteEditLane);

      return (
        <div key={idx} className={classNames('rounded-xl p-2 text-center', laneOn?'bg-slate-900':'bg-black/20 opacity-30')}>
          <div className="text-[9px] mb-1 opacity-50">{idx+1}</div>
          <button
            disabled={!laneOn}
            onClick={()=>{
              if(!pool.length) return;
              const next = pool[(pool.indexOf(currentNote)+1)%pool.length];
              setStepNote(noteEditLane, idx, next);
            }}
            className={classNames(
              'w-full rounded-lg py-2 text-xs font-bold transition',
              laneOn
                ? 'bg-emerald-400 text-slate-950 active:scale-95'
                : 'bg-white/10 text-slate-500'
            )}
          >
            {currentNote}
          </button>
        </div>
      );
    })}
  </div>

  <div className="mt-3 grid grid-cols-3 gap-2">
    <button onClick={()=>shiftLaneNotes(noteEditLane,-1)} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold">Down</button>
    <button onClick={()=>randomizeLaneNotes(noteEditLane)} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold">Random</button>
    <button onClick={()=>shiftLaneNotes(noteEditLane,1)} className="rounded-xl bg-white/5 px-3 py-2 text-xs font-bold">Up</button>
  </div>
</div>


          </div>

          <div className="rounded-[28px] border border-white/10 p-4" style={makeGloss('linear-gradient(135deg, rgba(17,24,39,0.94), rgba(30,41,59,0.9))')}>
            <div className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">Export · Save · Recorder</div>
            <div className="mb-3 rounded-2xl bg-white/5 p-3 text-xs font-semibold text-slate-300">Formato attuale: {recordMime}. Export JSON, salvataggio locale, project slots e recorder sono integrati. Il recorder cattura l’uscita master reale del browser.</div>
            <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] font-semibold tracking-[0.04em] text-slate-300">{renderTransportSummary()}</div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button onClick={loadProjectLocal} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">Load local</button>
              <button onClick={exportProjectJson} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">Export JSON</button>
              <button onClick={() => importInputRef.current?.click()} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-200">Import JSON</button>
              <button onClick={saveProjectLocal} className="rounded-2xl border border-emerald-400/20 bg-emerald-500 px-3 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-950">Quick save</button>
            </div>
            <input ref={importInputRef} type="file" accept="application/json" onChange={importProjectFile} className="hidden" />
            <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Project slots</div>
              <div className="grid gap-2">
                {[0,1,2,3].map((slot) => (
                  <div key={`project-slot-${slot}`} className={classNames('rounded-xl border p-3', currentProjectSlot === slot ? 'border-emerald-400/60 bg-emerald-400/10' : projectSlots[slot] ? 'border-cyan-400/30 bg-cyan-400/5' : 'border-white/10 bg-white/5')}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-extrabold tracking-[0.08em] text-white">P{slot + 1}</div>
                        <div className="text-[10px] text-slate-400">{projectSlots[slot]?.label || 'Empty slot'}</div>
                        <div className="text-[10px] text-slate-500">{projectSlots[slot]?.stamp || '—'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => loadProjectSlot(slot)} disabled={!projectSlots[slot]} className={classNames('rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em]', projectSlots[slot] ? 'bg-white/5 text-slate-200 hover:bg-white/10' : 'bg-white/5 text-slate-500 opacity-50 cursor-not-allowed')}>Load</button>
                        <button onClick={() => saveProjectSlot(slot)} className="rounded-lg bg-emerald-400 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-950">Save</button>
                        <button onClick={() => clearProjectSlot(slot)} className="rounded-lg bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">Clear</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {recordings.length === 0 ? (
                <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300">Nessuna registrazione ancora. Premi Record, poi Play o usa i pad live. Il file esportato viene preso direttamente dall’uscita master.</div>
              ) : recordings.map((item, idx) => (
                <div key={item.url} className="rounded-2xl bg-white/5 p-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-200">Take {idx + 1}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{projectName}</div>
                    </div>
                    <button onClick={() => downloadRecording(item)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"><div className="flex items-center gap-1">Save</div></button>
                  </div>
                  <audio controls src={item.url} className="w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <PresetStrip title="Drums · 16 suoni" items={drumPresets} active={drumPreset} onSelect={setDrumPreset} onPreview={(i) => playDrum(i)} />
          <PresetStrip title="Bass · 16 suoni" items={bassPresets} active={bassPreset} onSelect={setBassPreset} onPreview={(i) => playBass(i, bassNotes[i % bassNotes.length])} />
          <PresetStrip title="Synth · 16 suoni" items={synthPresets} active={synthPreset} onSelect={setSynthPreset} onPreview={(i) => playSynth(i, synthNotes[i % synthNotes.length])} />
          <PresetStrip title="FX Scenes · 16 look" items={fxScenes} active={fxPreset} onSelect={(i) => setFxPreset(i)} onPreview={(i) => applyFxScene(i)} />
        </div>
      </div>
    </div>
  );
}
