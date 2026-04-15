import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_STEPS = 64;
const DEFAULT_STEPS = 16;
const DEFAULT_BPM = 112;
const LANE_KEYS = ['kick','snare','hat','bass','synth'];
const PAGE_SIZE = 16;
const SCHEDULE_AHEAD = 0.14;
const LOOKAHEAD_MS = 20;
const UNDO_LIMIT = 24;

const LANE_COLOR = {kick:'#f87171',snare:'#fbbf24',hat:'#fde047',bass:'#22d3ee',synth:'#a78bfa'};
const LANE_CH    = {kick:1,snare:2,hat:3,bass:4,synth:5}; // MIDI channels

const drumPresets = [
  {name:'Kick Melt',type:'kick'},{name:'Kick Rubber',type:'kick2'},
  {name:'Snare Dust',type:'snare'},{name:'Snare Glass',type:'snare2'},
  {name:'Hat Tin',type:'hat'},{name:'Hat Steam',type:'hat2'},
  {name:'Clap Fog',type:'clap'},{name:'Tom Oil',type:'tom'},
  {name:'Metal Ping',type:'metal'},{name:'Noise Burst',type:'noise'},
  {name:'Kick Velvet',type:'kick'},{name:'Kick Asphalt',type:'kick2'},
  {name:'Snare Paper',type:'snare'},{name:'Hat Razor',type:'hat2'},
  {name:'Clap Static',type:'clap'},{name:'Metal Spray',type:'metal'},
];
const bassPresets = [
  {name:'Sub Worm',mode:'sub'},{name:'Grit Mono',mode:'grit'},
  {name:'FM Swamp',mode:'fm'},{name:'Pulse Root',mode:'pulse'},
  {name:'Broken Tube',mode:'tube'},{name:'Drone Heel',mode:'drone'},
  {name:'Wet Rubber',mode:'wet'},{name:'Fold Bass',mode:'fold'},
  {name:'Saw Mud',mode:'saw'},{name:'Bit Spine',mode:'bit'},
  {name:'Sub Resin',mode:'sub'},{name:'Mono Soot',mode:'grit'},
  {name:'FM Tar',mode:'fm'},{name:'Pulse Coal',mode:'pulse'},
  {name:'Wet Iron',mode:'wet'},{name:'Saw Heel',mode:'saw'},
];
const synthPresets = [
  {name:'Toy Glass',mode:'glass'},{name:'Gummy Pad',mode:'pad'},
  {name:'Chrome Mist',mode:'mist'},{name:'Bent Lead',mode:'lead'},
  {name:'Tiny Choir',mode:'choir'},{name:'Wobble Bell',mode:'bell'},
  {name:'Plastic Bloom',mode:'bloom'},{name:'Fold Star',mode:'star'},
  {name:'Noir Air',mode:'air'},{name:'FM Candy',mode:'candy'},
  {name:'Glass Thread',mode:'glass'},{name:'Mist Tape',mode:'mist'},
  {name:'Lead Bubble',mode:'lead'},{name:'Choir Toy',mode:'choir'},
  {name:'Bell Smoke',mode:'bell'},{name:'Air Bloom',mode:'air'},
];
const fxScenes = [
  {name:'Clean Glow',drive:0.05,filter:1.0,width:0.18,delay:0.08},
  {name:'Tape Jelly',drive:0.15,filter:0.86,width:0.28,delay:0.14},
  {name:'Lo-Fi Milk',drive:0.25,filter:0.72,width:0.24,delay:0.18},
  {name:'Metal Dream',drive:0.32,filter:0.92,width:0.42,delay:0.1},
  {name:'Crushed Air',drive:0.42,filter:0.62,width:0.1,delay:0.22},
  {name:'Room Spill',drive:0.18,filter:0.88,width:0.48,delay:0.16},
  {name:'Warp Bloom',drive:0.36,filter:0.77,width:0.4,delay:0.24},
  {name:'Deep Plastic',drive:0.22,filter:0.68,width:0.28,delay:0.2},
  {name:'Neon Rust',drive:0.48,filter:0.58,width:0.31,delay:0.12},
  {name:'Ghost Machine',drive:0.28,filter:0.81,width:0.56,delay:0.26},
  {name:'Bright Spill',drive:0.1,filter:0.95,width:0.52,delay:0.09},
  {name:'Mud Halo',drive:0.31,filter:0.55,width:0.16,delay:0.2},
  {name:'Stereo Melt',drive:0.24,filter:0.9,width:0.62,delay:0.18},
  {name:'Glass Spill',drive:0.18,filter:0.98,width:0.46,delay:0.28},
  {name:'Narrow Burn',drive:0.44,filter:0.52,width:0.08,delay:0.14},
  {name:'Toy Chamber',drive:0.2,filter:0.84,width:0.36,delay:0.22},
];

const bassNotes=['C2','D2','E2','G2','A2','C3','D3','E3','G3','A3'];
const synthNotes=['C4','D4','Eb4','G4','A4','C5','D5','Eb5','G5','A5'];
const noteToFreq={
  C2:65.41,Db2:69.3,D2:73.42,Eb2:77.78,E2:82.41,F2:87.31,G2:98.0,Ab2:103.83,A2:110.0,Bb2:116.54,
  C3:130.81,Db3:138.59,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196.0,A3:220.0,
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,G4:392.0,Ab4:415.3,A4:440.0,Bb4:466.16,
  C5:523.25,Db5:554.37,D5:587.33,Eb5:622.25,F5:698.46,G5:783.99,A5:880.0,
};
// note name → MIDI note number for MIDI out
const noteToMidi={
  C2:36,Db2:37,D2:38,Eb2:39,E2:40,F2:41,G2:43,Ab2:44,A2:45,Bb2:46,
  C3:48,Db3:49,D3:50,Eb3:51,E3:52,F3:53,G3:55,A3:57,
  C4:60,Db4:61,D4:62,Eb4:63,E4:64,F4:65,G4:67,Ab4:68,A4:69,Bb4:70,
  C5:72,Db5:73,D5:74,Eb5:75,F5:77,G5:79,A5:81,
};
// ─── Musical theory ────────────────────────────────────────────────────────────
const MODES={
  minor:   {bass:['C2','D2','Eb2','F2','G2','Ab2','Bb2','C3','D3','Eb3'],synth:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5','D5','Eb5']},
  phrygian:{bass:['C2','Db2','Eb2','F2','G2','Ab2','Bb2','C3','Db3','Eb3'],synth:['C4','Db4','Eb4','F4','G4','Ab4','Bb4','C5','Db5','Eb5']},
  dorian:  {bass:['C2','D2','Eb2','F2','G2','A2','Bb2','C3','D3','Eb3'],synth:['C4','D4','Eb4','F4','G4','A4','Bb4','C5','D5','Eb5']},
  chroma:  {bass:['C2','Db2','D2','Eb2','E2','F2','G2','Ab2','A2','Bb2'],synth:['C4','Db4','D4','Eb4','E4','F4','G4','Ab4','A4','Bb4']},
  mixo:    {bass:['C2','D2','E2','F2','G2','A2','Bb2','C3','D3','E3'],synth:['C4','D4','E4','F4','G4','A4','Bb4','C5','D5','E5']},
  lydian:  {bass:['C2','D2','E2','F#2','G2','A2','B2','C3','D3','E3'],synth:['C4','D4','E4','F#4','G4','A4','B4','C5','D5','E5']},
};

// Chord functions — each chord picks notes from mode scale degrees
const CHORD_PROGRESSIONS = {
  minor: [
    [{root:0,third:2,fifth:4},{root:5,third:0,fifth:2},{root:3,third:5,fifth:0},{root:4,third:0,fifth:2}], // i-vi-iv-v
    [{root:0,third:2,fifth:4},{root:3,third:5,fifth:0},{root:4,third:0,fifth:2},{root:0,third:2,fifth:4}], // i-iv-v-i
    [{root:0,third:2,fifth:4},{root:5,third:0,fifth:2},{root:6,third:1,fifth:3},{root:4,third:0,fifth:2}], // i-vi-vii-v
    [{root:0,third:2,fifth:4},{root:2,third:4,fifth:6},{root:3,third:5,fifth:0},{root:4,third:0,fifth:2}], // i-iii-iv-v
  ],
  phrygian:[
    [{root:0,third:1,fifth:3},{root:1,third:3,fifth:5},{root:3,third:5,fifth:0},{root:1,third:3,fifth:5}],
    [{root:0,third:1,fifth:3},{root:6,third:1,fifth:3},{root:3,third:5,fifth:0},{root:0,third:1,fifth:3}],
  ],
  dorian:[
    [{root:0,third:2,fifth:4},{root:5,third:0,fifth:2},{root:3,third:5,fifth:0},{root:4,third:0,fifth:2}],
    [{root:0,third:2,fifth:4},{root:1,third:3,fifth:5},{root:3,third:5,fifth:0},{root:6,third:1,fifth:3}],
  ],
  mixo:[
    [{root:0,third:2,fifth:4},{root:6,third:1,fifth:3},{root:4,third:6,fifth:1},{root:0,third:2,fifth:4}],
    [{root:0,third:2,fifth:4},{root:3,third:5,fifth:0},{root:6,third:1,fifth:3},{root:4,third:6,fifth:1}],
  ],
  lydian:[
    [{root:0,third:2,fifth:4},{root:3,third:5,fifth:0},{root:4,third:6,fifth:1},{root:2,third:4,fifth:6}],
  ],
  chroma:[
    [{root:0,third:1,fifth:4},{root:3,third:6,fifth:1},{root:7,third:2,fifth:5},{root:4,third:9,fifth:2}],
  ],
};

// Section archetypes — how a "part" of a song feels
const SECTION_ARCHETYPES = {
  intro:    {kickMult:0.5,snareMult:0.4,hatMult:0.6,bassMult:0.7,synthMult:0.5,velCurve:'rise',probFloor:0.55,lenBias:2},
  build:    {kickMult:0.75,snareMult:0.6,hatMult:0.9,bassMult:0.9,synthMult:0.7,velCurve:'rise',probFloor:0.65,lenBias:1.5},
  drop:     {kickMult:1.2,snareMult:1.0,hatMult:1.0,bassMult:1.1,synthMult:0.9,velCurve:'accent',probFloor:0.8,lenBias:1},
  groove:   {kickMult:1.0,snareMult:1.0,hatMult:1.1,bassMult:1.0,synthMult:1.0,velCurve:'groove',probFloor:0.75,lenBias:1},
  break:    {kickMult:0.3,snareMult:0.5,hatMult:0.4,bassMult:0.6,synthMult:1.2,velCurve:'flat',probFloor:0.5,lenBias:3},
  outro:    {kickMult:0.6,snareMult:0.5,hatMult:0.5,bassMult:0.5,synthMult:0.6,velCurve:'fall',probFloor:0.45,lenBias:2},
};

// Voice leading: move by smallest interval in scale
function voiceLead(currentNote, pool, direction='any'){
  if(!pool.length)return currentNote;
  const idx=pool.indexOf(currentNote);
  if(idx===-1)return pool[Math.floor(Math.random()*pool.length)];
  if(direction==='up')return pool[Math.min(idx+1,pool.length-1)];
  if(direction==='down')return pool[Math.max(idx-1,0)];
  // 'any': prefer step motion, allow occasional leap
  const r=Math.random();
  if(r<0.55)return pool[Math.min(idx+1,pool.length-1)];
  if(r<0.8)return pool[Math.max(idx-1,0)];
  return pool[clamp(idx+(Math.random()<0.5?2:-2),0,pool.length-1)];
}

// Velocity curves for different section archetypes
function velCurve(type, stepIdx, totalSteps, phraseWeight){
  const t=stepIdx/totalSteps;
  switch(type){
    case'rise':  return clamp(0.35+t*0.65*phraseWeight,0.2,1);
    case'fall':  return clamp(0.95-t*0.55,0.2,1);
    case'accent':return stepIdx%4===0?clamp(0.9+phraseWeight*0.1,0.7,1):clamp(0.55+phraseWeight*0.3,0.3,0.85);
    case'groove':return stepIdx%8===0?0.95:stepIdx%4===0?0.78:stepIdx%2===0?0.62:0.45+Math.random()*0.2;
    case'flat':  return clamp(0.6+phraseWeight*0.2,0.4,0.85);
    default:     return clamp(0.5+phraseWeight*0.5,0.3,1);
  }
}

// Arpeggio patterns
function arpeggiate(notes, mode, step, total){
  if(!notes.length)return notes[0];
  const n=notes.length;
  switch(mode){
    case'up':    return notes[step%n];
    case'down':  return notes[(n-1)-(step%n)];
    case'updown':{const period=n*2-2;const p=step%period;return p<n?notes[p]:notes[period-p];}
    case'random':return notes[Math.floor(Math.random()*n)];
    case'outside':{const p=step%n;return p%2===0?notes[Math.floor(p/2)]:notes[n-1-Math.floor(p/2)];}
    default:     return notes[step%n];
  }
}

// Build chord notes from progression
function chordNotes(chord, pool){
  const len=pool.length;
  return [
    pool[chord.root%len],
    pool[chord.third%len],
    pool[chord.fifth%len],
  ].filter(Boolean);
}

function chooseMode(chaos){
  if(chaos>0.82)return seededChoice(['chroma','phrygian']);
  if(chaos>0.62)return seededChoice(['minor','phrygian','dorian']);
  if(chaos>0.42)return seededChoice(['minor','dorian','mixo']);
  return seededChoice(['minor','mixo','lydian']);
}
function chooseGroove(density,chaos){
  if(density>0.68&&chaos>0.45)return'bunker';
  if(chaos>0.62)return'broken';
  if(density<0.38)return'float';
  return'steady';
}
function chooseSection(density,chaos,iterCount){
  // iterCount: how many times Freestyle/AutoJam has been pressed this session
  if(iterCount===0)return seededChoice(['intro','groove']);
  if(density<0.3)return seededChoice(['break','intro']);
  if(density>0.75&&chaos>0.5)return seededChoice(['drop','drop','groove']);
  if(density>0.55)return seededChoice(['groove','build','drop']);
  return seededChoice(['groove','break','build']);
}

function buildNoteLanes(stepCount, modeName, grooveName, chaos, progression, arpeMode, sectionType){
  const mode=MODES[modeName]||MODES.minor;
  const arch=SECTION_ARCHETYPES[sectionType]||SECTION_ARCHETYPES.groove;
  const bassPool=mode.bass;
  const synthPool=mode.synth;
  const bassLine=makeEmptyNotes(bassPool[0]);
  const synthLine=makeEmptyNotes(synthPool[0]);
  const chordLen=Math.floor(stepCount/4); // 4 chords across the pattern
  let lastBass=bassPool[0];

  for(let i=0;i<stepCount;i++){
    const chordIdx=Math.floor(i/chordLen)%progression.length;
    const chord=progression[chordIdx];
    const bassChordNotes=chordNotes(chord,bassPool);
    const synthChordNotes=chordNotes(chord,synthPool);

    // Bass: voice leading within chord tones, occasional passing tone
    const isPassingTone=Math.random()<chaos*0.15;
    if(isPassingTone){
      lastBass=voiceLead(lastBass,bassPool,'any');
    } else {
      // Move to nearest chord tone
      const nearest=bassChordNotes.reduce((best,n)=>{
        const bIdx=bassPool.indexOf(best),nIdx=bassPool.indexOf(n);
        const cIdx=bassPool.indexOf(lastBass);
        return Math.abs(nIdx-cIdx)<Math.abs(bIdx-cIdx)?n:best;
      },bassChordNotes[0]);
      lastBass=nearest;
    }
    bassLine[i]=lastBass;

    // Synth: arpeggio over chord tones, with occasional chromatic colour
    synthLine[i]=arpeggiate(synthChordNotes,arpeMode,i,stepCount);
  }

  return{bassLine,synthLine};
}

function chooseLaneLengths(density,chaos,grooveName){
  const banks={
    steady:[{kick:16,snare:16,hat:16,bass:32,synth:32,section:'pulse-cell'},{kick:32,snare:16,hat:32,bass:32,synth:48,section:'night-drive'},{kick:16,snare:32,hat:16,bass:48,synth:64,section:'slow-rise'}],
    broken:[{kick:32,snare:16,hat:32,bass:32,synth:48,section:'fracture-loop'},{kick:32,snare:32,hat:48,bass:32,synth:64,section:'split-engine'},{kick:16,snare:48,hat:32,bass:48,synth:32,section:'off-axis'}],
    bunker:[{kick:16,snare:32,hat:16,bass:32,synth:48,section:'pressure-room'},{kick:32,snare:16,hat:32,bass:16,synth:64,section:'steel-corridor'},{kick:16,snare:16,hat:48,bass:32,synth:64,section:'locked-floor'}],
    float: [{kick:32,snare:32,hat:48,bass:32,synth:64,section:'mist-window'},{kick:16,snare:48,hat:32,bass:48,synth:64,section:'ghost-hall'},{kick:16,snare:32,hat:48,bass:32,synth:48,section:'soft-tilt'}],
  };
  const sel=seededChoice(banks[grooveName]||banks.steady),allowed=[16,32,48,64];
  const snap=v=>allowed.reduce((b,c)=>Math.abs(c-v)<Math.abs(b-v)?c:b,allowed[0]),nudge=chaos>0.72?8:density>0.64?0:-4;
  return{kick:snap(clamp(sel.kick+nudge,16,MAX_STEPS)),snare:snap(clamp(sel.snare+nudge,16,MAX_STEPS)),hat:snap(clamp(sel.hat+nudge,16,MAX_STEPS)),bass:snap(clamp(sel.bass+nudge,16,MAX_STEPS)),synth:snap(clamp(sel.synth+nudge,16,MAX_STEPS)),section:sel.section};
}

function getGrooveAccent(profile,lane,stepIndex,amount){
  const pos=stepIndex%16;
  const maps={
    steady:{kick:[1.2,1,0.92,0.96,1,0.94,0.98,0.96,1.18,0.98,0.92,0.96,1.02,0.96,0.98,0.96],snare:[0.92,0.9,0.92,0.9,1.16,0.92,0.92,0.9,0.92,0.9,0.92,0.9,1.12,0.92,0.92,0.9],hat:[0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.06,0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.08],bass:[1.1,0.96,0.98,1.02,0.96,0.94,1,1.04,1.08,0.96,0.98,1.02,0.96,0.94,1,1.04],synth:[0.96,1,1.04,1,0.96,1,1.08,1,0.96,1,1.04,1,0.96,1,1.12,1]},
    broken:{kick:[1.22,0.88,1.04,0.84,0.96,1.06,0.9,1.02,1.14,0.86,1.08,0.82,0.94,1.04,0.9,1.06],snare:[0.88,0.94,0.9,1,1.12,0.9,0.96,0.9,0.88,1,0.9,0.96,1.1,0.88,1,0.92],hat:[0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.12,0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.16],bass:[1.06,0.94,1.1,0.88,1,0.94,1.08,0.9,1.04,0.94,1.1,0.88,1,0.94,1.08,0.92],synth:[0.92,1.04,1.12,0.9,0.94,1.08,1.14,0.88,0.92,1.04,1.1,0.9,0.94,1.08,1.16,0.86]},
    bunker:{kick:[1.28,0.92,0.94,0.9,1.02,0.92,0.94,0.9,1.24,0.92,0.94,0.9,1.04,0.92,0.94,0.9],snare:[0.9,0.9,0.92,0.9,1.08,0.9,0.92,0.9,0.9,0.9,0.92,0.9,1.06,0.9,0.92,0.9],hat:[0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.04,0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.06],bass:[1.16,0.94,0.96,1,1.04,0.94,0.96,1.02,1.14,0.94,0.96,1,1.06,0.94,0.96,1.04],synth:[0.9,0.98,1.02,0.96,0.9,0.98,1.06,0.96,0.9,0.98,1.02,0.96,0.9,0.98,1.1,0.96]},
    float: {kick:[1.12,0.98,0.96,1,1.04,0.98,0.96,1,1.1,0.98,0.96,1,1.02,0.98,0.96,1],snare:[0.94,0.98,0.96,1,1.06,0.98,0.96,1,0.94,0.98,0.96,1,1.08,0.98,0.96,1],hat:[0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.06,0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.08],bass:[1.04,0.98,1,1.02,1.04,0.98,1,1.04,1.02,0.98,1,1.02,1.06,0.98,1,1.04],synth:[1,1.04,1.08,1.02,1,1.04,1.1,1.02,1,1.04,1.08,1.02,1,1.04,1.12,1.02]},
  };
  const table=(maps[profile]||maps.steady)[lane]||maps.steady.kick;return 1+(table[pos]||1-1)*clamp(amount,0,1);
}

// Main generative function — now musically aware
function buildFreestylePattern(stepCount,laneStepCounts,density,chaos,currentPresets,options={}){
  const grooveName=chooseGroove(density,chaos);
  const modeName=chooseMode(chaos);
  const sectionType=options.sectionType||chooseSection(density,chaos,options.iterCount||0);
  const arch=SECTION_ARCHETYPES[sectionType]||SECTION_ARCHETYPES.groove;
  const arpeMode=seededChoice(['up','down','updown','random','outside']);
  const autoLength=options.autoLength??true;
  const gl=autoLength?chooseLaneLengths(density,chaos,grooveName):{...laneStepCounts,section:'manual-grid'};
  const ell={kick:gl.kick||laneStepCounts.kick||stepCount,snare:gl.snare||laneStepCounts.snare||stepCount,hat:gl.hat||laneStepCounts.hat||stepCount,bass:gl.bass||laneStepCounts.bass||stepCount,synth:gl.synth||laneStepCounts.synth||stepCount};
  const masterLength=Math.max(...Object.values(ell));

  // Pick a chord progression for this mode
  const progPool=CHORD_PROGRESSIONS[modeName]||CHORD_PROGRESSIONS.minor;
  const progression=seededChoice(progPool);

  const{bassLine,synthLine}=buildNoteLanes(masterLength,modeName,grooveName,chaos,progression,arpeMode,sectionType);

  const p={kick:makeStepData(),snare:makeStepData(),hat:makeStepData(),bass:makeStepData(),synth:makeStepData()};
  const groove=GROOVE_MAP[grooveName];
  const bar=16;
  const phraseShape=seededChoice(['anchor','stagger','mirror','fall','wave']);

  for(const lane of LANE_KEYS){
    const ll=ell[lane]||masterLength;
    const laneMult=arch[lane+'Mult']??1;
    for(let i=0;i<ll;i++){
      const pos=i%bar,strong=pos===0||pos===8,backbeat=pos===4||pos===12,offbeat=pos%2===1,pb=Math.floor(i/8)%4;
      const pw=phraseShape==='anchor'?[1,0.75,0.92,0.68][pb]:phraseShape==='stagger'?[0.72,1,0.66,0.94][pb]:phraseShape==='mirror'?[1,0.78,0.78,1][pb]:phraseShape==='wave'?[0.6,0.8,1,0.85][pb]:[1,0.9,0.68,0.56][pb];
      let hit=false;
      const dm=density*laneMult;
      if(lane==='kick'){if(strong||Math.random()<(groove.kickBias+dm*0.18+(strong?0.2:0))*pw)hit=true;}
      else if(lane==='snare'){if(backbeat||Math.random()<(groove.snareBias+dm*0.08+(backbeat?0.26:0))*(1.06-pw*0.18))hit=true;}
      else if(lane==='hat'){if(Math.random()<(!offbeat?groove.hatBias-0.08+dm*0.2:groove.hatBias+dm*0.16)*(0.82+pw*0.22))hit=true;}
      else if(lane==='bass'){if(Math.random()<(pos===0||pos===3||pos===7?0.94:groove.bassBias+dm*0.14)*(0.8+pw*0.26))hit=true;}
      else if(lane==='synth'){if((Math.random()<(pos===2||pos===6||pos===10?0.72:groove.synthBias+dm*0.1)*(0.7+pw*0.34)&&!strong)||(pb===3&&Math.random()<0.18+chaos*0.16))hit=true;}
      if(hit){
        p[lane][i].on=true;
        // Probability from section archetype
        p[lane][i].prob=clamp(arch.probFloor+Math.random()*(1-arch.probFloor),arch.probFloor,1);
        // Velocity from curve
        p[lane][i].vel=clamp(velCurve(arch.velCurve,i,ll,pw),0.25,1);
        // Note length from section bias + lane type
        const baseLenBias=arch.lenBias;
        if(lane==='bass'||lane==='synth'){
          const r=Math.random();
          p[lane][i].len=r<0.5?baseLenBias:r<0.75?baseLenBias*2:r<0.9?0.5:baseLenBias*0.75;
        } else {
          p[lane][i].len=1;
        }
      }
    }
  }
  // Guarantee anchors
  for(let i=0;i<ell.kick;i+=16)p.kick[i].on=true;
  for(let i=0;i<ell.snare;i+=16){if(i+4<ell.snare)p.snare[i+4].on=true;if(i+12<ell.snare)p.snare[i+12].on=true;}
  // Mutation passes
  const mp=Math.max(2,Math.floor(chaos*10));
  for(let m=0;m<mp;m++){const lane=seededChoice(LANE_KEYS),ll=ell[lane]||masterLength,pos=Math.floor(Math.random()*ll);
    if(lane==='hat'){p.hat[pos].on=!p.hat[pos].on;}
    else if(lane==='kick'){if(pos%4!==0)p.kick[pos].on=Math.random()<0.42+chaos*0.22;}
    else if(lane==='bass'||lane==='synth'){p[lane][pos].on=!p[lane][pos].on;}
    else{p.snare[pos].on=!p.snare[pos].on&&pos%4!==0;}
  }
  for(let i=ell.bass;i<MAX_STEPS;i++)bassLine[i]=bassLine[Math.max(0,i%Math.max(1,ell.bass))];
  for(let i=ell.synth;i<MAX_STEPS;i++)synthLine[i]=synthLine[Math.max(0,i%Math.max(1,ell.synth))];

  return{patterns:p,bassLine,synthLine,laneLengths:ell,
    sectionProfile:sectionType+' · '+gl.section,
    harmonicProfile:modeName,grooveProfile:grooveName,arpeMode,
    drumPreset:Math.floor((Math.random()*drumPresets.length+currentPresets.drumPreset*0.35)%drumPresets.length),
    bassPreset:Math.floor((Math.random()*bassPresets.length+currentPresets.bassPreset*0.35)%bassPresets.length),
    synthPreset:Math.floor((Math.random()*synthPresets.length+currentPresets.synthPreset*0.35)%synthPresets.length),
    fxPreset:Math.floor(Math.random()*fxScenes.length),
  };
}

// ─── Core helpers (needed by both generative and component code) ──────────────
const GROOVE_MAP={
  steady:{kickBias:0.22,snareBias:0.16,hatBias:0.58,bassBias:0.22,synthBias:0.12},
  broken:{kickBias:0.28,snareBias:0.14,hatBias:0.46,bassBias:0.28,synthBias:0.18},
  bunker:{kickBias:0.34,snareBias:0.1,hatBias:0.34,bassBias:0.24,synthBias:0.14},
  float: {kickBias:0.16,snareBias:0.12,hatBias:0.5,bassBias:0.18,synthBias:0.28},
};
const makeStepData=()=>Array.from({length:MAX_STEPS},()=>({on:false,prob:1.0,len:1,vel:1.0}));
const clamp=(v,mn,mx)=>Math.min(mx,Math.max(mn,v));
const seededChoice=arr=>arr[Math.floor(Math.random()*arr.length)];
const rotateArray=(arr,steps)=>arr.map((_,i)=>arr[(i-steps+arr.length)%arr.length]);
const makeEmptyNotes=(d='C2')=>Array.from({length:MAX_STEPS},()=>d);
function makePatternTemplate(sc=DEFAULT_STEPS){
  const p={kick:makeStepData(),snare:makeStepData(),hat:makeStepData(),bass:makeStepData(),synth:makeStepData()};
  [0,8,12,24,32,40,56].forEach(i=>{if(i<sc)p.kick[i].on=true;});
  [4,12,20,28,36,44,52,60].forEach(i=>{if(i<sc)p.snare[i].on=true;});
  for(let i=0;i<sc;i+=2)p.hat[i].on=true;
  [0,3,7,10,13,18,22,29,33,39,46,53].forEach(i=>{if(i<sc)p.bass[i].on=true;});
  [2,6,11,14,19,27,35,43,50,58].forEach(i=>{if(i<sc)p.synth[i].on=true;});
  return p;
}

// ─── UI Components ─────────────────────────────────────────────────────────────
const B0='#080d18',B1='rgba(255,255,255,0.025)',BD='rgba(255,255,255,0.07)';

function Knob({label,value,setValue,min=0,max=1,step=0.01,fmt,size=36,color='#34d399'}){
  const pct=(value-min)/(max-min);
  const startAngle=-225,totalArc=270;
  const angle=startAngle+totalArc*pct;
  const r=size/2-4,cx=size/2,cy=size/2;
  const toXY=(deg,radius)=>{const rad=(deg-90)*Math.PI/180;return{x:cx+radius*Math.cos(rad),y:cy+radius*Math.sin(rad)};};
  const ts=toXY(startAngle,r),te=toXY(startAngle+totalArc,r),fe=toXY(angle,r);
  const lgt=totalArc>180?1:0,lgf=totalArc*pct>180?1:0;
  const dragging=useRef(false),startY=useRef(0),startVal=useRef(value);
  useEffect(()=>{
    const onMove=e=>{if(!dragging.current)return;const delta=(startY.current-e.clientY)/180;setValue(clamp(startVal.current+delta*(max-min),min,max));};
    const onUp=()=>{dragging.current=false;};
    window.addEventListener('mousemove',onMove,{passive:true});window.addEventListener('mouseup',onUp);
    return()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp);};
  },[min,max,setValue]);
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1px',cursor:'ns-resize'}}
      onMouseDown={e=>{dragging.current=true;startY.current=e.clientY;startVal.current=value;e.preventDefault();}}>
      <svg width={size} height={size} style={{overflow:'visible'}}>
        <path d={`M${ts.x},${ts.y} A${r},${r} 0 ${lgt},1 ${te.x},${te.y}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" strokeLinecap="round"/>
        {pct>0.01&&<path d={`M${ts.x},${ts.y} A${r},${r} 0 ${lgf},1 ${fe.x},${fe.y}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{filter:`drop-shadow(0 0 3px ${color}66)`}}/>}
        <circle cx={cx} cy={cy} r={r-3} fill="rgba(0,0,0,0.4)" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
        <circle cx={fe.x} cy={fe.y} r="3" fill={color} style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
        <text x={cx} y={cy+3.5} textAnchor="middle" fontSize="7.5" fontWeight="800" fill={color} fontFamily="Inter,sans-serif">{fmt?fmt(value):value.toFixed(2)}</text>
      </svg>
      <div style={{fontSize:'7px',fontWeight:800,letterSpacing:'0.12em',color:'#475569',textTransform:'uppercase',textAlign:'center'}}>{label}</div>
    </div>
  );
}

function Slider({label,value,setValue,min=0,max=1,step=0.01,fmt,color='#34d399'}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:'1px'}}>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <span style={{fontSize:'7.5px',fontWeight:800,letterSpacing:'0.12em',color:'#475569',textTransform:'uppercase'}}>{label}</span>
        <span style={{fontSize:'8px',fontWeight:800,color}}>{fmt?fmt(value):value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setValue(Number(e.target.value))} style={{width:'100%',accentColor:color,height:'2px',cursor:'pointer'}}/>
    </div>
  );
}

function VU({level,color='#34d399',width=5,height=26}){
  const segs=8,lit=Math.round(clamp(level,0,1)*segs);
  return(
    <div style={{display:'flex',flexDirection:'column-reverse',gap:'1px',width,height,flexShrink:0}}>
      {Array.from({length:segs},(_,i)=>(
        <div key={i} style={{flex:1,borderRadius:'1px',background:i<lit?(i>5?'#f43f5e':i>3?'#fbbf24':color):'rgba(255,255,255,0.05)',transition:'background 0.03s'}}/>
      ))}
    </div>
  );
}

// Oscilloscope
function Scope({analyser,color='#34d399',width=230,height=28}){
  const canvasRef=useRef(null);
  useEffect(()=>{
    if(!analyser)return;
    let raf;
    const draw=()=>{
      const canvas=canvasRef.current;if(!canvas)return;
      const ctx=canvas.getContext('2d');const W=canvas.width,H=canvas.height;
      const buf=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(buf);
      ctx.clearRect(0,0,W,H);
      ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.globalAlpha=0.85;
      ctx.shadowBlur=4;ctx.shadowColor=color;
      ctx.beginPath();
      for(let i=0;i<buf.length;i++){const x=(i/buf.length)*W,y=H/2+(buf[i]*H*0.8);i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}
      ctx.stroke();ctx.shadowBlur=0;
      raf=requestAnimationFrame(draw);
    };
    draw();return()=>cancelAnimationFrame(raf);
  },[analyser,color]);
  return<canvas ref={canvasRef} width={width} height={height} style={{display:'block',borderRadius:'4px',background:'rgba(0,0,0,0.3)'}}/>;
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function CesiraV1(){
  const [isReady,setIsReady]=useState(false);
  const [isPlaying,setIsPlaying]=useState(false);
  const [stutterOn,setStutterOn]=useState(false);
  const [bpm,setBpm]=useState(DEFAULT_BPM);
  const [stepCount,setStepCount]=useState(DEFAULT_STEPS);
  const [laneStepCounts,setLaneStepCounts]=useState({kick:16,snare:16,hat:16,bass:16,synth:16});
  const [step,setStep]=useState(0);const [page,setPage]=useState(0);
  const [patterns,setPatterns]=useState(()=>makePatternTemplate(DEFAULT_STEPS));
  const [drumPreset,setDrumPreset]=useState(0);const [bassPreset,setBassPreset]=useState(0);const [synthPreset,setSynthPreset]=useState(0);const [fxPreset,setFxPreset]=useState(1);
  const [swing,setSwing]=useState(0.08);const [master,setMaster]=useState(0.82);
  const [recState,setRecState]=useState('idle');const [recordings,setRecordings]=useState([]);
  const [density,setDensity]=useState(0.44);const [chaos,setChaos]=useState(0.42);const [tone,setTone]=useState(0.64);const [noise,setNoise]=useState(0.34);const [space,setSpace]=useState(0.34);
  const [activeLane,setActiveLane]=useState('kick');const [statusText,setStatusText]=useState('Ready.');const [recordMime,setRecordMime]=useState('audio/webm');
  const [laneVolumes,setLaneVolumes]=useState({kick:0.95,snare:0.82,hat:0.48,bass:0.9,synth:0.78});
  const [compressAmount,setCompressAmount]=useState(0.52);const [resonance,setResonance]=useState(0.34);const [bassLfo,setBassLfo]=useState(0.38);const [synthLfo,setSynthLfo]=useState(0.42);
  const [drumDecay,setDrumDecay]=useState(0.46);const [bassWave,setBassWave]=useState('auto');const [synthWave,setSynthWave]=useState('auto');
  const [bassCutoff,setBassCutoff]=useState(0.58);const [synthCutoff,setSynthCutoff]=useState(0.68);const [bassSubAmount,setBassSubAmount]=useState(0.72);
  const [synthAttack,setSynthAttack]=useState(0.12);const [synthRelease,setSynthRelease]=useState(0.52);const [stutterBurst,setStutterBurst]=useState(3);
  const [bassLine,setBassLine]=useState(()=>makeEmptyNotes('C2'));const [synthLine,setSynthLine]=useState(()=>makeEmptyNotes('C4'));
  const [harmonicProfile,setHarmonicProfile]=useState('minor');const [grooveProfile,setGrooveProfile]=useState('steady');const [sectionProfile,setSectionProfile]=useState('pulse-cell');
  const [laneFx,setLaneFx]=useState({kick:{drive:0.18,tone:0.56,echo:0.0,crush:0.0,pan:-0.02},snare:{drive:0.12,tone:0.62,echo:0.08,crush:0.0,pan:0.0},hat:{drive:0.08,tone:0.84,echo:0.04,crush:0.04,pan:0.18},bass:{drive:0.16,tone:0.42,echo:0.02,crush:0.0,pan:-0.07},synth:{drive:0.14,tone:0.72,echo:0.16,crush:0.0,pan:0.08}});
  const [noteEditLane,setNoteEditLane]=useState('bass');const [humanize,setHumanize]=useState(0.08);const [macroKnob,setMacroKnob]=useState(0.28);const [grooveAmount,setGrooveAmount]=useState(0.42);
  const [sceneSlots,setSceneSlots]=useState([null,null,null,null]);const [currentScene,setCurrentScene]=useState(null);
  const [projectName,setProjectName]=useState('CESIRA Session');const [metronomeOn,setMetronomeOn]=useState(false);const [metronomeLevel,setMetronomeLevel]=useState(0.42);
  const [projectSlots,setProjectSlots]=useState([null,null,null,null]);const [currentProjectSlot,setCurrentProjectSlot]=useState(null);
  const [rightTab,setRightTab]=useState('knobs');
  const [sdLane,setSdLane]=useState('bass');
  const [iterCount,setIterCount]=useState(0);
  const [arpeMode,setArpeMode]=useState('up');
  const [laneVU,setLaneVU]=useState({kick:0,snare:0,hat:0,bass:0,synth:0});
  const [padFlash,setPadFlash]=useState({kick:0,snare:0,hat:0,bass:0,synth:0});
  const [tapTimes,setTapTimes]=useState([]);
  const [midiEnabled,setMidiEnabled]=useState(false);
  const [selectedStep,setSelectedStep]=useState(null);
  const [fmIndex,setFmIndex]=useState(0.62);
  const [scopeAnalyser,setScopeAnalyser]=useState(null);
  // Sound Design — per-lane custom synth params (overrides preset when active)
  const [soundDesign,setSoundDesign]=useState({
    bass:  {active:false,osc:'sawtooth',osc2:'sine',detune:5,filterType:'lowpass',cutoff:0.55,res:0.3,atk:0.008,dec:0.25,sus:0.6,rel:0.4,sub:0.5,drive:0.1,glide:0},
    synth: {active:false,osc:'sawtooth',osc2:'triangle',detune:8,filterType:'lowpass',cutoff:0.65,res:0.2,atk:0.02,dec:0.3,sus:0.7,rel:0.5,drive:0.08,lfo:0.3,lfoRate:3},
    drum:  {pitchEnvAmt:0.5,pitchEnvTime:0.12,noiseColor:'white',kickFreq:108,kickEnd:40},
  });
  const soundDesignRef=useRef(soundDesign);

  // Undo/Redo
  const undoStack=useRef([]);const redoStack=useRef([]);
  const pushUndo=(pat)=>{undoStack.current=[JSON.parse(JSON.stringify(pat)),...undoStack.current.slice(0,UNDO_LIMIT-1)];redoStack.current=[];};
  const undo=()=>{if(!undoStack.current.length)return;redoStack.current=[JSON.parse(JSON.stringify(patterns)),...redoStack.current.slice(0,UNDO_LIMIT-1)];setPatterns(undoStack.current[0]);undoStack.current=undoStack.current.slice(1);setStatusText('Undo.');};
  const redo=()=>{if(!redoStack.current.length)return;undoStack.current=[JSON.parse(JSON.stringify(patterns)),...undoStack.current.slice(0,UNDO_LIMIT-1)];setPatterns(redoStack.current[0]);redoStack.current=redoStack.current.slice(1);setStatusText('Redo.');};

  // Refs
  const audioRef=useRef(null);const schedulerRef=useRef(null);const nextNoteTimeRef=useRef(0);const currentStepRef=useRef(0);const isPlayingRef=useRef(false);
  const recorderRef=useRef(null),chunksRef=useRef([]),recordingsRef=useRef([]);
  const bpmRef=useRef(bpm),swingRef=useRef(swing),stepCountRef=useRef(stepCount),laneStepCountsRef=useRef(laneStepCounts);
  const patternsRef=useRef(patterns),bassLineRef=useRef(bassLine),synthLineRef=useRef(synthLine),laneFxRef=useRef(laneFx);
  const macroKnobRef=useRef(macroKnob),grooveAmountRef=useRef(grooveAmount),grooveProfileRef=useRef(grooveProfile),harmonicProfileRef=useRef(harmonicProfile);
  const humanizeRef=useRef(humanize),stutterOnRef=useRef(stutterOn),stutterBurstRef=useRef(stutterBurst),laneVolumesRef=useRef(laneVolumes);
  const drumPresetRef=useRef(drumPreset),bassPresetRef=useRef(bassPreset),synthPresetRef=useRef(synthPreset);
  const bassWaveRef=useRef(bassWave),synthWaveRef=useRef(synthWave),fmIndexRef=useRef(fmIndex);
  const midiRef=useRef(null);const importInputRef=useRef(null);const laneGainNodes=useRef({});
  const vuTimers=useRef({});

  const laneLabels=useMemo(()=>[{key:'kick',label:'K',long:'Kick'},{key:'snare',label:'S',long:'Snare'},{key:'hat',label:'H',long:'Hat'},{key:'bass',label:'B',long:'Bass'},{key:'synth',label:'Y',long:'Synth'}],[]);
  const totalPages=Math.ceil(stepCount/PAGE_SIZE),visibleStart=page*PAGE_SIZE,visibleEnd=Math.min(stepCount,visibleStart+PAGE_SIZE);
  const visibleIndices=Array.from({length:visibleEnd-visibleStart},(_,i)=>visibleStart+i);

  // Sync refs
  useEffect(()=>{bpmRef.current=bpm;},[bpm]);useEffect(()=>{swingRef.current=swing;},[swing]);useEffect(()=>{stepCountRef.current=stepCount;},[stepCount]);
  useEffect(()=>{laneStepCountsRef.current=laneStepCounts;},[laneStepCounts]);useEffect(()=>{patternsRef.current=patterns;},[patterns]);
  useEffect(()=>{const m=Math.max(...Object.values(laneStepCounts));setStepCount(m);stepCountRef.current=m;setPage(prev=>clamp(prev,0,Math.ceil(m/PAGE_SIZE)-1));if(currentStepRef.current>=m)currentStepRef.current=0;},[laneStepCounts]);
  useEffect(()=>{bassLineRef.current=bassLine;},[bassLine]);useEffect(()=>{synthLineRef.current=synthLine;},[synthLine]);useEffect(()=>{laneFxRef.current=laneFx;},[laneFx]);
  useEffect(()=>{macroKnobRef.current=macroKnob;},[macroKnob]);useEffect(()=>{grooveAmountRef.current=grooveAmount;},[grooveAmount]);useEffect(()=>{grooveProfileRef.current=grooveProfile;},[grooveProfile]);
  useEffect(()=>{harmonicProfileRef.current=harmonicProfile;},[harmonicProfile]);useEffect(()=>{humanizeRef.current=humanize;},[humanize]);useEffect(()=>{stutterOnRef.current=stutterOn;},[stutterOn]);
  useEffect(()=>{stutterBurstRef.current=stutterBurst;},[stutterBurst]);useEffect(()=>{laneVolumesRef.current=laneVolumes;},[laneVolumes]);
  useEffect(()=>{drumPresetRef.current=drumPreset;},[drumPreset]);useEffect(()=>{bassPresetRef.current=bassPreset;},[bassPreset]);useEffect(()=>{synthPresetRef.current=synthPreset;},[synthPreset]);
  useEffect(()=>{soundDesignRef.current=soundDesign;},[soundDesign]);
  useEffect(()=>{bassWaveRef.current=bassWave;},[bassWave]);useEffect(()=>{synthWaveRef.current=synthWave;},[synthWave]);useEffect(()=>{fmIndexRef.current=fmIndex;},[fmIndex]);
  useEffect(()=>{recordingsRef.current=recordings;},[recordings]);
  useEffect(()=>{LANE_KEYS.forEach(lane=>{const node=laneGainNodes.current[lane];if(node&&audioRef.current)node.gain.setTargetAtTime(laneVolumes[lane],audioRef.current.ctx.currentTime,0.02);});},[laneVolumes]);

  useEffect(()=>{try{const r=window.localStorage.getItem('cesira-project-autoload');if(r){const p=JSON.parse(r);if(p?.projectName)setProjectName(p.projectName);}const sr=window.localStorage.getItem('cesira-project-slots');if(sr){const ps=JSON.parse(sr);if(Array.isArray(ps))setProjectSlots(ps.slice(0,4));}}catch{}},[]);
  useEffect(()=>{try{window.localStorage.setItem('cesira-project-slots',JSON.stringify(projectSlots));}catch{}},[projectSlots]);
  useEffect(()=>()=>{if(schedulerRef.current)clearInterval(schedulerRef.current);if(audioRef.current?.ctx?.state&&audioRef.current.ctx.state!=='closed')audioRef.current.ctx.close().catch(()=>{});recordingsRef.current.forEach(i=>URL.revokeObjectURL(i.url));},[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const onKey=e=>{
      if(e.target.tagName==='INPUT')return;
      if(e.code==='Space'){e.preventDefault();togglePlay();}
      else if(e.code==='KeyR'&&!e.metaKey&&!e.ctrlKey)randomize();
      else if(e.code==='Digit1')triggerLaneNow('kick',1);
      else if(e.code==='Digit2')triggerLaneNow('snare',1);
      else if(e.code==='Digit3')triggerLaneNow('hat',1);
      else if(e.code==='Digit4')triggerLaneNow('bass',1);
      else if(e.code==='Digit5')triggerLaneNow('synth',1);
      else if(e.code==='KeyZ'&&(e.metaKey||e.ctrlKey)&&!e.shiftKey)undo();
      else if(e.code==='KeyZ'&&(e.metaKey||e.ctrlKey)&&e.shiftKey)redo();
      else if(e.code==='KeyT')tapTempo();
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);

  // MIDI init
  useEffect(()=>{
    if(!navigator.requestMIDIAccess)return;
    navigator.requestMIDIAccess().then(midi=>{midiRef.current=midi;setMidiEnabled(true);setStatusText('MIDI ready.');}).catch(()=>{});
  },[]);

  // Send MIDI note
  const sendMidi=(ch,note,vel,durationMs=100)=>{
    if(!midiRef.current)return;
    const outputs=[...midiRef.current.outputs.values()];if(!outputs.length)return;
    const out=outputs[0];const midiVel=Math.round(clamp(vel,0,1)*127);
    out.send([0x90+(ch-1),note,midiVel]);setTimeout(()=>out.send([0x80+(ch-1),note,0]),durationMs);
  };

  // Send MIDI clock
  const midiClockCountRef=useRef(0);
  const sendMidiClock=()=>{
    if(!midiRef.current)return;const outputs=[...midiRef.current.outputs.values()];if(!outputs.length)return;
    outputs[0].send([0xF8]);// clock tick
  };

  // ─── Audio Engine ─────────────────────────────────────────────────────────
  const setDriveCurve=(node,amount=0.2)=>{
    const k=2+clamp(amount,0,1)*70;const s=512,c=new Float32Array(s);
    for(let i=0;i<s;i++){const x=(i*2)/s-1;c[i]=((1+k)*x)/(1+k*Math.abs(x));}
    node.curve=c;node.oversample='2x';
  };

  const makeReverbIR=(ctx,duration=1.2,decay=2.5)=>{const sr=ctx.sampleRate,len=Math.floor(sr*duration);const buf=ctx.createBuffer(2,len,sr);for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay);}return buf;};

  const initAudio=async()=>{
    if(audioRef.current){await audioRef.current.ctx.resume();setIsReady(true);return;}
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
    const ctx=new AudioCtx({sampleRate:44100,latencyHint:'interactive'});
    const inputBus=ctx.createGain();inputBus.gain.value=0.82;
    const preDrive=ctx.createWaveShaper();
    const toneFilter=ctx.createBiquadFilter();toneFilter.type='lowpass';toneFilter.frequency.value=16000;toneFilter.Q.value=0.5;
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=0.005;compressor.release.value=0.12;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-2;limiter.knee.value=0;limiter.ratio.value=20;limiter.attack.value=0.001;limiter.release.value=0.05;
    const dry=ctx.createGain(),wet=ctx.createGain(),splitter=ctx.createChannelSplitter(2),merger=ctx.createChannelMerger(2);
    const leftDelay=ctx.createDelay(0.5),rightDelay=ctx.createDelay(0.5),feedback=ctx.createGain(),toneEcho=ctx.createBiquadFilter();
    toneEcho.type='lowpass';toneEcho.frequency.value=5000;
    const output=ctx.createGain();
    const analyser=ctx.createAnalyser();analyser.fftSize=512;analyser.smoothingTimeConstant=0.8;
    const dest=ctx.createMediaStreamDestination();
    // Chorus
    const chorusWet=ctx.createGain();chorusWet.gain.value=0.0;
    const cDel1=ctx.createDelay(0.05),cDel2=ctx.createDelay(0.05);
    const cLfo1=ctx.createOscillator(),cLfo2=ctx.createOscillator();
    const cLg1=ctx.createGain(),cLg2=ctx.createGain();
    cLfo1.frequency.value=0.9;cLfo2.frequency.value=1.3;cLg1.gain.value=0.003;cLg2.gain.value=0.004;
    cDel1.delayTime.value=0.025;cDel2.delayTime.value=0.031;
    cLfo1.connect(cLg1);cLg1.connect(cDel1.delayTime);cLfo2.connect(cLg2);cLg2.connect(cDel2.delayTime);
    cLfo1.start();cLfo2.start();
    // Reverb
    const reverb=ctx.createConvolver();reverb.buffer=makeReverbIR(ctx,1.4,2.2);
    const reverbWet=ctx.createGain();reverbWet.gain.value=0.0;
    inputBus.connect(preDrive);preDrive.connect(toneFilter);toneFilter.connect(compressor);
    compressor.connect(dry);compressor.connect(splitter);
    compressor.connect(cDel1);compressor.connect(cDel2);cDel1.connect(chorusWet);cDel2.connect(chorusWet);
    compressor.connect(reverb);reverb.connect(reverbWet);
    splitter.connect(leftDelay,0);splitter.connect(rightDelay,1);rightDelay.connect(toneEcho);toneEcho.connect(feedback);feedback.connect(leftDelay);
    leftDelay.connect(merger,0,0);rightDelay.connect(merger,0,1);merger.connect(wet);
    dry.connect(output);wet.connect(output);chorusWet.connect(output);reverbWet.connect(output);
    output.connect(limiter);limiter.connect(analyser);limiter.connect(ctx.destination);limiter.connect(dest);
    audioRef.current={ctx,inputBus,preDrive,toneFilter,compressor,limiter,dry,wet,leftDelay,rightDelay,feedback,output,analyser,dest,chorusWet,reverbWet,cLfo1,cLfo2};
    setScopeAnalyser(analyser);
    setDriveCurve(preDrive,fxScenes[fxPreset].drive*0.5);
    setIsReady(true);setStatusText('Audio online.');applyFxScene(fxPreset,false,ctx.currentTime);
  };

  const applyFxScene=(idx,flash=true,nowTime)=>{
    setFxPreset(idx);const audio=audioRef.current;if(!audio)return;
    const fx=fxScenes[idx],now=nowTime??audio.ctx.currentTime,macro=macroKnobRef.current;
    setDriveCurve(audio.preDrive,(fx.drive*0.5)+noise*0.07+macro*0.05);
    audio.toneFilter.frequency.cancelScheduledValues(now);audio.toneFilter.frequency.linearRampToValueAtTime(2200+12000*fx.filter*tone+macro*1000,now+0.04);
    audio.leftDelay.delayTime.cancelScheduledValues(now);audio.rightDelay.delayTime.cancelScheduledValues(now);
    audio.leftDelay.delayTime.linearRampToValueAtTime(0.02+fx.delay*0.16+space*0.02,now+0.04);
    audio.rightDelay.delayTime.linearRampToValueAtTime(0.03+fx.delay*0.21+space*0.035,now+0.04);
    audio.feedback.gain.cancelScheduledValues(now);audio.feedback.gain.linearRampToValueAtTime(clamp(0.1+space*0.18+fx.delay*0.22+macro*0.05,0.05,0.42),now+0.04);
    audio.wet.gain.cancelScheduledValues(now);audio.dry.gain.cancelScheduledValues(now);
    audio.wet.gain.linearRampToValueAtTime(clamp(fx.width*0.3+space*0.16+macro*0.05,0.04,0.38),now+0.04);
    audio.dry.gain.linearRampToValueAtTime(clamp(0.9-fx.width*0.12-macro*0.04,0.62,0.94),now+0.04);
    // Chorus — driven by space
    if(audio.chorusWet)audio.chorusWet.gain.linearRampToValueAtTime(clamp(space*0.18+fx.width*0.1,0,0.28),now+0.08);
    // Reverb — driven by space + fx
    if(audio.reverbWet)audio.reverbWet.gain.linearRampToValueAtTime(clamp(space*0.22+fx.width*0.08,0,0.32),now+0.1);
    audio.output.gain.cancelScheduledValues(now);audio.output.gain.linearRampToValueAtTime(master,now+0.04);
  };
  useEffect(()=>{if(!audioRef.current)return;applyFxScene(fxPreset,false);},[fxPreset,tone,space,noise]);
  useEffect(()=>{const a=audioRef.current;if(!a)return;a.output.gain.setTargetAtTime(master,a.ctx.currentTime,0.03);},[master]);
  useEffect(()=>{const a=audioRef.current;if(!a)return;const n=a.ctx.currentTime;a.compressor.threshold.setTargetAtTime(-10-compressAmount*16,n,0.04);a.compressor.ratio.setTargetAtTime(2+compressAmount*6,n,0.04);a.compressor.attack.setTargetAtTime(0.003+(1-compressAmount)*0.02,n,0.04);a.compressor.release.setTargetAtTime(0.06+compressAmount*0.2,n,0.04);a.compressor.knee.setTargetAtTime(6+compressAmount*16,n,0.04);},[compressAmount]);

  const getLaneGain=(lane)=>{
    const audio=audioRef.current;if(!audio)return null;
    if(!laneGainNodes.current[lane]){const g=audio.ctx.createGain();g.gain.value=laneVolumesRef.current[lane]??1;g.connect(audio.inputBus);laneGainNodes.current[lane]=g;}
    return laneGainNodes.current[lane];
  };

  const routeLaneFx=(sourceNode,lane)=>{
    const audio=audioRef.current;if(!audio)return[];
    const macro=macroKnobRef.current,fx=laneFxRef.current[lane]||{drive:0,tone:0.7,echo:0,crush:0,pan:0};
    const ld=audio.ctx.createWaveShaper(),lt=audio.ctx.createBiquadFilter(),echo=audio.ctx.createDelay(0.35),eg=audio.ctx.createGain(),et=audio.ctx.createBiquadFilter(),pan=audio.ctx.createStereoPanner();
    setDriveCurve(ld,clamp(fx.drive*0.55+macro*0.07,0,0.75));
    lt.type=lane==='hat'?'highpass':'lowpass';lt.frequency.value=lane==='hat'?1400+fx.tone*7000:200+fx.tone*6500;lt.Q.value=0.4+fx.crush*1.4;
    echo.delayTime.value=0.04+fx.echo*0.19;eg.gain.value=clamp(fx.echo*0.2,0,0.3);et.type='lowpass';et.frequency.value=1400+fx.tone*3800;pan.pan.value=clamp(fx.pan,-1,1);
    const dest=getLaneGain(lane)||audio.inputBus;
    sourceNode.connect(ld);ld.connect(lt);lt.connect(pan);pan.connect(dest);
    if(fx.echo>0.01){lt.connect(echo);echo.connect(et);et.connect(eg);eg.connect(pan);}
    return[ld,lt,echo,eg,et,pan];
  };

  const rampEnv=(param,now,attack,decay,peak,end=0.0001)=>{param.cancelScheduledValues(now);param.setValueAtTime(0.0001,now);param.exponentialRampToValueAtTime(Math.max(0.0001,peak),now+Math.max(0.001,attack));param.exponentialRampToValueAtTime(Math.max(0.0001,end),now+Math.max(0.002,attack+decay));};
  const createNoise=(len=0.2,amount=1)=>{const a=audioRef.current;const buf=a.ctx.createBuffer(1,Math.floor(a.ctx.sampleRate*len),a.ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*amount;return buf;};
  const safeStart=(n,t)=>{try{n.start(t);}catch{}};const safeStop=(n,t)=>{try{n.stop(t);}catch{}};
  const cleanup=(src,nodes,ms)=>{const fn=()=>[src,...nodes].forEach(n=>{try{n.disconnect();}catch{}});src.onended=fn;setTimeout(fn,ms);};
  const pickWave=(mode,family)=>{if(family==='bass'&&bassWaveRef.current!=='auto')return bassWaveRef.current;if(family==='synth'&&synthWaveRef.current!=='auto')return synthWaveRef.current;return mode;};
  const resolveDrumFx=(type)=>{if(type==='kick'||type==='kick2'||type==='tom')return'kick';if(type==='snare'||type==='snare2'||type==='clap')return'snare';return'hat';};

  const flashLane=useCallback((lane,level=1)=>{
    setLaneVU(prev=>({...prev,[lane]:Math.min(1,level)}));setPadFlash(prev=>({...prev,[lane]:Date.now()}));
    if(vuTimers.current[lane])clearInterval(vuTimers.current[lane]);
    vuTimers.current[lane]=setInterval(()=>setLaneVU(prev=>{const nv=Math.max(0,prev[lane]-0.18);if(nv<=0)clearInterval(vuTimers.current[lane]);return{...prev,[lane]:nv};}),55);
  },[]);

  // ─── FM synthesis helper (true FM: modulator drives carrier frequency) ─────
  const makeFmPair=(ctx,carrierFreq,modRatio,modIndex,carrierType='sine')=>{
    const carrier=ctx.createOscillator(),modulator=ctx.createOscillator(),modGain=ctx.createGain();
    carrier.type=carrierType;carrier.frequency.value=carrierFreq;
    modulator.type='sine';modulator.frequency.value=carrierFreq*modRatio;
    modGain.gain.value=carrierFreq*modIndex; // FM index scales with carrier freq
    modulator.connect(modGain);modGain.connect(carrier.frequency);
    return{carrier,modulator,modGain};
  };

  // Colored noise buffer: white=flat, pink=-3dB/oct, brown=-6dB/oct
  const createColoredNoise=(len=0.2,amount=1,color='white')=>{
    const a=audioRef.current;const sr=a.ctx.sampleRate;const buf=a.ctx.createBuffer(1,Math.floor(sr*len),sr);
    const d=buf.getChannelData(0);
    if(color==='white'){for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*amount;return buf;}
    // Pink: sum of octave-decimated white noise
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for(let i=0;i<d.length;i++){
      const w=(Math.random()*2-1);
      if(color==='pink'){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*amount*0.11;}
      else{b0=0.99*b0+w*0.01;d[i]=b0*amount*3;} // brown
    }
    return buf;
  };

  const playDrumAt=(pi,accent,t)=>{
    const audio=audioRef.current;if(!audio)return;
    const p=drumPresets[pi];
    const ds=soundDesignRef.current?.drum||{pitchEnvAmt:0.5,pitchEnvTime:0.12,noiseColor:'white',kickFreq:108,kickEnd:40};
    const noiseColor=ds.noiseColor||'white';
    const nb=createColoredNoise(0.2,0.22+noise*0.55,noiseColor);

    if(p.type.startsWith('kick')){
      const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain(),sh=audio.ctx.createWaveShaper();
      setDriveCurve(sh,0.12+noise*0.12);
      osc.type=p.type==='kick'?'sine':'triangle';
      const kickFreq=ds.kickFreq||(p.type==='kick'?108:88);
      const kickEnd=ds.kickEnd||40;
      const envTime=clamp(ds.pitchEnvTime??0.12,0.04,0.5);
      osc.frequency.setValueAtTime(kickFreq,t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30,kickEnd),t+envTime);
      rampEnv(g.gain,t,0.001,0.1+drumDecay*0.2,0.88*accent);
      osc.connect(sh);sh.connect(g);const fx=routeLaneFx(g,'kick');cleanup(osc,[g,sh,...fx],600);safeStart(osc,t);safeStop(osc,t+0.26);return;
    }
    if(p.type==='tom'){
      const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain();osc.type='sine';
      osc.frequency.setValueAtTime(155,t);osc.frequency.exponentialRampToValueAtTime(80,t+0.15);
      rampEnv(g.gain,t,0.001,0.08+drumDecay*0.18,0.75*accent);osc.connect(g);const fx=routeLaneFx(g,'kick');cleanup(osc,[g,...fx],600);safeStart(osc,t);safeStop(osc,t+0.22);return;
    }
    const src=audio.ctx.createBufferSource(),fil=audio.ctx.createBiquadFilter(),g=audio.ctx.createGain();src.buffer=nb;
    switch(p.type){
      case'snare':fil.type='bandpass';fil.frequency.value=1600;fil.Q.value=1.1;rampEnv(g.gain,t,0.001,0.065+drumDecay*0.14,0.6*accent);break;
      case'snare2':fil.type='highpass';fil.frequency.value=1200;rampEnv(g.gain,t,0.001,0.04+drumDecay*0.11,0.48*accent);break;
      case'hat':fil.type='highpass';fil.frequency.value=7200;rampEnv(g.gain,t,0.001,0.01+drumDecay*0.055,0.3*accent);break;
      case'hat2':fil.type='highpass';fil.frequency.value=9500;rampEnv(g.gain,t,0.001,0.007+drumDecay*0.035,0.24*accent);break;
      case'clap':fil.type='bandpass';fil.frequency.value=1900;fil.Q.value=1.4;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.46*accent,t+0.003);g.gain.linearRampToValueAtTime(0.06,t+0.033);g.gain.linearRampToValueAtTime(0.28*accent,t+0.054);g.gain.linearRampToValueAtTime(0.0001,t+0.13);break;
      case'metal':fil.type='bandpass';fil.frequency.value=4200;fil.Q.value=3;rampEnv(g.gain,t,0.001,0.022+drumDecay*0.1,0.25*accent);break;
      default:fil.type='bandpass';fil.frequency.value=2300;rampEnv(g.gain,t,0.001,0.06+drumDecay*0.13,0.38*accent);break;
    }
    src.playbackRate.value=0.97+Math.random()*0.06;src.connect(fil);fil.connect(g);const fxn=routeLaneFx(g,resolveDrumFx(p.type));cleanup(src,[fil,g,...fxn],750);safeStart(src,t);safeStop(src,t+0.2);
  };

  // Active node counter — hard cap to prevent audio thread overload
  const activeNodesRef=useRef(0);
  const MAX_NODES=120;
  const nodeGuard=()=>{if(activeNodesRef.current>=MAX_NODES)return false;return true;};
  const trackNode=(n,ms)=>{activeNodesRef.current++;setTimeout(()=>{activeNodesRef.current=Math.max(0,activeNodesRef.current-1);},ms+100);};

  // stepSec: real duration of a step at current BPM
  const stepSec=()=>(60/bpmRef.current)/4;

  const playBassAt=(pi,note,accent,t,noteLenSteps=1)=>{
    if(!nodeGuard())return;
    const audio=audioRef.current;if(!audio)return;
    // Custom sound design override
    const sd=soundDesignRef.current?.bass;
    if(sd?.active){
      const f=noteToFreq[note]||110;
      const noteDur=clamp(stepSec()*noteLenSteps*0.95,0.04,8.0);
      const atkT=Math.min(sd.atk,noteDur*0.4);const relT=Math.min(sd.rel+noteDur*0.5,noteDur*0.95);
      const cleanMs=(relT+0.4)*1000;
      const o1=audio.ctx.createOscillator(),o2=audio.ctx.createOscillator(),sub=audio.ctx.createGain();
      const fil=audio.ctx.createBiquadFilter(),g=audio.ctx.createGain(),driveN=audio.ctx.createWaveShaper();
      o1.type=sd.osc;o2.type=sd.osc2;
      // Glide: if glide>0, start from last played frequency
      const glideTime=sd.glide||0;
      if(glideTime>0&&window._cesiraLastBassFreq){
        o1.frequency.setValueAtTime(window._cesiraLastBassFreq,t);
        o1.frequency.exponentialRampToValueAtTime(f,t+glideTime);
        o2.frequency.setValueAtTime(window._cesiraLastBassFreq*(1+sd.detune/1200),t);
        o2.frequency.exponentialRampToValueAtTime(f*(1+sd.detune/1200),t+glideTime);
      } else {
        o1.frequency.value=f;o2.frequency.value=f*(1+sd.detune/1200);
      }
      window._cesiraLastBassFreq=f;
      sub.gain.value=sd.sub;fil.type=sd.filterType;
      fil.frequency.setValueAtTime(80+sd.cutoff*4000,t);fil.Q.value=0.5+sd.res*8;
      setDriveCurve(driveN,sd.drive);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.linearRampToValueAtTime(0.72*accent,t+atkT);
      g.gain.setValueAtTime(0.72*accent*sd.sus,t+Math.min(atkT+sd.dec,relT*0.6));
      g.gain.exponentialRampToValueAtTime(0.0001,t+relT);
      o1.connect(fil);o2.connect(sub);sub.connect(fil);fil.connect(driveN);driveN.connect(g);
      const fxn=routeLaneFx(g,'bass');
      trackNode(o1,cleanMs);cleanup(o1,[o2,sub,fil,driveN,g,...fxn],cleanMs);
      safeStart(o1,t);safeStart(o2,t);safeStop(o1,t+relT+0.05);safeStop(o2,t+relT+0.05);
      sendMidi(LANE_CH.bass,noteToMidi[note]||48,accent,relT*1000);return;
    }
    const p=bassPresets[pi],f=noteToFreq[note]||110,bs=pickWave(p.mode,'bass');
    // Real note duration from step length — capped to avoid runaway long notes
    const noteDur=clamp(stepSec()*noteLenSteps*0.95,0.04,8.0);
    const relTime=Math.max(0.04,noteDur*0.85); // release starts just before note end
    const g=audio.ctx.createGain(),fil=audio.ctx.createBiquadFilter();
    fil.type=p.mode==='bit'?'highpass':'lowpass';
    fil.frequency.setValueAtTime(80+bassCutoff*2000+tone*800+pi*12,t);
    fil.Q.value=0.5+resonance*5+(p.mode==='grit'?0.5:0);
    // ADSR envelope scaled to note duration
    const atkT=Math.min(0.008,noteDur*0.05);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.linearRampToValueAtTime(0.72*accent,t+atkT);
    g.gain.setValueAtTime(0.72*accent,t+relTime*0.3);
    g.gain.exponentialRampToValueAtTime(0.0001,t+relTime);
    const cleanMs=(relTime+0.3)*1000;

    if(p.mode==='fm'||p.mode==='bit'){
      const idx=fmIndexRef.current*(p.mode==='bit'?3:1.5);
      const{carrier,modulator,modGain}=makeFmPair(audio.ctx,f,p.mode==='fm'?2.0:3.0,idx,'sine');
      const sub=audio.ctx.createGain();sub.gain.value=bassSubAmount*0.4;
      const subOsc=audio.ctx.createOscillator();subOsc.type='sine';subOsc.frequency.value=f*0.5;
      carrier.connect(fil);subOsc.connect(sub);sub.connect(fil);fil.connect(g);
      const fxn=routeLaneFx(g,'bass');
      trackNode(carrier,cleanMs);
      cleanup(carrier,[modulator,modGain,sub,subOsc,fil,g,...fxn],cleanMs);
      safeStart(carrier,t);safeStart(modulator,t);safeStart(subOsc,t);
      safeStop(carrier,t+relTime+0.05);safeStop(modulator,t+relTime+0.05);safeStop(subOsc,t+relTime+0.05);
      sendMidi(LANE_CH.bass,noteToMidi[note]||48,accent,relTime*1000);return;
    }

    if(p.mode==='fold'||p.mode==='wet'){
      const carrier=audio.ctx.createOscillator(),ringOsc=audio.ctx.createOscillator();
      carrier.type='sawtooth';carrier.frequency.value=f;
      ringOsc.type='sine';ringOsc.frequency.value=f*(p.mode==='fold'?1.5:0.75);
      const ringMod=audio.ctx.createGain();ringMod.gain.value=0.5;
      const ringGain=audio.ctx.createGain();ringGain.gain.value=0;
      ringOsc.connect(ringGain);ringGain.connect(ringMod.gain);carrier.connect(ringMod);ringMod.connect(fil);
      const sub=audio.ctx.createGain();sub.gain.value=bassSubAmount*0.5;
      const subOsc=audio.ctx.createOscillator();subOsc.type='sine';subOsc.frequency.value=f*0.5;
      subOsc.connect(sub);sub.connect(fil);fil.connect(g);
      const fxn=routeLaneFx(g,'bass');
      trackNode(carrier,cleanMs);
      cleanup(carrier,[ringOsc,ringGain,ringMod,sub,subOsc,fil,g,...fxn],cleanMs);
      safeStart(carrier,t);safeStart(ringOsc,t);safeStart(subOsc,t);
      safeStop(carrier,t+relTime+0.05);safeStop(ringOsc,t+relTime+0.05);safeStop(subOsc,t+relTime+0.05);
      sendMidi(LANE_CH.bass,noteToMidi[note]||48,accent,relTime*1000);return;
    }

    const o1=audio.ctx.createOscillator(),o2=audio.ctx.createOscillator(),sub=audio.ctx.createGain(),tg=audio.ctx.createGain(),lfo=audio.ctx.createOscillator(),lg=audio.ctx.createGain();
    o1.type=bs==='sine'?'sine':bs==='triangle'?'triangle':bs==='square'?'square':['sub','tube'].includes(p.mode)?'sine':p.mode==='pulse'?'square':'sawtooth';
    o2.type=bs==='triangle'?'triangle':bs==='square'?'square':'sawtooth';
    o1.frequency.setValueAtTime(f,t);o2.frequency.setValueAtTime(f*1.005,t);
    sub.gain.value=bassSubAmount*(p.mode==='sub'?0.85:0.35);tg.gain.value=0.13+noise*0.1;
    lfo.frequency.value=0.4+bassLfo*8;lg.gain.value=clamp(bassLfo*10+(p.mode==='drone'?2.5:0),0,28);
    lfo.connect(lg);lg.connect(fil.frequency);o1.connect(sub);o2.connect(tg);sub.connect(fil);tg.connect(fil);fil.connect(g);
    const fxn=routeLaneFx(g,'bass');
    trackNode(o1,cleanMs);
    cleanup(o1,[o2,lfo,sub,tg,fil,g,lg,...fxn],cleanMs);
    safeStart(o1,t);safeStart(o2,t);safeStart(lfo,t);
    safeStop(o1,t+relTime+0.05);safeStop(o2,t+relTime+0.05);safeStop(lfo,t+relTime+0.05);
    sendMidi(LANE_CH.bass,noteToMidi[note]||48,accent,relTime*1000);
  };

  const playSynthAt=(pi,note,accent,t,noteLenSteps=1)=>{
    if(!nodeGuard())return;
    const audio=audioRef.current;if(!audio)return;
    // Custom sound design override
    const sd=soundDesignRef.current?.synth;
    if(sd?.active){
      const f=noteToFreq[note]||440;
      const noteDur=clamp(stepSec()*noteLenSteps*0.95,0.04,8.0);
      const atkT=Math.min(sd.atk,noteDur*0.4);const relT=Math.min(sd.rel+noteDur*0.5,noteDur*0.95);
      const cleanMs=(relT+0.5)*1000;
      const oA=audio.ctx.createOscillator(),oB=audio.ctx.createOscillator();
      const mix=audio.ctx.createGain(),fil=audio.ctx.createBiquadFilter(),amp=audio.ctx.createGain();
      const lfoOsc=audio.ctx.createOscillator(),lfoG=audio.ctx.createGain();
      const driveN=audio.ctx.createWaveShaper();
      oA.type=sd.osc;oB.type=sd.osc2;oA.frequency.value=f;oB.frequency.value=f*(1+sd.detune/1200);
      fil.type=sd.filterType;fil.frequency.value=200+sd.cutoff*7000;fil.Q.value=0.5+sd.res*7;
      lfoOsc.frequency.value=sd.lfoRate||3;lfoG.gain.value=(sd.lfo||0)*800;
      lfoOsc.connect(lfoG);lfoG.connect(fil.frequency);
      setDriveCurve(driveN,sd.drive||0.05);
      amp.gain.setValueAtTime(0.0001,t);
      amp.gain.linearRampToValueAtTime(0.44*accent,t+atkT);
      amp.gain.setValueAtTime(0.44*accent*sd.sus,t+Math.min(atkT+sd.dec,relT*0.6));
      amp.gain.exponentialRampToValueAtTime(0.0001,t+relT);
      oA.connect(mix);oB.connect(mix);mix.connect(fil);fil.connect(driveN);driveN.connect(amp);
      const fxn=routeLaneFx(amp,'synth');
      trackNode(oA,cleanMs);cleanup(oA,[oB,mix,fil,driveN,amp,lfoOsc,lfoG,...fxn],cleanMs);
      safeStart(oA,t);safeStart(oB,t);safeStart(lfoOsc,t);
      safeStop(oA,t+relT+0.1);safeStop(oB,t+relT+0.1);safeStop(lfoOsc,t+relT+0.1);
      sendMidi(LANE_CH.synth,noteToMidi[note]||60,accent,relT*1000);return;
    }
    const p=synthPresets[pi],f=noteToFreq[note]||440,ss=pickWave(p.mode,'synth');
    const noteDur=clamp(stepSec()*noteLenSteps*0.95,0.04,8.0);
    const atkT=Math.min(0.005+synthAttack*0.18,noteDur*0.4);
    const relT=Math.max(atkT+0.02,noteDur*(0.5+synthRelease*0.5)+space*0.3);
    const holdEnd=Math.max(atkT+0.01,noteDur*0.7);
    const cleanMs=(relT+0.5)*1000;

    const mix=audio.ctx.createGain(),fil=audio.ctx.createBiquadFilter(),amp=audio.ctx.createGain();
    const vib=audio.ctx.createOscillator(),vg=audio.ctx.createGain(),nn=audio.ctx.createBufferSource(),ng=audio.ctx.createGain();
    nn.buffer=createNoise(Math.min(noteDur+0.1,2.0),noise*0.7);
    fil.type=['air','mist'].includes(p.mode)?'bandpass':'lowpass';
    fil.frequency.value=200+synthCutoff*6500+tone*1600+pi*18;
    fil.Q.value=0.6+resonance*4.5+(p.mode==='bell'?1.1:p.mode==='glass'?0.5:0);
    vib.frequency.value=0.5+synthLfo*9;vg.gain.value=clamp(synthLfo*9+(['lead','star'].includes(p.mode)?1.2:0),0,22);
    ng.gain.value=['mist','air','choir'].includes(p.mode)?0.12+noise*0.1:0.018;
    // Proper ADSR
    amp.gain.setValueAtTime(0.0001,t);
    amp.gain.linearRampToValueAtTime(0.44*accent,t+atkT);
    amp.gain.setValueAtTime(0.44*accent,t+holdEnd);
    amp.gain.exponentialRampToValueAtTime(0.0001,t+relT);

    if(['glass','bell','star','candy'].includes(p.mode)){
      const idx=fmIndexRef.current*(p.mode==='bell'?2:p.mode==='glass'?1.2:1.5);
      const{carrier,modulator,modGain}=makeFmPair(audio.ctx,f,p.mode==='bell'?3.0:p.mode==='candy'?2.0:2.5,idx,'sine');
      vib.connect(vg);vg.connect(carrier.frequency);vg.connect(modulator.frequency);
      nn.connect(ng);ng.connect(mix);carrier.connect(mix);mix.connect(fil);fil.connect(amp);
      const fxn=routeLaneFx(amp,'synth');
      trackNode(carrier,cleanMs);
      cleanup(carrier,[modulator,modGain,vib,nn,mix,fil,amp,vg,ng,...fxn],cleanMs);
      safeStart(carrier,t);safeStart(modulator,t);safeStart(nn,t);safeStart(vib,t);
      safeStop(carrier,t+relT+0.1);safeStop(modulator,t+relT+0.1);safeStop(nn,t+relT+0.1);safeStop(vib,t+relT+0.1);
      sendMidi(LANE_CH.synth,noteToMidi[note]||60,accent,relT*1000);return;
    }

    const oA=audio.ctx.createOscillator(),oB=audio.ctx.createOscillator();
    oA.type=ss==='sine'?'sine':ss==='triangle'?'triangle':ss==='square'?'square':p.mode==='lead'?'square':'sawtooth';
    oB.type=ss==='square'?'square':ss==='sine'?'sine':['pad','choir','mist'].includes(p.mode)?'sine':'triangle';
    oA.frequency.value=f;oB.frequency.value=f*1.008;
    vib.connect(vg);vg.connect(oA.frequency);vg.connect(oB.frequency);
    oA.connect(mix);oB.connect(mix);nn.connect(ng);ng.connect(mix);mix.connect(fil);fil.connect(amp);
    const fxn=routeLaneFx(amp,'synth');
    trackNode(oA,cleanMs);
    cleanup(oA,[oB,vib,nn,mix,fil,amp,vg,ng,...fxn],cleanMs);
    safeStart(oA,t);safeStart(oB,t);safeStart(nn,t);safeStart(vib,t);
    safeStop(oA,t+relT+0.1);safeStop(oB,t+relT+0.1);safeStop(nn,t+relT+0.1);safeStop(vib,t+relT+0.1);
    sendMidi(LANE_CH.synth,noteToMidi[note]||60,accent,relT*1000);
  };

  const playMetronomeAt=(isDownbeat,t)=>{
    const audio=audioRef.current;if(!audio||!metronomeOn)return;
    const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain();osc.type='square';osc.frequency.setValueAtTime(isDownbeat?1760:1320,t);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.055*metronomeLevel,t+0.002);g.gain.exponentialRampToValueAtTime(0.0001,t+0.035);
    osc.connect(g);g.connect(audio.inputBus);cleanup(osc,[g],100);safeStart(osc,t);safeStop(osc,t+0.04);
  };

  // ─── Lookahead Scheduler ──────────────────────────────────────────────────
  const scheduleNote=(stepIdx,t)=>{
    const accent=stepIdx%4===0?1:0.86;const lp=patternsRef.current,lsc=laneStepCountsRef.current;
    if(metronomeOn&&stepIdx%4===0)playMetronomeAt(stepIdx%16===0,t);
    sendMidiClock();
    for(const lane of LANE_KEYS){
      const ll=lsc[lane]||stepCountRef.current,li=stepIdx%ll;
      const sd=lp[lane][li];if(!sd||!sd.on)continue;
      // Probability check
      if(sd.prob<1&&Math.random()>sd.prob)continue;
      const jitter=(Math.random()-0.5)*humanizeRef.current*0.022;
      const noteT=t+Math.max(0,jitter);
      const ga=getGrooveAccent(grooveProfileRef.current,lane,li,grooveAmountRef.current);
      const ma=1+macroKnobRef.current*0.14;
      const finalAccent=clamp(accent*ga*ma*(sd.vel??1),0.1,1.2);
      if(lane==='kick')playDrumAt(Math.min(drumPresetRef.current,1),finalAccent,noteT);
      else if(lane==='snare'){const p=drumPresetRef.current;playDrumAt(p<2?2:p<4?p:p%2===0?12:3,finalAccent,noteT);}
      else if(lane==='hat'){const p=drumPresetRef.current;playDrumAt(p<4?4:p<6?p:p%2===0?13:5,finalAccent,noteT);}
      else if(lane==='bass')playBassAt(bassPresetRef.current,bassLineRef.current[li]||'C2',finalAccent,noteT,sd.len??1);
      else if(lane==='synth')playSynthAt(synthPresetRef.current,synthLineRef.current[li]||'C4',finalAccent,noteT,sd.len??1);
      const flashDelay=Math.max(0,(noteT-audioRef.current.ctx.currentTime)*1000);
      window.setTimeout(()=>flashLane(lane,finalAccent),flashDelay);
      if(stutterOnRef.current&&Math.random()<0.16){const b=stutterBurstRef.current;for(let i=1;i<b;i++){const st=noteT+i*0.042;if(lane==='kick')playDrumAt(Math.min(drumPresetRef.current,1),0.62*ga,st);else if(lane==='snare'){const p=drumPresetRef.current;playDrumAt(p<2?2:3,0.62*ga,st);}else if(lane==='hat'){const p=drumPresetRef.current;playDrumAt(p<4?4:5,0.62*ga,st);}else if(lane==='bass')playBassAt(bassPresetRef.current,bassLineRef.current[li]||'C2',0.62*ga,st);else if(lane==='synth')playSynthAt(synthPresetRef.current,synthLineRef.current[li]||'C4',0.62*ga,st);}}
    }
  };

  const stepInterval=(idx)=>{const bMs=(60/bpmRef.current)*1000/4;const sw=idx%2===1?bMs*swingRef.current:-bMs*swingRef.current*0.5;return Math.max(0.028,(bMs+sw)/1000);};

  const runScheduler=()=>{
    const audio=audioRef.current;if(!audio||!isPlayingRef.current)return;const now=audio.ctx.currentTime;
    while(nextNoteTimeRef.current<now+SCHEDULE_AHEAD){
      const si=currentStepRef.current;scheduleNote(si,nextNoteTimeRef.current);
      const delay=Math.max(0,(nextNoteTimeRef.current-now)*1000);
      window.setTimeout(()=>{setStep(si);setPage(Math.floor(si/PAGE_SIZE));},delay);
      nextNoteTimeRef.current+=stepInterval(si);
      currentStepRef.current=(si+1)%stepCountRef.current;
    }
  };

  const startClock=()=>{const audio=audioRef.current;if(!audio)return;nextNoteTimeRef.current=audio.ctx.currentTime+0.06;currentStepRef.current=0;isPlayingRef.current=true;schedulerRef.current=setInterval(runScheduler,LOOKAHEAD_MS);};
  const stopClock=()=>{if(schedulerRef.current){clearInterval(schedulerRef.current);schedulerRef.current=null;}isPlayingRef.current=false;setIsPlaying(false);setStep(0);};

  const togglePlay=async()=>{
    await initAudio();if(!audioRef.current)return;
    if(isPlayingRef.current){stopClock();setStatusText('Stopped.');return;}
    if(audioRef.current.ctx.state==='suspended')await audioRef.current.ctx.resume();
    startClock();setIsPlaying(true);setStatusText('Running.');
  };

  const triggerLaneNow=async(lane,accent=1)=>{
    await initAudio();setActiveLane(lane);const audio=audioRef.current;if(!audio)return;
    const t=audio.ctx.currentTime+0.002;const li=currentStepRef.current%(laneStepCountsRef.current[lane]||stepCountRef.current);
    if(lane==='kick')playDrumAt(Math.min(drumPresetRef.current,1),accent,t);
    else if(lane==='snare'){const p=drumPresetRef.current;playDrumAt(p<2?2:p<4?p:p%2===0?12:3,accent,t);}
    else if(lane==='hat'){const p=drumPresetRef.current;playDrumAt(p<4?4:p<6?p:p%2===0?13:5,accent,t);}
    else if(lane==='bass')playBassAt(bassPresetRef.current,bassLineRef.current[li]||'C2',accent,t);
    else if(lane==='synth')playSynthAt(synthPresetRef.current,synthLineRef.current[li]||'C4',accent,t);
    flashLane(lane,accent);
  };

  // Velocity-sensitive mousedown for pads
  const padMouseRef=useRef({});
  const onPadDown=(lane,e)=>{padMouseRef.current[lane]=e.timeStamp;};
  const onPadUp=(lane,e)=>{const held=e.timeStamp-(padMouseRef.current[lane]||e.timeStamp);const vel=clamp(1-(held/500),0.3,1);triggerLaneNow(lane,vel);};

  // ─── Pattern ops ──────────────────────────────────────────────────────────
  const toggleCell=(lane,idx)=>{
    if(idx>=laneStepCounts[lane])return;
    pushUndo(patterns);
    setPatterns(prev=>({...prev,[lane]:prev[lane].map((s,i)=>i===idx?{...s,on:!s.on}:s)}));
  };
  const clearAll=()=>{stopClock();const empty={kick:makeStepData(),snare:makeStepData(),hat:makeStepData(),bass:makeStepData(),synth:makeStepData()};pushUndo(patterns);setPatterns(empty);setBassLine(makeEmptyNotes('C2'));setSynthLine(makeEmptyNotes('C4'));setLaneStepCounts({kick:16,snare:16,hat:16,bass:16,synth:16});setSectionProfile('pulse-cell');setHarmonicProfile('minor');setGrooveProfile('steady');setStatusText('Cleared.');};
  const handleStepCount=n=>{const s=clamp(n,16,MAX_STEPS);setLaneStepCounts({kick:s,snare:s,hat:s,bass:s,synth:s});};
  const setLaneStepCount=(lane,n)=>setLaneStepCounts(prev=>({...prev,[lane]:clamp(n,16,MAX_STEPS)}));
  const randomize=()=>{
    const fs=buildFreestylePattern(stepCount,laneStepCounts,density,chaos,{drumPreset,bassPreset,synthPreset},{autoLength:true,iterCount});
    pushUndo(patterns);setLaneStepCounts(fs.laneLengths);setPatterns(fs.patterns);setBassLine(fs.bassLine);setSynthLine(fs.synthLine);
    setSectionProfile(fs.sectionProfile);setHarmonicProfile(fs.harmonicProfile);setGrooveProfile(fs.grooveProfile);
    setArpeMode(fs.arpeMode||'up');
    setDrumPreset(fs.drumPreset);setBassPreset(fs.bassPreset);setSynthPreset(fs.synthPreset);setFxPreset(fs.fxPreset);
    setIterCount(c=>c+1);
    setStatusText(`${fs.sectionProfile} · ${fs.grooveProfile} · ${fs.harmonicProfile} · arp:${fs.arpeMode}`);
  };
  const autoJam=()=>{
    // Gradual evolution — parameters shift from current values, not random jump
    const newDensity=clamp(density+(Math.random()-0.4)*0.18,0.1,0.95);
    const newChaos=clamp(chaos+(Math.random()-0.4)*0.14,0,1);
    const fs=buildFreestylePattern(stepCount,laneStepCounts,newDensity,newChaos,{drumPreset,bassPreset,synthPreset},{autoLength:true,iterCount});
    pushUndo(patterns);setLaneStepCounts(fs.laneLengths);setPatterns(fs.patterns);setBassLine(fs.bassLine);setSynthLine(fs.synthLine);
    setSectionProfile(fs.sectionProfile);setHarmonicProfile(fs.harmonicProfile);setGrooveProfile(fs.grooveProfile);
    setArpeMode(fs.arpeMode||'up');setDrumPreset(fs.drumPreset);setBassPreset(fs.bassPreset);setSynthPreset(fs.synthPreset);setFxPreset(fs.fxPreset);
    // Gradual parameter evolution — never jumps to extremes
    setDensity(newDensity);setChaos(newChaos);
    setTone(clamp(tone+(Math.random()-0.5)*0.22,0.1,1));
    setNoise(clamp(noise+(Math.random()-0.5)*0.18,0,1));
    setSpace(clamp(space+(Math.random()-0.5)*0.2,0,1));
    setSwing(clamp(swing+(Math.random()-0.5)*0.06,0,0.25));
    setBassCutoff(clamp(bassCutoff+(Math.random()-0.5)*0.3,0,1));
    setSynthCutoff(clamp(synthCutoff+(Math.random()-0.5)*0.28,0,1));
    setBassSubAmount(clamp(bassSubAmount+(Math.random()-0.5)*0.2,0.1,1));
    setSynthAttack(clamp(synthAttack+(Math.random()-0.5)*0.12,0,1));
    setSynthRelease(clamp(synthRelease+(Math.random()-0.5)*0.18,0,1));
    setLaneFx(prev=>({
      kick: {...prev.kick,drive:clamp(prev.kick.drive+(Math.random()-0.5)*0.12,0,1),tone:clamp(prev.kick.tone+(Math.random()-0.5)*0.15,0,1)},
      snare:{...prev.snare,drive:clamp(prev.snare.drive+(Math.random()-0.5)*0.1,0,1),echo:clamp(prev.snare.echo+(Math.random()-0.5)*0.08,0,1)},
      hat:  {...prev.hat,tone:clamp(prev.hat.tone+(Math.random()-0.5)*0.14,0,1),crush:clamp(prev.hat.crush+(Math.random()-0.5)*0.08,0,1)},
      bass: {...prev.bass,drive:clamp(prev.bass.drive+(Math.random()-0.5)*0.1,0,1),tone:clamp(prev.bass.tone+(Math.random()-0.5)*0.14,0,1)},
      synth:{...prev.synth,drive:clamp(prev.synth.drive+(Math.random()-0.5)*0.1,0,1),echo:clamp(prev.synth.echo+(Math.random()-0.5)*0.1,0,1)},
    }));
    setIterCount(c=>c+1);
    setStatusText(`Auto Jam #${iterCount+1} · ${fs.sectionProfile} · ${fs.harmonicProfile}`);
  };
  const triggerStutter=async()=>{await initAudio();const audio=audioRef.current;if(!audio)return;const b=Math.max(2,stutterBurst),t=audio.ctx.currentTime+0.002;const li=currentStepRef.current%(laneStepCounts[activeLane]||stepCount);for(let i=0;i<b;i++){const st=t+i*0.048;if(activeLane==='kick')playDrumAt(Math.min(drumPreset,1),i===0?1:0.7,st);else if(activeLane==='snare')playDrumAt(drumPreset<2?2:3,i===0?1:0.7,st);else if(activeLane==='hat')playDrumAt(drumPreset<4?4:5,i===0?1:0.7,st);else if(activeLane==='bass')playBassAt(bassPreset,bassLine[li]||'C2',i===0?1:0.7,st);else if(activeLane==='synth')playSynthAt(synthPreset,synthLine[li]||'C4',i===0?1:0.7,st);}flashLane(activeLane,1);setStatusText(`${activeLane.toUpperCase()} stutter x${b}.`);};

  const fillLane=(lane,amount)=>{pushUndo(patterns);setPatterns(prev=>{const n={...prev,[lane]:[...prev[lane]]};for(let i=0;i<laneStepCounts[lane];i++){n[lane][i]={...n[lane][i],on:Math.random()<amount,prob:clamp(0.6+Math.random()*0.4,0.5,1),vel:clamp(0.5+Math.random()*0.5,0.4,1)};}return n;});};
  const rotateLane=(lane,dir=1)=>{pushUndo(patterns);setPatterns(prev=>{const len=laneStepCounts[lane],src=prev[lane].slice(0,len),s=src.map((_,i)=>src[(i-dir+len)%len]),n={...prev,[lane]:[...prev[lane]]};for(let i=0;i<len;i++)n[lane][i]=s[i];return n;});};
  const mutateLane=(lane)=>{pushUndo(patterns);setPatterns(prev=>{const n={...prev,[lane]:[...prev[lane]]},len=laneStepCounts[lane],flips=Math.max(2,Math.floor(len*(0.05+chaos*0.08)));for(let i=0;i<flips;i++){const pos=Math.floor(Math.random()*len);n[lane][pos]={...n[lane][pos],on:!n[lane][pos].on};}return n;});};
  const getLaneNotePool=(lane)=>{const mode=MODES[harmonicProfileRef.current]||MODES.minor;return lane==='bass'?mode.bass:lane==='synth'?mode.synth:[];};
  const setStepNote=(lane,idx,note)=>{if(lane==='bass'){if(idx>=laneStepCounts.bass||!patterns.bass[idx].on)return;setBassLine(prev=>prev.map((v,i)=>i===idx?note:v));}else if(lane==='synth'){if(idx>=laneStepCounts.synth||!patterns.synth[idx].on)return;setSynthLine(prev=>prev.map((v,i)=>i===idx?note:v));}};
  const randomizeLaneNotes=(lane)=>{const pool=getLaneNotePool(lane);if(!pool.length)return;if(lane==='bass')setBassLine(prev=>prev.map((v,i)=>i<laneStepCounts.bass&&patterns.bass[i].on?seededChoice(pool):v));else setSynthLine(prev=>prev.map((v,i)=>i<laneStepCounts.synth&&patterns.synth[i].on?seededChoice(pool):v));};
  const shiftLaneNotes=(lane,dir=1)=>{const pool=getLaneNotePool(lane);if(!pool.length)return;if(lane==='bass')setBassLine(prev=>prev.map((v,i)=>{if(i>=laneStepCounts.bass||!patterns.bass[i].on)return v;const at=pool.indexOf(v);return pool[at===-1?0:(at+dir+pool.length)%pool.length];}));else setSynthLine(prev=>prev.map((v,i)=>{if(i>=laneStepCounts.synth||!patterns.synth[i].on)return v;const at=pool.indexOf(v);return pool[at===-1?0:(at+dir+pool.length)%pool.length];}));};

  // Update step prob/vel/len inline
  const setStepProp=(lane,idx,prop,val)=>{setPatterns(prev=>({...prev,[lane]:prev[lane].map((s,i)=>i===idx?{...s,[prop]:val}:s)}));};

  // ─── Tap Tempo ────────────────────────────────────────────────────────────
  const tapTempo=()=>{const now=Date.now();setTapTimes(prev=>{const next=[...prev.filter(t=>now-t<3000),now];if(next.length>=2){const intervals=next.slice(1).map((t,i)=>t-next[i]);const avg=intervals.reduce((a,b)=>a+b,0)/intervals.length;const newBpm=clamp(Math.round(60000/avg),60,200);setBpm(newBpm);setStatusText(`TAP → ${newBpm} BPM`);}return next.slice(-6);});};

  // ─── Save/Load ────────────────────────────────────────────────────────────
  const serializeScene=()=>({bpm,swing,density,chaos,tone,noise,space,master,compressAmount,resonance,bassLfo,synthLfo,drumDecay,bassWave,synthWave,bassCutoff,synthCutoff,bassSubAmount,synthAttack,synthRelease,stutterBurst,stutterOn,macroKnob,grooveAmount,harmonicProfile,grooveProfile,sectionProfile,drumPreset,bassPreset,synthPreset,fxPreset,laneStepCounts,patterns,bassLine,synthLine,laneFx,laneVolumes,projectName,metronomeOn,metronomeLevel,fmIndex,soundDesign});
  const applySnapshot=(snap,label='Loaded.')=>{
    if(!snap)return;stopClock();if(snap.projectName)setProjectName(snap.projectName);
    const n=(k,s)=>typeof snap[k]==='number'&&s(snap[k]),b=(k,s)=>typeof snap[k]==='boolean'&&s(snap[k]);
    n('bpm',setBpm);n('swing',setSwing);n('density',setDensity);n('chaos',setChaos);n('tone',setTone);n('noise',setNoise);n('space',setSpace);n('master',setMaster);n('compressAmount',setCompressAmount);n('resonance',setResonance);n('bassLfo',setBassLfo);n('synthLfo',setSynthLfo);n('drumDecay',setDrumDecay);n('bassCutoff',setBassCutoff);n('synthCutoff',setSynthCutoff);n('bassSubAmount',setBassSubAmount);n('synthAttack',setSynthAttack);n('synthRelease',setSynthRelease);n('stutterBurst',setStutterBurst);n('macroKnob',setMacroKnob);n('grooveAmount',setGrooveAmount);n('metronomeLevel',setMetronomeLevel);n('drumPreset',setDrumPreset);n('bassPreset',setBassPreset);n('synthPreset',setSynthPreset);n('fxPreset',setFxPreset);n('fmIndex',setFmIndex);
    b('stutterOn',setStutterOn);b('metronomeOn',setMetronomeOn);
    if(snap.harmonicProfile)setHarmonicProfile(snap.harmonicProfile);if(snap.grooveProfile)setGrooveProfile(snap.grooveProfile);if(snap.sectionProfile)setSectionProfile(snap.sectionProfile);if(snap.bassWave)setBassWave(snap.bassWave);if(snap.synthWave)setSynthWave(snap.synthWave);
    if(snap.laneStepCounts)setLaneStepCounts(snap.laneStepCounts);if(snap.patterns)setPatterns(snap.patterns);if(snap.bassLine)setBassLine(snap.bassLine);if(snap.synthLine)setSynthLine(snap.synthLine);if(snap.laneFx)setLaneFx(snap.laneFx);if(snap.laneVolumes)setLaneVolumes(snap.laneVolumes);
    if(snap.soundDesign)setSoundDesign(snap.soundDesign);
    setStatusText(label);
  };
  const saveScene=slot=>{setSceneSlots(prev=>prev.map((v,i)=>i===slot?serializeScene():v));setCurrentScene(slot);setStatusText(`Scene ${slot+1} saved.`);};
  const loadScene=slot=>{if(!sceneSlots[slot]){setStatusText(`Scene ${slot+1} empty.`);return;}applySnapshot(sceneSlots[slot],`Scene ${slot+1} loaded.`);setCurrentScene(slot);};
  const saveProjectLocal=()=>{try{window.localStorage.setItem('cesira-project-autoload',JSON.stringify(serializeScene()));setStatusText('Saved.');}catch{setStatusText('Save failed.');}};
  const loadProjectLocal=()=>{try{const r=window.localStorage.getItem('cesira-project-autoload');if(!r){setStatusText('No local save.');return;}applySnapshot(JSON.parse(r),'Loaded.');}catch{setStatusText('Load failed.');}};
  const saveProjectSlot=slot=>{setProjectSlots(prev=>prev.map((v,i)=>i===slot?{label:projectName||`P${slot+1}`,stamp:new Date().toLocaleString(),data:serializeScene()}:v));setCurrentProjectSlot(slot);setStatusText(`Slot ${slot+1} saved.`);};
  const loadProjectSlot=slot=>{const item=projectSlots[slot];if(!item?.data){setStatusText(`Slot ${slot+1} empty.`);return;}applySnapshot(item.data,`Slot ${slot+1} loaded.`);setCurrentProjectSlot(slot);};
  const clearProjectSlot=slot=>{setProjectSlots(prev=>prev.map((v,i)=>i===slot?null:v));if(currentProjectSlot===slot)setCurrentProjectSlot(null);};
  const exportProjectJson=()=>{try{const blob=new Blob([JSON.stringify(serializeScene(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${(projectName||'cesira').replace(/[^a-z0-9-_]+/gi,'-').toLowerCase()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);setStatusText('Exported.');}catch{setStatusText('Export failed.');}};
  const importProjectFile=async e=>{const f=e.target.files?.[0];if(!f)return;try{const t=await f.text();applySnapshot(JSON.parse(t),'Imported.');}catch{setStatusText('Import failed.');}finally{if(e.target)e.target.value='';}};
  const startRecording=async()=>{await initAudio();const audio=audioRef.current;if(!audio||recState==='recording')return;const preferred=['audio/webm;codecs=opus','audio/webm','audio/mp4'];const mime=preferred.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported?.(t))||'';chunksRef.current=[];const recorder=mime?new MediaRecorder(audio.dest.stream,{mimeType:mime}):new MediaRecorder(audio.dest.stream);recorderRef.current=recorder;setRecordMime(mime||'audio/webm');recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)chunksRef.current.push(e.data);};recorder.onstop=()=>{const ft=mime||recorder.mimeType||'audio/webm';const ext=ft.includes('mp4')?'m4a':'webm';const blob=new Blob(chunksRef.current,{type:ft});const url=URL.createObjectURL(blob);setRecordings(prev=>[{url,name:`cesira-take-${prev.length+1}.${ext}`},...prev.slice(0,5)]);setRecState('idle');setStatusText('Take saved.');};recorder.start();setRecState('recording');setStatusText('Recording...');};
  const stopRecording=()=>{if(recorderRef.current&&recState==='recording'){recorderRef.current.stop();setRecState('stopping');setStatusText('Finalizing...');}};
  const downloadRecording=item=>{const a=document.createElement('a');a.href=item.url;a.download=item.name;a.click();};

  // ─── Styles ────────────────────────────────────────────────────────────────
  const pill=(active,color='#34d399')=>({padding:'2px 6px',borderRadius:'4px',border:`1px solid ${active?color:BD}`,background:active?`${color}18`:B1,color:active?color:'#64748b',fontSize:'8px',fontWeight:800,cursor:'pointer',transition:'all 0.1s',letterSpacing:'0.1em',whiteSpace:'nowrap'});

  const selStep=selectedStep;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return(
    <div style={{fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif',background:B0,color:'#e2e8f0',height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',padding:'6px',gap:'4px',boxSizing:'border-box',userSelect:'none'}}>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:'5px',flexShrink:0,height:'30px'}}>
        <div style={{fontSize:'9px',fontWeight:900,letterSpacing:'0.22em',color:'#34d399',padding:'2px 8px',borderRadius:'999px',border:'1px solid rgba(52,211,153,0.22)',background:'rgba(52,211,153,0.06)',whiteSpace:'nowrap'}}>CESIRA V1</div>
        <input value={projectName} onChange={e=>setProjectName(e.target.value)} style={{width:'100px',background:B1,border:`1px solid ${BD}`,borderRadius:'5px',padding:'2px 6px',fontSize:'10px',fontWeight:700,color:'#fff',outline:'none'}}/>
        <button onClick={togglePlay} style={{padding:'3px 14px',borderRadius:'6px',border:'none',background:isPlaying?'#f43f5e':'#34d399',color:isPlaying?'#fff':'#0a1628',fontWeight:900,fontSize:'10px',cursor:'pointer',letterSpacing:'0.08em',flexShrink:0,transition:'background 0.12s'}}>{isPlaying?'■ STOP':'▶ PLAY'}</button>
        <button onClick={randomize} style={{...pill(false),padding:'3px 8px',fontSize:'9px'}}>Freestyle</button>
        <button onClick={autoJam} style={{...pill(false),padding:'3px 8px',fontSize:'9px'}}>Auto Jam</button>
        <button onClick={recState==='recording'?stopRecording:startRecording} style={{...pill(recState==='recording','#f43f5e'),padding:'3px 8px',fontSize:'9px'}}>{recState==='recording'?'■ Rec':'⏺ Rec'}</button>
        <button onClick={undo} style={{...pill(false),padding:'3px 6px',fontSize:'9px'}}>↩</button>
        <button onClick={redo} style={{...pill(false),padding:'3px 6px',fontSize:'9px'}}>↪</button>
        <button onClick={clearAll} style={{...pill(false),padding:'3px 6px',fontSize:'9px'}}>Clr</button>
        <button onClick={saveProjectLocal} style={{...pill(false,'#34d399'),padding:'3px 6px',fontSize:'9px'}}>Save</button>
        {/* Oscilloscope */}
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',minWidth:0}}>
          <Scope analyser={scopeAnalyser} color='#34d399' width={180} height={24}/>
        </div>
        {/* BPM + Tap */}
        <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
          <span style={{fontSize:'7px',fontWeight:800,color:'#334155',letterSpacing:'0.16em'}}>BPM</span>
          <input type="number" min={60} max={200} value={bpm} onChange={e=>setBpm(clamp(Number(e.target.value),60,200))} style={{width:'40px',background:B1,border:`1px solid ${BD}`,borderRadius:'4px',padding:'2px 3px',fontSize:'11px',fontWeight:900,color:'#34d399',textAlign:'center',outline:'none'}}/>
          <button onClick={tapTempo} style={{...pill(tapTimes.length>0,'#fbbf24'),padding:'3px 5px',fontSize:'8px'}}>TAP</button>
        </div>
        {/* Steps */}
        <div style={{display:'flex',gap:'2px'}}>
          {[16,32,48,64].map(s=><button key={s} onClick={()=>handleStepCount(s)} style={pill(stepCount===s)}>{s}</button>)}
        </div>
        <div style={{fontSize:'8px',color:'#334155',fontWeight:800,whiteSpace:'nowrap',minWidth:'36px',textAlign:'right'}}>{step+1}/{stepCount}</div>
        <div style={{display:'flex',alignItems:'center',gap:'3px'}}>
          <div style={{width:'6px',height:'6px',borderRadius:'50%',background:midiEnabled?'#34d399':'#334155',transition:'background 0.3s'}}/>
          <span style={{fontSize:'7px',color:'#334155',fontWeight:700}}>MIDI</span>
        </div>
        <div style={{fontSize:'7px',color:'#34d399',opacity:0.55,maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{statusText}</div>
      </div>

      {/* PRESET STRIPS */}
      <div style={{display:'flex',flexDirection:'column',gap:'2px',flexShrink:0}}>
        {[
          {label:'DRUMS',items:drumPresets,active:drumPreset,onSelect:i=>{setDrumPreset(i);initAudio().then(()=>playDrumAt(i,0.85,(audioRef.current?.ctx.currentTime||0)+0.01));}},
          {label:'BASS', items:bassPresets, active:bassPreset, onSelect:i=>{setBassPreset(i);initAudio().then(()=>playBassAt(i,bassNotes[i%bassNotes.length],0.85,(audioRef.current?.ctx.currentTime||0)+0.01));}},
          {label:'SYNTH',items:synthPresets,active:synthPreset,onSelect:i=>{setSynthPreset(i);initAudio().then(()=>playSynthAt(i,synthNotes[i%synthNotes.length],0.85,(audioRef.current?.ctx.currentTime||0)+0.01));}},
          {label:'FX',   items:fxScenes,   active:fxPreset,   onSelect:i=>applyFxScene(i)},
        ].map(({label,items,active,onSelect})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:'4px',height:'18px'}}>
            <span style={{fontSize:'7px',fontWeight:900,letterSpacing:'0.2em',color:'#1e2d3d',width:'32px',flexShrink:0,textTransform:'uppercase'}}>{label}</span>
            <div style={{flex:1,display:'flex',gap:'2px',overflowX:'auto',height:'100%'}}>
              {items.map((item,idx)=>(
                <button key={item.name} onClick={()=>onSelect(idx)}
                  style={{flexShrink:0,padding:'1px 6px',borderRadius:'3px',border:`1px solid ${active===idx?'#34d399':BD}`,background:active===idx?'rgba(52,211,153,0.14)':B1,color:active===idx?'#34d399':'#3d5166',fontSize:'7.5px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',height:'100%',display:'flex',alignItems:'center',transition:'all 0.07s'}}>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',gap:'5px',minHeight:0}}>

        {/* LEFT GRID */}
        <div style={{flex:'1 1 0',display:'flex',flexDirection:'column',gap:'3px',background:B1,borderRadius:'10px',border:`1px solid ${BD}`,padding:'6px',minWidth:0,overflow:'hidden'}}>
          {/* Grid header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,height:'16px'}}>
            <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
              <span style={{fontSize:'8px',fontWeight:800,color:'#34d399'}}>{grooveProfile.toUpperCase()}</span>
              <span style={{color:'#1e293b',fontSize:'8px'}}>·</span>
              <span style={{fontSize:'8px',fontWeight:800,color:'#67e8f9'}}>{harmonicProfile.toUpperCase()}</span>
              <span style={{color:'#1e293b',fontSize:'8px'}}>·</span>
              <span style={{fontSize:'7px',fontWeight:600,color:'#fbbf24'}}>{sectionProfile}</span>
              <span style={{color:'#1e293b',fontSize:'8px'}}>·</span>
              <span style={{fontSize:'7px',fontWeight:600,color:'#a78bfa'}}>arp:{arpeMode}</span>
            </div>
            <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
              <button onClick={()=>setPage(p=>clamp(p-1,0,totalPages-1))} disabled={page===0} style={{...pill(false),padding:'1px 5px',opacity:page===0?0.3:1}}>‹</button>
              <span style={{fontSize:'7px',color:'#334155',fontWeight:700}}>pg {page+1}/{totalPages} · steps {visibleStart+1}-{visibleEnd}</span>
              <button onClick={()=>setPage(p=>clamp(p+1,0,totalPages-1))} disabled={page>=totalPages-1} style={{...pill(false),padding:'1px 5px',opacity:page>=totalPages-1?0.3:1}}>›</button>
            </div>
          </div>

          {/* Lane control strip — one compact horizontal row per lane */}
          <div style={{display:'flex',flexDirection:'column',gap:'2px',flexShrink:0,paddingBottom:'3px',borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
            {laneLabels.map(({key,label,long})=>{
              const lc=LANE_COLOR[key];const isActive=activeLane===key;
              const vuLevel=laneVU[key]||0;const fa=Math.max(0,1-(Date.now()-(padFlash[key]||0))/160);
              return(
                <div key={key} style={{display:'flex',alignItems:'center',gap:'5px',height:'18px'}}>
                  {/* VU + trigger */}
                  <div style={{display:'flex',alignItems:'center',gap:'3px',flexShrink:0}}>
                    <div style={{display:'flex',flexDirection:'row',gap:'1px',alignItems:'center',height:'12px'}}>
                      {Array.from({length:6},(_,i)=>{const lit=i<Math.round(vuLevel*6);return<div key={i} style={{width:'3px',height:'100%',borderRadius:'1px',background:lit?(i>4?'#f43f5e':i>3?'#fbbf24':lc):'rgba(255,255,255,0.05)',transition:'background 0.04s'}}/>;})  }
                    </div>
                    <button onMouseDown={e=>onPadDown(key,e)} onMouseUp={e=>onPadUp(key,e)} onClick={()=>setActiveLane(key)}
                      style={{padding:'2px 7px',borderRadius:'4px',border:`1px solid ${isActive?lc:BD}`,background:isActive?`${lc}18`:fa>0.05?`${lc}${Math.round(fa*20).toString(16).padStart(2,'0')}`:B1,color:isActive?lc:'#475569',fontSize:'8px',fontWeight:900,cursor:'pointer',letterSpacing:'0.06em',boxShadow:fa>0.1?`0 0 6px ${lc}50`:'none',transition:'border-color 0.08s',minWidth:'28px',textAlign:'center'}}>
                      {label}
                    </button>
                    <span style={{fontSize:'6px',color:'#2a3a4a',fontWeight:700,letterSpacing:'0.1em',minWidth:'24px'}}>{long.toUpperCase()}</span>
                  </div>
                  {/* Step count pills */}
                  <div style={{display:'flex',gap:'1px',flexShrink:0}}>
                    {[16,32,48,64].map(s=>(
                      <button key={s} onClick={()=>setLaneStepCount(key,s)}
                        style={{padding:'1px 4px',borderRadius:'3px',border:`1px solid ${laneStepCounts[key]===s?lc:BD}`,background:laneStepCounts[key]===s?`${lc}20`:B1,color:laneStepCounts[key]===s?lc:'#2a3a4a',fontSize:'6px',fontWeight:800,cursor:'pointer',lineHeight:1.4}}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {/* Volume: compact horizontal slider + value */}
                  <div style={{display:'flex',alignItems:'center',gap:'3px',flex:1,minWidth:0}}>
                    <span style={{fontSize:'5.5px',color:'#2a3a4a',fontWeight:700,flexShrink:0}}>VOL</span>
                    <input type="range" min={0} max={1} step={0.01} value={laneVolumes[key]} onChange={e=>setLaneVolumes(prev=>({...prev,[key]:Number(e.target.value)}))}
                      style={{flex:1,height:'2px',accentColor:lc,cursor:'pointer',minWidth:0}}/>
                    <span style={{fontSize:'6px',color:lc,fontWeight:800,flexShrink:0,minWidth:'20px',textAlign:'right'}}>{Math.round(laneVolumes[key]*100)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step grids — all uniform height */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:'2px',minHeight:0}}>
            {laneLabels.map(({key})=>{
              const lc=LANE_COLOR[key];
              return(
                <div key={key} style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visibleIndices.length},1fr)`,gap:'1.5px',alignItems:'stretch',minHeight:0}}>
                  {visibleIndices.map(idx=>{
                    const sd=patterns[key][idx];const on=sd.on,isActiveStep=step===idx&&isPlaying,disabled=idx>=laneStepCounts[key];
                    const isBeat=idx%16===0,isBar=idx%4===0;
                    const isSel=selStep?.lane===key&&selStep?.idx===idx;
                    const probAlpha=on?Math.round(clamp((sd.prob??1)*255,55,255)).toString(16).padStart(2,'0'):'';
                    return(
                      <button key={`${key}-${idx}`}
                        onClick={()=>{if(disabled)return;if(isSel){setSelectedStep(null);}else{toggleCell(key,idx);setSelectedStep(on?null:{lane:key,idx});setActiveLane(key);}}}
                        style={{
                          width:'100%',borderRadius:'3px',
                          border:`1px solid ${isActiveStep?lc:isSel?lc:isBeat?'rgba(255,255,255,0.14)':isBar?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                          background:isActiveStep?`${lc}78`:on?`${lc}${probAlpha}`:disabled?'rgba(255,255,255,0.004)':'rgba(255,255,255,0.022)',
                          opacity:disabled?0.08:1,cursor:disabled?'not-allowed':'pointer',
                          boxShadow:isActiveStep?`0 0 9px ${lc}88`:on?`0 0 2px ${lc}26`:'none',
                          transition:'background 0.04s',
                        }}/>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Step detail editor (shows when step selected) */}
          {selStep&&patterns[selStep.lane]&&patterns[selStep.lane][selStep.idx]&&(()=>{
            const sd=patterns[selStep.lane][selStep.idx];const lc=LANE_COLOR[selStep.lane];
            return(
              <div style={{flexShrink:0,display:'flex',gap:'8px',alignItems:'center',padding:'4px 6px',borderRadius:'6px',border:`1px solid ${lc}30`,background:`${lc}08`}}>
                <span style={{fontSize:'8px',fontWeight:800,color:lc}}>{selStep.lane.toUpperCase()} step {selStep.idx+1}</span>
                <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4px'}}>
                  <Slider label="Probability" value={sd.prob??1} setValue={v=>setStepProp(selStep.lane,selStep.idx,'prob',v)} fmt={v=>`${Math.round(v*100)}%`} color={lc}/>
                  <Slider label="Velocity" value={sd.vel??1} setValue={v=>setStepProp(selStep.lane,selStep.idx,'vel',v)} fmt={v=>`${Math.round(v*100)}`} color={lc}/>
                  <Slider label="Length" value={sd.len??1} setValue={v=>setStepProp(selStep.lane,selStep.idx,'len',v)} min={0.1} max={4} step={0.1} fmt={v=>`${v.toFixed(1)}x`} color={lc}/>
                </div>
                <button onClick={()=>setSelectedStep(null)} style={{...pill(false),padding:'2px 5px',fontSize:'8px'}}>✕</button>
              </div>
            );
          })()}

          {/* Pad row */}
          <div style={{display:'flex',gap:'3px',flexShrink:0,height:'26px'}}>
            {laneLabels.map(({key,long})=>{const lc=LANE_COLOR[key];const fa=Math.max(0,1-(Date.now()-(padFlash[key]||0))/150);return(
              <button key={key} onMouseDown={e=>onPadDown(key,e)} onMouseUp={e=>onPadUp(key,e)}
                style={{flex:1,borderRadius:'5px',border:`1px solid ${lc}38`,background:fa>0.1?`${lc}${Math.round(fa*36).toString(16).padStart(2,'0')}`:(`${lc}0c`),color:lc,fontSize:'7.5px',fontWeight:900,cursor:'pointer',letterSpacing:'0.06em',transition:'background 0.04s',boxShadow:fa>0.2?`0 0 ${Math.round(fa*7)}px ${lc}55`:'none'}}>
                {long}
              </button>
            );})}
            <button onClick={triggerStutter} style={{flex:1,borderRadius:'5px',border:`1px solid ${BD}`,background:B1,color:'#475569',fontSize:'7.5px',fontWeight:800,cursor:'pointer'}}>Stutter</button>
            <button onClick={()=>setStutterOn(v=>!v)} style={{flex:1,borderRadius:'5px',border:`1px solid ${stutterOn?'#34d399':BD}`,background:stutterOn?'rgba(52,211,153,0.1)':B1,color:stutterOn?'#34d399':'#3d5166',fontSize:'7.5px',fontWeight:800,cursor:'pointer'}}>Arm {stutterBurst}x</button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:'256px',flexShrink:0,display:'flex',flexDirection:'column',background:B1,borderRadius:'10px',border:`1px solid ${BD}`,overflow:'hidden'}}>
          <div style={{display:'flex',borderBottom:`1px solid ${BD}`,flexShrink:0}}>
            {[{id:'knobs',label:'Knobs'},{id:'lane',label:'Lane FX'},{id:'notes',label:'Notes'},{id:'sound',label:'Sound'},{id:'save',label:'Save'}].map(({id,label})=>(
              <button key={id} onClick={()=>setRightTab(id)}
                style={{flex:1,padding:'5px 0',fontSize:'7.5px',fontWeight:900,letterSpacing:'0.12em',border:'none',background:rightTab===id?'rgba(52,211,153,0.07)':'transparent',color:rightTab===id?'#34d399':'#2d3d4d',cursor:'pointer',borderBottom:rightTab===id?'2px solid #34d399':'2px solid transparent',textTransform:'uppercase',transition:'color 0.1s'}}>
                {label}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:'auto',padding:'7px',display:'flex',flexDirection:'column',gap:'5px'}}>

            {rightTab==='knobs'&&<>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'3px',justifyItems:'center'}}>
                <Knob label="Swing" value={swing} setValue={setSwing} min={0} max={0.25} size={34}/>
                <Knob label="Density" value={density} setValue={setDensity} size={34}/>
                <Knob label="Chaos" value={chaos} setValue={setChaos} size={34} color='#f43f5e'/>
                <Knob label="Humanize" value={humanize} setValue={setHumanize} min={0} max={0.3} size={34}/>
                <Knob label="Macro" value={macroKnob} setValue={setMacroKnob} size={34} color='#a78bfa'/>
                <Knob label="Groove" value={grooveAmount} setValue={setGrooveAmount} size={34}/>
                <Knob label="Master" value={master} setValue={setMaster} min={0.1} size={34} color='#fbbf24'/>
                <Knob label="Tone" value={tone} setValue={setTone} min={0.1} size={34} color='#22d3ee'/>
                <Knob label="Noise" value={noise} setValue={setNoise} size={34}/>
                <Knob label="Space" value={space} setValue={setSpace} size={34} color='#22d3ee'/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 8px'}}>
                {[
                  ['Compress',compressAmount,setCompressAmount,0,1],['Resonance',resonance,setResonance,0,1],
                  ['Bass LFO',bassLfo,setBassLfo,0,1],['Synth LFO',synthLfo,setSynthLfo,0,1],
                  ['Drum Decay',drumDecay,setDrumDecay,0.1,1],['Bass Cutoff',bassCutoff,setBassCutoff,0,1],
                  ['Synth Cutoff',synthCutoff,setSynthCutoff,0,1],['Bass Sub',bassSubAmount,setBassSubAmount,0.1,1],
                  ['Synth Atk',synthAttack,setSynthAttack,0,1],['Synth Rel',synthRelease,setSynthRelease,0,1],
                  ['FM Index',fmIndex,setFmIndex,0,3],['Stutter',stutterBurst,setStutterBurst,2,8],
                ].map(([l,v,s,mn,mx])=><Slider key={l} label={l} value={v} setValue={s} min={mn??0} max={mx??1} step={l==='Stutter'?1:0.01} fmt={l==='Stutter'?v=>`${v}x`:undefined}/>)}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <button onClick={()=>setMetronomeOn(v=>!v)} style={pill(metronomeOn)}>Metro</button>
                <input type="range" min={0} max={1} step={0.01} value={metronomeLevel} onChange={e=>setMetronomeLevel(Number(e.target.value))} style={{flex:1,height:'2px',accentColor:'#34d399'}}/>
              </div>
              {/* Wave selectors */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
                {[{label:'BASS WAVE',wave:bassWave,set:setBassWave,color:'#22d3ee'},{label:'SYNTH WAVE',wave:synthWave,set:setSynthWave,color:'#a78bfa'}].map(({label,wave,set,color})=>(
                  <div key={label}>
                    <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',marginBottom:'2px',textTransform:'uppercase'}}>{label}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>
                      {['auto','sine','tri','sq','saw'].map((w,i)=>{const full=['auto','sine','triangle','square','sawtooth'][i];return<button key={w} onClick={()=>set(full)} style={pill(wave===full,color)}>{w}</button>;})}
                    </div>
                  </div>
                ))}
              </div>
              {/* Scenes */}
              <div>
                <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',marginBottom:'3px',textTransform:'uppercase'}}>SCENES</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                  {[0,1,2,3].map(slot=>(
                    <div key={slot} style={{borderRadius:'4px',border:`1px solid ${currentScene===slot?'rgba(52,211,153,0.32)':sceneSlots[slot]?'rgba(34,211,238,0.16)':BD}`,background:'rgba(255,255,255,0.015)',padding:'3px 5px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'2px'}}>
                      <span style={{fontSize:'7px',fontWeight:800,color:currentScene===slot?'#34d399':'#2d3d4d'}}>S{slot+1}{sceneSlots[slot]?' ◆':''}</span>
                      <div style={{display:'flex',gap:'2px'}}>
                        <button onClick={()=>loadScene(slot)} disabled={!sceneSlots[slot]} style={{...pill(false),opacity:sceneSlots[slot]?1:0.28,padding:'1px 4px'}}>Load</button>
                        <button onClick={()=>saveScene(slot)} style={{...pill(false,'#34d399'),padding:'1px 4px'}}>Save</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Keyboard shortcuts hint */}
              <div style={{fontSize:'6.5px',color:'#1e2d3d',lineHeight:1.6,padding:'4px 6px',borderRadius:'4px',background:'rgba(255,255,255,0.015)',border:`1px solid ${BD}`}}>
                <span style={{color:'#2d4d5d',fontWeight:800}}>SHORTCUTS</span><br/>
                Space = Play/Stop · R = Freestyle · T = Tap<br/>
                1-5 = Trigger lane · ⌘Z / ⌘⇧Z = Undo/Redo
              </div>
            </>}

            {rightTab==='lane'&&<>
              <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                {laneLabels.map(({key,long})=>{const lc=LANE_COLOR[key];return<button key={key} onClick={()=>setActiveLane(key)} style={pill(activeLane===key,lc)}>{long}</button>;})}
              </div>
              <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                <VU level={laneVU[activeLane]||0} color={LANE_COLOR[activeLane]} width={7} height={38}/>
                <div style={{flex:1,display:'flex',flexDirection:'column',gap:'4px'}}>
                  <Slider label="Volume" value={laneVolumes[activeLane]} setValue={v=>setLaneVolumes(prev=>({...prev,[activeLane]:v}))} fmt={v=>`${Math.round(v*100)}`} color={LANE_COLOR[activeLane]}/>
                  {['drive','tone','echo','crush','pan'].map(param=>(
                    <Slider key={param} label={param} value={laneFx[activeLane]?.[param]??0}
                      setValue={v=>setLaneFx(prev=>({...prev,[activeLane]:{...prev[activeLane],[param]:v}}))} min={param==='pan'?-1:0} max={1} color={LANE_COLOR[activeLane]}/>
                  ))}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                {[['Rotate →',()=>rotateLane(activeLane,1)],['Rotate ←',()=>rotateLane(activeLane,-1)],['Mutate',()=>mutateLane(activeLane)],['Fill',()=>fillLane(activeLane,clamp(density+0.12,0.15,0.95))]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{...pill(false),padding:'4px',textAlign:'center'}}>{l}</button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'2px'}}>
                {laneLabels.map(({key})=><button key={key} onClick={()=>fillLane(key,clamp(density+0.12,0.15,0.95))} style={{...pill(false),padding:'3px 2px',textAlign:'center',fontSize:'7px'}}>Fill {key[0].toUpperCase()}</button>)}
              </div>
            </>}

            {rightTab==='notes'&&<>
              <div style={{display:'flex',gap:'3px'}}>
                {['bass','synth'].map(lane=><button key={lane} onClick={()=>setNoteEditLane(lane)} style={pill(noteEditLane===lane)}>{lane}</button>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:'2px'}}>
                {visibleIndices.map(idx=>{
                  const laneOn=noteEditLane==='bass'?(idx<laneStepCounts.bass&&patterns.bass[idx].on):(idx<laneStepCounts.synth&&patterns.synth[idx].on);
                  const currentNote=noteEditLane==='bass'?bassLine[idx]:synthLine[idx];const pool=getLaneNotePool(noteEditLane);const lc=LANE_COLOR[noteEditLane];
                  return(
                    <div key={idx} style={{borderRadius:'4px',background:laneOn?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.01)',padding:'2px',opacity:laneOn?1:0.18,textAlign:'center'}}>
                      <div style={{fontSize:'5.5px',color:'#283848',marginBottom:'1px'}}>{idx+1}</div>
                      <button disabled={!laneOn} onClick={()=>{if(!pool.length)return;const next=pool[(pool.indexOf(currentNote)+1)%pool.length];setStepNote(noteEditLane,idx,next);}}
                        style={{width:'100%',padding:'2px 0',borderRadius:'3px',border:'none',background:laneOn?lc:'rgba(255,255,255,0.04)',color:laneOn?'#0a1628':'#334155',fontSize:'6.5px',fontWeight:800,cursor:laneOn?'pointer':'default'}}>
                        {currentNote}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'2px'}}>
                {[['↓ Down',()=>shiftLaneNotes(noteEditLane,-1)],['Random',()=>randomizeLaneNotes(noteEditLane)],['↑ Up',()=>shiftLaneNotes(noteEditLane,1)]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{...pill(false),padding:'4px',textAlign:'center'}}>{l}</button>
                ))}
              </div>
            </>}

            {rightTab==='sound'&&(()=>{
              const sd=soundDesign[sdLane];
              const lc=LANE_COLOR[sdLane]||'#34d399';
              const update=(k,v)=>setSoundDesign(prev=>({...prev,[sdLane]:{...prev[sdLane],[k]:v}}));
              const oscTypes=['sine','triangle','square','sawtooth'];
              const filterTypes=['lowpass','highpass','bandpass','notch'];
              const isDrum=sdLane==='drum';
              const ds=soundDesign.drum;
              return(<>
                <div style={{display:'flex',gap:'2px',marginBottom:'2px',flexWrap:'wrap'}}>
                  {['bass','synth','drum'].map(l=><button key={l} onClick={()=>setSdLane(l)} style={{...pill(sdLane===l,l==='drum'?'#f87171':LANE_COLOR[l]),padding:'2px 8px',fontSize:'8px'}}>{l.toUpperCase()}</button>)}
                  {!isDrum&&<><div style={{flex:1}}/><button onClick={()=>update('active',!sd.active)} style={{...pill(sd.active,'#34d399'),padding:'2px 8px',fontSize:'8px',fontWeight:900}}>{sd.active?'● CUSTOM':'○ PRESET'}</button></>}
                </div>

                {isDrum&&<div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                  <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase'}}>KICK</div>
                  <Slider label="Kick Freq (Hz)" value={ds.kickFreq||108} setValue={v=>setSoundDesign(prev=>({...prev,drum:{...prev.drum,kickFreq:v}}))} min={40} max={220} step={1} fmt={v=>`${Math.round(v)}Hz`} color='#f87171'/>
                  <Slider label="Pitch End (Hz)" value={ds.kickEnd||40} setValue={v=>setSoundDesign(prev=>({...prev,drum:{...prev.drum,kickEnd:v}}))} min={20} max={120} step={1} fmt={v=>`${Math.round(v)}Hz`} color='#f87171'/>
                  <Slider label="Env Time" value={ds.pitchEnvTime||0.12} setValue={v=>setSoundDesign(prev=>({...prev,drum:{...prev.drum,pitchEnvTime:v}}))} min={0.02} max={0.6} step={0.01} fmt={v=>`${Math.round(v*1000)}ms`} color='#f87171'/>
                  <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginTop:'4px'}}>NOISE COLOR</div>
                  <div style={{display:'flex',gap:'3px'}}>
                    {['white','pink','brown'].map(c=><button key={c} onClick={()=>setSoundDesign(prev=>({...prev,drum:{...prev.drum,noiseColor:c}}))} style={{...pill((ds.noiseColor||'white')===c,'#fbbf24'),padding:'2px 8px',fontSize:'8px'}}>{c}</button>)}
                  </div>
                  <div style={{fontSize:'6.5px',color:'#334155',lineHeight:1.5,marginTop:'2px'}}>White = bright snare/hat · Pink = warmer · Brown = deep/muddy</div>
                </div>}

                {!isDrum&&<>
                  {!sd.active&&<div style={{fontSize:'7px',color:'#334155',padding:'5px',textAlign:'center',borderRadius:'4px',background:'rgba(255,255,255,0.02)',border:`1px solid ${BD}`}}>Attiva CUSTOM per usare il tuo suono al posto del preset</div>}
                  <div style={{opacity:sd.active?1:0.4,pointerEvents:sd.active?'all':'none',display:'flex',flexDirection:'column',gap:'4px'}}>
                    <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase'}}>OSCILLATORI</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px'}}>
                      <div><div style={{fontSize:'6px',color:'#334155',marginBottom:'2px',fontWeight:700}}>OSC 1</div><div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>{oscTypes.map(w=><button key={w} onClick={()=>update('osc',w)} style={{...pill(sd.osc===w,lc),padding:'1px 4px',fontSize:'6.5px'}}>{w.slice(0,3)}</button>)}</div></div>
                      <div><div style={{fontSize:'6px',color:'#334155',marginBottom:'2px',fontWeight:700}}>OSC 2</div><div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>{oscTypes.map(w=><button key={w} onClick={()=>update('osc2',w)} style={{...pill(sd.osc2===w,lc),padding:'1px 4px',fontSize:'6.5px'}}>{w.slice(0,3)}</button>)}</div></div>
                    </div>
                    <Slider label="Detune (cents)" value={sd.detune} setValue={v=>update('detune',v)} min={0} max={50} step={1} fmt={v=>`${v}¢`} color={lc}/>
                    {sdLane==='bass'&&<><Slider label="Sub Mix" value={sd.sub??0.5} setValue={v=>update('sub',v)} color={lc}/><Slider label="Glide (s)" value={sd.glide||0} setValue={v=>update('glide',v)} min={0} max={0.5} step={0.01} fmt={v=>v===0?'off':`${Math.round(v*1000)}ms`} color={lc}/></>}
                    <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginTop:'2px'}}>FILTRO</div>
                    <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>{filterTypes.map(f=><button key={f} onClick={()=>update('filterType',f)} style={{...pill(sd.filterType===f,lc),padding:'1px 4px',fontSize:'6.5px'}}>{f.slice(0,2).toUpperCase()}</button>)}</div>
                    <Slider label="Cutoff" value={sd.cutoff} setValue={v=>update('cutoff',v)} color={lc}/>
                    <Slider label="Resonance" value={sd.res} setValue={v=>update('res',v)} color={lc}/>
                    <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase',marginTop:'2px'}}>ENVELOPE ADSR</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 8px'}}>
                      <Slider label="Attack" value={sd.atk} setValue={v=>update('atk',v)} min={0.001} max={2} step={0.001} fmt={v=>v<0.1?`${Math.round(v*1000)}ms`:`${v.toFixed(2)}s`} color={lc}/>
                      <Slider label="Decay" value={sd.dec} setValue={v=>update('dec',v)} min={0.01} max={3} step={0.01} fmt={v=>`${v.toFixed(2)}s`} color={lc}/>
                      <Slider label="Sustain" value={sd.sus} setValue={v=>update('sus',v)} fmt={v=>`${Math.round(v*100)}%`} color={lc}/>
                      <Slider label="Release" value={sd.rel} setValue={v=>update('rel',v)} min={0.01} max={6} step={0.01} fmt={v=>`${v.toFixed(2)}s`} color={lc}/>
                    </div>
                    <Slider label="Drive" value={sd.drive} setValue={v=>update('drive',v)} color={lc}/>
                    {sdLane==='synth'&&<><Slider label="LFO Cutoff" value={sd.lfo||0} setValue={v=>update('lfo',v)} color={lc}/><Slider label="LFO Rate (Hz)" value={sd.lfoRate||3} setValue={v=>update('lfoRate',v)} min={0.1} max={20} step={0.1} fmt={v=>`${v.toFixed(1)}Hz`} color={lc}/></>}
                    <button onClick={()=>{initAudio().then(()=>{const t=(audioRef.current?.ctx.currentTime||0)+0.01;if(sdLane==='bass')playBassAt(bassPreset,'C2',0.85,t,4);else playSynthAt(synthPreset,'C4',0.85,t,4);});}}
                      style={{...pill(false,lc),padding:'6px',textAlign:'center',fontSize:'9px',fontWeight:900,marginTop:'2px'}}>▶ Ascolta {sdLane}</button>
                  </div>
                </>}
              </>);
            })()}

            {rightTab==='save'&&<>
              <div style={{fontSize:'8px',color:'#34d399',background:'rgba(52,211,153,0.06)',borderRadius:'4px',padding:'4px 6px',fontWeight:700}}>
                {Math.round(bpm)} BPM · {stepCount} step · {grooveProfile.toUpperCase()} · {harmonicProfile.toUpperCase()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                {[['Load Local',loadProjectLocal,''  ],['Quick Save',saveProjectLocal,'#34d399'],['Import JSON',()=>importInputRef.current?.click(),''  ],['Export JSON',exportProjectJson,''  ]].map(([l,fn,c])=>(
                  <button key={l} onClick={fn} style={{...pill(!!c,c||'#64748b'),padding:'5px',textAlign:'center'}}>{l}</button>
                ))}
              </div>
              <input ref={importInputRef} type="file" accept="application/json" onChange={importProjectFile} style={{display:'none'}}/>
              <div>
                <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',marginBottom:'3px',textTransform:'uppercase'}}>PROJECT SLOTS</div>
                {[0,1,2,3].map(slot=>(
                  <div key={slot} style={{borderRadius:'4px',border:`1px solid ${currentProjectSlot===slot?'rgba(52,211,153,0.32)':projectSlots[slot]?'rgba(34,211,238,0.16)':BD}`,background:'rgba(255,255,255,0.015)',padding:'4px 6px',marginBottom:'2px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'3px'}}>
                    <div><div style={{fontSize:'7.5px',fontWeight:800,color:currentProjectSlot===slot?'#34d399':'#475569'}}>P{slot+1}</div><div style={{fontSize:'6.5px',color:'#1e293b'}}>{projectSlots[slot]?.label||'Empty'}</div></div>
                    <div style={{display:'flex',gap:'2px'}}>
                      <button onClick={()=>loadProjectSlot(slot)} disabled={!projectSlots[slot]} style={{...pill(false),opacity:projectSlots[slot]?1:0.28,padding:'2px 4px'}}>Load</button>
                      <button onClick={()=>saveProjectSlot(slot)} style={{...pill(false,'#34d399'),padding:'2px 4px'}}>Save</button>
                      <button onClick={()=>clearProjectSlot(slot)} disabled={!projectSlots[slot]} style={{...pill(false),opacity:projectSlots[slot]?1:0.28,padding:'2px 4px'}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                  <div style={{fontSize:'7px',color:'#2d3d4d',fontWeight:800,letterSpacing:'0.14em',textTransform:'uppercase'}}>RECORDER</div>
                  <button onClick={recState==='recording'?stopRecording:startRecording} style={pill(recState==='recording','#f43f5e')}>{recState==='recording'?'■ Stop':'⏺ Rec'}</button>
                </div>
                {recordings.length===0?<div style={{fontSize:'7px',color:'#1e293b',padding:'6px',textAlign:'center'}}>No recordings yet.</div>:recordings.map((item,idx)=>(
                  <div key={item.url} style={{borderRadius:'4px',border:`1px solid ${BD}`,background:'rgba(255,255,255,0.015)',padding:'4px 6px',marginBottom:'2px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <span style={{fontSize:'7.5px',fontWeight:800,color:'#475569'}}>Take {idx+1}</span>
                      <button onClick={()=>downloadRecording(item)} style={{...pill(false),padding:'2px 5px',fontSize:'7px'}}>↓ Save</button>
                    </div>
                    <audio controls src={item.url} style={{width:'100%',height:'20px'}}/>
                  </div>
                ))}
              </div>
              {/* MIDI status */}
              <div style={{fontSize:'7px',color:'#1e2d3d',padding:'4px 6px',borderRadius:'4px',background:'rgba(255,255,255,0.015)',border:`1px solid ${BD}`}}>
                <span style={{color:midiEnabled?'#34d399':'#334155',fontWeight:800}}>MIDI {midiEnabled?'CONNECTED':'NOT AVAILABLE'}</span>
                {midiEnabled&&<><br/>Kick=CH1 · Snare=CH2 · Hat=CH3 · Bass=CH4 · Synth=CH5<br/>Clock: transmitted on all outputs</>}
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
