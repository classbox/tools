/**
 * First-Person Player Controller (FPOV) with Pointer Lock Mouse Look.
 * Keeps weapon lowered on bottom-right so laser beam is clearly visible at a perspective angle.
 */
class RobloxPlayer {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // Movement state
    this.position = new THREE.Vector3(0, 0, 16);
    this.velocity = new THREE.Vector3();
    this.speed = 10;
    this.jumpForce = 11;
    this.gravity = 28;
    this.isGrounded = true;

    // FPOV Camera Orientation (Pitch & Yaw)
    this.pitch = 0;
    this.yaw = 0;
    this.mouseSensitivity = 0.0022;
    this.isPointerLocked = false;

    // Keys input
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };

    // Firing state (Toggled by Left Click)
    this.isFiring = false;
    this.fireShakeTime = 0;
    this.weaponSway = new THREE.Vector3();

    // Weapon base offset (Fixed at bottom-right of viewport)
    this.weaponBasePos = new THREE.Vector3(0.46, -0.38, -0.75);

    this.createFPSViewModel();
    this.setupControls();
  }

  createFPSViewModel() {
    this.fpsWeaponGroup = new THREE.Group();

    // 1. Sleek Main Chassis (Multi-layered matte polymer & carbon frame)
    const chassisGeo = new THREE.BoxGeometry(0.28, 0.32, 1.15);
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.set(0, -0.05, -0.35);
    this.fpsWeaponGroup.add(chassis);

    // Top Receiver Cover with Angled Geometry
    const topCoverGeo = new THREE.BoxGeometry(0.22, 0.12, 0.85);
    const topCoverMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15
    });
    const topCover = new THREE.Mesh(topCoverGeo, topCoverMat);
    topCover.position.set(0, 0.13, -0.4);
    this.fpsWeaponGroup.add(topCover);

    // Heat Vents along Top Receiver
    const ventMat = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    for (let i = 0; i < 4; i++) {
      const ventGeo = new THREE.BoxGeometry(0.23, 0.02, 0.08);
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.position.set(0, 0.18, -0.65 + i * 0.16);
      this.fpsWeaponGroup.add(vent);
    }

    // 2. Translucent Glass Plasma Chamber & Rotating Reactor Core
    const chamberGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.55, 16);
    const chamberMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.1
    });
    const chamber = new THREE.Mesh(chamberGeo, chamberMat);
    chamber.rotation.x = Math.PI / 2;
    chamber.position.set(0, 0.04, -0.2);
    this.fpsWeaponGroup.add(chamber);

    // Rotating Internal Plasma Core Helix
    this.plasmaCore = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
      const ring = new THREE.Mesh(ringGeo, coreMat);
      ring.position.z = -0.16 + i * 0.16;
      this.plasmaCore.add(ring);
    }
    const corePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    corePillar.rotation.x = Math.PI / 2;
    this.plasmaCore.add(corePillar);
    this.plasmaCore.position.set(0, 0.04, -0.2);
    this.fpsWeaponGroup.add(this.plasmaCore);

    // 3. Heavy Armored Barrel Assembly with Chrome Stabilization Rails
    const barrelShroudGeo = new THREE.BoxGeometry(0.24, 0.22, 0.7);
    const barrelShroudMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2
    });
    const barrelShroud = new THREE.Mesh(barrelShroudGeo, barrelShroudMat);
    barrelShroud.position.set(0, -0.02, -0.95);
    this.fpsWeaponGroup.add(barrelShroud);

    // Precision Quad Titanium Barrel Tubes
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 12);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.1
    });
    const tubeOffsets = [
      [-0.06, 0.04],
      [0.06, 0.04],
      [-0.06, -0.08],
      [0.06, -0.08]
    ];
    tubeOffsets.forEach(([tx, ty]) => {
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(tx, ty, -1.25);
      this.fpsWeaponGroup.add(tube);
    });

    // 4. Heavy Fluted Muzzle Compensator / Accelerator Nozzle
    const muzzleCompGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.35, 16);
    const muzzleCompMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.92,
      roughness: 0.15
    });
    const muzzleComp = new THREE.Mesh(muzzleCompGeo, muzzleCompMat);
    muzzleComp.rotation.x = Math.PI / 2;
    muzzleComp.position.set(0, -0.02, -1.65);
    this.fpsWeaponGroup.add(muzzleComp);

    // Glowing Neon Muzzle Crown
    const crownGeo = new THREE.TorusGeometry(0.11, 0.025, 8, 16);
    this.crownMat = new THREE.MeshBasicMaterial({ color: 0xff003b });
    const crown = new THREE.Mesh(crownGeo, this.crownMat);
    crown.position.set(0, -0.02, -1.82);
    this.fpsWeaponGroup.add(crown);

    // 5. Side Cybernetic Energy Cables with Glowing Red Trim
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0xff003b,
      emissive: 0xff1744,
      emissiveIntensity: 0.95
    });
    const cableGeoL = new THREE.CylinderGeometry(0.022, 0.022, 0.8, 8);
    const cableL = new THREE.Mesh(cableGeoL, cableMat);
    cableL.rotation.x = Math.PI / 2;
    cableL.position.set(-0.15, -0.06, -0.6);
    this.fpsWeaponGroup.add(cableL);

    const cableR = new THREE.Mesh(cableGeoL, cableMat);
    cableR.rotation.x = Math.PI / 2;
    cableR.position.set(0.15, -0.06, -0.6);
    this.fpsWeaponGroup.add(cableR);

    // Glowing Red Frame Accent Trim Lines
    const trimMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.9), trimMat);
    trimL.position.set(-0.145, 0.08, -0.4);
    this.fpsWeaponGroup.add(trimL);

    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.9), trimMat);
    trimR.position.set(0.145, 0.08, -0.4);
    this.fpsWeaponGroup.add(trimR);

    // 7. Dynamic Muzzle Firing Light
    this.muzzleLight = new THREE.PointLight(0xff1744, 0, 14);
    this.muzzleLight.position.set(0, -0.02, -1.85);
    this.fpsWeaponGroup.add(this.muzzleLight);

    // 8. Emitter point for laser beam origin
    this.muzzleEmitter = new THREE.Object3D();
    this.muzzleEmitter.position.set(0, -0.02, -1.85);
    this.fpsWeaponGroup.add(this.muzzleEmitter);

    this.fpsWeaponGroup.position.copy(this.weaponBasePos);
    this.camera.add(this.fpsWeaponGroup);
    this.scene.add(this.camera);
  }

  setupControls() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    const canvas = this.domElement;

    canvas.addEventListener('click', (e) => {
      if (e.target.closest('#top-bar') || e.target.closest('#bottom-controls-bar') || e.target.closest('.roblox-modal') || (window.uiManager && window.uiManager.isModalOpen)) {
        return;
      }
      if (!this.isPointerLocked) {
        canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock;
        if (canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === canvas);
    });
    document.addEventListener('mozpointerlockchange', () => {
      this.isPointerLocked = (document.mozPointerLockElement === canvas);
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        const movementX = e.movementX || e.mozMovementX || 0;
        const movementY = e.movementY || e.mozMovementY || 0;

        this.yaw -= movementX * this.mouseSensitivity;
        this.pitch -= movementY * this.mouseSensitivity;

        const maxPitch = Math.PI * 0.48;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
      }
    });

    // Left Click: Toggle Firing Sizzling Laser Beam
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (e.target.closest('#top-bar') || e.target.closest('#bottom-controls-bar') || e.target.closest('.roblox-modal') || (window.uiManager && window.uiManager.isModalOpen)) {
          return;
        }
        if (this.isPointerLocked) {
          this.toggleFiring();
        }
      }
    });
  }

  onKeyDown(e) {
    if (e.target.tagName === 'INPUT') return;

    switch (e.code) {
      case 'KeyW':
        this.keys.forward = true;
        break;
      case 'KeyS':
        this.keys.backward = true;
        break;
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        if (this.isGrounded) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
          window.soundFX.playJump();
        }
        break;
      case 'KeyK':
        if (window.game && window.game.keys) {
          window.game.keys.KeyK = true;
        }
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
        this.keys.forward = false;
        break;
      case 'KeyS':
        this.keys.backward = false;
        break;
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'KeyK':
        if (window.game && window.game.keys) {
          window.game.keys.KeyK = false;
          window.game.keyKHoldTime = 0;
        }
        break;
    }
  }

  toggleFiring(forceState = null) {
    this.isFiring = forceState !== null ? forceState : !this.isFiring;
    window.soundFX.playWeaponToggle(this.isFiring);

    if (this.isFiring) {
      document.body.classList.add('aiming');
      window.soundFX.startLaserHum();
      if (this.muzzleLight) this.muzzleLight.intensity = 2.4;
    } else {
      document.body.classList.remove('aiming');
      window.soundFX.stopLaserHum();
      if (this.muzzleLight) this.muzzleLight.intensity = 0;
      if (window.game && window.game.world && window.game.world.clearGlassDeflect) {
        window.game.world.clearGlassDeflect();
      }
    }

    if (window.uiManager) {
      window.uiManager.updateChecklist('chk-aim', this.isFiring);
    }
  }

  getLaserOrigin() {
    const origin = new THREE.Vector3();
    this.muzzleEmitter.getWorldPosition(origin);
    return origin;
  }

  getLaserDirection() {
    // Crosshair target point in world space (50 units ahead of camera)
    const crosshairTarget = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);

    // Apply slight gentle aim sway when firing
    if (this.isFiring) {
      camDir.x += this.weaponSway.x * 0.15;
      camDir.y += this.weaponSway.y * 0.15;
    }

    crosshairTarget.copy(this.camera.position).addScaledVector(camDir, 60);

    // Laser shoots from muzzle origin towards the crosshair target point in 3D!
    const laserOrigin = this.getLaserOrigin();
    const dir = new THREE.Vector3().subVectors(crosshairTarget, laserOrigin).normalize();
    return dir;
  }

  update(delta) {
    // 1. Procedural Vibration / Sizzle recoil while firing (without moving to center)
    if (this.isFiring) {
      this.fireShakeTime += delta * 30;
      const shakeX = (Math.sin(this.fireShakeTime * 1.7) + Math.cos(this.fireShakeTime * 2.3)) * 0.006;
      const shakeY = (Math.cos(this.fireShakeTime * 2.1) + Math.sin(this.fireShakeTime * 3.1)) * 0.006;
      const shakeZ = Math.sin(this.fireShakeTime * 4.0) * 0.01;
      this.weaponSway.set(shakeX, shakeY, shakeZ);
    } else {
      this.weaponSway.set(0, 0, 0);
    }

    // Animate rotating plasma core inside transparent chamber
    if (this.plasmaCore) {
      const spinSpeed = this.isFiring ? 12.0 : 2.5;
      this.plasmaCore.rotation.z += delta * spinSpeed;
    }

    // Pulse glowing neon muzzle crown
    if (this.crownMat) {
      const pulseSpeed = this.isFiring ? 25.0 : 4.0;
      this.crownMat.opacity = 0.75 + Math.sin(performance.now() * 0.001 * pulseSpeed) * 0.25;
    }

    // Keep weapon anchored in lowered bottom-right stance with subtle vibration
    const gunPos = this.weaponBasePos.clone().add(this.weaponSway);
    this.fpsWeaponGroup.position.copy(gunPos);

    // 2. Movement Calculation
    const moveX = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const moveZ = (this.keys.backward ? 1 : 0) - (this.keys.forward ? 1 : 0);

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3()
      .addScaledVector(forward, -moveZ)
      .addScaledVector(right, moveX);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    this.velocity.x = moveDir.x * this.speed;
    this.velocity.z = moveDir.z * this.speed;

    this.velocity.y -= this.gravity * delta;

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.position.x = THREE.MathUtils.clamp(this.position.x, -16.0, 16.0);
    this.position.z = THREE.MathUtils.clamp(this.position.z, 6.0, 26.0);

    // Camera Placement (Eye height 2.4)
    this.camera.position.set(this.position.x, this.position.y + 2.4, this.position.z);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  reset() {
    this.position.set(0, 0, 16);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.toggleFiring(false);
  }
}

window.RobloxPlayer = RobloxPlayer;
