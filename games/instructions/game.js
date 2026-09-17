/**
 * Blind Rover: Minimalist Grade 2 Classroom Grid Defusal Game
 * Logic, Strict Non-Touching Route Generator, Dual Timer Modes, and Audio Engine.
 */

(function () {
  'use strict';

  // --- Constants ---
  const GRID_SIZE = 6;
  const HOLD_DURATION_MS = 3000; // 3 seconds continuous hold

  const DIRECTIONS = {
    UP: { r: -1, c: 0, name: 'UP', arrow: '⬆️', alt: 'W', keys: ['ArrowUp', 'w', 'W'] },
    DOWN: { r: 1, c: 0, name: 'DOWN', arrow: '⬇️', alt: 'S', keys: ['ArrowDown', 's', 'S'] },
    LEFT: { r: 0, c: -1, name: 'LEFT', arrow: '⬅️', alt: 'A', keys: ['ArrowLeft', 'a', 'A'] },
    RIGHT: { r: 0, c: 1, name: 'RIGHT', arrow: '➡️', alt: 'D', keys: ['ArrowRight', 'd', 'D'] }
  };

  // --- Game Settings ---
  const settings = {
    timerMode: 'score', // 'countdown' | 'countup' | 'score'
    duration: 60, // seconds
    lives: 3, // default 3 lives
    spellingLocks: 1, // 0 to 3
    holdLocks: 1, // 0 to 3
    music: true,
    volume: 0.85,
    muted: false
  };

  const COLOR_WORDS = [
    { word: 'RED', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.85)' },
    { word: 'BLUE', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.85)' },
    { word: 'PINK', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.85)' },
    { word: 'GREEN', color: '#10b981', glow: 'rgba(16, 185, 129, 0.85)' },
    { word: 'GOLD', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.85)' },
    { word: 'CYAN', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.85)' },
    { word: 'WHITE', color: '#f8fafc', glow: 'rgba(255, 255, 255, 0.85)' },
    { word: 'BLACK', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.85)' },
    { word: 'ORANGE', color: '#f97316', glow: 'rgba(249, 115, 22, 0.85)' },
    { word: 'PURPLE', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.85)' },
    { word: 'BROWN', color: '#a16207', glow: 'rgba(161, 98, 7, 0.85)' },
    { word: 'YELLOW', color: '#eab308', glow: 'rgba(234, 179, 8, 0.85)' }
  ];

  // --- Game State ---
  let gameState = 'SPLASH'; // 'SPLASH' | 'PLAYING' | 'HOLDING' | 'SPELLING' | 'WON' | 'LOST'
  let safePath = []; // Array of { r, c }
  let safePathSet = new Set(); // Set of 'r,c'
  let defusalTiles = new Map(); // 'r,c' -> { type, dirKey, colorObj, defused, index }
  let roverIndex = 0;
  let roverCoord = { r: 0, c: 0 };
  let currentHoldTile = null;
  let currentLives = 3;

  // Hold Defusal State
  let isKeyDepressed = false;
  let holdStartTime = null;
  let holdAnimFrame = null;
  let activeHoldDirection = null;
  let keysCurrentlyDown = new Set();

  // Spelling Lock State & Typing Time Tracking
  let currentSpellingWord = '';
  let currentTypedIndex = 0;
  let spellingStartTime = null;
  let totalTypingTimeSec = 0;
  let totalSpellingChallengesCompleted = 0;

  // Timer & Round Duration State
  let timerCurrent = 60.0;
  let timerInterval = null;
  let lastTimerTick = null;
  let roundElapsedSec = 0;
  let scoreRackingAnimId = null;

  // --- DOM Elements ---
  const gridBoard = document.getElementById('grid-board');
  const timerDisplay = document.getElementById('timer-display');
  const timerContainer = document.getElementById('timer-container');
  const livesContainer = document.getElementById('lives-container');

  // Modals & Overlays
  const splashModal = document.getElementById('splash-modal');
  const btnStartMission = document.getElementById('btn-start-mission');
  const defusalBackdrop = document.getElementById('defusal-backdrop');

  // Arrow Hold Elements
  const holdChallengeView = document.getElementById('hold-challenge-view');
  const targetKeyBadge = document.getElementById('target-key-badge');
  const targetKeyArrow = document.getElementById('target-key-arrow');
  const targetKeyName = document.getElementById('target-key-name');
  const targetKeyAlt = document.getElementById('target-key-alt');
  const holdProgressFill = document.getElementById('hold-progress-fill');
  const holdTimeText = document.getElementById('hold-time-text');

  // Spelling Challenge Elements
  const spellingChallengeView = document.getElementById('spelling-challenge-view');
  const spellingTitle = document.getElementById('spelling-title');
  const spellingBoxesContainer = document.getElementById('spelling-boxes-container');

  const overlayFail = document.getElementById('overlay-fail');
  const failReasonText = document.getElementById('fail-reason-text');
  const btnRetryFail = document.getElementById('btn-retry-fail');

  const overlayVictory = document.getElementById('overlay-victory');
  const victorySubtitleText = document.getElementById('victory-subtitle-text');
  const btnNextVictory = document.getElementById('btn-next-victory');

  // Score Mode Tally DOM Elements
  const scoreTallyWrap = document.getElementById('score-tally-wrap');
  const tallyTotalScore = document.getElementById('tally-total-score');
  const tallySpeedPts = document.getElementById('tally-speed-pts');
  const tallyTypingPts = document.getElementById('tally-typing-pts');
  const tallyLivesPts = document.getElementById('tally-lives-pts');

  // Controls & Drawer
  const btnReset = document.getElementById('btn-reset');
  const btnSettings = document.getElementById('btn-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const settingsDrawer = document.getElementById('settings-drawer');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  // Settings Elements
  const modeCountdownBtn = document.getElementById('mode-countdown');
  const modeCountupBtn = document.getElementById('mode-countup');
  const modeScoreBtn = document.getElementById('mode-score');
  const settingLives = document.getElementById('setting-lives');
  const settingSpellingCount = document.getElementById('setting-spelling-count');
  const settingHoldCount = document.getElementById('setting-hold-count');
  const musicOnBtn = document.getElementById('music-on');
  const musicOffBtn = document.getElementById('music-off');
  const settingDuration = document.getElementById('setting-duration');
  const settingVolume = document.getElementById('setting-volume');

  // =========================================================================
  // AUDIO CONTROLLER (CORS-Free Web Audio + HTML5 Audio)
  // =========================================================================
  let audioCtx = null;
  let holdDroneOsc = null;
  let holdDroneGain = null;
  let tickTimerId = null;

  const audioFiles = {
    step: new Audio('sound/step.mp3'),
    explosion: new Audio('sound/explosion.mp3'),
    fanfare: new Audio('sound/fanfare.mp3'),
    ticking: new Audio('sound/ticking.mp3'),
    unlock: new Audio('sound/unlock.mp3'),
    background: new Audio('sound/background.mp3')
  };

  audioFiles.ticking.loop = true;
  audioFiles.background.loop = true;

  function setAudioVolumes() {
    audioFiles.step.volume = Math.min(1.0, settings.volume);
    audioFiles.explosion.volume = Math.min(1.0, settings.volume);
    audioFiles.fanfare.volume = Math.min(1.0, settings.volume);
    audioFiles.unlock.volume = Math.min(1.0, settings.volume);
    // Ticking audio element set to maximum volume
    audioFiles.ticking.volume = Math.min(1.0, settings.volume);
    // Soft, pleasant background music volume (around 35% of master volume)
    audioFiles.background.volume = Math.min(1.0, settings.volume * 0.35);
  }

  function updateMusicPlayback() {
    if (settings.muted || !settings.music || gameState === 'LOST' || gameState === 'WON') {
      audioFiles.background.pause();
    } else {
      audioFiles.background.play().catch(() => {});
    }
  }

  setAudioVolumes();

  function initAudioContext() {
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) audioCtx = new AudioCtxClass();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  function playSound(type) {
    if (settings.muted) return;
    initAudioContext();
    setAudioVolumes();

    const aud = audioFiles[type];
    if (aud) {
      if (type === 'step') {
        const clone = aud.cloneNode();
        clone.volume = Math.min(1.0, settings.volume);
        clone.play().catch(() => playSynthStep());
        return;
      }
      aud.currentTime = 0;
      aud.play().catch(() => {
        if (type === 'explosion') playSynthExplosion();
        else if (type === 'fanfare') playSynthFanfare();
        else if (type === 'unlock') playSynthUnlock();
      });
    } else {
      if (type === 'step') playSynthStep();
      else if (type === 'explosion') playSynthExplosion();
      else if (type === 'fanfare') playSynthFanfare();
      else if (type === 'unlock') playSynthUnlock();
    }
  }

  // Pure Web Audio synthesized loud, sharp mechanical clock tick (Zero CORS, 100% reliable)
  function playClockTickSound(isHighTick) {
    if (!audioCtx || settings.muted) return;
    try {
      const t = audioCtx.currentTime;
      // High-pitched woodblock/escapement click
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isHighTick ? 2400 : 1800, t);
      filter.Q.setValueAtTime(3.0, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isHighTick ? 1200 : 900, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.04);

      // Extra loud, punchy volume
      const tickVol = Math.min(1.0, settings.volume * 0.95);
      gain.gain.setValueAtTime(tickVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.05);

      // Add a crisp noise click transient
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.02);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(tickVol * 0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      noise.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(t);
      noise.stop(t + 0.025);
    } catch (e) {}
  }

  // Pure Web Audio crisp mechanical score racking click (Rapid, punchy digital/escapement click)
  function playScoreClickSound(pitchFactor = 1.0) {
    if (!audioCtx || settings.muted) return;
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000 * pitchFactor, t);
      filter.Q.setValueAtTime(4.0, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 * pitchFactor, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.025);

      const clickVol = Math.min(0.85, settings.volume * 0.75);
      gain.gain.setValueAtTime(clickVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch (e) {}
  }

  function startHoldAudio() {
    if (settings.muted) return;
    initAudioContext();
    setAudioVolumes();

    // 1. Play HTML5 ticking audio element
    try {
      audioFiles.ticking.currentTime = 0;
      audioFiles.ticking.volume = Math.min(1.0, settings.volume);
      audioFiles.ticking.play().catch(() => {});
    } catch (e) {}

    // 2. Synthesized loud, crisp mechanical ticks at rapid urgency (~5 ticks per second)
    stopTickingInterval();
    let tickToggle = false;
    // Play immediate first tick
    playClockTickSound(tickToggle);
    tickTimerId = setInterval(() => {
      tickToggle = !tickToggle;
      playClockTickSound(tickToggle);
    }, 200);

    // 3. Ascending Drone (Soft, quiet background)
    if (audioCtx) {
      stopHoldDrone();
      try {
        holdDroneOsc = audioCtx.createOscillator();
        holdDroneGain = audioCtx.createGain();
        holdDroneOsc.type = 'sine'; // Soft, warm sine wave
        holdDroneOsc.frequency.setValueAtTime(220, audioCtx.currentTime);
        holdDroneOsc.frequency.exponentialRampToValueAtTime(650, audioCtx.currentTime + 3.0);
        holdDroneGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        holdDroneGain.gain.linearRampToValueAtTime(0.012 * settings.volume, audioCtx.currentTime + 0.3);
        holdDroneOsc.connect(holdDroneGain);
        holdDroneGain.connect(audioCtx.destination);
        holdDroneOsc.start();
      } catch (e) {}
    }
  }

  function stopTickingInterval() {
    if (tickTimerId) {
      clearInterval(tickTimerId);
      tickTimerId = null;
    }
  }

  function stopHoldAudio() {
    stopTickingInterval();
    try {
      audioFiles.ticking.pause();
      audioFiles.ticking.currentTime = 0;
    } catch (e) {}
    stopHoldDrone();
  }

  function stopHoldDrone() {
    if (holdDroneOsc) {
      try {
        holdDroneGain.gain.linearRampToValueAtTime(0.0005, audioCtx.currentTime + 0.05);
        holdDroneOsc.stop(audioCtx.currentTime + 0.06);
      } catch (e) {}
      holdDroneOsc = null;
      holdDroneGain = null;
    }
  }

  // Synthesized Fallbacks
  function playSynthStep() {
    if (!audioCtx || settings.muted) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15 * settings.volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  function playSynthExplosion() {
    if (!audioCtx || settings.muted) return;
    try {
      const bufferSize = audioCtx.sampleRate * 0.5;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.4 * settings.volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
      noise.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  }

  function playSynthFanfare() {
    if (!audioCtx || settings.muted) return;
    try {
      const arpeggio = [523.25, 659.25, 783.99, 1046.5];
      arpeggio.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = audioCtx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.25 * settings.volume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch (e) {}
  }

  function playSynthUnlock() {
    if (!audioCtx || settings.muted) return;
    try {
      const t = audioCtx.currentTime;
      const notes = [659.25, 880.0, 1318.5]; // E5 -> A5 -> E6 quick bright unlock chime
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.3 * settings.volume, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  }

  // =========================================================================
  // DIVERSE WINDING ROUTE GENERATION
  // =========================================================================
  /**
   * Generates exciting, winding safe routes with high vertical movement and turns.
   * Completely eliminates boring straight horizontal lines while strictly preserving
   * the non-touching invariant so players never die on green tiles.
   */
  function generateSafeRoute() {
    const patterns = ['snake', 'staircase', 'horseshoe', 'zigzag'];

    let attempts = 0;
    while (attempts < 800) {
      attempts++;
      const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
      const path = [];
      const visited = new Set();

      function add(r, c) {
        path.push({ r, c });
        visited.add(`${r},${c}`);
      }

      if (chosenPattern === 'snake') {
        // Multi-column vertical sweep (e.g. sweep col 0, cross to col 2, sweep col 2, cross to col 4, sweep col 4)
        const startBottom = Math.random() < 0.5;
        let r = startBottom ? (Math.floor(Math.random() * 2) + 4) : Math.floor(Math.random() * 2);
        let movingUp = startBottom;
        add(r, 0);

        // Sweep in Col 0
        const target0 = movingUp ? Math.floor(Math.random() * 2) : (Math.floor(Math.random() * 2) + 4);
        while (r !== target0) {
          r += movingUp ? -1 : 1;
          add(r, 0);
        }
        movingUp = !movingUp;

        // Cross col 1 to col 2
        add(r, 1);
        add(r, 2);

        // Sweep in Col 2
        const target2 = movingUp ? Math.floor(Math.random() * 2) : (Math.floor(Math.random() * 2) + 4);
        while (r !== target2) {
          r += movingUp ? -1 : 1;
          add(r, 2);
        }
        movingUp = !movingUp;

        // Cross col 3 to col 4
        add(r, 3);
        add(r, 4);

        // Sweep in Col 4
        const target4 = movingUp ? Math.floor(Math.random() * 2) : (Math.floor(Math.random() * 2) + 4);
        while (r !== target4) {
          r += movingUp ? -1 : 1;
          add(r, 4);
        }

        // Exit into Col 5
        add(r, 5);

      } else if (chosenPattern === 'staircase') {
        // Staircase with 2-step vertical climbs/drops between right steps
        const startBottom = Math.random() < 0.5;
        let r = startBottom ? (Math.floor(Math.random() * 2) + 4) : Math.floor(Math.random() * 2);
        let c = 0;
        add(r, c);

        while (c < 5) {
          const vSteps = Math.floor(Math.random() * 2) + 1;
          for (let s = 0; s < vSteps; s++) {
            const nextR = startBottom ? r - 1 : r + 1;
            if (nextR >= 0 && nextR < GRID_SIZE) {
              r = nextR;
              add(r, c);
            }
          }
          c++;
          add(r, c);
        }

      } else if (chosenPattern === 'horseshoe') {
        // High/low sweeping perimeter arc
        const startBottom = Math.random() < 0.5;
        let r = startBottom ? 4 : 1;
        let movingUp = startBottom;
        add(r, 0);

        const edgeR = movingUp ? 0 : 5;
        while (r !== edgeR) {
          r += movingUp ? -1 : 1;
          add(r, 0);
        }

        for (let col = 1; col <= 3; col++) {
          add(r, col);
        }

        const oppR = movingUp ? 4 : 1;
        while (r !== oppR) {
          r += movingUp ? 1 : -1;
          add(r, 3);
        }

        add(r, 4);
        add(r, 5);

      } else { // 'zigzag'
        // Winding 3-column S-curve
        const startBottom = Math.random() < 0.5;
        let r = startBottom ? 5 : 0;
        let movingUp = startBottom;
        add(r, 0);

        // Climb/drop to mid
        const midR = 2 + Math.floor(Math.random() * 2);
        while (r !== midR) {
          r += movingUp ? -1 : 1;
          add(r, 0);
        }

        add(r, 1);

        // Continue to opposite edge in col 1
        const oppR = movingUp ? 0 : 5;
        while (r !== oppR) {
          r += movingUp ? -1 : 1;
          add(r, 1);
        }

        add(r, 2);
        add(r, 3);

        // Turn back towards center in col 3
        const returnR = 2 + Math.floor(Math.random() * 2);
        while (r !== returnR) {
          r += movingUp ? 1 : -1;
          add(r, 3);
        }

        add(r, 4);
        add(r, 5);
      }

      // 1. Strict Non-Touching Validation
      let isValid = true;
      for (let i = 0; i < path.length; i++) {
        for (let j = i + 2; j < path.length; j++) {
          const dist = Math.abs(path[i].r - path[j].r) + Math.abs(path[i].c - path[j].c);
          if (dist <= 1) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;
      }

      // 2. Count vertical steps
      let verticalSteps = 0;
      for (let i = 1; i < path.length; i++) {
        if (path[i].r !== path[i - 1].r) verticalSteps++;
      }

      // Route must be winding: at least 10 tiles, and at least 5 vertical steps!
      if (isValid && path.length >= 10 && path.length <= 18 && verticalSteps >= 5) {
        return path;
      }
    }

    // Fallback stepped path
    const fallback = [];
    fallback.push({ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 });
    fallback.push({ r: 2, c: 1 }, { r: 2, c: 2 });
    fallback.push({ r: 3, c: 2 }, { r: 4, c: 2 });
    fallback.push({ r: 4, c: 3 }, { r: 4, c: 4 });
    fallback.push({ r: 3, c: 4 }, { r: 2, c: 4 });
    fallback.push({ r: 2, c: 5 });
    return fallback;
  }

  // =========================================================================
  // ROUND SETUP & RENDERING
  // =========================================================================
  function initRound(startTimerRunning = true) {
    stopTimer();
    stopHoldAudio();
    stopScoreRacking();
    if (holdAnimFrame) {
      cancelAnimationFrame(holdAnimFrame);
      holdAnimFrame = null;
    }
    isKeyDepressed = false;
    activeHoldDirection = null;
    keysCurrentlyDown.clear();

    overlayFail.classList.remove('active');
    overlayVictory.classList.remove('active');
    defusalBackdrop.classList.remove('active');
    document.body.classList.remove('shake-screen', 'flash-red');

    // 1. Generate winding path
    safePath = generateSafeRoute();
    safePathSet = new Set(safePath.map(p => `${p.r},${p.c}`));

    // 2. Place Defusal Challenges (arbitrary mixture of spelling and hold locks, well spaced)
    defusalTiles.clear();
    const directionKeys = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const N = safePath.length;

    // Build array of challenge types to place
    const challengesToPlace = [];
    for (let i = 0; i < settings.spellingLocks; i++) challengesToPlace.push('spelling');
    for (let i = 0; i < settings.holdLocks; i++) challengesToPlace.push('hold');

    // Shuffle the types so they can appear in mixed random order
    for (let i = challengesToPlace.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [challengesToPlace[i], challengesToPlace[j]] = [challengesToPlace[j], challengesToPlace[i]];
    }

    const totalChallenges = challengesToPlace.length;
    if (totalChallenges > 0) {
      // Usable path indices are between index 2 and N - 2
      const minStart = 2;
      const maxEnd = N - 2;
      const span = maxEnd - minStart;

      // Assign spaced indices
      const chosenIndices = [];
      const segmentSize = span / totalChallenges;
      for (let i = 0; i < totalChallenges; i++) {
        const segMin = Math.round(minStart + i * segmentSize);
        const segMax = Math.round(minStart + (i + 1) * segmentSize - 1);
        const randIdx = segMin + Math.floor(Math.random() * Math.max(1, segMax - segMin + 1));
        const clamped = Math.max(minStart, Math.min(maxEnd, randIdx));
        chosenIndices.push(clamped);
      }

      // Ensure strictly increasing indices with at least 1 tile separation
      for (let i = 1; i < chosenIndices.length; i++) {
        if (chosenIndices[i] <= chosenIndices[i - 1] + 1) {
          chosenIndices[i] = chosenIndices[i - 1] + 2;
        }
      }

      // Cap at safePath bounds
      for (let i = 0; i < totalChallenges; i++) {
        const idx = Math.min(N - 2, chosenIndices[i]);
        const type = challengesToPlace[i];
        const cell = safePath[idx];
        const coordKey = `${cell.r},${cell.c}`;

        if (!defusalTiles.has(coordKey)) {
          if (type === 'spelling') {
            const colorObj = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
            defusalTiles.set(coordKey, { type: 'spelling', colorObj, defused: false, index: idx });
          } else {
            const dirKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
            defusalTiles.set(coordKey, { type: 'hold', dirKey, defused: false, index: idx });
          }
        }
      }
    }

    // 3. Reset Rover & Lives
    roverIndex = 0;
    roverCoord = { ...safePath[0] };
    currentHoldTile = null;
    currentLives = Math.max(1, parseInt(settings.lives, 10) || 3);
    renderLives();

    // 4. Render Grid
    renderGrid();

    // 5. Reset Timer & Metrics
    roundElapsedSec = 0;
    totalTypingTimeSec = 0;
    totalSpellingChallengesCompleted = 0;
    spellingStartTime = null;

    if (settings.timerMode === 'countdown') {
      timerCurrent = parseFloat(settings.duration);
    } else {
      // Both 'countup' and 'score' modes count up elapsed time
      timerCurrent = 0.0;
    }
    updateTimerDisplay();
    timerContainer.classList.remove('warning', 'danger');

    if (startTimerRunning) {
      gameState = 'PLAYING';
      startTimer();
      updateMusicPlayback();
    } else {
      gameState = 'SPLASH';
    }
  }

  function renderGrid() {
    gridBoard.innerHTML = '';

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const coordKey = `${r},${c}`;
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tile-${r}-${c}`;

        if (safePathSet.has(coordKey)) {
          const pathIndex = safePath.findIndex(p => p.r === r && p.c === c);

          if (pathIndex === safePath.length - 1) {
            // GOAL TILE
            tile.classList.add('tile-goal');
            tile.innerHTML = `<span class="goal-icon">🏁</span>`;
          } else if (defusalTiles.has(coordKey)) {
            // LOCK CHALLENGE TILE (Arrow Hold or Spelling)
            const lockData = defusalTiles.get(coordKey);
            const icon = lockData.type === 'spelling' ? '🎨' : '🔒';
            tile.classList.add('tile-hold');
            tile.innerHTML = `<span class="hold-icon" id="icon-${r}-${c}">${icon}</span>`;
          } else if (pathIndex === 0) {
            // START TILE
            tile.classList.add('tile-safe', 'visited');
            tile.innerHTML = `<div class="safe-dot"></div>`;
          } else {
            // REGULAR SAFE TILE
            tile.classList.add('tile-safe');
            tile.innerHTML = `<div class="safe-dot"></div>`;
          }
        } else {
          // BOMB HAZARD (Clean skull icon, no text underneath)
          tile.classList.add('tile-bomb');
          tile.innerHTML = `<span class="hazard-icon">☠️</span>`;
        }

        gridBoard.appendChild(tile);
      }
    }

    // Rover Token
    const roverEl = document.createElement('div');
    roverEl.className = 'rover-token';
    roverEl.id = 'rover-avatar';
    roverEl.innerHTML = `<div class="rover-face">🤖</div>`;
    gridBoard.appendChild(roverEl);

    updateNextTileHighlight();
    updateRoverPosition(false);
  }

  function updateRoverPosition(animate = true) {
    const tile = document.getElementById(`tile-${roverCoord.r}-${roverCoord.c}`);
    const roverEl = document.getElementById('rover-avatar');
    if (!tile || !roverEl) return;

    const tileRect = tile.getBoundingClientRect();
    const boardRect = gridBoard.getBoundingClientRect();

    if (tileRect.width === 0 || boardRect.width === 0) {
      setTimeout(() => updateRoverPosition(animate), 50);
      return;
    }

    const roverSize = Math.round(tileRect.width * 0.76);
    roverEl.style.width = `${roverSize}px`;
    roverEl.style.height = `${roverSize}px`;

    const left = tileRect.left - boardRect.left + (tileRect.width - roverSize) / 2;
    const top = tileRect.top - boardRect.top + (tileRect.height - roverSize) / 2;

    roverEl.style.transition = animate ? 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none';
    roverEl.style.transform = `translate(${left}px, ${top}px)`;
  }

  function updateNextTileHighlight() {
    // Remove previous highlights
    document.querySelectorAll('.tile.next-step').forEach(t => t.classList.remove('next-step'));
    const nextIdx = roverIndex + 1;
    if (nextIdx < safePath.length) {
      const nextCell = safePath[nextIdx];
      const nextTile = document.getElementById(`tile-${nextCell.r}-${nextCell.c}`);
      if (nextTile) nextTile.classList.add('next-step');
    }
  }

  // =========================================================================
  // TIMER ENGINE (COUNTDOWN OR COUNT UP)
  // =========================================================================
  function startTimer() {
    stopTimer();
    lastTimerTick = performance.now();

    timerInterval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTimerTick) / 1000;
      lastTimerTick = now;
      roundElapsedSec += delta;

      if (settings.timerMode === 'countdown') {
        timerCurrent = Math.max(0, timerCurrent - delta);
        updateTimerDisplay();

        if (timerCurrent <= 5.0) {
          timerContainer.classList.remove('warning');
          timerContainer.classList.add('danger');
        } else if (timerCurrent <= 15.0) {
          timerContainer.classList.add('warning');
        }

        if (timerCurrent <= 0) {
          stopTimer();
          failRound('Time ran out!');
        }
      } else if (settings.timerMode === 'score') {
        // Score Mode: counts up elapsed seconds smoothly, no artificial timeout
        timerCurrent += delta;
        updateTimerDisplay();
      } else {
        // Count Up Mode
        timerCurrent += delta;
        updateTimerDisplay();

        const limit = parseFloat(settings.duration);
        if (timerCurrent >= limit) {
          stopTimer();
          failRound('Time limit reached!');
        }
      }
    }, 50);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    timerDisplay.textContent = timerCurrent.toFixed(1);
  }

  // =========================================================================
  // MOVEMENT CONTROLLER
  // =========================================================================
  function handleMove(directionKey) {
    if (gameState !== 'PLAYING') return;

    const dir = DIRECTIONS[directionKey];
    if (!dir) return;

    const newR = roverCoord.r + dir.r;
    const newC = roverCoord.c + dir.c;

    // 1. Boundary check: Off the board
    if (newR < 0 || newR >= GRID_SIZE || newC < 0 || newC >= GRID_SIZE) {
      playSynthStep();
      const currentTile = document.getElementById(`tile-${roverCoord.r}-${roverCoord.c}`);
      if (currentTile) {
        currentTile.style.transform = 'scale(0.9)';
        setTimeout(() => { currentTile.style.transform = ''; }, 120);
      }
      return;
    }

    const nextSafe = roverIndex + 1 < safePath.length ? safePath[roverIndex + 1] : null;

    // 2. Forward Safe Step
    if (nextSafe && nextSafe.r === newR && nextSafe.c === newC) {
      roverIndex++;
      roverCoord = { r: newR, c: newC };
      playSound('step');

      const tile = document.getElementById(`tile-${newR}-${newC}`);
      if (tile) tile.classList.add('visited');

      updateRoverPosition(true);
      updateNextTileHighlight();

      // Check Lock Tile (Hold or Spelling)
      const coordKey = `${newR},${newC}`;
      if (defusalTiles.has(coordKey)) {
        const lockData = defusalTiles.get(coordKey);
        if (!lockData.defused) {
          triggerLockChallenge(coordKey, lockData);
          return;
        }
      }

      // Check Goal Reached
      if (roverIndex === safePath.length - 1) {
        winRound();
        return;
      }
      return;
    }

    // 3. Backwards Step on Safe Path
    const prevSafe = roverIndex > 0 ? safePath[roverIndex - 1] : null;
    if (prevSafe && prevSafe.r === newR && prevSafe.c === newC) {
      roverIndex--;
      roverCoord = { r: newR, c: newC };
      playSound('step');
      updateRoverPosition(true);
      updateNextTileHighlight();
      return;
    }

    // 4. Any other cell is an armed bomb!
    const bombTile = document.getElementById(`tile-${newR}-${newC}`);
    if (bombTile) {
      bombTile.style.transform = 'scale(1.2)';
      setTimeout(() => { if (bombTile) bombTile.style.transform = ''; }, 300);
    }
    loseLife('Stepped on a bomb!');
  }

  // =========================================================================
  // LOCK DEFUSAL ENGINES (ARROW HOLD & SPELLING LOCK)
  // =========================================================================
  function triggerLockChallenge(coordKey, lockData) {
    currentHoldTile = { coordKey, lockData };

    if (lockData.type === 'spelling') {
      gameState = 'SPELLING';
      if (holdChallengeView) holdChallengeView.style.display = 'none';
      if (spellingChallengeView) spellingChallengeView.style.display = 'block';

      currentSpellingWord = lockData.colorObj.word;
      currentTypedIndex = 0;
      spellingStartTime = performance.now();

      if (spellingTitle) spellingTitle.textContent = `SPELL "${currentSpellingWord}"!`;
      if (spellingBoxesContainer) {
        spellingBoxesContainer.innerHTML = '';
        for (let i = 0; i < currentSpellingWord.length; i++) {
          const box = document.createElement('div');
          box.className = 'letter-box' + (i === 0 ? ' active-letter' : '');
          box.id = `spell-box-${i}`;
          box.textContent = currentSpellingWord[i];
          box.style.setProperty('--letter-color', lockData.colorObj.color);
          box.style.setProperty('--letter-glow', lockData.colorObj.glow);
          spellingBoxesContainer.appendChild(box);
        }
      }

      defusalBackdrop.classList.add('active');
    } else {
      gameState = 'HOLDING';
      if (spellingChallengeView) spellingChallengeView.style.display = 'none';
      if (holdChallengeView) holdChallengeView.style.display = 'block';
      triggerHoldChallenge(coordKey, lockData);
    }
  }

  function completeSpellingChallenge() {
    playSound('unlock');

    // Track time taken to spell the word
    if (spellingStartTime) {
      const elapsedTypingSec = (performance.now() - spellingStartTime) / 1000;
      totalTypingTimeSec += elapsedTypingSec;
      totalSpellingChallengesCompleted++;
      spellingStartTime = null;
    }

    if (currentHoldTile) {
      currentHoldTile.lockData.defused = true;
      const [r, c] = currentHoldTile.coordKey.split(',');
      const tile = document.getElementById(`tile-${r}-${c}`);
      if (tile) {
        tile.classList.add('defused');
        const icon = document.getElementById(`icon-${r}-${c}`);
        if (icon) icon.textContent = '✨';
      }
    }

    setTimeout(() => {
      defusalBackdrop.classList.remove('active');
      gameState = 'PLAYING';
    }, 450);
  }

  function triggerHoldChallenge(coordKey, holdData) {
    gameState = 'HOLDING';
    currentHoldTile = { coordKey, lockData: holdData };
    activeHoldDirection = holdData.dirKey;
    isKeyDepressed = false;
    holdStartTime = null;

    const dirInfo = DIRECTIONS[activeHoldDirection];

    targetKeyArrow.textContent = dirInfo.arrow;
    targetKeyName.textContent = dirInfo.name;
    targetKeyAlt.textContent = `or [${dirInfo.alt}]`;

    holdProgressFill.style.width = '0%';
    holdTimeText.textContent = 'HOLD FOR 3 SECONDS!';
    targetKeyBadge.classList.remove('pressed');

    defusalBackdrop.classList.add('active');
  }

  function startHoldingKey() {
    isKeyDepressed = true;
    holdStartTime = performance.now();
    targetKeyBadge.classList.add('pressed');
    holdTimeText.textContent = 'KEEP HOLDING...';

    startHoldAudio();

    function updateProgress() {
      if (!isKeyDepressed || gameState !== 'HOLDING') return;

      const elapsed = performance.now() - holdStartTime;
      const progress = Math.min(1.0, elapsed / HOLD_DURATION_MS);

      holdProgressFill.style.width = `${progress * 100}%`;
      const remain = Math.max(0, (HOLD_DURATION_MS - elapsed) / 1000);
      holdTimeText.textContent = `${remain.toFixed(1)}s`;

      if (elapsed >= HOLD_DURATION_MS) {
        completeHoldChallenge();
        return;
      }

      holdAnimFrame = requestAnimationFrame(updateProgress);
    }

    holdAnimFrame = requestAnimationFrame(updateProgress);
  }

  function cancelHoldingKeyEarly() {
    if (!isKeyDepressed) return;
    isKeyDepressed = false;
    stopHoldAudio();
    if (holdAnimFrame) {
      cancelAnimationFrame(holdAnimFrame);
      holdAnimFrame = null;
    }
    loseLife('Key released too early!', () => {
      // Still alive: reset hold progress and key badge so pilot can try holding again
      holdProgressFill.style.width = '0%';
      holdTimeText.textContent = 'HOLD FOR 3 SECONDS!';
      targetKeyBadge.classList.remove('pressed');
    });
  }

  function completeHoldChallenge() {
    isKeyDepressed = false;
    stopHoldAudio();
    if (holdAnimFrame) {
      cancelAnimationFrame(holdAnimFrame);
      holdAnimFrame = null;
    }

    playSound('unlock');

    if (currentHoldTile) {
      currentHoldTile.lockData.defused = true;
      const [r, c] = currentHoldTile.coordKey.split(',');
      const tile = document.getElementById(`tile-${r}-${c}`);
      if (tile) {
        tile.classList.add('defused');
        const icon = document.getElementById(`icon-${r}-${c}`);
        if (icon) icon.textContent = '🔓';
      }
    }

    defusalBackdrop.classList.remove('active');
    gameState = 'PLAYING';
  }

  // =========================================================================
  // LIVES ENGINE (HEARTS)
  // =========================================================================
  function renderLives() {
    if (!livesContainer) return;
    livesContainer.innerHTML = '';
    for (let i = 0; i < settings.lives; i++) {
      const heart = document.createElement('span');
      heart.className = 'life-heart' + (i >= currentLives ? ' lost' : '');
      heart.id = `life-heart-${i}`;
      heart.textContent = i < currentLives ? '❤️' : '🖤';
      livesContainer.appendChild(heart);
    }
  }

  function loseLife(reason, onHeartLostOnly) {
    currentLives = Math.max(0, currentLives - 1);

    // Visual heart break animation
    const heartIdx = currentLives; // The index of the heart just lost
    const heartEl = document.getElementById(`life-heart-${heartIdx}`);
    if (heartEl) {
      heartEl.classList.add('breaking');
      setTimeout(() => {
        heartEl.classList.remove('breaking');
        heartEl.classList.add('lost');
        heartEl.textContent = '🖤';
      }, 450);
    }

    // Screen shake and red flash for taking damage
    document.body.classList.add('shake-screen', 'flash-red');
    setTimeout(() => { document.body.classList.remove('flash-red'); }, 350);

    if (currentLives <= 0) {
      // All lives depleted: Game Over / Player is Dead
      failRound(`${reason} — All lives lost!`);
    } else {
      // Still has lives remaining: play explosion sound and execute damage response
      playSound('explosion');
      if (onHeartLostOnly) {
        onHeartLostOnly();
      }
    }
  }

  // =========================================================================
  // FAIL & VICTORY STATES
  // =========================================================================
  function failRound(reason) {
    gameState = 'LOST';
    stopTimer();
    stopHoldAudio();
    stopScoreRacking();
    updateMusicPlayback();
    if (holdAnimFrame) {
      cancelAnimationFrame(holdAnimFrame);
      holdAnimFrame = null;
    }

    playSound('explosion');

    document.body.classList.add('shake-screen', 'flash-red');
    setTimeout(() => { document.body.classList.remove('flash-red'); }, 350);

    defusalBackdrop.classList.remove('active');
    failReasonText.textContent = reason;
    overlayFail.classList.add('active');
  }

  function stopScoreRacking() {
    if (scoreRackingAnimId) {
      cancelAnimationFrame(scoreRackingAnimId);
      scoreRackingAnimId = null;
    }
  }

  function startScoreRackingAnimation(speedPts, typingPts, livesPts, grandTotalScore) {
    stopScoreRacking();

    if (!scoreTallyWrap || !tallyTotalScore) return;

    // Reset initial values to zero
    tallyTotalScore.textContent = '0';
    if (tallySpeedPts) tallySpeedPts.textContent = '+0';
    if (tallyTypingPts) tallyTypingPts.textContent = '+0';
    if (tallyLivesPts) tallyLivesPts.textContent = '+0';
    tallyTotalScore.classList.remove('score-bump');

    const duration = 1400; // 1.4s dynamic rack-up
    const startTime = performance.now();
    let lastClickTime = 0;

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      // Ease out cubic: rapid start, juicy decelerating finish
      const ease = 1 - Math.pow(1 - progress, 3);

      const curSpeed = Math.round(speedPts * ease);
      const curTyping = Math.round(typingPts * ease);
      const curLives = Math.round(livesPts * ease);
      const curTotal = Math.round(grandTotalScore * ease);

      tallyTotalScore.textContent = curTotal.toLocaleString();
      if (tallySpeedPts) tallySpeedPts.textContent = `+${curSpeed.toLocaleString()}`;
      if (tallyTypingPts) tallyTypingPts.textContent = `+${curTyping.toLocaleString()}`;
      if (tallyLivesPts) {
        tallyLivesPts.textContent = progress >= 1.0
          ? `+${curLives.toLocaleString()} (${currentLives} ❤️)`
          : `+${curLives.toLocaleString()}`;
      }

      // Play rapid mechanical counter click every ~38ms while racking
      if (progress < 1.0 && (now - lastClickTime >= 38)) {
        lastClickTime = now;
        const pitchFactor = 0.9 + 0.45 * progress;
        playScoreClickSound(pitchFactor);
      }

      if (progress < 1.0) {
        scoreRackingAnimId = requestAnimationFrame(frame);
      } else {
        scoreRackingAnimId = null;
        tallyTotalScore.textContent = grandTotalScore.toLocaleString();
        if (tallySpeedPts) tallySpeedPts.textContent = `+${speedPts.toLocaleString()}`;
        if (tallyTypingPts) tallyTypingPts.textContent = `+${typingPts.toLocaleString()}`;
        if (tallyLivesPts) tallyLivesPts.textContent = `+${livesPts.toLocaleString()} (${currentLives} ❤️)`;

        // Visual bounce bump & celebratory chime
        tallyTotalScore.classList.add('score-bump');
        setTimeout(() => tallyTotalScore.classList.remove('score-bump'), 260);
        playSynthUnlock();
      }
    }

    playScoreClickSound(0.9);
    lastClickTime = performance.now();
    scoreRackingAnimId = requestAnimationFrame(frame);
  }

  function winRound() {
    gameState = 'WON';
    stopTimer();
    stopHoldAudio();
    stopScoreRacking();
    updateMusicPlayback();

    playSound('fanfare');

    const timeTaken = settings.timerMode === 'countdown'
      ? (parseFloat(settings.duration) - timerCurrent).toFixed(1)
      : timerCurrent.toFixed(1);

    if (settings.timerMode === 'score') {
      // SCORE MODE: calculate rich score breakdown and show dynamic racking tally
      // 1. Speed: faster mission completion awards higher points (Max 3,000 base)
      const elapsedSec = Math.max(1, roundElapsedSec);
      const speedPts = Math.max(200, Math.round(3000 * Math.exp(-elapsedSec / 45)));

      // 2. Typing speed points: fast word completion awards bonus points (Up to 1,500 pts)
      let typingPts = 0;
      if (totalSpellingChallengesCompleted > 0) {
        const avgTypingTime = totalTypingTimeSec / totalSpellingChallengesCompleted;
        // 500 bonus per challenge, reduced if slower than 2 seconds
        const ptsPerChallenge = Math.max(100, Math.round(750 * Math.max(0.2, (8 - avgTypingTime) / 8)));
        typingPts = ptsPerChallenge * totalSpellingChallengesCompleted;
      } else {
        // If no spelling locks chosen, reward steady navigation bonus
        typingPts = 500;
      }

      // 3. Lives remaining contribution: each surviving heart adds +500 pts
      const livesPts = currentLives * 500;

      const grandTotalScore = speedPts + typingPts + livesPts;

      victorySubtitleText.textContent = `Completed in ${timeTaken}s!`;
      if (scoreTallyWrap) {
        scoreTallyWrap.style.display = 'block';
        startScoreRackingAnimation(speedPts, typingPts, livesPts, grandTotalScore);
      }
    } else {
      // Countdown or Countup standard modes
      if (scoreTallyWrap) scoreTallyWrap.style.display = 'none';
      victorySubtitleText.textContent = `Completed in ${timeTaken}s!`;
    }

    overlayVictory.classList.add('active');
  }

  // =========================================================================
  // KEYBOARD LISTENER
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (gameState === 'SPLASH' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      startGame();
      return;
    }

    // Quick restart key R (ignore if in SPELLING mode so letter 'R' can be typed)
    if ((e.key === 'r' || e.key === 'R') && gameState !== 'SPLASH' && gameState !== 'SPELLING') {
      e.preventDefault();
      initRound(true);
      return;
    }

    if (e.repeat) return;
    keysCurrentlyDown.add(e.key);

    if (gameState === 'PLAYING') {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleMove('UP');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleMove('DOWN');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleMove('LEFT');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleMove('RIGHT');
      }
      return;
    }

    // Spelling Lock Mode
    if (gameState === 'SPELLING') {
      e.preventDefault();
      const letter = e.key.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return;

      const targetLetter = currentSpellingWord[currentTypedIndex];
      if (letter === targetLetter) {
        const box = document.getElementById(`spell-box-${currentTypedIndex}`);
        if (box) {
          box.classList.add('lit');
          box.classList.remove('active-letter');
        }
        playSound('step');
        currentTypedIndex++;

        if (currentTypedIndex < currentSpellingWord.length) {
          const nextBox = document.getElementById(`spell-box-${currentTypedIndex}`);
          if (nextBox) nextBox.classList.add('active-letter');
        } else {
          completeSpellingChallenge();
        }
      } else {
        // Wrong letter pressed! Lose life, shake word, and reset typed letters
        if (spellingBoxesContainer) {
          spellingBoxesContainer.classList.add('shake-word');
          setTimeout(() => {
            spellingBoxesContainer.classList.remove('shake-word');
          }, 400);
        }

        currentTypedIndex = 0;
        for (let i = 0; i < currentSpellingWord.length; i++) {
          const b = document.getElementById(`spell-box-${i}`);
          if (b) {
            b.classList.remove('lit');
            b.classList.toggle('active-letter', i === 0);
          }
        }

        loseLife(`Misspelled ${currentSpellingWord}!`);
      }
      return;
    }

    if (gameState === 'HOLDING') {
      e.preventDefault();

      if (keysCurrentlyDown.size > 1 && isKeyDepressed) {
        cancelHoldingKeyEarly();
        loseLife('Pressed two keys at once!');
        return;
      }

      let pressedDir = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pressedDir = 'UP';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pressedDir = 'DOWN';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') pressedDir = 'LEFT';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressedDir = 'RIGHT';

      if (!pressedDir) {
        loseLife('Wrong key pressed during lock!');
        return;
      }

      if (pressedDir === activeHoldDirection) {
        if (!isKeyDepressed) startHoldingKey();
      } else {
        loseLife(`Wrong key! Expected [${activeHoldDirection}]!`);
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keysCurrentlyDown.delete(e.key);

    if (gameState === 'HOLDING') {
      let releasedDir = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') releasedDir = 'UP';
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') releasedDir = 'DOWN';
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') releasedDir = 'LEFT';
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') releasedDir = 'RIGHT';

      if (releasedDir === activeHoldDirection && isKeyDepressed) {
        cancelHoldingKeyEarly();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (gameState !== 'SPLASH') updateRoverPosition(false);
  });

  // =========================================================================
  // BUTTONS & SETTINGS HANDLERS
  // =========================================================================
  function startGame(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    initAudioContext();
    splashModal.classList.add('hidden');
    initRound(true);
  }

  if (btnStartMission) {
    btnStartMission.addEventListener('click', startGame);
  }

  btnReset.addEventListener('click', () => {
    initRound(true);
  });

  btnRetryFail.addEventListener('click', () => {
    initRound(true);
  });

  btnNextVictory.addEventListener('click', () => {
    initRound(true);
  });

  // Settings Drawer Toggle
  btnSettings.addEventListener('click', () => {
    settingsDrawer.classList.add('open');
    drawerBackdrop.classList.add('active');
  });

  function closeSettings() {
    settingsDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
  }

  btnCloseSettings.addEventListener('click', closeSettings);
  drawerBackdrop.addEventListener('click', closeSettings);

  // Sound Toggle
  btnSoundToggle.addEventListener('click', () => {
    settings.muted = !settings.muted;
    soundIcon.textContent = settings.muted ? '🔇' : '🔊';
    if (settings.muted) stopHoldAudio();
    updateMusicPlayback();
  });

  // Game Mode Toggle (Countdown vs Count Up vs Score Mode)
  function setGameMode(mode) {
    settings.timerMode = mode;
    modeCountdownBtn.classList.toggle('active', mode === 'countdown');
    modeCountupBtn.classList.toggle('active', mode === 'countup');
    if (modeScoreBtn) modeScoreBtn.classList.toggle('active', mode === 'score');
    initRound(gameState !== 'SPLASH');
  }

  modeCountdownBtn.addEventListener('click', () => setGameMode('countdown'));
  modeCountupBtn.addEventListener('click', () => setGameMode('countup'));
  if (modeScoreBtn) modeScoreBtn.addEventListener('click', () => setGameMode('score'));

  // Mixed Challenge Pickers
  if (settingSpellingCount) {
    settingSpellingCount.addEventListener('change', (e) => {
      settings.spellingLocks = parseInt(e.target.value, 10);
      initRound(gameState !== 'SPLASH');
    });
  }

  if (settingHoldCount) {
    settingHoldCount.addEventListener('change', (e) => {
      settings.holdLocks = parseInt(e.target.value, 10);
      initRound(gameState !== 'SPLASH');
    });
  }

  // Background Music Toggle
  if (musicOnBtn && musicOffBtn) {
    musicOnBtn.addEventListener('click', () => {
      settings.music = true;
      musicOnBtn.classList.add('active');
      musicOffBtn.classList.remove('active');
      initAudioContext();
      updateMusicPlayback();
    });

    musicOffBtn.addEventListener('click', () => {
      settings.music = false;
      musicOffBtn.classList.add('active');
      musicOnBtn.classList.remove('active');
      updateMusicPlayback();
    });
  }

  if (settingLives) {
    settingLives.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (!isNaN(val) && val >= 1 && val <= 9) {
        settings.lives = val;
        currentLives = val;
        renderLives();
      }
    });

    settingLives.addEventListener('change', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 9) val = 9;
      settingLives.value = val;
      settings.lives = val;
      initRound(gameState !== 'SPLASH');
    });
  }

  settingDuration.addEventListener('change', (e) => {
    settings.duration = parseInt(e.target.value, 10);
    initRound(gameState !== 'SPLASH');
  });

  settingVolume.addEventListener('input', (e) => {
    settings.volume = parseFloat(e.target.value);
    setAudioVolumes();
  });

  // Pre-render the grid board immediately behind the splash screen
  initRound(false);

})();
