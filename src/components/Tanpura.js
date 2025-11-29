import React, { useEffect, useRef, useState } from 'react';
import '../styles/Tanpura.css';

// Simple tanpura-like drone using WebAudio
export default function Tanpura() {
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const oscRefs = useRef([]);
  const refOscRef = useRef(null);
  const filterRef = useRef(null);
  const delayRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [tonic, setTonic] = useState('C');
  // replace octave selector with Indian swara selector (Sa, Ri, Ga, Ma, Pa, Dha, Ni)
  const [referenceSwara, setReferenceSwara] = useState('Sa');
  const [refVolume, setRefVolume] = useState(0.28);
  const [refEnabled, setRefEnabled] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [includePancham, setIncludePancham] = useState(true);

  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  const SWARA_SEMITONES = {
    'Sa': 0,
    'R1': 1,
    'R2': 2,
    'R3': 3,
    'G1': 2,
    'G2': 3,
    'G3': 4,
    'M1': 5,
    'M2': 6,
    'Pa': 7,
    'D1': 8,
    'D2': 9,
    'D3': 10,
    'N1': 9,
    'N2': 10,
    'N3': 11
  };

  function noteFreq(note, oct) {
    // A4 = 440Hz reference
    const noteIndex = NOTES.indexOf(note);
    const semisFromC4 = noteIndex - 0 + (oct - 4) * 12; // shift from C4
    // C4 frequency
    const C4 = 261.6255653005986;
    return C4 * Math.pow(2, semisFromC4 / 12);
  }

  // Produce frequency for a swara relative to the chosen Sa (tonic)
  function swaraFreqForSa(saNote, saOctave, swara) {
    const saFreq = noteFreq(saNote, saOctave);
    const semitoneOffset = SWARA_SEMITONES[swara] || 0;
    return saFreq * Math.pow(2, semitoneOffset / 12);
  }

  function startDrone() {
    if (running) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // master chain
    const master = ctx.createGain();
    master.gain.value = volume;
    const masterPan = ctx.createStereoPanner();
    master.connect(masterPan);
    masterPan.connect(ctx.destination);
    gainRef.current = master;

    // tone-shaping filter — mellows high harmonics like a real tanpura resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 5000;
    filter.Q.value = 0.8;
    filter.connect(master);
    filterRef.current = filter;

    // small delay + feedback for body/reverb
    const delay = ctx.createDelay(0.5);
    delay.delayTime.value = 0.08;
    const fb = ctx.createGain();
    fb.gain.value = 0.18;
    const delayLowpass = ctx.createBiquadFilter();
    delayLowpass.type = 'lowpass';
    delayLowpass.frequency.value = 3000;
    // feedback loop
    delay.connect(delayLowpass);
    delayLowpass.connect(fb);
    fb.connect(delay);
    // route some of the filter output into delay
    delay.connect(master);
    delayRef.current = delay;

    // assume Sa at selected tonic and octave 4 by default for base frequency
    const saOct = 4;
    const baseFreq = noteFreq(tonic, saOct);

    // create richer harmonic set with gentle detune and smooth attack to avoid harsh beating
    const tonicOscs = [];
    const harmonicDefs = [
      {mul:1, gain:0.55, detune:0, type:'sine'},
      {mul:2, gain:0.22, detune:5, type:'sine'},
      {mul:3, gain:0.12, detune:-4, type:'triangle'},
      {mul:4, gain:0.06, detune:6, type:'triangle'}
    ];
    const attack = 0.08;

    // Build a small resonator bank (bandpass filters) to emphasise tanpura partials
    const resonators = harmonicDefs.map(h => {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = baseFreq * h.mul;
      f.Q.value = 8 + h.mul * 2;
      // route resonator to filter and delay
      f.connect(filter);
      f.connect(delay);
      return f;
    });

    harmonicDefs.forEach((h, i) => {
      const o = ctx.createOscillator();
      o.type = h.type;
      o.frequency.value = baseFreq * h.mul;
      // detune in cents; small values to reduce train-like beating
      o.detune.value = h.detune; 
      const g = ctx.createGain();
      // start at 0 and ramp to target for a smooth onset
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(h.gain, ctx.currentTime + attack);
      o.connect(g);
      // subtle panning per partial
      const p = ctx.createStereoPanner();
      p.pan.value = (i - 1.5) * 0.06; // evenly spread
      g.connect(p);
      // route through resonator to shape body
      p.connect(resonators[i]);
      o.start();
      tonicOscs.push({o,g,p});
    });

    oscRefs.current = tonicOscs.slice();

    // add selected reference swara (e.g., Pa/Pancham, Ma) as a prominent neighbor only if enabled
    if (refEnabled) {
      const refFreq = swaraFreqForSa(tonic, 4, referenceSwara);
      const refOsc = ctx.createOscillator();
      refOsc.type = 'sine';
      refOsc.frequency.value = refFreq;
      const rg = ctx.createGain();
      // smooth attack for reference swara
      rg.gain.setValueAtTime(0, ctx.currentTime);
      rg.gain.linearRampToValueAtTime(refVolume || (includePancham ? 0.28 : 0.2), ctx.currentTime + 0.06);
      const rp = ctx.createStereoPanner();
      rp.pan.value = 0.12;
      refOsc.connect(rg);
      rg.connect(rp);
      rp.connect(filter);
      rp.connect(delay);
      refOsc.start();
      // keep a dedicated ref to the reference swara so we can update it live
      refOscRef.current = { o: refOsc, g: rg, p: rp };
      oscRefs.current.push(refOscRef.current);
    } else {
      refOscRef.current = null;
    }

    // gentle octave above Sa to provide fullness
    const octaveOsc = ctx.createOscillator();
    octaveOsc.type = 'sine';
    octaveOsc.frequency.value = baseFreq * 2;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, ctx.currentTime);
    og.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.08);
    const op = ctx.createStereoPanner();
    op.pan.value = -0.12;
    octaveOsc.connect(og);
    og.connect(op);
    op.connect(filter);
    op.connect(delay);
    octaveOsc.start();
    oscRefs.current.push({o: octaveOsc, g: og, p: op});

    // subtle chorus / motion via a very small LFO on delay time (reduced depth to avoid 'train' wobble)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06 + Math.random()*0.06; // very slow
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.0007; // much smaller modulation depth
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();
    // keep lfo in refs so we can stop it later
    oscRefs.current.push({lfo, lfoGain});

    // subtle tanpura buzz: filtered noise mixed low level for string-body realism
    const bufSize = 2 * ctx.sampleRate;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random()*2-1) * 0.25;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 2000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filter);
    noiseSrc.start();
    oscRefs.current.push({noiseSrc, noiseFilter, noiseGain});

    setRunning(true);
  }

  function createRefOsc() {
    const ctx = audioCtxRef.current;
    if (!ctx || !filterRef.current || !delayRef.current) return;
    if (refOscRef.current) {
      // already present — update
      try {
        const newFreq = swaraFreqForSa(tonic, 4, referenceSwara);
        refOscRef.current.o.frequency.setTargetAtTime(newFreq, ctx.currentTime, 0.02);
        refOscRef.current.g.gain.setTargetAtTime(refVolume, ctx.currentTime, 0.02);
      } catch (e) {}
      return;
    }
    const refFreq = swaraFreqForSa(tonic, 4, referenceSwara);
    const refOsc = ctx.createOscillator();
    refOsc.type = 'sine';
    refOsc.frequency.value = refFreq;
    const rg = ctx.createGain();
    rg.gain.setValueAtTime(0, ctx.currentTime);
    rg.gain.linearRampToValueAtTime(refVolume, ctx.currentTime + 0.06);
    const rp = ctx.createStereoPanner();
    rp.pan.value = 0.12;
    refOsc.connect(rg);
    rg.connect(rp);
    rp.connect(filterRef.current);
    rp.connect(delayRef.current);
    refOsc.start();
    refOscRef.current = { o: refOsc, g: rg, p: rp };
    oscRefs.current.push(refOscRef.current);
  }

  function removeRefOsc() {
    const ctx = audioCtxRef.current;
    if (!ctx || !refOscRef.current) return;
    try {
      refOscRef.current.g.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
      setTimeout(() => {
        try { if (refOscRef.current.o) refOscRef.current.o.stop(); } catch (e) {}
        oscRefs.current = oscRefs.current.filter(x => x !== refOscRef.current);
        refOscRef.current = null;
      }, 140);
    } catch (e) {
      try { if (refOscRef.current.o) refOscRef.current.o.stop(); } catch (e) {}
      oscRefs.current = oscRefs.current.filter(x => x !== refOscRef.current);
      refOscRef.current = null;
    }
  }

  function stopDrone() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    // stop oscillators
    oscRefs.current.forEach(entry => {
      // stop any node with a `stop` method and disconnect any connectable node
      try {
        Object.values(entry).forEach(n => {
          try { if (n && typeof n.stop === 'function') n.stop(); } catch (e) {}
          try { if (n && typeof n.disconnect === 'function') n.disconnect(); } catch (e) {}
        });
      } catch (e) {}
    });
    oscRefs.current = [];
    refOscRef.current = null;
    try { ctx.close(); } catch (e) {}
    audioCtxRef.current = null;
    filterRef.current = null;
    delayRef.current = null;
    setRunning(false);
  }

  useEffect(() => {
    // adjust volume live
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    // restart drone when tonic or includePancham changes while running
    // Changing referenceSwara updates the reference oscillator live (no full restart)
    if (!running) return;
    stopDrone();
    // small timeout to ensure context closed
    setTimeout(() => startDrone(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tonic, includePancham]);

  useEffect(() => {
    // update or create/remove reference swara oscillator live when changed
    if (!running) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      if (refEnabled) {
        if (!refOscRef.current) {
          createRefOsc();
        } else {
          const newFreq = swaraFreqForSa(tonic, 4, referenceSwara);
          refOscRef.current.o.frequency.setTargetAtTime(newFreq, ctx.currentTime, 0.02);
          refOscRef.current.g.gain.setTargetAtTime(refVolume, ctx.currentTime, 0.02);
        }
      } else {
        if (refOscRef.current) removeRefOsc();
      }
    } catch (e) {
      stopDrone();
      setTimeout(() => startDrone(), 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceSwara, includePancham, refVolume, refEnabled, tonic]);

  useEffect(() => {
    return () => { stopDrone(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tanpura-page" style={{padding:20}}>
      <h2>Tanpura / Sruthi Box</h2>
      <p>Select tonic (Sa), octave and play a continuous drone.</p>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16, alignItems:'center'}}>
        <div>
          <label style={{display:'block', fontWeight:600}}>Tonic (Sa as pitch)</label>
          <select value={tonic} onChange={e => setTonic(e.target.value)} style={{marginTop:8, width:'100%', padding:8}}>
            {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="control">
          <label className="control-label">Reference Swara</label>
          <select className="control-select" value={referenceSwara} onChange={e => setReferenceSwara(e.target.value)}>
            {Object.keys(SWARA_SEMITONES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="control-note">Reference swara emphasises a neighboring note (Pa/Ma etc.).</div>

          <div className="control-switch">
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="radio" name="refPlay" checked={refEnabled} onChange={() => setRefEnabled(true)} />
              <span style={{fontSize:14}}>Play</span>
            </label>
            <label style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="radio" name="refPlay" checked={!refEnabled} onChange={() => setRefEnabled(false)} />
              <span style={{fontSize:14}}>Mute</span>
            </label>
          </div>

          <div className="control-range">
            <label className="control-label">Reference Volume</label>
            <input type="range" min="0" max="1" step="0.01" value={refVolume} onChange={e=>setRefVolume(Number(e.target.value))} />
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <label style={{fontWeight:600}}>Harmonics</label>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <label style={{display:'flex', alignItems:'center', gap:6}}>
              <input type="checkbox" checked={includePancham} onChange={e=>setIncludePancham(e.target.checked)} />
              <span style={{fontSize:14}}>Enhanced</span>
            </label>
          </div>
          <div style={{fontSize:12, color:'#555'}}>Toggle stronger pancham-style harmonic.</div>
        </div>

        <div>
          <label style={{display:'block', fontWeight:600}}>Volume</label>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>setVolume(Number(e.target.value))} style={{marginTop:8, width:'100%'}} />
        </div>

        <div style={{display:'flex', gap:12}}>
          {!running ? (
            <button onClick={startDrone} className="upload-btn" style={{padding:'10px 18px'}}>Start Drone</button>
          ) : (
            <button onClick={stopDrone} className="upload-btn" style={{padding:'10px 18px'}}>Stop Drone</button>
          )}
          <button onClick={() => { stopDrone(); setTimeout(()=>startDrone(), 120); }} className="upload-btn" style={{padding:'10px 18px'}}>Restart</button>
        </div>
      </div>

      <div style={{marginTop:18}}>
        <p style={{maxWidth:700}}>Notes: This is a lightweight, browser-based drone using WebAudio. It approximates tanpura harmonics by mixing multiple sine oscillators. For the best experience use headphones and allow the page to play audio (browser may request interaction).</p>
      </div>
    </div>
  );
}
