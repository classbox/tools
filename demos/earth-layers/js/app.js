/* ==========================================================================
   Earth Layers Explorer – Interactive 3D Classroom Utility
   Grade 2 Science • Projector-Optimized
   True 2D Canvas Pan • Zero-Clip Exploded Peel • Sourced Audio Click
   ========================================================================== */

(async function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Three.js Loader
  // ---------------------------------------------------------------------------
  async function loadThree() {
    if (window.THREE) return window.THREE;
    try {
      const mod = await import('three');
      return mod;
    } catch (e) {
      try {
        const mod = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
        return mod;
      } catch (e2) {
        throw new Error('Three.js could not be loaded: ' + e2.message);
      }
    }
  }

  const THREE = await loadThree();
  const DATA = window.EARTH_DATA;
  if (!DATA) {
    console.error('EARTH_DATA not found. Make sure js/data.js is loaded.');
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Sourced Audio Click Player (Zero Synthesis, Completely Silent on Canvas)
  // ---------------------------------------------------------------------------
  const CLICK_WAV_BASE64 = "data:audio/wav;base64,UklGRjIMAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQ4MAACs5hdJa08MKzgbDmN3YahtQ1oLNn8LIgaTNhYDguIf/SXQc85D93kqTQwGNHov+wFGFKshghEw6rIW6BQ0HtXab/r670D+ohmURd4q8jZ4VCs0DS0rOLlFlDyYNKMOV/6dFXoA/PD2CZLimPck5PIH9/2dB1wVxhDCFFsyqCMNF6gKjRunIe0WgQseE8AMYw9FLR8t5yJxLQ0dEhmdHD0rFCBrECwL7vNO9z3wZ97O6JPqGO/a8tX11fsd+gsNShDmFokkeBViIm4dYBNEBVYJMQxFBOb/D/WT+kj6oPOg/sr75/6T8tfyT/IZ8xvwbeHo2m7YUNr43rHfrt4v677sc+82+0r9ZQTZCtAFiwujClQGOgKn+bztfefk4kXhfd1y21Hdx9wE4/jgEOOj5oTtZO5/6RXq1+hU6/HnE+qT7FzrkOqA77TzWfkD/Dv9QQHTBCADJwDIAQ36lvlF8wLuBemP5t3hn+JV3+3j6+OO6gju/vQR+Nf84ADpAZADcQVXA08DuQL7AtIBwQA3AXgCpAMHBNME8gUqCHEJ5AZeBuED5wJf/nH8GfqG+Xb4cPjq9yv6Wv8RA04G3Av2D28T7RbPGNgYcBknGDcVLxPMEMwNzwx+CikJkwgyCZQJ/AjUCicLeQxXDAUM3gsoCskJ+wjLBy4HTgjCCNkJwgsyDjMRphPjFU8X5hh9GW8YHBerFD0SRg+JC9kIZAUxA5kBvQCWACcB8wEaAyYFUgZJB7UI+AgJCSQJWQhQB84GDAbCBXcFgQUKBkYGxga7B8cH6QeVB6QGGAVRAwEBUf7B+yr5VPdt9bD0MPSi9JD1p/aM+Fn6N/zv/Rn/wP8DAAwATf8+/hb9o/tM+i75Dvh39wb39fbr9tH24Pbp9rT2G/Zj9aH0pfNx8mDxmfAw8AvwQ/Am8TPyx/Nk9QX30/g0+kn7Efw//Pj7XvtM+gP5nfcq9t70zPM28+PyzfI388fzfPRV9Sr28fZ999f3JvhP+Er4U/hn+LT4FPmu+Xj6ePuY/MD97P7h/50ADQEeAfgAYACR/5j+lf2Z/MH7GfvM+uH6RPv4+wr9PP59/9gAEAIhAwgEpAQSBT0FUQVABRsFBgUJBSMFUAWlBQUGdwbWBigHXAdqB0IH5AZuBtEFMQWcBB0EzQO0A9oDSATrBMgFygbbB+II1QmYCiELaQtuCzMLxQorCnsJxggaCH8HCQe6BpAGhAaRBqIGuwbKBsIGogZsBiMGxgVnBRAFyASaBI0EpgTjBD0FrAUkBpUG7QYjBy8HAQegBgwGTAVtBHwDiQKkAd0AOgDF/3r/X/9m/4r/vf/0/yQAQwBNAD0AGADc/5P/Q//4/rb+hP5k/lf+WP5k/nL+dv5t/kv+C/6u/TP9oPz5+077pvoN+o75NPn/+Pb4FflV+bH5HPqL+vX6TvuO+7L7t/uf+2/7Lvvk+pj6U/oa+vL53fnX+eD58fkF+hb6H/ob+gv67fnG+Zr5cflP+T35Qvlg+Zn57flY+tP6WPvd+1r8xvwb/VX9cf1y/Vn9Lv34/L/8i/xj/Ez8S/xg/In8xPwN/Vz9rf37/UH+ff6u/tX+9v4U/zP/WP+F/7//BQBXALEAEAFuAcUBEAJLAnECggJ+AmcCQgIVAucBvQGfAZEBlwGyAeEBIgJxAskCIwN6A8kDCwQ/BGQEegSEBIQEfwR6BHYEdwR+BIwEngSzBMgE2QTiBOEE1QS9BJoEbwQ+BAwE3gO3A5wDkAOSA6QDwwPsAxsESgR2BJgErQSzBKkEjgRlBDAE8wOyA3EDNAP+AtACqwKOAncCZQJTAkECKwIQAu8ByAGdAXABQgEYAfMA1gDCALcAswC3AL4AxQDJAMYAugCjAH8ATgATACUpCPos/zsihUNBKVVEVzgtLEY9mh3NFXv+0Bi8Av0YOxkkD1oMBwy64qLjCgP99Nr8RvRjCFoCiPmg81QBjQ/S/kz3/wICBPn5R/YW8Vvu4+mYDi7+f/wOE+sdNh3THfohayroOUE/Fj1JJtojEh/RHBwWgRClAOH5agES91zrmen05xDswulf9ePxBf5p98UK7A74DH4R7AgCCToMpgx0C5QPig5YCLUO0BE7DZsLOBQUEhkZshSrHPUXmB4RF9gZSxilG0cVTBVeDWQITgFk+6X6SPGh7tbxt+nE69nsnO/182HxFvd+/ED/NAPNBhgKtQwYD54OuA+gEOAN6QwoCtsIRAjCAwoCHf8tAbH/8/yI/2j+TP/F/jYAVf+P/8r9vPqD+en4nPQN9EvxGO6Y7q3rAuxt6lzrcO7e7n/y6fSn90L89P4CAegDGwUJB9sHqQd3BhYEMgJU/wH+UPp494n2h/P28VvweO/o7yjvk++q8Ojw1PH78Urz//Oo8+fzv/OL8+/zsfL48nnyN/Ir8lDzX/OP9Mb1EPiW+QL7cf0g/4kAMAH3AZQCcgK+AYYAMP80/ST7lPmM9071jvOI8pLxmPCX8Ozwy/Hz8j704/Wd9zL5F/tH/Kv9nP6c/+D/XgBFACsAJwAjAO//GgBFAF4A4QBXAfwB0QKQAzEErATnBBMFAAXVBDoEqQOnAp4BlgB+/4L+oP0G/Zf8kPzG/FH9LP4k/4wA/gF5AwwFdAbiBwcJCQrKCkwLgQtaCysLqgoXCmoJywgtCIUHEAeyBoUGcgZ7BpIGyAbtBiMHQQdbB0oHKAfxBpEGLga3BT8F0QRrBCkEAgQRBEwEpQQtBeAFsQaHB2sIOwkHCqQKHgtWC2MLQgvaCkcKlAm8CMcH0QbXBfcEIQRtA9oCcwI0Ag0CCAIcAkoCcgKpAtAC8gIGAwgD8QLTAqECZwImAu0BsQGGAWkBWQFjAXgBoAHUAQsCQQJzApMCowKaAm8CJQLAATgBkwDd/xX/Sf55/bf8Bvxt+/H6mvpj+lD6YvqO+tD6JvuE++b7QvyV/Nb8BP0b/R39Cv3m/LD8c/wy/PD7svt8+1L7M/sh+xn7G/si+yr7Mfsy+yr7FPvz+sL6hPo7+uv5lvlD+fX4sfh9+Fz4Ufhd+ID4uvgI+Wf50/lG+rv6LvuX+/T7Qfx8/KT8t/y4/Kj8i/xj/Db8CPzc+7f7mvuI+4L7ifuc+7n73vsJ/Df8ZvyS/Ln82/z2/Av9G/0m/S/9Of1H/Vr9df2b/cz9CP5R/qP+/v5e/7//IAB7AM4AFgFPAXkBkwGdAZgBhgFrAUgBIwH+AN0AwgCxAKwAsgDFAOQADgFAAXgBtAHyAS4CZgKaAscC7QIMAyUDOQNIA1UDYQNuA34DkAOmA8AD3QP9Ax4EPgRdBHcEjASaBKAEnQSRBHwEXwQ7BBME6AO9A5MDbgNPAzcDKAMiAyUDMgNGA2ADfwOgA8ED4AP7AxAEHgQjBCEEFwQFBO0D0AOvA4wDaQNHAycDCgPwAtoCxwK2AqYClwKHAnUCXwJHAioCCQLkAb0BkwFoAT4BFgHxANEAtgChAJIAiQCGAIgAjACTAJoAoACkAKMAngCSAIEAaQBMACkAAgDY/6z/gP9U/yr/A//g/sH+pv6Q/n3+bv5h/lb+TP5D/jn+Lv4h/hP+BP70/eP90v3C/bP9pv2c/ZX9kf2Q/ZP9mP2f/af9sP24/b/9w/3E/cH9u/2x/aP9kv1+/Wr9VP0//Sz9HP0P/Qb9Av0C/Qf9EP0d/Sz9Pv1R/WX9eP2L/Zv9qv23/cL9y/3T/dv94f3p/fD9+f0E/hD+Hf4s/jz+TP5d/m7+ff6M/pn+pP6t/rX+uv6+/sL+xP7I/sv+0f7Y/uL+7v79/hD/JP88/1X/b/+K/6b/wf/a//L/CQAcAC4APABJAFMAXABjAGkAcAB2AH0AhACNAJYAoQCsALgAxQDRAN4A6QD0AP4ABgENARMBGAEdASEBJAEpAS4BNAE7AUQBTgFZAWUBcgGAAY0BmgGlAa8BuAG+AcIBwwHDAcABvAG2AbABqQGhAZoBkwGOAYkBhQGCAYEBgAF/AX8BgAF/AX8BfgF8AXkBdgFxAWwBZwFhAVsBVQFPAUoBRQFAATwBOQE1ATIBLgEqASUBIAEZARIBCQH/APQA5wDaAMwAvgCwAKIAlACIAHwAcgBpAGEAWgBUAE8ASwBHAA==";

  class SoundPlayer {
    constructor() {
      this.enabled = true;
      this.audioPool = [];
      for (let i = 0; i < 4; i++) {
        const a = new Audio(CLICK_WAV_BASE64);
        a.volume = 0.6;
        this.audioPool.push(a);
      }
      this.poolIdx = 0;
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    // Play sourced real click (Only on buttons/quiz answers, NEVER on canvas dragging/rotating)
    play() {
      if (!this.enabled) return;
      try {
        const snd = this.audioPool[this.poolIdx];
        this.poolIdx = (this.poolIdx + 1) % this.audioPool.length;
        snd.currentTime = 0;
        snd.play().catch(() => {});
      } catch (e) {}
    }
  }

  const sound = new SoundPlayer();


  // ---------------------------------------------------------------------------
  // 4. Toast & Confetti
  // ---------------------------------------------------------------------------
  const toastEl = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  const confettiCanvas = document.getElementById('confetti');
  let confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
  let confettiParticles = [];
  let confettiActive = false;

  function resizeConfetti() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  function fireConfetti() {
    if (!confettiCtx) return;
    resizeConfetti();
    confettiParticles = [];
    const colors = ['#2563eb', '#38bdf8', '#f59e0b', '#ef4444', '#10b981', '#fbbf24', '#8b5cf6'];
    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: window.innerWidth * (0.35 + Math.random() * 0.3),
        y: window.innerHeight * 0.55,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 18 - 6,
        size: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 14,
        life: 1.0,
        decay: Math.random() * 0.012 + 0.008
      });
    }
    confettiActive = true;
  }

  function updateConfetti() {
    if (!confettiActive || !confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;
    for (const p of confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;
      p.rotation += p.vr;
      p.life -= p.decay;
      if (p.life > 0) {
        alive = true;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.fillStyle = p.color;
        confettiCtx.globalAlpha = Math.max(0, p.life);
        confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        confettiCtx.restore();
      }
    }
    if (!alive) {
      confettiActive = false;
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Procedural Noise Generator
  // ---------------------------------------------------------------------------
  class ValueNoise {
    constructor(seed = 12345) {
      this.p = new Uint8Array(512);
      const perm = new Uint8Array(256);
      for (let i = 0; i < 256; i++) perm[i] = i;
      let s = seed;
      for (let i = 255; i > 0; i--) {
        s = (s * 16807) % 2147483647;
        const j = s % (i + 1);
        const tmp = perm[i];
        perm[i] = perm[j];
        perm[j] = tmp;
      }
      for (let i = 0; i < 512; i++) {
        this.p[i] = perm[i & 255];
      }
    }

    noise2D(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = xf * xf * (3 - 2 * xf);
      const v = yf * yf * (3 - 2 * yf);
      const A = this.p[X] + Y;
      const B = this.p[X + 1] + Y;
      const g00 = this.p[A] / 255;
      const g10 = this.p[B] / 255;
      const g01 = this.p[A + 1] / 255;
      const g11 = this.p[B + 1] / 255;
      const nx0 = g00 + u * (g10 - g00);
      const nx1 = g01 + u * (g11 - g01);
      return nx0 + v * (nx1 - nx0);
    }

    fbm(x, y, octaves = 4) {
      let val = 0, amp = 0.5, freq = 1.0, max = 0;
      for (let i = 0; i < octaves; i++) {
        val += this.noise2D(x * freq, y * freq) * amp;
        max += amp;
        amp *= 0.5;
        freq *= 2.0;
      }
      return val / max;
    }
  }

  const noiseGen = new ValueNoise(88442);

  // ---------------------------------------------------------------------------
  // 6. High-Fidelity Geological & Radiant Textures
  // ---------------------------------------------------------------------------
  function createDetailedEarthTexture() {
    const W = 2048;
    const H = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const ocean = ctx.createLinearGradient(0, 0, 0, H);
    ocean.addColorStop(0, '#0f385c');
    ocean.addColorStop(0.18, '#134c7a');
    ocean.addColorStop(0.5, '#0b3254');
    ocean.addColorStop(0.82, '#134c7a');
    ocean.addColorStop(1, '#0f385c');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, W, H);

    function mapPoly(pts) {
      return pts.map(([lon, lat]) => [
        ((lon + 180) / 360) * W,
        ((90 - lat) / 180) * H
      ]);
    }

    const polys = [
      mapPoly([[-168,71],[-156,71],[-141,69],[-130,69],[-120,76],[-105,74],[-85,76],[-65,64],[-60,50],[-65,44],[-70,42],[-75,35],[-80,25],[-82,23],[-85,21],[-97,20],[-105,23],[-110,24],[-117,32],[-124,38],[-124,48],[-130,55],[-140,60],[-155,58],[-165,60],[-168,66]]),
      mapPoly([[-55,60],[-45,60],[-25,65],[-18,76],[-20,82],[-40,83],[-55,82],[-70,76],[-55,60]]),
      mapPoly([[-76,12],[-72,11],[-60,10],[-52,5],[-35,-5],[-35,-8],[-40,-20],[-50,-30],[-55,-38],[-65,-55],[-72,-54],[-75,-48],[-72,-35],[-77,-20],[-81,-5],[-80,8]]),
      mapPoly([[-10,36],[0,38],[10,36],[20,40],[30,42],[40,46],[50,55],[60,65],[70,68],[80,72],[90,75],[105,76],[120,77],[140,75],[160,70],[170,65],[180,65],[180,45],[170,40],[140,35],[120,32],[110,22],[100,15],[90,22],[80,15],[70,22],[60,25],[55,15],[45,12],[35,32],[30,30],[20,32],[10,37],[-5,36],[-10,42],[-10,50],[0,52],[5,58],[15,58],[25,70],[15,70],[-5,60],[-10,42]]),
      mapPoly([[-17,32],[0,36],[12,37],[25,32],[33,31],[35,25],[44,12],[51,12],[45,-15],[40,-20],[33,-34],[26,-34],[18,-34],[12,-20],[10,-5],[0,5],[-15,12],[-17,20]]),
      mapPoly([[114,-22],[122,-18],[130,-12],[136,-12],[142,-10],[146,-15],[152,-24],[153,-28],[150,-35],[144,-38],[138,-35],[132,-32],[124,-34],[115,-34],[113,-28]]),
      mapPoly([[-180,-70],[180,-70],[180,-90],[-180,-90]]),
      mapPoly([[130,32],[132,34],[137,35],[141,40],[145,44],[142,44],[135,36],[129,32]]),
      mapPoly([[-10,50],[2,50],[2,58],[-5,58],[-10,55]])
    ];

    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1b8ea8';
    polys.forEach(poly => {
      ctx.beginPath();
      poly.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.stroke();
    });

    polys.forEach((poly, idx) => {
      ctx.beginPath();
      poly.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();

      if (idx === 6) {
        ctx.fillStyle = '#f8fafc';
      } else {
        const aGrad = ctx.createLinearGradient(0, 300, 0, 700);
        aGrad.addColorStop(0, '#2d6a4f');
        aGrad.addColorStop(0.35, '#52b788');
        aGrad.addColorStop(0.65, '#b78b54');
        aGrad.addColorStop(1, '#8a6538');
        ctx.fillStyle = aGrad;
      }
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1b4332';
      ctx.stroke();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, W, H);
      tex.needsUpdate = true;
    };
    img.src = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

    return tex;
  }

  function createCrustStrataTexture() {
    const S = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');

    const cx = S / 2, cy = S / 2;
    const maxR = S / 2;

    for (let r = maxR; r > 0; r -= 1) {
      const frac = r / maxR;
      let color;
      if (frac > 0.992) color = '#2d6a4f';      // Surface soil / ocean
      else if (frac > 0.987) color = '#d4a373'; // Sedimentary rock
      else if (frac > 0.984) color = '#7f5539'; // Continental granite
      else color = '#2b2623';                   // Dense basalt lithosphere / Moho line
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }

  function createRadiantMantleTexture() {
    const S = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(S, S);
    const data = imgData.data;

    const cx = S / 2, cy = S / 2;
    const maxR = S / 2;

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy) / maxR;

        const n1 = noiseGen.fbm(x * 0.012, y * 0.012, 4);
        const n2 = noiseGen.fbm(x * 0.024 + 10, y * 0.024 + 10, 3);
        const turbulent = n1 * 0.7 + n2 * 0.3;

        const depthHeat = Math.max(0, Math.min(1, (1.0 - dist) * 1.5));
        const heat = Math.max(0, Math.min(1, depthHeat * 0.6 + turbulent * 0.65));

        let r, g, b;
        if (heat > 0.72) {
          const t = (heat - 0.72) / 0.28;
          r = 255;
          g = Math.floor(180 + t * 75);
          b = Math.floor(40 + t * 200);
        } else if (heat > 0.45) {
          const t = (heat - 0.45) / 0.27;
          r = Math.floor(220 + t * 35);
          g = Math.floor(55 + t * 125);
          b = Math.floor(10 + t * 30);
        } else if (heat > 0.25) {
          const t = (heat - 0.25) / 0.2;
          r = Math.floor(140 + t * 80);
          g = Math.floor(18 + t * 37);
          b = Math.floor(8 + t * 12);
        } else {
          const t = heat / 0.25;
          r = Math.floor(35 + t * 105);
          g = Math.floor(8 + t * 10);
          b = Math.floor(6 + t * 8);
        }

        const idx = (y * S + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createRadiantOuterCoreTexture() {
    const S = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(S, S);
    const data = imgData.data;

    const cx = S / 2, cy = S / 2;
    const maxR = S / 2;

    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy) / maxR;
        const angle = Math.atan2(dy, dx);

        const swirl = angle * 2.5 + dist * 6.0;
        const n = noiseGen.fbm(
          Math.cos(swirl) * 2.2 + x * 0.015,
          Math.sin(swirl) * 2.2 + y * 0.015,
          4
        );

        const heat = Math.max(0, Math.min(1, (1.0 - dist * 0.4) * 0.45 + n * 0.65));

        let r, g, b;
        if (heat > 0.7) {
          const t = (heat - 0.7) / 0.3;
          r = 255;
          g = Math.floor(225 + t * 30);
          b = Math.floor(110 + t * 145);
        } else if (heat > 0.4) {
          const t = (heat - 0.4) / 0.3;
          r = 255;
          g = Math.floor(155 + t * 70);
          b = Math.floor(15 + t * 95);
        } else {
          const t = heat / 0.4;
          r = Math.floor(215 + t * 40);
          g = Math.floor(95 + t * 60);
          b = Math.floor(10 + t * 15);
        }

        const idx = (y * S + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function createRadiantInnerCoreTexture() {
    const S = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#fffef0');
    grad.addColorStop(0.55, '#fef08a');
    grad.addColorStop(0.82, '#fde047');
    grad.addColorStop(1, '#eab308');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);

    const imgData = ctx.getImageData(0, 0, S, S);
    const data = imgData.data;
    for (let y = 0; y < S; y += 2) {
      for (let x = 0; x < S; x += 2) {
        const n = (noiseGen.noise2D(x * 0.08, y * 0.08) - 0.5) * 18;
        const idx = (y * S + x) * 4;
        data[idx] = Math.min(255, Math.max(0, data[idx] + n));
        data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + n));
        data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + n));
      }
    }
    ctx.putImageData(imgData, 0, 0);

    return new THREE.CanvasTexture(canvas);
  }

  // ---------------------------------------------------------------------------
  // 7. Three.js Scene Setup (High Contrast, Radiant Lighting)
  // ---------------------------------------------------------------------------
  const container = document.getElementById('scene');
  const width = window.innerWidth;
  const height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);

  // Master Earth Container: Holds all concentric layers
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.8);
  sunLight.position.set(10, 12, 10);
  scene.add(sunLight);

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
  rimLight.position.set(-10, -6, -8);
  scene.add(rimLight);

  // Core Point Lights (Radiates warmth from within)
  const corePointLight = new THREE.PointLight(0xff7700, 4.2, 25);
  corePointLight.position.set(0, 0, 0);
  scene.add(corePointLight);

  const innerCoreWhiteLight = new THREE.PointLight(0xfff5cc, 3.8, 16);
  innerCoreWhiteLight.position.set(0, 0, 0);
  scene.add(innerCoreWhiteLight);

  // Starfield
  const starGeo = new THREE.BufferGeometry();
  const starCount = 700;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const r = 30 + Math.random() * 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i + 2] = r * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.85 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ---------------------------------------------------------------------------
  // 8. 3D Cutaway Layers & ZERO-CLIP Exploded Lineup
  // ---------------------------------------------------------------------------
  const earthTex = createDetailedEarthTexture();
  const strataTex = createCrustStrataTexture();
  const mantleTex = createRadiantMantleTexture();
  const outerTex = createRadiantOuterCoreTexture();
  const innerTex = createRadiantInnerCoreTexture();

  function applyPlanarUVs(geometry) {
    const pos = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const u = (px / 5.0) * 0.5 + 0.5;
      const v = (py / 5.0) * 0.5 + 0.5;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }

  const CUT_PHI_START = Math.PI * 0.5;
  const CUT_PHI_LEN = Math.PI * 1.5;

  const layerMeshes = [];

  // Zero-Clip Exploded Positions (Guaranteed 2.0 unit clear gap between every layer!):
  // Layer 0 (Crust):      Radius 5.0  -> Center at -11.55 (spans -16.55 to -6.55)
  // Layer 1 (Mantle):     Radius 4.7  -> Center at  +0.15 (spans  -4.55 to +4.85)  [2.0 unit gap!]
  // Layer 2 (Outer Core): Radius 2.75 -> Center at  +9.60 (spans  +6.85 to +12.35) [2.0 unit gap!]
  // Layer 3 (Inner Core): Radius 1.1  -> Center at +15.45 (spans +14.35 to +16.55) [2.0 unit gap!]
  const peelPositions = [
    new THREE.Vector3(-11.55, 0, 0),
    new THREE.Vector3(0.15, 0, 0),
    new THREE.Vector3(9.60, 0, 0),
    new THREE.Vector3(15.45, 0, 0)
  ];

  DATA.layers.forEach((layerData, idx) => {
    const group = new THREE.Group();

    group.userData = {
      layerIndex: idx,
      layerId: layerData.id,
      name: layerData.name,
      basePos: new THREE.Vector3(0, 0, 0),
      explodedPos: peelPositions[idx]
    };

    const Rin = layerData.inner;
    const Rout = layerData.outer;

    // 1. Curved outer shell
    const outerGeo = new THREE.SphereGeometry(Rout, 64, 32, CUT_PHI_START, CUT_PHI_LEN, 0, Math.PI);
    let outerMat;

    if (idx === 0) {
      outerMat = new THREE.MeshStandardMaterial({
        map: earthTex,
        roughness: 0.65,
        metalness: 0.05
      });
    } else if (idx === 1) {
      outerMat = new THREE.MeshStandardMaterial({
        map: mantleTex,
        roughness: 0.4,
        emissive: new THREE.Color(0xd9480f),
        emissiveIntensity: 0.85
      });
    } else if (idx === 2) {
      outerMat = new THREE.MeshStandardMaterial({
        map: outerTex,
        roughness: 0.15,
        metalness: 0.9,
        emissive: new THREE.Color(0xf59f00),
        emissiveIntensity: 1.15
      });
    } else {
      outerMat = new THREE.MeshStandardMaterial({
        map: innerTex,
        roughness: 0.1,
        metalness: 0.85,
        emissive: new THREE.Color(0xfef08a),
        emissiveIntensity: 2.2
      });
    }

    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.userData.layerIndex = idx;
    group.add(outerMesh);

    // 2. Curved inner shell (visible when peeled)
    if (Rin > 0) {
      const innerGeo = new THREE.SphereGeometry(Rin, 48, 24, CUT_PHI_START, CUT_PHI_LEN, 0, Math.PI);
      const innerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(layerData.color).multiplyScalar(0.85),
        side: THREE.BackSide,
        roughness: 0.5,
        emissive: idx > 0 ? new THREE.Color(layerData.color).multiplyScalar(0.4) : new THREE.Color(0x000000)
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.userData.layerIndex = idx;
      group.add(innerMesh);
    }

    // 3. Flat Cut Faces with Planar UVs
    let cutFace1Geo, cutFace2Geo;
    if (Rin === 0) {
      cutFace1Geo = new THREE.CircleGeometry(Rout, 48, Math.PI * 0.5, Math.PI);
      cutFace2Geo = new THREE.CircleGeometry(Rout, 48, Math.PI * 0.5, Math.PI);
    } else {
      cutFace1Geo = new THREE.RingGeometry(Rin, Rout, 48, 2, Math.PI * 0.5, Math.PI);
      cutFace2Geo = new THREE.RingGeometry(Rin, Rout, 48, 2, Math.PI * 0.5, Math.PI);
    }

    applyPlanarUVs(cutFace1Geo);
    applyPlanarUVs(cutFace2Geo);

    let cutMat;
    if (idx === 0) {
      cutMat = new THREE.MeshStandardMaterial({
        map: strataTex,
        side: THREE.DoubleSide,
        roughness: 0.75
      });
    } else if (idx === 1) {
      cutMat = new THREE.MeshStandardMaterial({
        map: mantleTex,
        side: THREE.DoubleSide,
        roughness: 0.35,
        emissive: new THREE.Color(0xd9480f),
        emissiveIntensity: 0.85
      });
    } else if (idx === 2) {
      cutMat = new THREE.MeshStandardMaterial({
        map: outerTex,
        side: THREE.DoubleSide,
        roughness: 0.15,
        metalness: 0.9,
        emissive: new THREE.Color(0xf59f00),
        emissiveIntensity: 1.15
      });
    } else {
      cutMat = new THREE.MeshStandardMaterial({
        map: innerTex,
        side: THREE.DoubleSide,
        roughness: 0.1,
        metalness: 0.85,
        emissive: new THREE.Color(0xfef08a),
        emissiveIntensity: 2.2
      });
    }

    const cutMesh1 = new THREE.Mesh(cutFace1Geo, cutMat);
    cutMesh1.userData.layerIndex = idx;
    group.add(cutMesh1);

    const cutMesh2 = new THREE.Mesh(cutFace2Geo, cutMat);
    cutMesh2.rotation.y = Math.PI * 0.5;
    cutMesh2.userData.layerIndex = idx;
    group.add(cutMesh2);

    earthGroup.add(group);
    layerMeshes.push(group);
  });

  // ---------------------------------------------------------------------------
  // 9. True 2D Canvas Pan & Rock-Solid Turntable Rotation
  // ---------------------------------------------------------------------------
  const DEFAULT_ROT_Y = -0.55;
  const DEFAULT_ROT_X = 0.22;
  const DEFAULT_DIST = 13.5;
  const PEELED_DIST = 26.0;

  let rotY = DEFAULT_ROT_Y;
  let rotX = DEFAULT_ROT_X;
  let cameraDist = DEFAULT_DIST;
  let targetCameraDist = DEFAULT_DIST;

  let panOffset = { x: 0, y: 0 };
  let targetPanelShiftX = 0.0;
  let currentPanelShiftX = 0.0;

  let isPeeled = false;
  let isOrbiting = false;
  let isPanning = false;
  let prevMouseX = 0;
  let prevMouseY = 0;

  // Initial showcase orientation
  earthGroup.rotation.set(DEFAULT_ROT_X, DEFAULT_ROT_Y, 0, 'YXZ');

  // The camera remains stationary at (0, 0, cameraDist) looking at (0, 0, 0)
  // Panning translates EarthGroup directly across the screen (pure 2D canvas pan!)
  function updateEarthTransforms() {
    currentPanelShiftX += (targetPanelShiftX - currentPanelShiftX) * 0.1;
    cameraDist += (targetCameraDist - cameraDist) * 0.08;

    const posX = currentPanelShiftX + panOffset.x;
    const posY = panOffset.y;

    earthGroup.position.set(posX, posY, 0);

    camera.position.set(0, 0, cameraDist);
    camera.lookAt(0, 0, 0);
  }

  const dom = renderer.domElement;
  dom.addEventListener('contextmenu', e => e.preventDefault());

  // Canvas Interactions: Completely silent on basic movements!
  let dragStartX = 0;
  let dragStartY = 0;
  let hasDragged = false;

  dom.addEventListener('pointerdown', e => {
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    hasDragged = false;

    if (e.button === 1 || e.button === 2) {
      // Middle Click / Right Click: PAN CANVAS
      e.preventDefault();
      isPanning = true;
      isOrbiting = false;
      dom.style.cursor = 'move';
    } else if (e.button === 0) {
      // Left Click: SPIN EARTH (Turntable)
      isOrbiting = true;
      isPanning = false;
      dom.style.cursor = 'grabbing';
    }

    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  });

  window.addEventListener('pointermove', e => {
    const dx = e.clientX - prevMouseX;
    const dy = e.clientY - prevMouseY;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;

    if (Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY) > 5) {
      hasDragged = true;
    }

    if (isPanning) {
      // Direct 2D canvas panning: Earth follows the mouse cursor precisely across the screen
      const panFactor = (cameraDist / Math.min(window.innerWidth, window.innerHeight)) * 1.5;
      panOffset.x += dx * panFactor;
      panOffset.y -= dy * panFactor;
    } else if (isOrbiting) {
      // True Google Earth / Physical Sphere Trackball Rotation:
      // Dragging left/right spins around screen vertical axis.
      // Dragging up (dy < 0) pulls the surface UP (rolls towards user).
      // Dragging down (dy > 0) pulls the surface DOWN (rolls away from user).
      // Applied in screen/camera space using quaternions so orientation never flips!
      const rotSpeed = 0.0055;
      const deltaRotation = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
          dy * rotSpeed,   // Screen vertical drag rolls around horizontal axis
          dx * rotSpeed,   // Screen horizontal drag rolls around vertical axis
          0,
          'XYZ'
        ));

      earthGroup.quaternion.multiplyQuaternions(deltaRotation, earthGroup.quaternion);
    } else {
      checkHover(e);
    }
  });

  window.addEventListener('pointerup', () => {
    isOrbiting = false;
    isPanning = false;
    dom.style.cursor = 'grab';
  });

  // Scroll wheel zooms in/out
  dom.addEventListener('wheel', e => {
    e.preventDefault();
    targetCameraDist += e.deltaY * 0.012;
    targetCameraDist = Math.max(7.5, Math.min(34.0, targetCameraDist));
  }, { passive: false });

  // 3D Raycasting for direct clicks on the globe
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function getRaycastLayer(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(earthGroup.children, true);
    for (const hit of intersects) {
      if (hit.object && hit.object.userData && hit.object.userData.layerIndex !== undefined) {
        return hit.object.userData.layerIndex;
      }
    }
    return -1;
  }

  function checkHover(e) {
    if (isOrbiting || isPanning) return;
    const hitIdx = getRaycastLayer(e);
    dom.style.cursor = hitIdx >= 0 ? 'pointer' : 'grab';
  }

  // Only trigger on genuine stationary clicks, NEVER after dragging/spinning around!
  dom.addEventListener('click', e => {
    if (hasDragged) return;
    const hitIdx = getRaycastLayer(e);
    if (hitIdx >= 0) {
      sound.play();
      selectLayer(hitIdx);
    }
  });

  // ---------------------------------------------------------------------------
  // 10. UI Navigation, Layer Selection & Panels
  // ---------------------------------------------------------------------------
  let currentMode = 'welcome';
  let activeLayerIndex = -1;

  const topbar = document.getElementById('topbar');
  const layerBar = document.getElementById('layerBar');
  const sideTools = document.getElementById('sideTools');
  const infoPanel = document.getElementById('infoPanel');
  const quizPanel = document.getElementById('quizPanel');
  const peachModal = document.getElementById('peachModal');
  const helpModal = document.getElementById('helpModal');

  // Layer Bar Cards: Elegant volume of emojis
  function renderLayerBar() {
    layerBar.innerHTML = '';
    DATA.layers.forEach((layer, idx) => {
      const btn = document.createElement('button');
      btn.className = 'layer-btn';
      btn.style.setProperty('--c', layer.color);
      btn.style.setProperty('--t', layer.text);
      btn.innerHTML = `
        <span class="layer-badge">${layer.number}</span>
        <span class="layer-emoji">${layer.emoji}</span>
        <span class="layer-name">${layer.name}</span>
      `;
      btn.addEventListener('click', () => {
        sound.play();
        selectLayer(idx);
      });
      layerBar.appendChild(btn);
    });
  }
  renderLayerBar();

  function setMode(mode) {
    currentMode = mode;
    document.body.setAttribute('data-mode', mode);

    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === mode);
    });

    if (mode === 'explore') {
      closeQuizPanel();
      if (activeLayerIndex === -1) selectLayer(0);
      else openInfoPanel(activeLayerIndex);
    } else if (mode === 'quiz') {
      closeInfoPanel();
      openQuizPanel();
    }
  }

  function selectLayer(idx) {
    if (idx < 0 || idx >= DATA.layers.length) return;
    activeLayerIndex = idx;

    const btns = layerBar.querySelectorAll('.layer-btn');
    btns.forEach((b, i) => b.classList.toggle('active', i === idx));

    openInfoPanel(idx);
  }

  // Open Layer Info Panel
  function openInfoPanel(idx) {
    const layer = DATA.layers[idx];
    if (!layer) return;

    targetPanelShiftX = -2.5;
    document.body.classList.add('panel-open');

    const head = document.getElementById('infoHead');
    head.style.setProperty('--c', layer.color);
    head.style.setProperty('--t', layer.text);

    document.getElementById('infoBadgeNum').textContent = layer.emoji;
    document.getElementById('infoKicker').textContent = `Layer ${layer.number} of ${DATA.layers.length}`;
    document.getElementById('infoName').textContent = layer.name;

    const body = document.getElementById('infoBody');
    body.innerHTML = `
      <p class="tagline">${layer.tagline}</p>
      <div class="chips">
        <div class="chip">
          <span style="font-size:2rem;line-height:1">📏</span>
          <div><b>Depth</b>${layer.depth}</div>
        </div>
        <div class="chip">
          <span style="font-size:2rem;line-height:1">🔬</span>
          <div><b>State</b>${layer.state}</div>
        </div>
      </div>

      <div class="hot">
        <div class="hot-row">
          <div class="hot-row-left">
            <span style="font-size:1.8rem;line-height:1">🌡️</span>
            <b>Temperature</b>
          </div>
          <span class="hot-val">${layer.temp}</span>
        </div>
        <div class="hotbar">
          <div class="hotcover" style="width:${(1 - layer.heat) * 100}%"></div>
        </div>
      </div>

      <div class="like-card">
        <b>🍎 Classroom Analogy</b>
        ${layer.like}
      </div>

      <ul class="facts">
        ${layer.facts.map(f => `<li>${f}</li>`).join('')}
      </ul>

      <div class="wow">
        <div class="wow-head">
          <span>💡</span>
          Scientist Fact
        </div>
        ${layer.wow}
      </div>
    `;

    document.getElementById('infoPrev').disabled = idx === 0;
    document.getElementById('infoNext').disabled = idx === DATA.layers.length - 1;

    infoPanel.classList.add('open');
  }

  function closeInfoPanel() {
    infoPanel.classList.remove('open');
    if (currentMode !== 'quiz') {
      targetPanelShiftX = 0.0;
      document.body.classList.remove('panel-open');
    }
    const btns = layerBar.querySelectorAll('.layer-btn');
    btns.forEach(b => b.classList.remove('active'));
  }

  // ---------------------------------------------------------------------------
  // 11. Interactive Grade 2 Quiz
  // ---------------------------------------------------------------------------
  let quizIndex = 0;
  let quizScore = 0;
  let quizAnswered = false;

  const qKicker = document.getElementById('qKicker');
  const qProgress = document.getElementById('qProgress');
  const qBody = document.getElementById('qBody');
  const qNext = document.getElementById('qNext');

  function openQuizPanel() {
    quizIndex = 0;
    quizScore = 0;
    quizAnswered = false;

    targetPanelShiftX = -2.5;
    document.body.classList.add('panel-open');
    quizPanel.classList.add('open');

    renderQuestion();
  }

  function closeQuizPanel() {
    quizPanel.classList.remove('open');
    if (currentMode !== 'explore' || !infoPanel.classList.contains('open')) {
      targetPanelShiftX = 0.0;
      document.body.classList.remove('panel-open');
    }
  }

  function renderQuestion() {
    quizAnswered = false;
    const qData = DATA.quizFacts[quizIndex];
    if (!qData) {
      renderQuizResults();
      return;
    }

    qKicker.textContent = `Question ${quizIndex + 1} of ${DATA.quizFacts.length}`;
    qProgress.innerHTML = '';
    DATA.quizFacts.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'q-dot' + (i === quizIndex ? ' cur' : (i < quizIndex ? ' done' : ''));
      dot.textContent = i + 1;
      qProgress.appendChild(dot);
    });

    const optionLetters = ['A', 'B', 'C', 'D'];

    qBody.innerHTML = `
      <p class="q-text">${qData.q}</p>
      <div class="answers">
        ${DATA.layers.map((l, i) => `
          <button class="ans" data-idx="${i}" style="--c:${l.color};--t:${l.text}">
            <div class="ans-opt">${optionLetters[i]}</div>
            <span>${l.emoji} ${l.name}</span>
          </button>
        `).join('')}
      </div>
      <div class="feedback" id="qFeedback"></div>
    `;

    qNext.style.display = 'none';

    qBody.querySelectorAll('.ans').forEach(btn => {
      btn.addEventListener('click', () => {
        if (quizAnswered) return;
        sound.play();
        const picked = parseInt(btn.dataset.idx, 10);
        checkQuizAnswer(picked, btn);
      });
    });
  }

  function checkQuizAnswer(picked, btn) {
    const qData = DATA.quizFacts[quizIndex];
    const fbEl = document.getElementById('qFeedback');

    if (picked === qData.a) {
      quizAnswered = true;
      quizScore++;
      btn.classList.add('right');
      fbEl.className = 'feedback good';
      fbEl.innerHTML = `<span>🎉 Correct! Fantastic job Grade 2!</span>`;

      qNext.style.display = 'block';
      qNext.textContent = quizIndex === DATA.quizFacts.length - 1 ? 'See Your Score 🏆' : 'Next Question ▶';
      qBody.querySelectorAll('.ans').forEach(b => {
        if (b !== btn) b.disabled = true;
      });
    } else {
      btn.classList.add('wrong');
      fbEl.className = 'feedback bad';
      fbEl.innerHTML = `<span>🤔 Not quite! Try another layer.</span>`;
      setTimeout(() => btn.classList.remove('wrong'), 600);
    }
  }

  function renderQuizResults() {
    qKicker.textContent = 'Quiz Complete! 🏆';
    qProgress.innerHTML = '';
    const total = DATA.quizFacts.length;

    qBody.innerHTML = `
      <div class="q-end">
        <div class="q-score">${quizScore} / ${total} Correct ⭐</div>
        <p class="q-msg">
          ${quizScore >= 8 ? 'Outstanding! You are official Earth Scientists! 🌍' :
            quizScore >= 5 ? 'Great job! You know the Earth\'s layers! 👏' :
            'Good effort! Let\'s explore the layers and try again! 🔍'}
        </p>
        <div class="end-btns">
          <button class="btn primary big" id="btnQuizRestart">Play Again 🔄</button>
          <button class="btn big" id="btnQuizExplore">Explore Earth 🌍</button>
        </div>
      </div>
    `;

    qNext.style.display = 'none';

    document.getElementById('btnQuizRestart').addEventListener('click', () => {
      sound.play();
      openQuizPanel();
    });
    document.getElementById('btnQuizExplore').addEventListener('click', () => {
      sound.play();
      setMode('explore');
    });

    if (quizScore >= 7) {
      fireConfetti();
    }
  }

  // ---------------------------------------------------------------------------
  // 12. Modals & Side Tools Wiring
  // ---------------------------------------------------------------------------
  const btnPeel = document.getElementById('btnPeel');
  const btnPeach = document.getElementById('btnPeach');
  const btnHome = document.getElementById('btnHome');
  const btnSound = document.getElementById('btnSound');
  const btnFull = document.getElementById('btnFull');
  const btnHelp = document.getElementById('btnHelp');

  // WIDE ZERO-CLIP Exploded Layer Separation
  btnPeel.addEventListener('click', () => {
    sound.play();
    isPeeled = !isPeeled;
    btnPeel.classList.toggle('on', isPeeled);
    targetCameraDist = isPeeled ? PEELED_DIST : DEFAULT_DIST;
    showToast(isPeeled ? 'Layers Separated 🧅' : 'Layers Rejoined 🌍');
  });

  // Peach & Egg Comparison Modal
  btnPeach.addEventListener('click', () => {
    sound.play();
    peachModal.classList.remove('hidden');
  });

  // Reset View to Presentation Default (Smoothly re-centers Earth and resets zoom)
  btnHome.addEventListener('click', () => {
    sound.play();
    earthGroup.rotation.set(DEFAULT_ROT_X, DEFAULT_ROT_Y, 0, 'YXZ');
    targetCameraDist = DEFAULT_DIST;
    panOffset.x = 0;
    panOffset.y = 0;
    isPeeled = false;
    btnPeel.classList.remove('on');
    showToast('View Reset 🎯');
  });

  // Sound Mute Toggle
  btnSound.addEventListener('click', () => {
    const active = sound.toggle();
    btnSound.classList.toggle('muted', !active);
    btnSound.classList.toggle('off', !active);
    document.getElementById('soundEmoji').textContent = active ? '🔊' : '🔇';
    if (active) sound.play();
    showToast(active ? 'Sound On 🔊' : 'Sound Muted 🔇');
  });

  // Fullscreen Toggle
  btnFull.addEventListener('click', () => {
    sound.play();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Teacher Help Modal
  btnHelp.addEventListener('click', () => {
    sound.play();
    helpModal.classList.remove('hidden');
  });

  // Close modals
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.play();
      peachModal.classList.add('hidden');
      helpModal.classList.add('hidden');
    });
  });

  [peachModal, helpModal].forEach(m => {
    m.addEventListener('click', e => {
      if (e.target === m) {
        sound.play();
        m.classList.add('hidden');
      }
    });
  });

  // Info panel buttons
  document.getElementById('infoClose').addEventListener('click', () => {
    sound.play();
    closeInfoPanel();
  });
  document.getElementById('infoPrev').addEventListener('click', () => {
    sound.play();
    if (activeLayerIndex > 0) selectLayer(activeLayerIndex - 1);
  });
  document.getElementById('infoNext').addEventListener('click', () => {
    sound.play();
    if (activeLayerIndex < DATA.layers.length - 1) selectLayer(activeLayerIndex + 1);
  });

  // Quiz panel buttons
  qNext.addEventListener('click', () => {
    sound.play();
    quizIndex++;
    renderQuestion();
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sound.play();
      setMode(tab.dataset.mode);
    });
  });

  // Welcome screen buttons
  document.querySelectorAll('.w-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.play();
      setMode(btn.dataset.go);
    });
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', e => {
    const key = e.key;

    if (key === 'Escape') {
      closeInfoPanel();
      closeQuizPanel();
      peachModal.classList.add('hidden');
      helpModal.classList.add('hidden');
      return;
    }

    if (key >= '1' && key <= '4') {
      const idx = parseInt(key, 10) - 1;
      if (currentMode === 'quiz' && !quizAnswered) {
        const btn = qBody.querySelector(`.ans[data-idx="${idx}"]`);
        if (btn) btn.click();
      } else {
        selectLayer(idx);
      }
      return;
    }

    if (key === 'ArrowLeft') {
      if (activeLayerIndex > 0) selectLayer(activeLayerIndex - 1);
    } else if (key === 'ArrowRight' || key === ' ') {
      if (currentMode === 'quiz' && quizAnswered) qNext.click();
      else if (activeLayerIndex < DATA.layers.length - 1) selectLayer(activeLayerIndex + 1);
    } else if (key === 'p' || key === 'P') {
      btnPeel.click();
    } else if (key === 'e' || key === 'E') {
      setMode('explore');
    } else if (key === 'q' || key === 'Q') {
      setMode('quiz');
    } else if (key === 'f' || key === 'F') {
      btnFull.click();
    }
  });

  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    resizeConfetti();
  });

  // ---------------------------------------------------------------------------
  // 13. Render Loop (Smooth Peel Animation & Turntable Orientation)
  // ---------------------------------------------------------------------------
  function animate() {
    requestAnimationFrame(animate);

    // Smooth Zero-Clip Exploded Separation Interpolation
    layerMeshes.forEach(group => {
      const targetPos = isPeeled ? group.userData.explodedPos : group.userData.basePos;
      group.position.lerp(targetPos, 0.08);
    });

    updateEarthTransforms();
    updateConfetti();

    renderer.render(scene, camera);
  }

  // Remove loading overlay
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    setTimeout(() => {
      loadingEl.style.opacity = '0';
      loadingEl.style.transition = 'opacity 0.4s';
      setTimeout(() => loadingEl.remove(), 400);
    }, 250);
  }

  animate();

})();
