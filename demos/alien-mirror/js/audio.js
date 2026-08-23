/**
 * Web Audio API Sound Synthesizer
 * Fully self-contained sound effects for the game without external audio dependencies.
 */
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isLaserPlaying = false;

    // Load Audio Elements from sound folder
    this.laserAudio = new Audio('sound/laser.mp3');
    this.laserAudio.loop = true;
    this.laserAudio.volume = 0.425;

    // Trim 0.5s total off the tail for a seamless loop (2.28s - 0.5s = 1.78s)
    this.laserAudio.addEventListener('timeupdate', () => {
      if (this.isLaserPlaying && this.laserAudio.currentTime > 1.78) {
        this.laserAudio.currentTime = 0.02;
      }
    });

    this.damageAudio = new Audio('sound/damage.mp3');
    this.damageAudio.volume = 0.8;

    this.explosionAudio = new Audio('sound/explosion.mp3');
    this.explosionAudio.volume = 0.95;

    this.mirrorAudio = new Audio('sound/mirror.mp3');
    this.mirrorAudio.loop = true;
    this.mirrorAudio.volume = 0.75;
    this.isMirrorPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopLaserHum();
      this.stopMirrorMovement();
      if (this.damageAudio) {
        this.damageAudio.pause();
      }
      if (this.explosionAudio) {
        this.explosionAudio.pause();
      }
    }
    return this.enabled;
  }

  // Play sound/mirror.mp3 while rotating/tilting mirror
  startMirrorMovement() {
    if (!this.enabled || this.isMirrorPlaying) return;
    this.init();
    this.isMirrorPlaying = true;
    try {
      if (this.mirrorAudio) {
        const p = this.mirrorAudio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    } catch (e) {}
  }

  stopMirrorMovement() {
    if (!this.isMirrorPlaying) return;
    this.isMirrorPlaying = false;
    try {
      if (this.mirrorAudio) {
        this.mirrorAudio.pause();
        this.mirrorAudio.currentTime = 0;
      }
    } catch (e) {}
  }

  // Play sound/explosion.mp3 on alien defeat
  playExplosion() {
    if (!this.enabled) return;
    try {
      if (this.explosionAudio) {
        this.explosionAudio.currentTime = 0;
        const p = this.explosionAudio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    } catch (e) {}
  }

  // Play weapon aim toggle sound
  playWeaponToggle(aiming) {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (aiming) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    } else {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
    }

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (aiming ? 0.2 : 0.16));

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Play sound/laser.mp3 loud and clear on loop
  startLaserHum() {
    if (!this.enabled || this.isLaserPlaying) return;
    this.init();
    this.isLaserPlaying = true;

    try {
      if (this.laserAudio) {
        this.laserAudio.currentTime = 0.02;
        this.laserAudio.volume = 0.425;
        const p = this.laserAudio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      }
    } catch (e) {}
  }

  stopLaserHum() {
    if (!this.isLaserPlaying) return;
    this.isLaserPlaying = false;

    try {
      if (this.laserAudio) {
        this.laserAudio.pause();
        this.laserAudio.currentTime = 0.02;
      }
    } catch (e) {}
  }

  // Legacy Mirror rotate hook (now handled cleanly by startMirrorMovement / mirror.mp3)
  playMirrorRotate() {
    // No-op to avoid double-playing over sound/mirror.mp3
  }

  // Laser hitting mirror bounce sound
  playLaserBounce() {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // UFO takes laser damage: plays sound/damage.mp3
  playUfoHit() {
    if (!this.enabled) return;
    try {
      if (this.damageAudio) {
        // Clone node or reset time to allow rapid overlapping/continuous sizzle hits
        const sound = this.damageAudio.cloneNode();
        sound.volume = 0.7;
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {});
        }
      }
    } catch (e) {}
  }

  // Player Jump sound
  playJump() {
    if (!this.enabled) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Victory fanfare
  playVictory() {
    if (!this.enabled) return;
    this.init();

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const now = this.ctx.currentTime + index * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.38);
    });
  }
}

window.soundFX = new SoundFX();
