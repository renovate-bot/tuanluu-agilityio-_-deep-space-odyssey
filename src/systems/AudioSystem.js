// Everything heard on the deck is synthesised live with the Web Audio API: no audio files are downloaded.
// This is cinematic in-cabin sound design, not a claim that sound travels through the vacuum outside.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Harmony per mood: slow chord cycles (MIDI notes) + a scale for the sparse bell notes.
const MOODS = {
  drift: { chords: [[38, 53, 57, 60, 64], [34, 53, 58, 62, 65], [41, 53, 57, 60, 64], [33, 52, 57, 60, 67]], scale: [62, 64, 65, 69, 72, 74, 76], cutoff: 700, bells: 9 },
  home: { chords: [[41, 55, 57, 60, 64], [36, 55, 60, 64, 67], [38, 53, 57, 60, 65], [34, 53, 57, 62, 65]], scale: [65, 67, 69, 72, 74, 76, 79], cutoff: 900, bells: 7 },
  desert: { chords: [[40, 52, 55, 59, 64], [41, 53, 57, 59, 64], [40, 55, 59, 62, 66], [38, 53, 57, 62, 65]], scale: [64, 65, 67, 71, 72, 76], cutoff: 620, bells: 11 },
  giant: { chords: [[36, 51, 55, 58, 62], [32, 51, 55, 60, 63], [39, 50, 55, 58, 62], [31, 50, 53, 58, 62]], scale: [60, 62, 63, 67, 70, 72, 75], cutoff: 560, bells: 12 },
  nebula: { chords: [[38, 54, 57, 61, 68], [40, 54, 59, 62, 68], [35, 54, 57, 61, 66], [43, 54, 59, 61, 66]], scale: [66, 68, 69, 73, 76, 78, 80, 85], cutoff: 1100, bells: 4.5 },
  void: { chords: [[33, 45, 52, 59], [33, 45, 52, 57], [31, 43, 50, 57], [33, 45, 52, 59]], scale: [69, 71, 76, 81], cutoff: 420, bells: 16 },
  galaxy: { chords: [[38, 54, 57, 61, 64], [35, 54, 57, 62, 66], [43, 54, 59, 62, 69], [33, 52, 57, 62, 64]], scale: [66, 69, 73, 74, 76, 78, 81], cutoff: 950, bells: 6 },
  alien: { chords: [[37, 52, 56, 60, 63], [33, 53, 56, 61, 64], [42, 52, 57, 61, 68], [38, 54, 58, 61, 69]], scale: [61, 64, 66, 68, 72, 73, 76], cutoff: 800, bells: 6 },
};

export class AudioSystem {
  constructor(store) {
    this.store = store;
    this.ctx = null;
    this.ready = false;
    this.mood = 'drift';
    this.chordIndex = 0;
    this.chordTimer = 0;
    this.bellTimer = 4;
    this.blipTimer = 8;
    this.voices = [];
    this.ends = []; // end times of one-shot voices still sounding
    this.lastHover = 0;
    this.engineOn = false;
    this.musicOn = false;
    this.swell = 0;
    this.warpNodes = null;
    this.settings = { muted: false, volMaster: 0.8, volMusic: 0.7, volSfx: 0.8 };
  }

  /** Must be called from a user gesture (the ENTER button). */
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const ctx = (this.ctx = new AC({ latencyHint: 'playback' }));
      this.master = ctx.createGain();
      this.master.gain.value = 0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3.5; comp.attack.value = 0.02; comp.release.value = 0.4;
      this.master.connect(comp).connect(ctx.destination);
      this.musicBus = ctx.createGain();
      this.shipBus = ctx.createGain();
      this.sfxBus = ctx.createGain();
      for (const b of [this.musicBus, this.shipBus, this.sfxBus]) b.connect(this.master);
      // generated reverb tail
      this.reverb = ctx.createConvolver();
      this.reverb.buffer = this.impulse(4.2, 2.4);
      const wet = ctx.createGain();
      wet.gain.value = 0.7;
      this.reverb.connect(wet).connect(this.master);
      this.musicSend = ctx.createGain(); this.musicSend.gain.value = 0.55; this.musicBus.connect(this.musicSend).connect(this.reverb);
      this.sfxSend = ctx.createGain(); this.sfxSend.gain.value = 0.25; this.sfxBus.connect(this.sfxSend).connect(this.reverb);
      this.noiseBuffer = this.makeNoise(4, false);
      this.brownBuffer = this.makeNoise(6, true);
      // pad filter shared by all music voices
      this.padFilter = ctx.createBiquadFilter();
      this.padFilter.type = 'lowpass'; this.padFilter.frequency.value = 600; this.padFilter.Q.value = 0.6;
      this.padFilter.connect(this.musicBus);
      this.buildNebulaBed();
      this.ready = true;
      this.applySettings(this.store.get());
      if (ctx.state === 'suspended') ctx.resume();
    } catch (err) {
      console.warn('[audio] unavailable', err);
      this.ctx = null;
    }
  }

  impulse(seconds, decay) {
    const ctx = this.ctx, rate = ctx.sampleRate, len = Math.floor(rate * seconds);
    const buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 400 ? i / 400 : 1);
    }
    return buf;
  }

  makeNoise(seconds, brown) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    // crossfade the loop point so it never clicks
    const f = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < f; i++) { const t = i / f; d[len - f + i] = d[len - f + i] * (1 - t) + d[i] * t; }
    return buf;
  }

  noise(brown = false) {
    const s = this.ctx.createBufferSource();
    s.buffer = brown ? this.brownBuffer : this.noiseBuffer;
    s.loop = true;
    return s;
  }

  applySettings(s) {
    this.settings = { muted: s.muted, volMaster: s.volMaster, volMusic: s.volMusic, volSfx: s.volSfx };
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.volMaster, t, 0.08);
    this.musicBus.gain.setTargetAtTime(s.volMusic * 0.9, t, 0.1);
    this.shipBus.gain.setTargetAtTime(s.volSfx * 0.8, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(s.volSfx, t, 0.1);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // ───────────────────────────────────────────────────────────── music ──
  startMusic() {
    if (!this.ready || this.musicOn) return;
    this.musicOn = true;
    this.chordTimer = 0;
  }

  setMood(mood) {
    if (!MOODS[mood] || mood === this.mood) return;
    this.mood = mood;
    this.chordIndex = 0;
    this.chordTimer = Math.min(this.chordTimer, 1.5); // move to the new harmony soon, but not abruptly
    this.bellTimer = Math.min(this.bellTimer, 5);
  }

  setSwell(v) { this.swell = v; }

  nextChord() {
    const ctx = this.ctx, t = ctx.currentTime;
    const m = MOODS[this.mood];
    const chord = m.chords[this.chordIndex % m.chords.length];
    this.chordIndex++;
    // release the previous chord slowly: the two overlap into one continuous texture
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, 3.2);
      for (const o of v.oscs) o.stop(t + 16);
    }
    this.voices = chord.map((note, i) => {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const bass = i === 0;
      const level = bass ? 0.2 : 0.07;
      gain.gain.setTargetAtTime(level, t + i * 0.7, 3.5);
      const pan = ctx.createStereoPanner();
      pan.pan.value = bass ? 0 : (i / (chord.length - 1)) * 1.4 - 0.7;
      const oscs = (bass ? [['sine', 0], ['triangle', 4]] : [['sawtooth', -7], ['sawtooth', 7], ['triangle', 0]]).map(([type, detune]) => {
        const o = ctx.createOscillator();
        o.type = type; o.frequency.value = mtof(note); o.detune.value = detune + (Math.random() - 0.5) * 4;
        o.connect(gain); o.start(t);
        return o;
      });
      gain.connect(pan).connect(bass ? this.musicBus : this.padFilter);
      return { gain, oscs };
    });
  }

  bell() {
    const ctx = this.ctx, t = ctx.currentTime;
    const m = MOODS[this.mood];
    const note = m.scale[(Math.random() * m.scale.length) | 0] + (Math.random() < 0.3 ? 12 : 0);
    const f = mtof(note);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 5);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
    o.connect(g); o2.connect(g2).connect(g);
    g.connect(pan); pan.connect(this.musicBus); pan.connect(this.reverb);
    o.start(t); o2.start(t); o.stop(t + 5.2); o2.stop(t + 5.2);
  }

  // ───────────────────────────────────────────────────────────── ship ──
  startEngine() {
    if (!this.ready || this.engineOn) return;
    this.engineOn = true;
    const ctx = this.ctx, t = ctx.currentTime;
    const out = (this.engineGain = ctx.createGain());
    out.gain.value = 0;
    out.gain.setTargetAtTime(1, t, 1.2);
    out.connect(this.shipBus);
    const a = (this.engA = ctx.createOscillator()); a.type = 'sine'; a.frequency.value = 46;
    const b = (this.engB = ctx.createOscillator()); b.type = 'sawtooth'; b.frequency.value = 92.6;
    const lp = (this.engLp = ctx.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 170; lp.Q.value = 1.2;
    const ga = ctx.createGain(); ga.gain.value = 0.2;
    const gb = ctx.createGain(); gb.gain.value = 0.045;
    a.connect(ga).connect(out); b.connect(lp).connect(gb).connect(out);
    // rumble
    const n = this.noise(true);
    const nlp = (this.engNoiseLp = ctx.createBiquadFilter()); nlp.type = 'lowpass'; nlp.frequency.value = 140;
    const gn = (this.engNoiseGain = ctx.createGain()); gn.gain.value = 0.22;
    n.connect(nlp).connect(gn).connect(out);
    // air handling: a barely audible hiss that makes the room feel inhabited
    const air = this.noise(false);
    const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = 0.4;
    const gair = ctx.createGain(); gair.gain.value = 0.006;
    air.connect(hp).connect(gair).connect(out);
    // slow beating so the hum is alive
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lg = ctx.createGain(); lg.gain.value = 0.03;
    lfo.connect(lg).connect(ga.gain);
    for (const s of [a, b, n, air, lfo]) s.start(t);
    this.engineSources = [a, b, n, air, lfo];
  }

  buildNebulaBed() {
    const ctx = this.ctx;
    const n = this.noise(false);
    const out = (this.nebulaGain = ctx.createGain());
    out.gain.value = 0;
    this.nebulaFilters = [520, 910].map((f, i) => {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 14;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ctx.createGain(); lg.gain.value = f * 0.35;
      lfo.connect(lg).connect(bp.frequency); lfo.start();
      n.connect(bp).connect(out);
      return { bp, lfo };
    });
    out.connect(this.musicBus); out.connect(this.reverb);
    n.start();
    this.nebulaSource = n;
  }

  startWarp() {
    if (!this.ready || this.warpNodes) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(0.5, t + 2.8);
    out.connect(this.sfxBus);
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(55, t); o1.frequency.exponentialRampToValueAtTime(330, t + 2.8); o1.frequency.setTargetAtTime(165, t + 2.9, 0.5);
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(55.7, t); o2.frequency.exponentialRampToValueAtTime(334, t + 2.8); o2.frequency.setTargetAtTime(110.8, t + 2.9, 0.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5;
    lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(1800, t + 2.8); lp.frequency.setTargetAtTime(600, t + 2.9, 0.6);
    const og = ctx.createGain(); og.gain.value = 0.16;
    o1.connect(lp); o2.connect(lp); lp.connect(og).connect(out);
    const n = this.noise(false);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 2.8); bp.frequency.setTargetAtTime(900, t + 2.9, 0.8);
    const ng = ctx.createGain(); ng.gain.value = 0.22;
    n.connect(bp).connect(ng).connect(out);
    const trem = ctx.createOscillator(); trem.frequency.value = 9;
    const tg = ctx.createGain(); tg.gain.value = 0.05;
    trem.connect(tg).connect(og.gain);
    for (const s of [o1, o2, n, trem]) s.start(t);
    this.warpNodes = { out, sources: [o1, o2, n, trem] };
  }

  stopWarp() {
    if (!this.warpNodes) return;
    const { out, sources } = this.warpNodes;
    const t = this.ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setTargetAtTime(0, t, 0.25);
    for (const s of sources) s.stop(t + 1.6);
    this.warpNodes = null;
  }

  // ───────────────────────────────────────────────────────── one-shots ──
  tone(freq, dur, gain, { type = 'sine', to = null, delay = 0, wet = false, attack = 0.005, bus = null } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    o.connect(g).connect(bus || this.sfxBus);
    if (wet) g.connect(this.reverb);
    o.start(t); o.stop(t + dur + 0.05);
    this.track(t + dur + 0.05);
  }

  burst(dur, gain, { type = 'bandpass', from = 800, to = 800, q = 1, delay = 0, attack = 0.02, brown = false } = {}) {
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const n = this.noise(brown);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0004, t + dur);
    n.connect(f).connect(g).connect(this.sfxBus);
    n.start(t, Math.random() * 2); n.stop(t + dur + 0.05);
    this.track(t + dur + 0.05);
  }

  /** Remember when a one-shot ends, so the number of sounding voices can be capped without relying on events. */
  track(endTime) { this.ends.push(endTime); }

  get oneShots() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (this.ends.length) this.ends = this.ends.filter((t) => t > now);
    return this.ends.length;
  }

  play(name) {
    if (!this.ready || this.settings.muted) return;
    // voice limiting: decorative sounds are dropped first when many things happen at once
    const minor = name === 'hover' || name === 'ui' || name === 'screen';
    if (this.oneShots > (minor ? 8 : 20)) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'hover':
        if (now - this.lastHover < 0.09) return;
        this.lastHover = now;
        this.tone(1900, 0.04, 0.018); break;
      case 'ui': this.tone(880, 0.07, 0.05, { to: 1180 }); break;
      case 'select': this.tone(660, 0.1, 0.05); this.tone(990, 0.14, 0.045, { delay: 0.07 }); break;
      case 'confirm': [523.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.22, 0.05, { delay: i * 0.07, wet: true })); break;
      case 'ai': this.tone(880, 0.7, 0.04, { wet: true }); this.tone(1318.5, 0.9, 0.035, { delay: 0.12, wet: true }); break;
      case 'alert': this.tone(440, 0.16, 0.035, { type: 'triangle' }); this.tone(440, 0.16, 0.035, { type: 'triangle', delay: 0.26 }); break;
      case 'screen': this.tone(1400, 0.05, 0.03); this.tone(2100, 0.08, 0.025, { delay: 0.05 }); break;
      case 'door': this.burst(1.8, 0.09, { from: 500, to: 180, q: 3 }); this.tone(64, 1.8, 0.1, { to: 52, attack: 0.2 }); break;
      case 'lock': this.tone(120, 0.3, 0.3, { to: 45 }); this.burst(0.08, 0.15, { type: 'highpass', from: 2500, to: 2500 }); this.tone(700, 0.12, 0.03, { delay: 0.3 }); break;
      case 'boot': this.tone(70, 2.6, 0.12, { to: 300, attack: 1.4, type: 'triangle', wet: true }); this.tone(140, 2.6, 0.04, { to: 600, attack: 1.8, wet: true }); this.burst(2.4, 0.03, { from: 300, to: 3000, q: 2, attack: 1.5 }); break;
      case 'shutter': this.burst(4.4, 0.07, { from: 260, to: 340, q: 4, attack: 0.4 }); this.burst(4.4, 0.25, { type: 'lowpass', from: 90, to: 60, attack: 0.5, brown: true }); this.tone(180, 0.3, 0.06, { to: 90, delay: 4.3 }); break;
      case 'whoosh': this.burst(4.0, 0.1, { from: 200, to: 1400, q: 1.2, attack: 2.8 }); break;
      case 'align': this.burst(0.9, 0.05, { type: 'highpass', from: 1800, to: 900, attack: 0.1 }); this.burst(0.7, 0.04, { type: 'highpass', from: 1600, to: 800, attack: 0.1, delay: 1.3 }); break;
      case 'warpJump': this.burst(1.6, 0.4, { from: 3200, to: 180, q: 0.9, attack: 0.03 }); this.tone(130, 1.8, 0.4, { to: 32, attack: 0.02 }); break;
      case 'warpArrive': this.tone(95, 1.6, 0.45, { to: 28, attack: 0.01 }); this.burst(1.4, 0.2, { type: 'lowpass', from: 2400, to: 120, attack: 0.01 }); this.tone(1568, 1.6, 0.025, { wet: true, delay: 0.1 }); break;
      default: break;
    }
  }

  // ───────────────────────────────────────────────────────────── frame ──
  /** state: { warp 0..1, nebula 0..1, speed } */
  update(dt, state) {
    if (!this.ready || this.ctx.state !== 'running') return;
    const ctx = this.ctx, t = ctx.currentTime;
    const m = MOODS[this.mood];

    if (this.musicOn) {
      this.chordTimer -= dt;
      if (this.chordTimer <= 0) { this.chordTimer = 17 + Math.random() * 5; this.nextChord(); }
      this.bellTimer -= dt;
      if (this.bellTimer <= 0) { this.bellTimer = m.bells * (0.5 + Math.random()); this.bell(); }
      // the pad opens up with the galaxy swell and inside nebulae; it ducks under the warp
      const cutoff = m.cutoff * (1 + 1.6 * this.swell + 0.5 * state.nebula) * (1 - 0.4 * state.warp);
      this.padFilter.frequency.setTargetAtTime(cutoff, t, 0.8);
      this.musicSend.gain.setTargetAtTime(0.55 + 0.3 * this.swell, t, 0.8);
    }

    if (this.engineOn) {
      const w = state.warp;
      const cruise = Math.min(1, state.speed / 2500) * 0.25;
      this.engA.frequency.setTargetAtTime(46 * (1 + 0.9 * w + 0.25 * cruise), t, 0.25);
      this.engB.frequency.setTargetAtTime(92.6 * (1 + 0.9 * w + 0.25 * cruise), t, 0.25);
      this.engLp.frequency.setTargetAtTime(170 + 900 * w + 200 * cruise, t, 0.25);
      this.engNoiseLp.frequency.setTargetAtTime(140 + 700 * w + 160 * cruise, t, 0.25);
      this.engNoiseGain.gain.setTargetAtTime(0.22 + 0.5 * w + 0.2 * cruise, t, 0.25);
      // idle electronics: an occasional quiet chirp from a console
      this.blipTimer -= dt;
      if (this.blipTimer <= 0 && w < 0.05) {
        this.blipTimer = 7 + Math.random() * 14;
        if (!this.settings.muted) { const f = 1200 + Math.random() * 1400; this.tone(f, 0.05, 0.012); if (Math.random() < 0.5) this.tone(f * 1.5, 0.05, 0.01, { delay: 0.09 }); }
      }
    }
    this.nebulaGain.gain.setTargetAtTime(0.11 * state.nebula, t, 1.5);
  }

  dispose() {
    if (!this.ctx) return;
    try { this.ctx.close(); } catch (e) { /* already closed */ }
    this.ctx = null;
    this.ready = false;
  }
}
