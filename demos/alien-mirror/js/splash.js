/**
 * Splash Guide & Interactive Reflection Mini-Lab
 * Controls the 3-step kid-friendly science walkthrough and the live SVG mirror lab.
 */
class SplashGuide {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.wasHit = false;
    this.holdIntervalId = null;

    this.pivotX = 215;
    this.pivotY = 200;
    this.ufoX = 265;
    this.ufoY = 62;
    this.ufoHitRadius = 28;
    this.arcRadius = 34;

    this.cacheDOMElements();
    this.setupEventListeners();
    this.goToStep(1, { skipFocus: true });
    this.updateReflectionDemo(false);
  }

  cacheDOMElements() {
    this.stepPanels = [
      document.getElementById('splash-step-1'),
      document.getElementById('splash-step-2'),
      document.getElementById('splash-step-3')
    ];
    this.stepPills = Array.from(document.querySelectorAll('.splash-stepper .step-pill'));

    this.btnStep1Skip = document.getElementById('btn-step1-skip');
    this.btnStep1Next = document.getElementById('btn-step1-next');
    this.btnStep2Back = document.getElementById('btn-step2-back');
    this.btnStep2Next = document.getElementById('btn-step2-next');
    this.btnStep3Back = document.getElementById('btn-step3-back');
    this.playerNameInput = document.getElementById('player-name-input');

    // Interactive Step 2 Lab Elements
    this.mirrorSlider = document.getElementById('demo-mirror-slider');
    this.btnTurnLeft = document.getElementById('demo-turn-left');
    this.btnTurnRight = document.getElementById('demo-turn-right');
    this.mirrorGroup = document.getElementById('demo-mirror-group');
    this.normalLine = document.getElementById('demo-normal-line');
    this.arcIn = document.getElementById('demo-arc-in');
    this.arcOut = document.getElementById('demo-arc-out');
    this.beamAura = document.getElementById('demo-reflected-aura');
    this.beamMid = document.getElementById('demo-reflected-mid');
    this.beamCore = document.getElementById('demo-reflected-core');
    this.ufoGroup = document.getElementById('demo-ufo-group');
    this.ufoHitSpark = document.getElementById('demo-ufo-hit-spark');
    this.statusPill = document.getElementById('demo-status-pill');
  }

  setupEventListeners() {
    this.stepPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const targetStep = parseInt(pill.getAttribute('data-step'), 10);
        if (!Number.isNaN(targetStep)) {
          this.goToStep(targetStep);
        }
      });
    });

    if (this.btnStep1Skip) {
      this.btnStep1Skip.addEventListener('click', () => this.goToStep(3));
    }
    if (this.btnStep1Next) {
      this.btnStep1Next.addEventListener('click', () => this.goToStep(2));
    }
    if (this.btnStep2Back) {
      this.btnStep2Back.addEventListener('click', () => this.goToStep(1));
    }
    if (this.btnStep2Next) {
      this.btnStep2Next.addEventListener('click', () => this.goToStep(3));
    }
    if (this.btnStep3Back) {
      this.btnStep3Back.addEventListener('click', () => this.goToStep(2));
    }

    if (this.mirrorSlider) {
      this.mirrorSlider.addEventListener('input', () => {
        this.updateReflectionDemo(true);
      });
    }

    this.bindHoldButton(this.btnTurnLeft, -3);
    this.bindHoldButton(this.btnTurnRight, 3);
  }

  bindHoldButton(button, deltaDegrees) {
    if (!button) return;

    const stopHold = () => {
      if (this.holdIntervalId !== null) {
        clearInterval(this.holdIntervalId);
        this.holdIntervalId = null;
      }
    };

    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      stopHold();
      this.nudgeSlider(deltaDegrees);
      this.holdIntervalId = setInterval(() => {
        this.nudgeSlider(deltaDegrees);
      }, 60);
    });

    button.addEventListener('pointerup', stopHold);
    button.addEventListener('pointercancel', stopHold);
    button.addEventListener('pointerleave', stopHold);

    // Support keyboard activation (Enter/Space) without double-firing on mouse clicks
    button.addEventListener('click', (e) => {
      if (e.detail === 0) {
        this.nudgeSlider(deltaDegrees);
      }
    });
  }

  nudgeSlider(deltaDegrees) {
    if (!this.mirrorSlider) return;
    const min = parseFloat(this.mirrorSlider.min) || 22;
    const max = parseFloat(this.mirrorSlider.max) || 74;
    const current = parseFloat(this.mirrorSlider.value) || 34;
    const next = Math.max(min, Math.min(max, current + deltaDegrees));
    if (next !== current) {
      this.mirrorSlider.value = String(next);
      this.updateReflectionDemo(true);
    }
  }

  goToStep(step, { skipFocus = false } = {}) {
    const clamped = Math.max(1, Math.min(this.totalSteps, step));
    this.currentStep = clamped;

    this.stepPanels.forEach((panel, idx) => {
      if (!panel) return;
      panel.classList.toggle('hidden', idx + 1 !== clamped);
    });

    this.stepPills.forEach((pill) => {
      const pillStep = parseInt(pill.getAttribute('data-step'), 10);
      pill.classList.toggle('is-active', pillStep === clamped);
      pill.classList.toggle('is-completed', pillStep < clamped);
    });

    const splashBody = document.querySelector('.splash-body');
    if (splashBody) {
      splashBody.scrollTop = 0;
    }

    if (clamped === 3 && !skipFocus) {
      this.focusNameInput();
    }
  }

  focusNameInput() {
    if (!this.playerNameInput) return;
    setTimeout(() => {
      if (this.currentStep === 3 && this.playerNameInput) {
        this.playerNameInput.focus();
        this.playerNameInput.select();
      }
    }, 50);
  }

  resetDemo() {
    this.wasHit = false;
    if (this.mirrorSlider) {
      this.mirrorSlider.value = '34';
    }
    this.updateReflectionDemo(false);
  }

  updateReflectionDemo(fromUser = false) {
    if (!this.mirrorSlider) return;

    const alpha = parseFloat(this.mirrorSlider.value) || 34;
    const rad = (alpha * Math.PI) / 180;

    // Mirror normal pointing out of the reflective surface
    const nx = -Math.cos(rad);
    const ny = -Math.sin(rad);

    if (this.mirrorGroup) {
      this.mirrorGroup.setAttribute(
        'transform',
        `translate(${this.pivotX}, ${this.pivotY}) rotate(${alpha - 90})`
      );
    }

    if (this.normalLine) {
      this.normalLine.setAttribute('x2', (this.pivotX + nx * 64).toFixed(1));
      this.normalLine.setAttribute('y2', (this.pivotY + ny * 64).toFixed(1));
    }

    // Equal-angle arcs (incoming back-ray is along -x; reflected ray is at 2 * alpha)
    const r = this.arcRadius;
    const dx = -Math.cos(2 * rad);
    const dy = -Math.sin(2 * rad);

    const inX = this.pivotX - r;
    const inY = this.pivotY;
    const normX = this.pivotX + nx * r;
    const normY = this.pivotY + ny * r;
    const outX = this.pivotX + dx * r;
    const outY = this.pivotY + dy * r;

    if (this.arcIn) {
      this.arcIn.setAttribute(
        'd',
        `M ${this.pivotX} ${this.pivotY} L ${inX.toFixed(1)} ${inY.toFixed(1)} A ${r} ${r} 0 0 1 ${normX.toFixed(1)} ${normY.toFixed(1)} Z`
      );
    }
    if (this.arcOut) {
      this.arcOut.setAttribute(
        'd',
        `M ${this.pivotX} ${this.pivotY} L ${normX.toFixed(1)} ${normY.toFixed(1)} A ${r} ${r} 0 0 1 ${outX.toFixed(1)} ${outY.toFixed(1)} Z`
      );
    }

    // Ray-circle intersection check against the hovering Alien UFO
    const toUx = this.ufoX - this.pivotX;
    const toUy = this.ufoY - this.pivotY;
    const proj = toUx * dx + toUy * dy;
    const perpDist = Math.abs(toUx * -dy + toUy * dx);
    const isHit = proj > 0 && perpDist <= this.ufoHitRadius;

    let endX;
    let endY;
    if (isHit) {
      const tHit = Math.max(20, proj - 18);
      endX = this.pivotX + dx * tHit;
      endY = this.pivotY + dy * tHit;
    } else {
      const tMaxX = dx > 1e-6
        ? (448 - this.pivotX) / dx
        : (dx < -1e-6 ? (12 - this.pivotX) / dx : Infinity);
      const tMaxY = dy > 1e-6
        ? (258 - this.pivotY) / dy
        : (dy < -1e-6 ? (12 - this.pivotY) / dy : Infinity);
      const tWall = Math.max(10, Math.min(tMaxX, tMaxY));
      endX = this.pivotX + dx * tWall;
      endY = this.pivotY + dy * tWall;
    }

    [this.beamAura, this.beamMid, this.beamCore].forEach((beam) => {
      if (!beam) return;
      beam.setAttribute('x2', endX.toFixed(1));
      beam.setAttribute('y2', endY.toFixed(1));
    });

    if (this.ufoHitSpark) {
      this.ufoHitSpark.classList.toggle('hidden', !isHit);
      if (isHit) {
        this.ufoHitSpark.setAttribute(
          'transform',
          `translate(${endX.toFixed(1)}, ${endY.toFixed(1)})`
        );
      }
    }

    if (this.ufoGroup) {
      this.ufoGroup.classList.toggle('is-hit', isHit);
    }

    if (this.statusPill) {
      this.statusPill.classList.toggle('is-hit', isHit);
      this.statusPill.textContent = isHit
        ? '🎯 BULLSEYE! Light bounced straight to the UFO!'
        : 'Turn the mirror to bounce the laser into the UFO!';
    }

    if (fromUser && isHit && !this.wasHit) {
      if (window.soundFX && window.soundFX.playLaserBounce) {
        window.soundFX.playLaserBounce();
      }
    }
    this.wasHit = isHit;
  }
}

window.SplashGuide = SplashGuide;
