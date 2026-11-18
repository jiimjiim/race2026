// 音效：原版 wav（start / money）+ WebAudio 合成引擎声与菜单 BGM
class AudioMan {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.bgm = null;
    this.bgmWanted = false;
    this.muted = localStorage.getItem('race2026_muted') === '1';
    this.engine = null;
  }
  async init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    await Promise.all(['start', 'money', 'none', 's11'].map(async (n) => {
      try {
        const r = await fetch(new URL(`audio/${n}.wav`, document.baseURI));
        const ab = await r.arrayBuffer();
        this.buffers[n] = await this.ctx.decodeAudioData(ab);
      } catch (e) { /* 忽略音频加载失败 */ }
    }));
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  play(name, volume = 0.8) {
    if (!this.ctx || !this.buffers[name] || this.muted) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.buffers[name];
    const g = this.ctx.createGain();
    g.gain.value = volume;
    s.connect(g).connect(this.ctx.destination);
    s.start();
    return s;
  }
  startBgm() {
    this.bgmWanted = true;
    if (!this.ctx || this.muted) return;
    if (this.bgm) {
      this.bgm.master.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.3);
      return;
    }
    const ctx = this.ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    master.connect(lp).connect(ctx.destination);
    master.gain.setTargetAtTime(0.12, ctx.currentTime, 0.6);
    this.bgm = { master, step: 0, next: ctx.currentTime + 0.15, timer: null };
    this.bgm.timer = setInterval(() => this.bgmTick(), 90);
    this.bgmTick();
  }
  stopBgm() {
    this.bgmWanted = false;
    if (!this.bgm) return;
    const b = this.bgm;
    this.bgm = null;
    clearInterval(b.timer);
    b.master.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    setTimeout(() => { try { b.master.disconnect(); } catch (e) { /* noop */ } }, 500);
  }
  bgmTick() {
    if (!this.bgm || !this.ctx || this.ctx.state !== 'running') return;
    const b = this.bgm;
    const stepDur = 60 / 108 / 2;
    while (b.next < this.ctx.currentTime + 0.35) {
      this.bgmStep(b.step, b.next, b.master);
      b.step = (b.step + 1) % 32;
      b.next += stepDur;
    }
  }
  bgmStep(step, t, out) {
    const ctx = this.ctx;
    const bar = Math.floor(step / 8) % 4;
    const eighth = step % 8;
    const roots = [45, 41, 48, 43];
    const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
    const note = (n, dur, type, vol, attack = 0.01) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    const root = roots[bar];
    if (eighth === 0) {
      for (const n of chords[bar]) note(n, 2.0, 'sine', 0.05, 0.5);
    }
    if (eighth === 0 || eighth === 3 || eighth === 4 || eighth === 6) {
      note(root - 12 + (eighth === 4 ? 12 : 0), 0.3, 'triangle', 0.16);
    }
    if (eighth === 2 || eighth === 7) note(root - 5, 0.2, 'triangle', 0.1);
    if (eighth % 2 === 1) {
      note(chords[bar][((eighth - 1) / 2) % 3] + 12, 0.12, 'square', 0.028, 0.005);
    }
    if (eighth === 0 || eighth === 4) this.bgmKick(t, out);
    if (eighth === 2 || eighth === 6) this.bgmSnare(t, out);
    this.bgmHat(t, out, eighth % 2 === 1 ? 0.018 : 0.009);
  }
  bgmKick(t, out) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + 0.18);
  }
  bgmSnare(t, out) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1800;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.14);
  }
  bgmHat(t, out, vol) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + 0.05);
  }
  noiseBuffer() {
    if (!this._noise) {
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noise = buf;
    }
    return this._noise;
  }
  setMuted(m) {
    this.muted = m;
    localStorage.setItem('race2026_muted', m ? '1' : '0');
    if (this.bgm) this.bgm.master.gain.setTargetAtTime(m ? 0 : 0.12, this.ctx.currentTime, 0.1);
    if (m) this.stopEngine();
    else if (this.bgmWanted) this.startBgm();
  }
  // ---- 引擎声 ----
  startEngine() {
    if (!this.ctx || this.engine || this.muted) return;
    const ctx = this.ctx;
    const master = ctx.createGain(); master.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 2.2;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 42;
    const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 84;
    const g1 = ctx.createGain(); g1.gain.value = 0.32;
    const g2 = ctx.createGain(); g2.gain.value = 0.09;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7.5;
    const lfoG = ctx.createGain(); lfoG.gain.value = 6;
    lfo.connect(lfoG).connect(o1.frequency);
    o1.connect(g1).connect(lp);
    o2.connect(g2).connect(lp);
    lp.connect(master).connect(ctx.destination);
    // 风噪
    const nb = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = nb; noise.loop = true;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 0.6;
    const ng = ctx.createGain(); ng.gain.value = 0;
    noise.connect(nf).connect(ng).connect(master);
    o1.start(); o2.start(); lfo.start(); noise.start();
    this.engine = { o1, o2, lp, master, ng, noise, nf };
    master.gain.setTargetAtTime(0.09, ctx.currentTime, 0.25);
  }
  updateEngine(speed, throttle) {
    if (!this.engine) return;
    const t = this.ctx.currentTime;
    const kmh = Math.abs(speed);
    const f = 34 + kmh * 1.05 + (throttle ? 6 : 0);
    this.engine.o1.frequency.setTargetAtTime(f, t, 0.08);
    this.engine.o2.frequency.setTargetAtTime(f * 2.0, t, 0.08);
    this.engine.lp.frequency.setTargetAtTime(420 + kmh * 6, t, 0.1);
    this.engine.ng.gain.setTargetAtTime(Math.min(0.09, kmh / 2600), t, 0.2);
    this.engine.master.gain.setTargetAtTime(throttle ? 0.105 : 0.055, t, 0.15);
  }
  stopEngine() {
    if (!this.engine) return;
    const e = this.engine, t = this.ctx.currentTime;
    try {
      e.master.gain.setTargetAtTime(0, t, 0.12);
      setTimeout(() => { try { e.o1.stop(); e.o2.stop(); e.noise.stop(); } catch (err) { /* noop */ } }, 400);
    } catch (err) { /* noop */ }
    this.engine = null;
  }
  // ---- 小合成音 ----
  blip(freq = 880, dur = 0.06, type = 'square', vol = 0.05) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  sweep(from, to, dur = 0.4, vol = 0.06) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  }
}

export const audio = new AudioMan();
