/**
 * Main Entry Point & Game Loop
 * Orchestrates Scene, Camera, Lighting, Entities, Physics, Optics, and Render Loop.
 */
class ReflectionGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();
    this.keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };

    this.initThree();
    this.initSystems();
    this.setupEventListeners();
    this.animate();
  }

  initThree() {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.container.appendChild(this.renderer.domElement);
  }

  initSystems() {
    this.gameStartTime = performance.now();
    this.gameElapsedTime = 0;
    this.isVictory = false;

    // UI Manager
    window.uiManager = new UIManager();

    // Environment & World
    this.world = new GameWorld(this.scene);

    // Player with FPOV
    this.player = new RobloxPlayer(this.scene, this.camera, this.renderer.domElement);

    // Rotating Reflective Chrome Mirrors with Tilt
    this.mirrorManager = new MirrorManager(this.scene);

    // Alien UFO Boss Target with Player reference for bomb lobbing
    this.ufo = new AlienUFO(this.scene, new THREE.Vector3(0, 10.5, -26), this.player);

    // Sizzling Red Laser Optics Engine
    this.optics = new OpticsEngine(this.scene, this.player, this.mirrorManager, this.ufo, this.world);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'ArrowLeft') this.keys.ArrowLeft = true;
      if (e.code === 'ArrowRight') this.keys.ArrowRight = true;
      if (e.code === 'ArrowUp') this.keys.ArrowUp = true;
      if (e.code === 'ArrowDown') this.keys.ArrowDown = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft') this.keys.ArrowLeft = false;
      if (e.code === 'ArrowRight') this.keys.ArrowRight = false;
      if (e.code === 'ArrowUp') this.keys.ArrowUp = false;
      if (e.code === 'ArrowDown') this.keys.ArrowDown = false;
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  resetGame() {
    this.gameStartTime = performance.now();
    this.gameElapsedTime = 0;
    this.isVictory = false;
    this.world.reset();
    this.player.reset();
    this.mirrorManager.reset();
    this.ufo.reset();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isVictory) {
      this.gameElapsedTime = (performance.now() - this.gameStartTime) * 0.001;
      const hudTimer = document.getElementById('hud-timer-val');
      if (hudTimer) {
        const mins = Math.floor(this.gameElapsedTime / 60);
        const secs = (this.gameElapsedTime % 60).toFixed(1);
        hudTimer.textContent = `${String(mins).padStart(2, '0')}:${secs < 10 ? '0' : ''}${secs}`;
      }
    }

    const combinedKeys = {
      ArrowLeft: this.keys.ArrowLeft || (window.uiManager && window.uiManager.touchRotateDir === -1),
      ArrowRight: this.keys.ArrowRight || (window.uiManager && window.uiManager.touchRotateDir === 1),
      ArrowUp: this.keys.ArrowUp,
      ArrowDown: this.keys.ArrowDown
    };

    // 1. Update Entities & Atmospheric World
    this.player.update(delta);
    this.mirrorManager.update(delta, combinedKeys);
    this.ufo.update(delta);
    this.world.update(delta);

    // 2. Compute Optics & Sizzling Beam
    this.optics.update(delta);

    // 3. Pre-render Mirror Reflection Render Targets
    if (this.mirrorManager && this.mirrorManager.renderReflectors) {
      this.mirrorManager.renderReflectors(this.renderer, this.camera);
    }

    // 4. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Boot application when DOM is ready
function bootGame() {
  if (!window.game) {
    window.game = new ReflectionGame();
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootGame);
} else {
  bootGame();
}
