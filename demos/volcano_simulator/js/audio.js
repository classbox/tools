/* Little Volcano Lab – synthesized sound effects (Web Audio API, no files needed) */
(function () {
  'use strict';

  class VolcanoAudio {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = (this.ctx = new AC());
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(ctx.destination);

      const len = ctx.sampleRate * 4;
      // brown noise (deep rumble)
      this.brown = ctx.createBuffer(1, len, ctx.sampleRate);
      let d = this.brown.getChannelData(0), last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.5;
      }
      // white noise
      this.white = ctx.createBuffer(1, len, ctx.sampleRate);
      d = this.white.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

      // continuous rumble
      const rs = ctx.createBufferSource();
      rs.buffer = this.brown; rs.loop = true;
      const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 110;
      this.rumbleGain = ctx.createGain(); this.rumbleGain.gain.value = 0;
      rs.connect(rf).connect(this.rumbleGain).connect(this.master);
      rs.start();

      // continuous eruption roar
      const ws = ctx.createBufferSource();
      ws.buffer = this.white; ws.loop = true;
      const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 260; bf.Q.value = 0.5;
      const lf = ctx.createBiquadFilter(); lf.type = 'lowpass'; lf.frequency.value = 900;
      this.roarGain = ctx.createGain(); this.roarGain.gain.value = 0;
      ws.connect(bf).connect(lf).connect(this.roarGain).connect(this.master);
      ws.start();
    }

    setMuted(m) {
      this.muted = m;
      if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }

    setLevels(rumble, roar) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.rumbleGain.gain.setTargetAtTime(Math.min(1.2, rumble), t, 0.2);
      this.roarGain.gain.setTargetAtTime(Math.min(1.0, roar), t, 0.2);
    }

    _noiseBurst(buffer, filterType, f0, f1, dur, peak, delay) {
      const ctx = this.ctx, t = ctx.currentTime + (delay || 0);
      const s = ctx.createBufferSource(); s.buffer = buffer;
      const f = ctx.createBiquadFilter(); f.type = filterType;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(this.master);
      s.start(t, Math.random() * 2);
      s.stop(t + dur + 0.1);
    }

    _tone(f0, f1, dur, peak, delay) {
      const ctx = this.ctx, t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + dur + 0.1);
    }

    boom(power) {
      if (!this.ctx) return;
      const p = 0.5 + power * 0.7;
      this._noiseBurst(this.white, 'lowpass', 2200, 60, 2.8, 1.1 * p);
      this._noiseBurst(this.brown, 'lowpass', 400, 40, 3.5, 1.4 * p);
      this._tone(75, 26, 2.2, 0.9 * p);
    }

    crack() {
      if (!this.ctx) return;
      this._noiseBurst(this.white, 'highpass', 3000, 900, 0.35, 0.5);
      this._noiseBurst(this.brown, 'lowpass', 300, 50, 2.0, 0.8, 0.25);
    }

    thud(v) {
      if (!this.ctx) return;
      this._tone(110, 40, 0.25, Math.min(0.35, 0.08 * v));
    }
  }

  window.VolcanoAudio = VolcanoAudio;
})();
