import React, { useEffect, useRef, useState } from 'react';

// Simple tanpura-like drone using WebAudio
export default function Tanpura() {
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const oscRefs = useRef([]);
  const [running, setRunning] = useState(false);
  const [tonic, setTonic] = useState('C');
  // replace octave selector with Indian swara selector (Sa, Ri, Ga, Ma, Pa, Dha, Ni)
  const [referenceSwara, setReferenceSwara] = useState('Sa');
  const [volume, setVolume] = useState(0.3);
  const [includePancham, setIncludePancham] = useState(true);

  const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  // Map common Carnatic swaras to semitone offsets from Sa (using common variants)
  // This is a simplified mapping (Sa=0). Variants (R1/R2/R3 etc.) are not listed; using the common major-like mapping:
  const SWARA_SEMITONES = {
    'Sa': 0,
    'Ri': 2, // approx Ri2
    'Ga': 4, // approx Ga3
    'Ma': 5, // Ma1
    'Pa': 7,
    'Dha': 9,
    'Ni': 11
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

    // add selected reference swara (e.g., Pa/Pancham, Ma) as a prominent neighbor
    const refFreq = swaraFreqForSa(tonic, 4, referenceSwara);
    const refOsc = ctx.createOscillator();
    refOsc.type = 'sine';
    refOsc.frequency.value = refFreq;
    const rg = ctx.createGain();
    // smooth attack for reference swara
    rg.gain.setValueAtTime(0, ctx.currentTime);
    rg.gain.linearRampToValueAtTime(includePancham ? 0.28 : 0.2, ctx.currentTime + 0.06);
    const rp = ctx.createStereoPanner();
    rp.pan.value = 0.12;
    refOsc.connect(rg);
    rg.connect(rp);
    rp.connect(filter);
    rp.connect(delay);
    refOsc.start();
    oscRefs.current.push({o: refOsc, g: rg, p: rp});

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
    try { ctx.close(); } catch (e) {}
    audioCtxRef.current = null;
    setRunning(false);
  }

  useEffect(() => {
    // adjust volume live
    if (gainRef.current) gainRef.current.gain.value = volume;
  }, [volume]);

  useEffect(() => {
    // restart drone when tonic or includePancham changes while running
    if (!running) return;
    stopDrone();
    // small timeout to ensure context closed
    setTimeout(() => startDrone(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tonic, referenceSwara, includePancham]);

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

        <div>
          <label style={{display:'block', fontWeight:600}}>Reference Swara</label>
          <select value={referenceSwara} onChange={e => setReferenceSwara(e.target.value)} style={{marginTop:8, width:'100%', padding:8}}>
            {['Sa','Ri','Ga','Ma','Pa','Dha','Ni'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{fontSize:12, color:'#555', marginTop:6}}>Reference swara controls which additional swara (e.g., Pa/Ma) is emphasized in the drone.</div>
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
