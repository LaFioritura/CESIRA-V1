import React, { useEffect, useMemo, useRef, useState } from 'react';

const MAX_STEPS = 64;
const DEFAULT_STEPS = 16;
const DEFAULT_BPM = 112;
const LANE_KEYS = ['kick', 'snare', 'hat', 'bass', 'synth'];
const PAGE_SIZE = 16;

const drumPresets = [
  { name: 'Kick Melt', type: 'kick' }, { name: 'Kick Rubber', type: 'kick2' },
  { name: 'Snare Dust', type: 'snare' }, { name: 'Snare Glass', type: 'snare2' },
  { name: 'Hat Tin', type: 'hat' }, { name: 'Hat Steam', type: 'hat2' },
  { name: 'Clap Fog', type: 'clap' }, { name: 'Tom Oil', type: 'tom' },
  { name: 'Metal Ping', type: 'metal' }, { name: 'Noise Burst', type: 'noise' },
  { name: 'Kick Velvet', type: 'kick' }, { name: 'Kick Asphalt', type: 'kick2' },
  { name: 'Snare Paper', type: 'snare' }, { name: 'Hat Razor', type: 'hat2' },
  { name: 'Clap Static', type: 'clap' }, { name: 'Metal Spray', type: 'metal' },
];
const bassPresets = [
  { name: 'Sub Worm', mode: 'sub' }, { name: 'Grit Mono', mode: 'grit' },
  { name: 'FM Swamp', mode: 'fm' }, { name: 'Pulse Root', mode: 'pulse' },
  { name: 'Broken Tube', mode: 'tube' }, { name: 'Drone Heel', mode: 'drone' },
  { name: 'Wet Rubber', mode: 'wet' }, { name: 'Fold Bass', mode: 'fold' },
  { name: 'Saw Mud', mode: 'saw' }, { name: 'Bit Spine', mode: 'bit' },
  { name: 'Sub Resin', mode: 'sub' }, { name: 'Mono Soot', mode: 'grit' },
  { name: 'FM Tar', mode: 'fm' }, { name: 'Pulse Coal', mode: 'pulse' },
  { name: 'Wet Iron', mode: 'wet' }, { name: 'Saw Heel', mode: 'saw' },
];
const synthPresets = [
  { name: 'Toy Glass', mode: 'glass' }, { name: 'Gummy Pad', mode: 'pad' },
  { name: 'Chrome Mist', mode: 'mist' }, { name: 'Bent Lead', mode: 'lead' },
  { name: 'Tiny Choir', mode: 'choir' }, { name: 'Wobble Bell', mode: 'bell' },
  { name: 'Plastic Bloom', mode: 'bloom' }, { name: 'Fold Star', mode: 'star' },
  { name: 'Noir Air', mode: 'air' }, { name: 'FM Candy', mode: 'candy' },
  { name: 'Glass Thread', mode: 'glass' }, { name: 'Mist Tape', mode: 'mist' },
  { name: 'Lead Bubble', mode: 'lead' }, { name: 'Choir Toy', mode: 'choir' },
  { name: 'Bell Smoke', mode: 'bell' }, { name: 'Air Bloom', mode: 'air' },
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

const bassNotes = ['C2','D2','E2','G2','A2','C3','D3','E3','G3','A3'];
const synthNotes = ['C4','D4','Eb4','G4','A4','C5','D5','Eb5','G5','A5'];
const noteToFreq = {
  C2:65.41,Db2:69.3,D2:73.42,Eb2:77.78,E2:82.41,F2:87.31,G2:98.0,Ab2:103.83,A2:110.0,Bb2:116.54,
  C3:130.81,Db3:138.59,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196.0,A3:220.0,
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,G4:392.0,Ab4:415.3,A4:440.0,Bb4:466.16,
  C5:523.25,Db5:554.37,D5:587.33,Eb5:622.25,F5:698.46,G5:783.99,A5:880.0,
};
const MODES = {
  minor:    { bass:['C2','D2','Eb2','G2','A2','C3','D3','Eb3'], synth:['C4','D4','Eb4','G4','A4','C5','D5','Eb5'] },
  phrygian: { bass:['C2','Db2','Eb2','G2','Ab2','C3','Db3','Eb3'], synth:['C4','Db4','Eb4','G4','Ab4','C5','Db5','Eb5'] },
  dorian:   { bass:['C2','D2','Eb2','G2','Bb2','C3','D3','F3'], synth:['C4','D4','Eb4','G4','Bb4','C5','D5','F5'] },
  chroma:   { bass:['C2','Db2','Eb2','E2','G2','Ab2','A2','C3'], synth:['C4','Db4','Eb4','E4','G4','Ab4','A4','C5'] },
};
const GROOVE_MAP = {
  steady: { kickBias:0.22,snareBias:0.16,hatBias:0.58,bassBias:0.22,synthBias:0.12 },
  broken: { kickBias:0.28,snareBias:0.14,hatBias:0.46,bassBias:0.28,synthBias:0.18 },
  bunker: { kickBias:0.34,snareBias:0.1,hatBias:0.34,bassBias:0.24,synthBias:0.14 },
  float:  { kickBias:0.16,snareBias:0.12,hatBias:0.5,bassBias:0.18,synthBias:0.28 },
};

function clamp(v,mn,mx){return Math.min(mx,Math.max(mn,v));}
function seededChoice(arr){return arr[Math.floor(Math.random()*arr.length)];}
function rotateArray(arr,steps){return arr.map((_,i)=>arr[(i-steps+arr.length)%arr.length]);}
function makeEmptyLane(){return Array.from({length:MAX_STEPS},()=>false);}
function makeEmptyNotes(d='C2'){return Array.from({length:MAX_STEPS},()=>d);}
function makePatternTemplate(sc=DEFAULT_STEPS){
  const p={kick:makeEmptyLane(),snare:makeEmptyLane(),hat:makeEmptyLane(),bass:makeEmptyLane(),synth:makeEmptyLane()};
  [0,8,12,24,32,40,56].forEach(i=>{if(i<sc)p.kick[i]=true;});
  [4,12,20,28,36,44,52,60].forEach(i=>{if(i<sc)p.snare[i]=true;});
  for(let i=0;i<sc;i+=2)p.hat[i]=true;
  [0,3,7,10,13,18,22,29,33,39,46,53].forEach(i=>{if(i<sc)p.bass[i]=true;});
  [2,6,11,14,19,27,35,43,50,58].forEach(i=>{if(i<sc)p.synth[i]=true;});
  return p;
}
function chooseMode(chaos){if(chaos>0.78)return'chroma';if(chaos>0.56)return seededChoice(['minor','phrygian']);return seededChoice(['minor','dorian','phrygian']);}
function chooseGroove(density,chaos){if(density>0.68&&chaos>0.45)return'bunker';if(chaos>0.62)return'broken';if(density<0.38)return'float';return'steady';}
function buildNoteLanes(stepCount,modeName,grooveName,chaos){
  const mode=MODES[modeName]||MODES.minor;const groove=GROOVE_MAP[grooveName]||GROOVE_MAP.steady;
  const bassLine=makeEmptyNotes(mode.bass[0]);const synthLine=makeEmptyNotes(mode.synth[0]);
  const anchorBass=[0,0,2,0,4,0,2,0];const anchorSynth=chaos>0.58?[4,2,6,4,1,4,6,2]:[4,2,4,6,1,4,2,4];
  for(let i=0;i<stepCount;i++){
    const phrase=Math.floor(i/8)%anchorBass.length;const motion=(i%4===3&&Math.random()<groove.bassBias)?1:0;
    bassLine[i]=mode.bass[(anchorBass[phrase]+motion+(Math.random()<chaos*0.18?1:0))%mode.bass.length];
    synthLine[i]=mode.synth[(anchorSynth[phrase]+(i%8===6?1:0)+(Math.random()<chaos*0.24?2:0))%mode.synth.length];
  }
  if(chaos>0.66)return{bassLine:rotateArray(bassLine,Math.floor(Math.random()*3)),synthLine:rotateArray(synthLine,Math.floor(Math.random()*5))};
  return{bassLine,synthLine};
}
function chooseLaneLengths(density,chaos,grooveName){
  const banks={
    steady:[{kick:16,snare:16,hat:16,bass:32,synth:32,section:'pulse-cell'},{kick:32,snare:16,hat:32,bass:32,synth:48,section:'night-drive'},{kick:16,snare:32,hat:16,bass:48,synth:64,section:'slow-rise'}],
    broken:[{kick:32,snare:16,hat:32,bass:32,synth:48,section:'fracture-loop'},{kick:32,snare:32,hat:48,bass:32,synth:64,section:'split-engine'},{kick:16,snare:48,hat:32,bass:48,synth:32,section:'off-axis'}],
    bunker:[{kick:16,snare:32,hat:16,bass:32,synth:48,section:'pressure-room'},{kick:32,snare:16,hat:32,bass:16,synth:64,section:'steel-corridor'},{kick:16,snare:16,hat:48,bass:32,synth:64,section:'locked-floor'}],
    float: [{kick:32,snare:32,hat:48,bass:32,synth:64,section:'mist-window'},{kick:16,snare:48,hat:32,bass:48,synth:64,section:'ghost-hall'},{kick:16,snare:32,hat:48,bass:32,synth:48,section:'soft-tilt'}],
  };
  const sel=seededChoice(banks[grooveName]||banks.steady);const allowed=[16,32,48,64];
  const snap=v=>allowed.reduce((b,c)=>Math.abs(c-v)<Math.abs(b-v)?c:b,allowed[0]);const nudge=chaos>0.72?8:density>0.64?0:-4;
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
function buildFreestylePattern(stepCount,laneStepCounts,density,chaos,currentPresets,options={}){
  const grooveName=chooseGroove(density,chaos);const modeName=chooseMode(chaos);const autoLength=options.autoLength??true;
  const gl=autoLength?chooseLaneLengths(density,chaos,grooveName):{...laneStepCounts,section:'manual-grid'};
  const ell={kick:gl.kick||laneStepCounts.kick||stepCount,snare:gl.snare||laneStepCounts.snare||stepCount,hat:gl.hat||laneStepCounts.hat||stepCount,bass:gl.bass||laneStepCounts.bass||stepCount,synth:gl.synth||laneStepCounts.synth||stepCount};
  const masterLength=Math.max(...Object.values(ell));
  const p={kick:makeEmptyLane(),snare:makeEmptyLane(),hat:makeEmptyLane(),bass:makeEmptyLane(),synth:makeEmptyLane()};
  const groove=GROOVE_MAP[grooveName];const{bassLine,synthLine}=buildNoteLanes(masterLength,modeName,grooveName,chaos);
  const bar=16;const phraseShape=seededChoice(['anchor','stagger','mirror','fall']);
  for(const lane of LANE_KEYS){const ll=ell[lane]||masterLength;for(let i=0;i<ll;i++){
    const pos=i%bar;const strong=pos===0||pos===8;const backbeat=pos===4||pos===12;const offbeat=pos%2===1;const pb=Math.floor(i/8)%4;
    const pw=phraseShape==='anchor'?[1,0.75,0.92,0.68][pb]:phraseShape==='stagger'?[0.72,1,0.66,0.94][pb]:phraseShape==='mirror'?[1,0.78,0.78,1][pb]:[1,0.9,0.68,0.56][pb];
    if(lane==='kick'){if(strong||Math.random()<(groove.kickBias+density*0.18+(strong?0.2:0))*pw)p.kick[i]=true;}
    else if(lane==='snare'){if(backbeat||Math.random()<(groove.snareBias+density*0.08+(backbeat?0.26:0))*(1.06-pw*0.18))p.snare[i]=true;}
    else if(lane==='hat'){if(Math.random()<(!offbeat?groove.hatBias-0.08+density*0.2:groove.hatBias+density*0.16)*(0.82+pw*0.22))p.hat[i]=true;}
    else if(lane==='bass'){if(Math.random()<(pos===0||pos===3||pos===7?0.94:groove.bassBias+density*0.14)*(0.8+pw*0.26))p.bass[i]=true;}
    else if(lane==='synth'){if((Math.random()<(pos===2||pos===6||pos===10?0.72:groove.synthBias+density*0.1)*(0.7+pw*0.34)&&!strong)||(pb===3&&Math.random()<0.18+chaos*0.16))p.synth[i]=true;}
  }}
  for(let i=0;i<ell.kick;i+=16)p.kick[i]=true;
  for(let i=0;i<ell.snare;i+=16){if(i+4<ell.snare)p.snare[i+4]=true;if(i+12<ell.snare)p.snare[i+12]=true;}
  const mp=Math.max(2,Math.floor(chaos*10));
  for(let m=0;m<mp;m++){const lane=seededChoice(LANE_KEYS);const ll=ell[lane]||masterLength;const pos=Math.floor(Math.random()*ll);
    if(lane==='hat'){p.hat[pos]=!p.hat[pos];if(chaos>0.52&&pos+2<ll&&Math.random()<0.34)p.hat[pos+2]=true;}
    else if(lane==='kick'){if(pos%4!==0)p.kick[pos]=Math.random()<0.42+chaos*0.22;}
    else if(lane==='bass'){p.bass[pos]=!p.bass[pos];if(Math.random()<0.34)bassLine[pos]=seededChoice(MODES[modeName].bass);}
    else if(lane==='synth'){p.synth[pos]=!p.synth[pos];if(Math.random()<0.4)synthLine[pos]=seededChoice(MODES[modeName].synth);}
    else{p.snare[pos]=!p.snare[pos]&&pos%4!==0;}
  }
  for(let i=ell.bass;i<MAX_STEPS;i++)bassLine[i]=bassLine[Math.max(0,i%Math.max(1,ell.bass))];
  for(let i=ell.synth;i<MAX_STEPS;i++)synthLine[i]=synthLine[Math.max(0,i%Math.max(1,ell.synth))];
  return{patterns:p,bassLine,synthLine,laneLengths:ell,sectionProfile:gl.section||'manual-grid',harmonicProfile:modeName,grooveProfile:grooveName,
    drumPreset:Math.floor((Math.random()*drumPresets.length+currentPresets.drumPreset*0.35)%drumPresets.length),
    bassPreset:Math.floor((Math.random()*bassPresets.length+currentPresets.bassPreset*0.35)%bassPresets.length),
    synthPreset:Math.floor((Math.random()*synthPresets.length+currentPresets.synthPreset*0.35)%synthPresets.length),
    fxPreset:Math.floor(Math.random()*fxScenes.length),
  };
}

const LANE_COLOR = {kick:'#f87171',snare:'#fbbf24',hat:'#fde047',bass:'#22d3ee',synth:'#a78bfa'};
const S = (style={}) => ({ fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif', ...style });

const Slider = ({label,value,setValue,min=0,max=1,step=0.01,fmt})=>(
  <div style={{display:'flex',flexDirection:'column',gap:'2px'}}>
    <div style={{display:'flex',justifyContent:'space-between'}}>
      <span style={{fontSize:'8px',fontWeight:800,letterSpacing:'0.16em',color:'#475569',textTransform:'uppercase'}}>{label}</span>
      <span style={{fontSize:'9px',fontWeight:800,color:'#34d399'}}>{fmt?fmt(value):value.toFixed(2)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>setValue(Number(e.target.value))}
      style={{width:'100%',accentColor:'#34d399',height:'2px',cursor:'pointer'}}/>
  </div>
);

export default function CesiraV1(){
  const [isReady,setIsReady]=useState(false);
  const [isPlaying,setIsPlaying]=useState(false);
  const [stutterOn,setStutterOn]=useState(false);
  const [bpm,setBpm]=useState(DEFAULT_BPM);
  const [stepCount,setStepCount]=useState(DEFAULT_STEPS);
  const [laneStepCounts,setLaneStepCounts]=useState({kick:DEFAULT_STEPS,snare:DEFAULT_STEPS,hat:DEFAULT_STEPS,bass:DEFAULT_STEPS,synth:DEFAULT_STEPS});
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

  const audioRef=useRef(null),clockRef=useRef(null),stepRef=useRef(0),recorderRef=useRef(null),chunksRef=useRef([]),recordingsRef=useRef([]);
  const bpmRef=useRef(bpm),swingRef=useRef(swing),stepCountRef=useRef(stepCount),laneStepCountsRef=useRef(laneStepCounts);
  const patternsRef=useRef(patterns),bassLineRef=useRef(bassLine),synthLineRef=useRef(synthLine),laneFxRef=useRef(laneFx);
  const macroKnobRef=useRef(macroKnob),grooveAmountRef=useRef(grooveAmount),grooveProfileRef=useRef(grooveProfile),harmonicProfileRef=useRef(harmonicProfile);
  const humanizeRef=useRef(humanize),stutterOnRef=useRef(stutterOn),stutterBurstRef=useRef(stutterBurst),isPlayingRef=useRef(false),importInputRef=useRef(null);
  const laneLabels=useMemo(()=>[{key:'kick',label:'K',long:'Kick'},{key:'snare',label:'S',long:'Snare'},{key:'hat',label:'H',long:'Hat'},{key:'bass',label:'B',long:'Bass'},{key:'synth',label:'Y',long:'Synth'}],[]);
  const totalPages=Math.ceil(stepCount/PAGE_SIZE),visibleStart=page*PAGE_SIZE,visibleEnd=Math.min(stepCount,visibleStart+PAGE_SIZE);
  const visibleIndices=Array.from({length:visibleEnd-visibleStart},(_,i)=>visibleStart+i);

  useEffect(()=>{bpmRef.current=bpm;},[bpm]);useEffect(()=>{swingRef.current=swing;},[swing]);useEffect(()=>{stepCountRef.current=stepCount;},[stepCount]);
  useEffect(()=>{laneStepCountsRef.current=laneStepCounts;},[laneStepCounts]);useEffect(()=>{patternsRef.current=patterns;},[patterns]);
  useEffect(()=>{const m=Math.max(...Object.values(laneStepCounts));setStepCount(m);stepCountRef.current=m;setPage(prev=>clamp(prev,0,Math.ceil(m/PAGE_SIZE)-1));if(stepRef.current>=m){stepRef.current=0;setStep(0);}},[laneStepCounts]);
  useEffect(()=>{bassLineRef.current=bassLine;},[bassLine]);useEffect(()=>{synthLineRef.current=synthLine;},[synthLine]);useEffect(()=>{laneFxRef.current=laneFx;},[laneFx]);
  useEffect(()=>{macroKnobRef.current=macroKnob;},[macroKnob]);useEffect(()=>{grooveAmountRef.current=grooveAmount;},[grooveAmount]);useEffect(()=>{grooveProfileRef.current=grooveProfile;},[grooveProfile]);
  useEffect(()=>{harmonicProfileRef.current=harmonicProfile;},[harmonicProfile]);useEffect(()=>{humanizeRef.current=humanize;},[humanize]);useEffect(()=>{stutterOnRef.current=stutterOn;},[stutterOn]);
  useEffect(()=>{stutterBurstRef.current=stutterBurst;},[stutterBurst]);useEffect(()=>{isPlayingRef.current=isPlaying;},[isPlaying]);useEffect(()=>{recordingsRef.current=recordings;},[recordings]);
  useEffect(()=>{try{const r=window.localStorage.getItem('cesira-project-autoload');if(r){const p=JSON.parse(r);if(p?.projectName)setProjectName(p.projectName);}const sr=window.localStorage.getItem('cesira-project-slots');if(sr){const ps=JSON.parse(sr);if(Array.isArray(ps))setProjectSlots(ps.slice(0,4));}}catch{}},[]);
  useEffect(()=>{try{window.localStorage.setItem('cesira-project-slots',JSON.stringify(projectSlots));}catch{}},[projectSlots]);
  useEffect(()=>()=>{if(clockRef.current)clearTimeout(clockRef.current);if(audioRef.current?.ctx?.state&&audioRef.current.ctx.state!=='closed')audioRef.current.ctx.close().catch(()=>{});recordingsRef.current.forEach(i=>URL.revokeObjectURL(i.url));},[]);

  const setDriveCurve=(node,amount=0.2)=>{const k=2+amount*120;const s=1024;const c=new Float32Array(s);for(let i=0;i<s;i++){const x=(i*2)/s-1;c[i]=((1+k)*x)/(1+k*Math.abs(x));}node.curve=c;node.oversample='4x';};
  const initAudio=async()=>{
    if(audioRef.current){await audioRef.current.ctx.resume();setIsReady(true);return;}
    const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx){setStatusText('Web Audio not supported.');return;}
    const ctx=new AudioCtx({sampleRate:48000});
    const inputBus=ctx.createGain(),preDrive=ctx.createWaveShaper(),toneFilter=ctx.createBiquadFilter();
    toneFilter.type='lowpass';toneFilter.frequency.value=18000;toneFilter.Q.value=0.7;
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=18;compressor.ratio.value=3;compressor.attack.value=0.003;compressor.release.value=0.18;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-3;limiter.knee.value=0;limiter.ratio.value=16;limiter.attack.value=0.001;limiter.release.value=0.08;
    const dry=ctx.createGain(),wet=ctx.createGain(),splitter=ctx.createChannelSplitter(2),merger=ctx.createChannelMerger(2);
    const leftDelay=ctx.createDelay(0.5),rightDelay=ctx.createDelay(0.5),feedback=ctx.createGain(),toneEcho=ctx.createBiquadFilter();
    toneEcho.type='lowpass';toneEcho.frequency.value=6800;
    const output=ctx.createGain(),analyser=ctx.createAnalyser(),dest=ctx.createMediaStreamDestination();analyser.fftSize=512;
    inputBus.connect(preDrive);preDrive.connect(toneFilter);toneFilter.connect(compressor);compressor.connect(dry);compressor.connect(splitter);
    splitter.connect(leftDelay,0);splitter.connect(rightDelay,1);rightDelay.connect(toneEcho);toneEcho.connect(feedback);feedback.connect(leftDelay);
    leftDelay.connect(merger,0,0);rightDelay.connect(merger,0,1);merger.connect(wet);dry.connect(output);wet.connect(output);
    output.connect(limiter);limiter.connect(analyser);limiter.connect(ctx.destination);limiter.connect(dest);
    audioRef.current={ctx,inputBus,preDrive,toneFilter,compressor,limiter,dry,wet,leftDelay,rightDelay,feedback,output,analyser,dest};
    setDriveCurve(preDrive,fxScenes[fxPreset].drive);setIsReady(true);setStatusText('Audio online.');applyFxScene(fxPreset,false,ctx.currentTime);
  };
  const applyFxScene=(idx,flash=true,nowTime)=>{
    setFxPreset(idx);const audio=audioRef.current;if(!audio)return;
    const fx=fxScenes[idx];const now=nowTime??audio.ctx.currentTime;const macro=macroKnobRef.current;
    setDriveCurve(audio.preDrive,fx.drive+noise*0.12+macro*0.1);
    audio.toneFilter.frequency.cancelScheduledValues(now);audio.toneFilter.frequency.linearRampToValueAtTime(1800+14500*fx.filter*tone+macro*1800,now+0.03);
    audio.leftDelay.delayTime.cancelScheduledValues(now);audio.rightDelay.delayTime.cancelScheduledValues(now);
    audio.leftDelay.delayTime.linearRampToValueAtTime(0.02+fx.delay*0.18+space*0.02+macro*0.01,now+0.03);
    audio.rightDelay.delayTime.linearRampToValueAtTime(0.03+fx.delay*0.23+space*0.04+macro*0.015,now+0.03);
    audio.feedback.gain.cancelScheduledValues(now);audio.feedback.gain.linearRampToValueAtTime(clamp(0.12+space*0.2+fx.delay*0.3+macro*0.08,0.08,0.56),now+0.03);
    audio.wet.gain.cancelScheduledValues(now);audio.dry.gain.cancelScheduledValues(now);
    audio.wet.gain.linearRampToValueAtTime(clamp(fx.width*0.4+space*0.22+macro*0.08,0.06,0.5),now+0.03);
    audio.dry.gain.linearRampToValueAtTime(clamp(0.96-fx.width*0.18-macro*0.06,0.64,1),now+0.03);
    audio.output.gain.cancelScheduledValues(now);audio.output.gain.linearRampToValueAtTime(master,now+0.03);
  };
  useEffect(()=>{if(!audioRef.current)return;applyFxScene(fxPreset,false);},[fxPreset,tone,space,noise]);
  useEffect(()=>{const a=audioRef.current;if(!a)return;a.output.gain.setTargetAtTime(master,a.ctx.currentTime,0.02);},[master]);
  useEffect(()=>{const a=audioRef.current;if(!a)return;const n=a.ctx.currentTime;a.compressor.threshold.setTargetAtTime(-8-compressAmount*22,n,0.03);a.compressor.ratio.setTargetAtTime(1.8+compressAmount*8.5,n,0.03);a.compressor.attack.setTargetAtTime(0.002+(1-compressAmount)*0.025,n,0.03);a.compressor.release.setTargetAtTime(0.08+compressAmount*0.28,n,0.03);a.compressor.knee.setTargetAtTime(8+compressAmount*22,n,0.03);},[compressAmount]);
  const routeLaneFx=(sourceNode,lane)=>{
    const audio=audioRef.current;const macro=macroKnobRef.current;const fx=laneFxRef.current[lane]||{drive:0,tone:0.7,echo:0,crush:0,pan:0};
    const ld=audio.ctx.createWaveShaper(),lt=audio.ctx.createBiquadFilter(),lg=audio.ctx.createGain(),echo=audio.ctx.createDelay(0.4),eg=audio.ctx.createGain(),et=audio.ctx.createBiquadFilter(),pan=audio.ctx.createStereoPanner(),ep=audio.ctx.createStereoPanner();
    setDriveCurve(ld,clamp(fx.drive+macro*0.12,0,1));lt.type=lane==='hat'?'highpass':'lowpass';lt.frequency.value=lane==='hat'?1200+fx.tone*9000+macro*900:180+fx.tone*7800+macro*1200;lt.Q.value=0.5+fx.crush*2.2+macro*0.4;
    echo.delayTime.value=0.04+fx.echo*0.22;eg.gain.value=clamp((fx.echo+macro*0.08)*0.26,0,0.38);et.type='lowpass';et.frequency.value=1800+fx.tone*5200;lg.gain.value=1-fx.crush*0.16;pan.pan.value=fx.pan;ep.pan.value=fx.pan*0.7;
    sourceNode.connect(ld);ld.connect(lt);lt.connect(lg);lg.connect(pan);pan.connect(audio.inputBus);
    if(fx.echo>0.001||macro>0.05){lg.connect(echo);echo.connect(et);et.connect(eg);eg.connect(ep);ep.connect(audio.inputBus);}
    return[ld,lt,lg,echo,eg,et,pan,ep];
  };
  const rampEnv=(param,now,attack,decay,peak,end=0.0001)=>{param.cancelScheduledValues(now);param.setValueAtTime(0.0001,now);param.exponentialRampToValueAtTime(Math.max(0.0001,peak),now+Math.max(0.001,attack));param.exponentialRampToValueAtTime(Math.max(0.0001,end),now+Math.max(0.002,attack+decay));};
  const createNoiseBuffer=(len=0.25,amount=1)=>{const a=audioRef.current;const buf=a.ctx.createBuffer(1,Math.floor(a.ctx.sampleRate*len),a.ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*amount;return buf;};
  const safeStartStop=(node,start,stop)=>{try{node.start(start);}catch{}try{node.stop(stop);}catch{}};
  const pickWave=(mode,family)=>{if(family==='bass'&&bassWave!=='auto')return bassWave;if(family==='synth'&&synthWave!=='auto')return synthWave;return mode;};
  const attachCleanup=(src,nodes=[],ms=1200)=>{const fn=()=>{[src,...nodes].forEach(n=>{try{n.disconnect();}catch{}});};src.onended=fn;window.setTimeout(fn,ms);};
  const resolveDrumFxLane=(type)=>{if(type==='kick'||type==='kick2'||type==='tom')return'kick';if(type==='snare'||type==='snare2'||type==='clap')return'snare';return'hat';};
  const playDrum=async(pi=drumPreset,accent=1)=>{
    await initAudio();const audio=audioRef.current;if(!audio)return;const p=drumPresets[pi];const now=audio.ctx.currentTime+0.002;const nb=createNoiseBuffer(0.28,0.28+noise*0.75);
    if(p.type.startsWith('kick')){const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain(),sh=audio.ctx.createWaveShaper();setDriveCurve(sh,0.18+noise*0.22);osc.type=p.type==='kick'?'sine':'triangle';osc.frequency.setValueAtTime(p.type==='kick'?118:94,now);osc.frequency.exponentialRampToValueAtTime(44,now+0.16);rampEnv(g.gain,now,0.001,0.12+drumDecay*0.28,0.98*accent);osc.connect(sh);sh.connect(g);const fx=routeLaneFx(g,'kick');attachCleanup(osc,[g,sh,...fx],700);safeStartStop(osc,now,now+0.3);return;}
    if(p.type==='tom'){const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(170,now);osc.frequency.exponentialRampToValueAtTime(88,now+0.18);rampEnv(g.gain,now,0.001,0.1+drumDecay*0.24,0.82*accent);osc.connect(g);const fx=routeLaneFx(g,resolveDrumFxLane('tom'));attachCleanup(osc,[g,...fx],700);safeStartStop(osc,now,now+0.26);return;}
    const src=audio.ctx.createBufferSource(),fil=audio.ctx.createBiquadFilter(),g=audio.ctx.createGain();src.buffer=nb;
    switch(p.type){case'snare':fil.type='bandpass';fil.frequency.value=1800;rampEnv(g.gain,now,0.001,0.08+drumDecay*0.18,0.7*accent);break;case'snare2':fil.type='highpass';fil.frequency.value=1400;rampEnv(g.gain,now,0.001,0.05+drumDecay*0.14,0.58*accent);break;case'hat':fil.type='highpass';fil.frequency.value=6400;rampEnv(g.gain,now,0.001,0.015+drumDecay*0.07,0.36*accent);break;case'hat2':fil.type='highpass';fil.frequency.value=8200;rampEnv(g.gain,now,0.001,0.01+drumDecay*0.045,0.3*accent);break;case'clap':fil.type='bandpass';fil.frequency.value=2200;g.gain.setValueAtTime(0.0001,now);g.gain.linearRampToValueAtTime(0.58*accent,now+0.004);g.gain.linearRampToValueAtTime(0.08,now+0.04);g.gain.linearRampToValueAtTime(0.34*accent,now+0.065);g.gain.linearRampToValueAtTime(0.0001,now+0.16);break;case'metal':fil.type='bandpass';fil.frequency.value=4700;rampEnv(g.gain,now,0.001,0.03+drumDecay*0.14,0.33*accent);break;default:fil.type='bandpass';fil.frequency.value=2600;rampEnv(g.gain,now,0.001,0.08+drumDecay*0.18,0.46*accent);break;}
    src.playbackRate.value=0.96+Math.random()*0.1;src.connect(fil);fil.connect(g);const fxn=routeLaneFx(g,resolveDrumFxLane(p.type));attachCleanup(src,[fil,g,...fxn],900);safeStartStop(src,now,now+0.24);
  };
  const playBass=async(pi=bassPreset,note=bassNotes[bassPreset],accent=1)=>{
    await initAudio();const audio=audioRef.current;if(!audio)return;const p=bassPresets[pi];const now=audio.ctx.currentTime+0.002;const f=noteToFreq[note]||110;const bs=pickWave(p.mode,'bass');
    const o1=audio.ctx.createOscillator(),o2=audio.ctx.createOscillator(),g=audio.ctx.createGain(),fil=audio.ctx.createBiquadFilter(),sub=audio.ctx.createGain(),tg=audio.ctx.createGain(),lfo=audio.ctx.createOscillator(),lg=audio.ctx.createGain();
    o1.type=bs==='sine'?'sine':bs==='triangle'?'triangle':bs==='square'?'square':['sub','tube','wet'].includes(p.mode)?'sine':['pulse','bit'].includes(p.mode)?'square':'sawtooth';
    o2.type=bs==='triangle'?'triangle':bs==='square'?'square':p.mode==='fm'?'triangle':'sawtooth';
    o1.frequency.setValueAtTime(f,now);o2.frequency.setValueAtTime(f*(p.mode==='fm'?2.01:1.01),now);sub.gain.value=bassSubAmount*(p.mode==='sub'?1.0:0.46);tg.gain.value=0.18+noise*0.18;
    fil.type=p.mode==='bit'?'highpass':'lowpass';fil.frequency.setValueAtTime(60+bassCutoff*2400+tone*1100+pi*18,now);fil.Q.value=0.6+resonance*8+(p.mode==='grit'?0.8:0);
    lfo.frequency.value=0.4+bassLfo*10;lg.gain.value=1+bassLfo*16+(p.mode==='drone'?4:0);
    lfo.connect(lg);lg.connect(fil.frequency);rampEnv(g.gain,now,0.003,p.mode==='drone'?0.74:0.32,0.82*accent);
    o1.connect(sub);o2.connect(tg);sub.connect(fil);tg.connect(fil);fil.connect(g);const fxn=routeLaneFx(g,'bass');attachCleanup(o1,[o2,lfo,sub,tg,fil,g,lg,...fxn],1200);
    safeStartStop(o1,now,now+0.58);safeStartStop(o2,now,now+0.58);safeStartStop(lfo,now,now+0.58);
  };
  const playSynth=async(pi=synthPreset,note=synthNotes[synthPreset],accent=1)=>{
    await initAudio();const audio=audioRef.current;if(!audio)return;const p=synthPresets[pi];const now=audio.ctx.currentTime+0.002;const f=noteToFreq[note]||440;const ss=pickWave(p.mode,'synth');
    const oA=audio.ctx.createOscillator(),oB=audio.ctx.createOscillator(),mix=audio.ctx.createGain(),fil=audio.ctx.createBiquadFilter(),amp=audio.ctx.createGain();
    const vib=audio.ctx.createOscillator(),vg=audio.ctx.createGain(),nn=audio.ctx.createBufferSource(),ng=audio.ctx.createGain();
    nn.buffer=createNoiseBuffer(0.7,noise);
    oA.type=ss==='sine'?'sine':ss==='triangle'?'triangle':ss==='square'?'square':['glass','bell','air'].includes(p.mode)?'triangle':['lead','star'].includes(p.mode)?'square':'sawtooth';
    oB.type=ss==='square'?'square':ss==='sine'?'sine':['pad','choir','mist'].includes(p.mode)?'sine':'triangle';
    oA.frequency.value=f;oB.frequency.value=f*(['bell','star','candy'].includes(p.mode)?1.5:1.01);
    fil.type=['air','mist'].includes(p.mode)?'bandpass':'lowpass';fil.frequency.value=180+synthCutoff*7600+tone*2200+pi*24;fil.Q.value=0.8+resonance*7+(p.mode==='bell'?1.6:p.mode==='glass'?0.8:0);
    vib.frequency.value=0.5+synthLfo*11;vg.gain.value=1+synthLfo*12+(['lead','star'].includes(p.mode)?2:0);ng.gain.value=['mist','air','choir'].includes(p.mode)?0.18+noise*0.16:0.03;
    vib.connect(vg);vg.connect(oA.frequency);vg.connect(oB.frequency);oA.connect(mix);oB.connect(mix);nn.connect(ng);ng.connect(mix);mix.connect(fil);fil.connect(amp);
    const fxn=routeLaneFx(amp,'synth');attachCleanup(oA,[oB,vib,nn,mix,fil,amp,vg,ng,...fxn],1800);
    amp.gain.setValueAtTime(0.0001,now);amp.gain.linearRampToValueAtTime(0.54*accent,now+(0.005+synthAttack*0.18));amp.gain.exponentialRampToValueAtTime(0.0001,now+0.18+synthRelease*1.25+space*0.42);
    safeStartStop(oA,now,now+1.4);safeStartStop(oB,now,now+1.4);safeStartStop(nn,now,now+1.4);safeStartStop(vib,now,now+1.4);
  };
  const playMetronome=async(isDownbeat=false)=>{
    await initAudio();const audio=audioRef.current;if(!audio||!metronomeOn)return;const now=audio.ctx.currentTime+0.001;
    const osc=audio.ctx.createOscillator(),g=audio.ctx.createGain();osc.type='square';osc.frequency.setValueAtTime(isDownbeat?1760:1320,now);
    g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.08*metronomeLevel,now+0.002);g.gain.exponentialRampToValueAtTime(0.0001,now+0.045);
    osc.connect(g);g.connect(audio.inputBus);attachCleanup(osc,[g],120);safeStartStop(osc,now,now+0.06);
  };
  const triggerLane=async(lane,accent=1,forcedIndex=null)=>{
    setActiveLane(lane);const level=laneVolumes[lane]??1;const sa=accent*level;const ll=laneStepCountsRef.current[lane]||stepCountRef.current;const ci=forcedIndex??(stepRef.current%ll);
    if(lane==='kick')return playDrum(Math.min(drumPreset,1),sa);
    if(lane==='snare')return playDrum(drumPreset<2?2:drumPreset<4?drumPreset:drumPreset%2===0?12:3,sa);
    if(lane==='hat')return playDrum(drumPreset<4?4:drumPreset<6?drumPreset:drumPreset%2===0?13:5,sa);
    if(lane==='bass')return playBass(bassPreset,bassLineRef.current[ci]||bassNotes[bassPreset%bassNotes.length],sa);
    if(lane==='synth')return playSynth(synthPreset,synthLineRef.current[ci]||synthNotes[synthPreset%synthNotes.length],sa);
  };
  const stopClock=()=>{if(clockRef.current)clearTimeout(clockRef.current);clockRef.current=null;isPlayingRef.current=false;setIsPlaying(false);};
  const scheduleNextTick=()=>{const bMs=(60/bpmRef.current)*1000/4;const ni=(stepRef.current+1)%stepCountRef.current;const sw=ni%2===1?bMs*swingRef.current:-bMs*swingRef.current*0.5;clockRef.current=window.setTimeout(runStep,Math.max(26,bMs+sw));};
  const runStep=async()=>{
    if(!isPlayingRef.current)return;const current=stepRef.current;setStep(current);setPage(Math.floor(current/PAGE_SIZE));
    if(metronomeOn&&current%4===0)playMetronome(current%16===0);
    const accent=current%4===0?1:0.86;const lp=patternsRef.current;
    for(const lane of LANE_KEYS){const ll=laneStepCountsRef.current[lane]||stepCountRef.current;const li=current%ll;
      if(lp[lane][li]){const jitter=Math.floor((Math.random()-0.5)*humanizeRef.current*42);const ga=getGrooveAccent(grooveProfileRef.current,lane,li,grooveAmountRef.current);const ma=1+macroKnobRef.current*0.18;
        window.setTimeout(()=>triggerLane(lane,accent*ga*ma,li),Math.max(0,jitter+1));
        if(stutterOnRef.current&&Math.random()<0.18){for(let i=1;i<stutterBurstRef.current;i++)window.setTimeout(()=>triggerLane(lane,0.7*ga,li),i*40+Math.max(0,jitter));}
      }
    }
    stepRef.current=(current+1)%stepCountRef.current;if(isPlayingRef.current)scheduleNextTick();
  };
  const togglePlay=async()=>{
    await initAudio();if(!audioRef.current)return;
    if(isPlayingRef.current){stopClock();setStatusText('Stopped.');return;}
    if(audioRef.current.ctx.state==='suspended')await audioRef.current.ctx.resume();
    isPlayingRef.current=true;setIsPlaying(true);setStatusText('Running.');runStep();
  };
  const toggleCell=(lane,idx)=>{if(idx>=laneStepCounts[lane])return;setPatterns(prev=>({...prev,[lane]:prev[lane].map((v,i)=>i===idx?!v:v)}));};
  const clearAll=()=>{stopClock();setStep(0);stepRef.current=0;setPatterns({kick:makeEmptyLane(),snare:makeEmptyLane(),hat:makeEmptyLane(),bass:makeEmptyLane(),synth:makeEmptyLane()});setBassLine(makeEmptyNotes('C2'));setSynthLine(makeEmptyNotes('C4'));setLaneStepCounts({kick:DEFAULT_STEPS,snare:DEFAULT_STEPS,hat:DEFAULT_STEPS,bass:DEFAULT_STEPS,synth:DEFAULT_STEPS});setSectionProfile('pulse-cell');setHarmonicProfile('minor');setGrooveProfile('steady');setStatusText('Cleared.');};
  const handleStepCount=n=>{const s=clamp(n,16,MAX_STEPS);setLaneStepCounts({kick:s,snare:s,hat:s,bass:s,synth:s});};
  const setLaneStepCount=(lane,n)=>{setLaneStepCounts(prev=>({...prev,[lane]:clamp(n,16,MAX_STEPS)}));};
  const randomize=()=>{const fs=buildFreestylePattern(stepCount,laneStepCounts,density,chaos,{drumPreset,bassPreset,synthPreset},{autoLength:true});setLaneStepCounts(fs.laneLengths);setPatterns(fs.patterns);setBassLine(fs.bassLine);setSynthLine(fs.synthLine);setSectionProfile(fs.sectionProfile);setHarmonicProfile(fs.harmonicProfile);setGrooveProfile(fs.grooveProfile);setDrumPreset(fs.drumPreset);setBassPreset(fs.bassPreset);setSynthPreset(fs.synthPreset);setFxPreset(fs.fxPreset);setStatusText(`${fs.sectionProfile} · ${fs.grooveProfile} · ${fs.harmonicProfile}`);};
  const autoJam=()=>{const fs=buildFreestylePattern(stepCount,laneStepCounts,clamp(density+0.08,0.1,0.95),clamp(chaos+0.12,0,1),{drumPreset,bassPreset,synthPreset},{autoLength:true});setLaneStepCounts(fs.laneLengths);setPatterns(fs.patterns);setBassLine(fs.bassLine);setSynthLine(fs.synthLine);setSectionProfile(fs.sectionProfile);setHarmonicProfile(fs.harmonicProfile);setGrooveProfile(fs.grooveProfile);setDrumPreset(fs.drumPreset);setBassPreset(fs.bassPreset);setSynthPreset(fs.synthPreset);setFxPreset(fs.fxPreset);setTone(clamp(0.35+Math.random()*0.55,0.1,1));setNoise(clamp(0.14+Math.random()*0.62,0,1));setSpace(clamp(0.12+Math.random()*0.58,0,1));setSwing(clamp(Math.random()*0.18,0,0.25));setBassCutoff(clamp(0.2+Math.random()*0.65,0,1));setSynthCutoff(clamp(0.28+Math.random()*0.62,0,1));setBassSubAmount(clamp(0.35+Math.random()*0.65,0.1,1));setSynthAttack(clamp(Math.random()*0.45,0,1));setSynthRelease(clamp(0.2+Math.random()*0.75,0,1));setLaneFx(prev=>({kick:{...prev.kick,drive:clamp(0.08+Math.random()*0.3,0,1),tone:clamp(0.3+Math.random()*0.45,0,1),echo:0},snare:{...prev.snare,drive:clamp(0.06+Math.random()*0.22,0,1),tone:clamp(0.42+Math.random()*0.38,0,1),echo:clamp(Math.random()*0.16,0,1)},hat:{...prev.hat,tone:clamp(0.6+Math.random()*0.35,0,1),crush:clamp(Math.random()*0.22,0,1)},bass:{...prev.bass,drive:clamp(0.08+Math.random()*0.28,0,1),tone:clamp(0.2+Math.random()*0.4,0,1),echo:clamp(Math.random()*0.08,0,1)},synth:{...prev.synth,drive:clamp(0.06+Math.random()*0.24,0,1),tone:clamp(0.46+Math.random()*0.4,0,1),echo:clamp(0.08+Math.random()*0.22,0,1)}}));setStatusText(`Auto Jam · ${fs.sectionProfile} · ${fs.grooveProfile}`);};
  const triggerStutter=()=>{const b=Math.max(2,stutterBurst);for(let i=0;i<b;i++)window.setTimeout(()=>triggerLane(activeLane,i===0?1:0.78),i*55);setStatusText(`${activeLane.toUpperCase()} stutter x${b}.`);};
  const fillLane=(lane,amount)=>{setPatterns(prev=>{const n={...prev,[lane]:[...prev[lane]]};for(let i=0;i<laneStepCounts[lane];i++)n[lane][i]=Math.random()<amount;return n;});};
  const rotateLane=(lane,dir=1)=>{setPatterns(prev=>{const len=laneStepCounts[lane];const src=prev[lane].slice(0,len);const s=src.map((_,i)=>src[(i-dir+len)%len]);const n={...prev,[lane]:[...prev[lane]]};for(let i=0;i<len;i++)n[lane][i]=s[i];return n;});};
  const mutateLane=(lane)=>{setPatterns(prev=>{const n={...prev,[lane]:[...prev[lane]]};const len=laneStepCounts[lane];const flips=Math.max(2,Math.floor(len*(0.05+chaos*0.08)));for(let i=0;i<flips;i++){const pos=Math.floor(Math.random()*len);n[lane][pos]=!n[lane][pos];}return n;});};
  const getLaneNotePool=(lane)=>{const mode=MODES[harmonicProfileRef.current]||MODES.minor;return lane==='bass'?mode.bass:lane==='synth'?mode.synth:[];};
  const setStepNote=(lane,idx,note)=>{if(lane==='bass'){if(idx>=laneStepCounts.bass||!patterns.bass[idx])return;setBassLine(prev=>prev.map((v,i)=>i===idx?note:v));}else if(lane==='synth'){if(idx>=laneStepCounts.synth||!patterns.synth[idx])return;setSynthLine(prev=>prev.map((v,i)=>i===idx?note:v));}};
  const randomizeLaneNotes=(lane)=>{const pool=getLaneNotePool(lane);if(!pool.length)return;if(lane==='bass')setBassLine(prev=>prev.map((v,i)=>i<laneStepCounts.bass&&patterns.bass[i]?seededChoice(pool):v));else setSynthLine(prev=>prev.map((v,i)=>i<laneStepCounts.synth&&patterns.synth[i]?seededChoice(pool):v));};
  const shiftLaneNotes=(lane,dir=1)=>{const pool=getLaneNotePool(lane);if(!pool.length)return;if(lane==='bass')setBassLine(prev=>prev.map((v,i)=>{if(i>=laneStepCounts.bass||!patterns.bass[i])return v;const at=pool.indexOf(v);return pool[at===-1?0:(at+dir+pool.length)%pool.length];}));else setSynthLine(prev=>prev.map((v,i)=>{if(i>=laneStepCounts.synth||!patterns.synth[i])return v;const at=pool.indexOf(v);return pool[at===-1?0:(at+dir+pool.length)%pool.length];}));};
  const serializeScene=()=>({bpm,swing,density,chaos,tone,noise,space,master,compressAmount,resonance,bassLfo,synthLfo,drumDecay,bassWave,synthWave,bassCutoff,synthCutoff,bassSubAmount,synthAttack,synthRelease,stutterBurst,stutterOn,macroKnob,grooveAmount,harmonicProfile,grooveProfile,sectionProfile,drumPreset,bassPreset,synthPreset,fxPreset,laneStepCounts,patterns,bassLine,synthLine,laneFx,laneVolumes,projectName,metronomeOn,metronomeLevel});
  const applySnapshot=(snap,label='Loaded.')=>{
    if(!snap)return;stopClock();if(snap.projectName)setProjectName(snap.projectName);
    const n=(k,s)=>typeof snap[k]==='number'&&s(snap[k]);const b=(k,s)=>typeof snap[k]==='boolean'&&s(snap[k]);
    n('bpm',setBpm);n('swing',setSwing);n('density',setDensity);n('chaos',setChaos);n('tone',setTone);n('noise',setNoise);n('space',setSpace);n('master',setMaster);n('compressAmount',setCompressAmount);n('resonance',setResonance);n('bassLfo',setBassLfo);n('synthLfo',setSynthLfo);n('drumDecay',setDrumDecay);n('bassCutoff',setBassCutoff);n('synthCutoff',setSynthCutoff);n('bassSubAmount',setBassSubAmount);n('synthAttack',setSynthAttack);n('synthRelease',setSynthRelease);n('stutterBurst',setStutterBurst);n('macroKnob',setMacroKnob);n('grooveAmount',setGrooveAmount);n('metronomeLevel',setMetronomeLevel);n('drumPreset',setDrumPreset);n('bassPreset',setBassPreset);n('synthPreset',setSynthPreset);n('fxPreset',setFxPreset);
    b('stutterOn',setStutterOn);b('metronomeOn',setMetronomeOn);
    if(snap.harmonicProfile)setHarmonicProfile(snap.harmonicProfile);if(snap.grooveProfile)setGrooveProfile(snap.grooveProfile);if(snap.sectionProfile)setSectionProfile(snap.sectionProfile);if(snap.bassWave)setBassWave(snap.bassWave);if(snap.synthWave)setSynthWave(snap.synthWave);
    if(snap.laneStepCounts)setLaneStepCounts(snap.laneStepCounts);if(snap.patterns)setPatterns(snap.patterns);if(snap.bassLine)setBassLine(snap.bassLine);if(snap.synthLine)setSynthLine(snap.synthLine);if(snap.laneFx)setLaneFx(snap.laneFx);if(snap.laneVolumes)setLaneVolumes(snap.laneVolumes);
    setStatusText(label);
  };
  const saveScene=(slot)=>{setSceneSlots(prev=>prev.map((v,i)=>i===slot?serializeScene():v));setCurrentScene(slot);setStatusText(`Scene ${slot+1} saved.`);};
  const loadScene=(slot)=>{if(!sceneSlots[slot]){setStatusText(`Scene ${slot+1} empty.`);return;}applySnapshot(sceneSlots[slot],`Scene ${slot+1} loaded.`);setCurrentScene(slot);};
  const saveProjectLocal=()=>{try{window.localStorage.setItem('cesira-project-autoload',JSON.stringify(serializeScene()));setStatusText('Saved.');}catch{setStatusText('Save failed.');}};
  const loadProjectLocal=()=>{try{const r=window.localStorage.getItem('cesira-project-autoload');if(!r){setStatusText('No local save.');return;}applySnapshot(JSON.parse(r),'Loaded.');}catch{setStatusText('Load failed.');}};
  const saveProjectSlot=(slot)=>{setProjectSlots(prev=>prev.map((v,i)=>i===slot?{label:projectName||`P${slot+1}`,stamp:new Date().toLocaleString(),data:serializeScene()}:v));setCurrentProjectSlot(slot);setStatusText(`Slot ${slot+1} saved.`);};
  const loadProjectSlot=(slot)=>{const item=projectSlots[slot];if(!item?.data){setStatusText(`Slot ${slot+1} empty.`);return;}applySnapshot(item.data,`Slot ${slot+1} loaded.`);setCurrentProjectSlot(slot);};
  const clearProjectSlot=(slot)=>{setProjectSlots(prev=>prev.map((v,i)=>i===slot?null:v));if(currentProjectSlot===slot)setCurrentProjectSlot(null);};
  const exportProjectJson=()=>{try{const blob=new Blob([JSON.stringify(serializeScene(),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${(projectName||'cesira').replace(/[^a-z0-9-_]+/gi,'-').toLowerCase()}.json`;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),500);setStatusText('Exported.');}catch{setStatusText('Export failed.');}};
  const importProjectFile=async(e)=>{const f=e.target.files?.[0];if(!f)return;try{const t=await f.text();applySnapshot(JSON.parse(t),'Imported.');}catch{setStatusText('Import failed.');}finally{if(e.target)e.target.value='';}};
  const startRecording=async()=>{
    await initAudio();const audio=audioRef.current;if(!audio||recState==='recording')return;
    const preferred=['audio/webm;codecs=opus','audio/webm','audio/mp4'];const mime=preferred.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported?.(t))||'';
    chunksRef.current=[];const recorder=mime?new MediaRecorder(audio.dest.stream,{mimeType:mime}):new MediaRecorder(audio.dest.stream);recorderRef.current=recorder;setRecordMime(mime||'audio/webm');
    recorder.ondataavailable=e=>{if(e.data&&e.data.size>0)chunksRef.current.push(e.data);};
    recorder.onstop=()=>{const ft=mime||recorder.mimeType||'audio/webm';const ext=ft.includes('mp4')?'m4a':'webm';const blob=new Blob(chunksRef.current,{type:ft});const url=URL.createObjectURL(blob);setRecordings(prev=>[{url,name:`cesira-take-${prev.length+1}.${ext}`},...prev.slice(0,5)]);setRecState('idle');setStatusText('Take saved.');};
    recorder.start();setRecState('recording');setStatusText('Recording...');
  };
  const stopRecording=()=>{if(recorderRef.current&&recState==='recording'){recorderRef.current.stop();setRecState('stopping');setStatusText('Finalizing...');}};
  const downloadRecording=(item)=>{const a=document.createElement('a');a.href=item.url;a.download=item.name;a.click();};

  // ─── Styles helpers
  const bg0='#080d18';const bg1='rgba(255,255,255,0.025)';const border0='rgba(255,255,255,0.07)';
  const pill=(active,color='#34d399')=>({padding:'3px 8px',borderRadius:'5px',border:`1px solid ${active?color:border0}`,background:active?`${color}20`:bg1,color:active?color:'#64748b',fontSize:'8px',fontWeight:800,cursor:'pointer',transition:'all 0.1s',letterSpacing:'0.1em'});

  return (
    <div style={{fontFamily:'Inter,ui-sans-serif,system-ui,sans-serif',background:bg0,color:'#e2e8f0',height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden',padding:'6px',gap:'4px',boxSizing:'border-box',userSelect:'none'}}>

      {/* TOP BAR */}
      <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0,height:'32px'}}>
        <div style={{fontSize:'9px',fontWeight:900,letterSpacing:'0.24em',color:'#34d399',padding:'2px 8px',borderRadius:'999px',border:'1px solid rgba(52,211,153,0.25)',background:'rgba(52,211,153,0.08)',whiteSpace:'nowrap'}}>CESIRA V1</div>
        <input value={projectName} onChange={e=>setProjectName(e.target.value)} style={{width:'120px',background:bg1,border:`1px solid ${border0}`,borderRadius:'6px',padding:'3px 8px',fontSize:'10px',fontWeight:700,color:'#fff',outline:'none'}}/>
        <button onClick={togglePlay} style={{padding:'4px 14px',borderRadius:'6px',border:'none',background:isPlaying?'#f43f5e':'#34d399',color:isPlaying?'#fff':'#0a1628',fontWeight:900,fontSize:'10px',cursor:'pointer',letterSpacing:'0.08em',flexShrink:0}}>{isPlaying?'■ STOP':'▶ PLAY'}</button>
        {[{l:'Freestyle',fn:randomize},{l:'Auto Jam',fn:autoJam}].map(({l,fn})=><button key={l} onClick={fn} style={{...pill(false,'#94a3b8'),padding:'4px 10px',fontSize:'9px'}}>{l}</button>)}
        <button onClick={recState==='recording'?stopRecording:startRecording} style={{padding:'4px 10px',borderRadius:'5px',border:`1px solid ${recState==='recording'?'#f43f5e':border0}`,background:recState==='recording'?'rgba(244,63,94,0.15)':bg1,color:recState==='recording'?'#f43f5e':'#64748b',fontSize:'9px',fontWeight:800,cursor:'pointer'}}>{recState==='recording'?'■ Stop Rec':'⏺ Rec'}</button>
        {[{l:'Clear',fn:clearAll},{l:'Save',fn:saveProjectLocal}].map(({l,fn})=><button key={l} onClick={fn} style={{...pill(false,'#94a3b8'),padding:'4px 10px',fontSize:'9px'}}>{l}</button>)}
        <div style={{display:'flex',alignItems:'center',gap:'3px',marginLeft:'auto'}}>
          <span style={{fontSize:'8px',fontWeight:700,color:'#475569',letterSpacing:'0.14em'}}>BPM</span>
          <input type="number" min={70} max={170} value={bpm} onChange={e=>setBpm(Number(e.target.value))} style={{width:'44px',background:bg1,border:`1px solid ${border0}`,borderRadius:'5px',padding:'2px 4px',fontSize:'11px',fontWeight:900,color:'#34d399',textAlign:'center',outline:'none'}}/>
        </div>
        <div style={{display:'flex',gap:'2px'}}>
          {[16,32,48,64].map(s=><button key={s} onClick={()=>handleStepCount(s)} style={pill(stepCount===s)}>{s}</button>)}
        </div>
        <div style={{fontSize:'9px',color:'#475569',fontWeight:700,whiteSpace:'nowrap'}}>{step+1}/{stepCount}</div>
        <div style={{fontSize:'8px',color:'#34d399',opacity:0.6,maxWidth:'120px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{statusText}</div>
      </div>

      {/* PRESET STRIPS */}
      <div style={{display:'flex',flexDirection:'column',gap:'2px',flexShrink:0}}>
        {[
          {label:'DRUMS',items:drumPresets,active:drumPreset,onSelect:setDrumPreset,onPreview:i=>playDrum(i)},
          {label:'BASS', items:bassPresets, active:bassPreset, onSelect:setBassPreset, onPreview:i=>playBass(i,bassNotes[i%bassNotes.length])},
          {label:'SYNTH',items:synthPresets,active:synthPreset,onSelect:setSynthPreset,onPreview:i=>playSynth(i,synthNotes[i%synthNotes.length])},
          {label:'FX',   items:fxScenes,   active:fxPreset,   onSelect:i=>applyFxScene(i),onPreview:i=>applyFxScene(i)},
        ].map(({label,items,active,onSelect,onPreview})=>(
          <div key={label} style={{display:'flex',alignItems:'center',gap:'5px',height:'20px'}}>
            <span style={{fontSize:'7px',fontWeight:900,letterSpacing:'0.2em',color:'#334155',width:'34px',flexShrink:0,textTransform:'uppercase'}}>{label}</span>
            <div style={{flex:1,display:'flex',gap:'2px',overflowX:'auto',height:'100%'}}>
              {items.map((item,idx)=>(
                <button key={item.name} onClick={()=>onSelect(idx)} onDoubleClick={()=>onPreview(idx)}
                  style={{flexShrink:0,padding:'2px 6px',borderRadius:'4px',border:`1px solid ${active===idx?'#34d399':border0}`,background:active===idx?'rgba(52,211,153,0.18)':bg1,color:active===idx?'#34d399':'#475569',fontSize:'8px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.08s',height:'100%',display:'flex',alignItems:'center'}}>
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
        <div style={{flex:'1 1 0',display:'flex',flexDirection:'column',gap:'3px',background:bg1,borderRadius:'10px',border:`1px solid ${border0}`,padding:'6px',minWidth:0,overflow:'hidden'}}>
          {/* Grid top bar */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,height:'18px'}}>
            <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
              <span style={{fontSize:'8px',fontWeight:800,color:'#34d399',letterSpacing:'0.08em'}}>{grooveProfile.toUpperCase()}</span>
              <span style={{fontSize:'8px',color:'#1e293b'}}>·</span>
              <span style={{fontSize:'8px',fontWeight:800,color:'#67e8f9',letterSpacing:'0.08em'}}>{harmonicProfile.toUpperCase()}</span>
              <span style={{fontSize:'8px',color:'#1e293b'}}>·</span>
              <span style={{fontSize:'8px',fontWeight:700,color:'#fbbf24',letterSpacing:'0.06em'}}>{sectionProfile}</span>
            </div>
            <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
              <button onClick={()=>setPage(p=>clamp(p-1,0,totalPages-1))} disabled={page===0} style={{...pill(false),padding:'1px 6px',opacity:page===0?0.3:1}}>‹</button>
              <span style={{fontSize:'8px',color:'#334155',fontWeight:700}}>pg {page+1}/{totalPages}</span>
              <button onClick={()=>setPage(p=>clamp(p+1,0,totalPages-1))} disabled={page>=totalPages-1} style={{...pill(false),padding:'1px 6px',opacity:page>=totalPages-1?0.3:1}}>›</button>
            </div>
          </div>

          {/* Lanes */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:'2px',minHeight:0}}>
            {laneLabels.map(({key,label,long})=>{
              const lc=LANE_COLOR[key];
              return (
                <div key={key} style={{flex:1,display:'flex',gap:'3px',alignItems:'stretch',minHeight:0}}>
                  {/* Lane sidebar */}
                  <div style={{width:'76px',flexShrink:0,display:'flex',flexDirection:'column',gap:'2px',justifyContent:'center'}}>
                    <div style={{display:'flex',gap:'2px',alignItems:'center'}}>
                      <button onClick={()=>triggerLane(key,1)} style={{flex:1,padding:'2px 0',borderRadius:'5px',border:`1px solid ${activeLane===key?lc:border0}`,background:activeLane===key?`${lc}18`:bg1,color:activeLane===key?lc:'#64748b',fontSize:'9px',fontWeight:900,cursor:'pointer'}}>
                        {label}
                      </button>
                      <span style={{fontSize:'7px',color:'#334155',fontWeight:600,letterSpacing:'0.1em'}}>{long}</span>
                    </div>
                    <div style={{display:'flex',gap:'1px'}}>
                      {[16,32,48,64].map(s=>(
                        <button key={s} onClick={()=>setLaneStepCount(key,s)}
                          style={{flex:1,padding:'1px 0',borderRadius:'3px',border:`1px solid ${laneStepCounts[key]===s?lc:border0}`,background:laneStepCounts[key]===s?`${lc}25`:bg1,color:laneStepCounts[key]===s?lc:'#334155',fontSize:'6px',fontWeight:800,cursor:'pointer'}}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={laneVolumes[key]} onChange={e=>setLaneVolumes(prev=>({...prev,[key]:Number(e.target.value)}))}
                      style={{width:'100%',height:'2px',accentColor:lc,cursor:'pointer'}}/>
                  </div>

                  {/* Steps */}
                  <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visibleIndices.length},1fr)`,gap:'1.5px',alignItems:'stretch'}}>
                    {visibleIndices.map(idx=>{
                      const on=patterns[key][idx],active=step===idx&&isPlaying,disabled=idx>=laneStepCounts[key],isBar=idx%4===0;
                      return (
                        <button key={`${key}-${idx}`} onClick={()=>toggleCell(key,idx)}
                          style={{width:'100%',borderRadius:'3px',border:`1px solid ${active?lc:isBar?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)'}`,background:active?`${lc}60`:on?lc:disabled?'rgba(255,255,255,0.01)':'rgba(255,255,255,0.03)',opacity:disabled?0.15:1,cursor:disabled?'not-allowed':'pointer',transition:'background 0.05s',boxShadow:on&&!active?`0 0 4px ${lc}40`:active?`0 0 8px ${lc}80`:undefined}}/>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom pad row */}
          <div style={{display:'flex',gap:'3px',flexShrink:0,height:'28px'}}>
            {laneLabels.map(({key,long})=>{const lc=LANE_COLOR[key];return(
              <button key={key} onClick={()=>triggerLane(key,1)} style={{flex:1,padding:'0',borderRadius:'5px',border:`1px solid ${lc}30`,background:`${lc}0c`,color:lc,fontSize:'8px',fontWeight:900,cursor:'pointer',letterSpacing:'0.06em'}}>{long}</button>
            );})}
            <button onClick={triggerStutter} style={{flex:1,padding:'0',borderRadius:'5px',border:`1px solid ${border0}`,background:bg1,color:'#64748b',fontSize:'8px',fontWeight:800,cursor:'pointer'}}>Stutter</button>
            <button onClick={()=>setStutterOn(v=>!v)} style={{flex:1,padding:'0',borderRadius:'5px',border:`1px solid ${stutterOn?'#34d399':border0}`,background:stutterOn?'rgba(52,211,153,0.1)':bg1,color:stutterOn?'#34d399':'#475569',fontSize:'8px',fontWeight:800,cursor:'pointer'}}>Arm {stutterBurst}x</button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:'252px',flexShrink:0,display:'flex',flexDirection:'column',background:bg1,borderRadius:'10px',border:`1px solid ${border0}`,overflow:'hidden'}}>
          {/* Tabs */}
          <div style={{display:'flex',borderBottom:`1px solid ${border0}`,flexShrink:0}}>
            {[{id:'knobs',label:'Knobs'},{id:'lane',label:'Lane FX'},{id:'notes',label:'Notes'},{id:'save',label:'Save'}].map(({id,label})=>(
              <button key={id} onClick={()=>setRightTab(id)}
                style={{flex:1,padding:'5px 0',fontSize:'8px',fontWeight:900,letterSpacing:'0.14em',border:'none',background:rightTab===id?'rgba(52,211,153,0.08)':'transparent',color:rightTab===id?'#34d399':'#334155',cursor:'pointer',borderBottom:rightTab===id?'2px solid #34d399':'2px solid transparent',textTransform:'uppercase',transition:'color 0.1s'}}>
                {label}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:'auto',padding:'7px',display:'flex',flexDirection:'column',gap:'5px'}}>

            {rightTab==='knobs'&&<>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px 8px'}}>
                {[
                  ['Swing',swing,setSwing,0,0.25],['Density',density,setDensity,0,1],['Chaos',chaos,setChaos,0,1],['Humanize',humanize,setHumanize,0,0.3],
                  ['Macro',macroKnob,setMacroKnob,0,1],['Groove Amt',grooveAmount,setGrooveAmount,0,1],['Master',master,setMaster,0.1,1],['Tone',tone,setTone,0.1,1],
                  ['Noise',noise,setNoise,0,1],['Space',space,setSpace,0,1],['Compress',compressAmount,setCompressAmount,0,1],['Resonance',resonance,setResonance,0,1],
                  ['Bass LFO',bassLfo,setBassLfo,0,1],['Synth LFO',synthLfo,setSynthLfo,0,1],['Drum Decay',drumDecay,setDrumDecay,0.1,1],['Bass Cutoff',bassCutoff,setBassCutoff,0,1],
                  ['Synth Cutoff',synthCutoff,setSynthCutoff,0,1],['Bass Sub',bassSubAmount,setBassSubAmount,0.1,1],['Synth Atk',synthAttack,setSynthAttack,0,1],['Synth Rel',synthRelease,setSynthRelease,0,1],
                ].map(([label,v,s,min,max])=><Slider key={label} label={label} value={v} setValue={s} min={min} max={max}/>)}
              </div>
              <Slider label="Stutter Burst" value={stutterBurst} setValue={setStutterBurst} min={2} max={8} step={1} fmt={v=>`${v}x`}/>
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <button onClick={()=>setMetronomeOn(v=>!v)} style={pill(metronomeOn)}>Metro</button>
                <input type="range" min={0} max={1} step={0.01} value={metronomeLevel} onChange={e=>setMetronomeLevel(Number(e.target.value))} style={{flex:1,height:'2px',accentColor:'#34d399'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px'}}>
                {[{label:'BASS WAVE',wave:bassWave,set:setBassWave,color:'#22d3ee'},{label:'SYNTH WAVE',wave:synthWave,set:setSynthWave,color:'#a78bfa'}].map(({label,wave,set,color})=>(
                  <div key={label}>
                    <div style={{fontSize:'7px',color:'#334155',fontWeight:800,letterSpacing:'0.16em',marginBottom:'3px',textTransform:'uppercase'}}>{label}</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'2px'}}>
                      {['auto','sine','tri','square','saw'].map((w,i)=>{const full=['auto','sine','triangle','square','sawtooth'][i];return<button key={w} onClick={()=>set(full)} style={pill(wave===full,color)}>{w}</button>;})}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{fontSize:'7px',color:'#334155',fontWeight:800,letterSpacing:'0.16em',marginBottom:'3px',textTransform:'uppercase'}}>SCENES</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                  {[0,1,2,3].map(slot=>(
                    <div key={slot} style={{borderRadius:'5px',border:`1px solid ${currentScene===slot?'rgba(52,211,153,0.35)':sceneSlots[slot]?'rgba(34,211,238,0.18)':border0}`,background:'rgba(255,255,255,0.015)',padding:'3px 5px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'3px'}}>
                      <span style={{fontSize:'8px',fontWeight:800,color:currentScene===slot?'#34d399':'#334155'}}>S{slot+1}</span>
                      <div style={{display:'flex',gap:'2px'}}>
                        <button onClick={()=>loadScene(slot)} disabled={!sceneSlots[slot]} style={{...pill(false),opacity:sceneSlots[slot]?1:0.3,padding:'1px 5px'}}>Load</button>
                        <button onClick={()=>saveScene(slot)} style={{...pill(false,'#34d399'),padding:'1px 5px'}}>Save</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>}

            {rightTab==='lane'&&<>
              <div style={{display:'flex',gap:'2px'}}>
                {laneLabels.map(({key,long})=>{const lc=LANE_COLOR[key];return<button key={key} onClick={()=>setActiveLane(key)} style={pill(activeLane===key,lc)}>{long}</button>;})}
              </div>
              {['drive','tone','echo','crush','pan'].map(param=>(
                <Slider key={param} label={`${activeLane} · ${param}`} value={laneFx[activeLane]?.[param]??0}
                  setValue={v=>setLaneFx(prev=>({...prev,[activeLane]:{...prev[activeLane],[param]:v}}))} min={param==='pan'?-1:0} max={1}/>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                {[['Rotate →',()=>rotateLane(activeLane,1)],['Rotate ←',()=>rotateLane(activeLane,-1)],['Mutate',()=>mutateLane(activeLane)],['Fill',()=>fillLane(activeLane,clamp(density+0.12,0.15,0.95))]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{...pill(false),padding:'4px',textAlign:'center',fontSize:'8px'}}>{l}</button>
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
                  const laneOn=noteEditLane==='bass'?(idx<laneStepCounts.bass&&patterns.bass[idx]):(idx<laneStepCounts.synth&&patterns.synth[idx]);
                  const currentNote=noteEditLane==='bass'?bassLine[idx]:synthLine[idx];const pool=getLaneNotePool(noteEditLane);
                  return (
                    <div key={idx} style={{borderRadius:'4px',background:laneOn?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.01)',padding:'2px',opacity:laneOn?1:0.25,textAlign:'center'}}>
                      <div style={{fontSize:'6px',color:'#334155',marginBottom:'1px'}}>{idx+1}</div>
                      <button disabled={!laneOn} onClick={()=>{if(!pool.length)return;const next=pool[(pool.indexOf(currentNote)+1)%pool.length];setStepNote(noteEditLane,idx,next);}}
                        style={{width:'100%',padding:'2px 0',borderRadius:'3px',border:'none',background:laneOn?'#34d399':'rgba(255,255,255,0.04)',color:laneOn?'#0a1628':'#334155',fontSize:'7px',fontWeight:800,cursor:laneOn?'pointer':'default'}}>
                        {currentNote}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'2px'}}>
                {[['↓ Down',()=>shiftLaneNotes(noteEditLane,-1)],['Random',()=>randomizeLaneNotes(noteEditLane)],['↑ Up',()=>shiftLaneNotes(noteEditLane,1)]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{...pill(false),padding:'4px',textAlign:'center',fontSize:'8px'}}>{l}</button>
                ))}
              </div>
            </>}

            {rightTab==='save'&&<>
              <div style={{fontSize:'8px',color:'#34d399',background:'rgba(52,211,153,0.07)',borderRadius:'5px',padding:'4px 7px',fontWeight:700,letterSpacing:'0.06em'}}>
                {Math.round(bpm)} BPM · {stepCount} step · {grooveProfile.toUpperCase()} · {harmonicProfile.toUpperCase()}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px'}}>
                {[['Load Local',loadProjectLocal],['Quick Save',saveProjectLocal],['Import JSON',()=>importInputRef.current?.click()],['Export JSON',exportProjectJson]].map(([l,fn])=>(
                  <button key={l} onClick={fn} style={{...pill(l==='Quick Save','#34d399'),padding:'5px',textAlign:'center',fontSize:'8px'}}>{l}</button>
                ))}
              </div>
              <input ref={importInputRef} type="file" accept="application/json" onChange={importProjectFile} style={{display:'none'}}/>
              <div>
                <div style={{fontSize:'7px',color:'#334155',fontWeight:800,letterSpacing:'0.16em',marginBottom:'3px',textTransform:'uppercase'}}>PROJECT SLOTS</div>
                {[0,1,2,3].map(slot=>(
                  <div key={slot} style={{borderRadius:'5px',border:`1px solid ${currentProjectSlot===slot?'rgba(52,211,153,0.35)':projectSlots[slot]?'rgba(34,211,238,0.18)':border0}`,background:'rgba(255,255,255,0.015)',padding:'4px 6px',marginBottom:'2px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'4px'}}>
                    <div>
                      <div style={{fontSize:'8px',fontWeight:800,color:currentProjectSlot===slot?'#34d399':'#475569'}}>P{slot+1}</div>
                      <div style={{fontSize:'7px',color:'#1e293b'}}>{projectSlots[slot]?.label||'Empty'}</div>
                    </div>
                    <div style={{display:'flex',gap:'2px'}}>
                      <button onClick={()=>loadProjectSlot(slot)} disabled={!projectSlots[slot]} style={{...pill(false),opacity:projectSlots[slot]?1:0.3,padding:'2px 5px'}}>Load</button>
                      <button onClick={()=>saveProjectSlot(slot)} style={{...pill(false,'#34d399'),padding:'2px 5px'}}>Save</button>
                      <button onClick={()=>clearProjectSlot(slot)} disabled={!projectSlots[slot]} style={{...pill(false),opacity:projectSlots[slot]?1:0.3,padding:'2px 5px'}}>×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                  <div style={{fontSize:'7px',color:'#334155',fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase'}}>RECORDER · {recordMime}</div>
                  <button onClick={recState==='recording'?stopRecording:startRecording} style={pill(recState==='recording','#f43f5e')}>{recState==='recording'?'■ Stop':'⏺ Rec'}</button>
                </div>
                {recordings.length===0?<div style={{fontSize:'8px',color:'#1e293b',padding:'6px',textAlign:'center'}}>No recordings yet.</div>:recordings.map((item,idx)=>(
                  <div key={item.url} style={{borderRadius:'5px',border:`1px solid ${border0}`,background:'rgba(255,255,255,0.015)',padding:'4px 6px',marginBottom:'2px'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'3px'}}>
                      <span style={{fontSize:'8px',fontWeight:800,color:'#64748b'}}>Take {idx+1}</span>
                      <button onClick={()=>downloadRecording(item)} style={{...pill(false),padding:'2px 6px',fontSize:'8px'}}>↓ Save</button>
                    </div>
                    <audio controls src={item.url} style={{width:'100%',height:'20px'}}/>
                  </div>
                ))}
              </div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}
