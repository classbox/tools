/**
 * Mirrors Module
 * Builds realistic, bright silver reflective mirror props with chrome frames,
 * glass sheen reflection textures, normal indicators, and arrow-key rotation.
 */
class MirrorProp {
  constructor(id, name, position, initialYaw, initialPitch = 0, scene) {
    this.id = id;
    this.name = name;
    this.initialPosition = position.clone();
    this.initialYaw = initialYaw;
    this.initialPitch = initialPitch;
    this.yaw = initialYaw;
    this.pitch = initialPitch;
    this.scene = scene;
    this.isSelected = false;
    this.rotationSpeed = 1.2;

    this.createMesh();
    this.createNormalIndicator();
    this.createSelectionBox();
  }

  // Generate a procedural bright silver mirror reflection texture
  createMirrorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Sky & Horizon Reflection Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#7dd3fc'); // Sky Blue
    grad.addColorStop(0.4, '#bae6fd'); // Light Sky
    grad.addColorStop(0.55, '#f8fafc'); // Horizon White Glint
    grad.addColorStop(0.58, '#86efac'); // Distant Ground Reflection
    grad.addColorStop(1.0, '#cbd5e1'); // Silver Base
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Soft Glossy Clouds / Reflections
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(140, 160, 90, 0, Math.PI * 2);
    ctx.arc(280, 140, 110, 0, Math.PI * 2);
    ctx.arc(400, 170, 80, 0, Math.PI * 2);
    ctx.fill();

    // 3. Diagonal Mirror Gloss Light Streak
    const glossGrad = ctx.createLinearGradient(0, 512, 512, 0);
    glossGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
    glossGrad.addColorStop(0.42, 'rgba(255, 255, 255, 0.1)');
    glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    glossGrad.addColorStop(0.58, 'rgba(255, 255, 255, 0.1)');
    glossGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, 0, 512, 512);

    // 4. Subtle Clean Inner Mirror Bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 500);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.initialPosition);

    // 1. Sleek Metallic Base Pedestal (Silver & Chrome)
    const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.8, 20);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.4;
    base.castShadow = true;
    this.group.add(base);

    // Chrome Base Trim Ring
    const baseRingGeo = new THREE.TorusGeometry(2.5, 0.15, 8, 24);
    const baseRingMat = new THREE.MeshStandardMaterial({ color: 0x00a2ff, roughness: 0.1, metalness: 0.9 });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.8;
    this.group.add(baseRing);

    // 2. Rotating Head Pivot
    this.rotatorGroup = new THREE.Group();
    this.rotatorGroup.position.y = 0.8;

    // Swivel Center Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.2
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = 0.6;
    pillar.castShadow = true;
    this.rotatorGroup.add(pillar);

    // Tilt Pivot Group (Tilts up and down)
    this.tiltGroup = new THREE.Group();
    this.tiltGroup.position.set(0, 2.4, 0);

    // Dual Vertical Chrome Arms
    const armGeo = new THREE.BoxGeometry(0.4, 4.6, 0.65);
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1
    });

    const armL = new THREE.Mesh(armGeo, armMat);
    armL.position.set(-3.2, -0.1, 0);
    armL.castShadow = true;
    this.tiltGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(3.2, -0.1, 0);
    armR.castShadow = true;
    this.tiltGroup.add(armR);

    // 3. Mirror Frame (Enlarged for forgiving target acquisition)
    const frameGeo = new THREE.BoxGeometry(6.2, 4.4, 0.35);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xdbeafe,
      metalness: 0.9,
      roughness: 0.15
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0;
    frame.castShadow = true;
    this.tiltGroup.add(frame);

    // Chrome Beveled Border
    const borderGeo = new THREE.BoxGeometry(5.9, 4.1, 0.38);
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.98,
      roughness: 0.05
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.y = 0;
    this.tiltGroup.add(borderMesh);

    // 4. Real-Time Dynamic Mirror Reflection Shader (THREE.Reflector) - Enlarged 5.6 x 3.8
    const glassGeo = new THREE.PlaneGeometry(5.6, 3.8);

    if (typeof THREE.Reflector !== 'undefined') {
      this.glass = new THREE.Reflector(glassGeo, {
        clipBias: 0.003,
        textureWidth: Math.min(window.innerWidth * window.devicePixelRatio, 1024),
        textureHeight: Math.min(window.innerHeight * window.devicePixelRatio, 1024),
        color: 0x8899aa
      });

      // Detach from onBeforeRender so it executes in a clean pre-pass without corrupting Three.js main scene render lists
      const doRender = this.glass.onBeforeRender;
      this.glass.onBeforeRender = function() {};
      this.glass.renderReflection = (renderer, scene, camera) => {
        if (!this.glass || !this.glass.visible) return;
        doRender.call(this.glass, renderer, scene, camera);
      };
    } else {
      const mirrorTex = this.createMirrorTexture();
      const glassMat = new THREE.MeshStandardMaterial({
        map: mirrorTex,
        color: 0xffffff,
        metalness: 0.95,
        roughness: 0.05,
        emissive: 0x1e3a5f,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide
      });
      this.glass = new THREE.Mesh(glassGeo, glassMat);
    }

    this.glass.position.set(0, 0, 0.20);
    this.tiltGroup.add(this.glass);

    // Mirror Glass Surface Protective Sheen Layer with bevel glint
    const sheenGeo = new THREE.PlaneGeometry(5.6, 3.8);
    const sheenMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    const sheenMesh = new THREE.Mesh(sheenGeo, sheenMat);
    sheenMesh.position.set(0, 0, 0.21);
    this.tiltGroup.add(sheenMesh);

    // 5. Big Number Decal on the BACK
    this.createBackNumberDecal();

    this.rotatorGroup.add(this.tiltGroup);
    this.group.add(this.rotatorGroup);
    this.scene.add(this.group);

    this.updateYawPitch(0, 0);
  }

  createBackNumberDecal() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Dark sleek backing plate
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing Circular Frame
    ctx.strokeStyle = '#00a2ff';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.arc(256, 256, 210, 0, Math.PI * 2);
    ctx.stroke();

    // Prominent Number 1 / 2
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 320px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.id}`, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const numberMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), mat);

    // Position on the back face of the mirror frame (Z = -0.22, facing backwards)
    numberMesh.position.set(0, 0, -0.22);
    numberMesh.rotation.y = Math.PI;
    this.tiltGroup.add(numberMesh);
  }


  createNormalIndicator() {
    // Perpendicular Normal Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0.21),
      new THREE.Vector3(0, 0, 3.2)
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      dashSize: 0.35,
      gapSize: 0.15,
      linewidth: 3
    });
    this.normalLine = new THREE.Line(lineGeo, lineMat);
    this.normalLine.computeLineDistances();
    this.tiltGroup.add(this.normalLine);

    const coneGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 0, 3.3);
    this.tiltGroup.add(cone);
  }

  createSelectionBox() {
    this.arrowGroup = new THREE.Group();
    this.arrowGroup.position.set(0, 6.2, 0);

    const coneGeo = new THREE.ConeGeometry(0.55, 1.2, 16);
    this.arrowMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.95
    });
    const coneMesh = new THREE.Mesh(coneGeo, this.arrowMat);
    coneMesh.rotation.x = Math.PI;
    coneMesh.position.y = -0.6;
    this.arrowGroup.add(coneMesh);

    const stemGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.9, 16);
    const stemMesh = new THREE.Mesh(stemGeo, this.arrowMat);
    stemMesh.position.y = 0.35;
    this.arrowGroup.add(stemMesh);

    this.arrowGroup.visible = false;
    this.group.add(this.arrowGroup);
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.arrowGroup.visible = selected;
  }

  updateArrowAnimation(time) {
    if (this.isSelected && this.arrowGroup) {
      this.arrowGroup.position.y = 6.2 + Math.sin(time * 5) * 0.35;
      const flash = 0.6 + Math.sin(time * 10) * 0.4;
      this.arrowMat.opacity = flash;
    }
  }

  updateYawPitch(deltaYaw, deltaPitch) {
    this.yaw += deltaYaw;
    this.yaw = (this.yaw % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    this.rotatorGroup.rotation.y = this.yaw;

    this.pitch += deltaPitch;
    // Clamp pitch tilt between -40 deg and +40 deg
    const maxPitch = Math.PI * 0.25;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    this.tiltGroup.rotation.x = this.pitch;
  }

  getNormal() {
    const normal = new THREE.Vector3(0, 0, 1);
    const quat = new THREE.Quaternion();
    this.tiltGroup.getWorldQuaternion(quat);
    normal.applyQuaternion(quat);
    return normal.normalize();
  }

  getCenter() {
    const center = new THREE.Vector3();
    this.glass.getWorldPosition(center);
    return center;
  }

  reset() {
    this.yaw = this.initialYaw;
    this.pitch = this.initialPitch;
    this.rotatorGroup.rotation.y = this.yaw;
    this.tiltGroup.rotation.x = this.pitch;
    this.setSelected(false);
  }
}

class MirrorManager {
  constructor(scene) {
    this.scene = scene;
    this.mirrors = [];
    this.selectedMirrorIndex = 0;

    this.createMirrors();
    this.setupKeyboardControls();
  }

  createMirrors() {
    // Mirror 1 (Alpha): Located at X = 16, Z = -6
    // Safe Yaw range: facing generally towards field/Mirror Beta (2.0 to 3.4 rad)
    // Safe Pitch range: slight tilt (-0.25 to +0.25 rad)
    const randomYaw1 = 2.0 + Math.random() * 1.4;
    const randomPitch1 = (Math.random() - 0.5) * 0.45;

    const m1 = new MirrorProp(
      1,
      'Mirror Alpha',
      new THREE.Vector3(16, 0, -6),
      randomYaw1,
      randomPitch1,
      this.scene
    );
    this.mirrors.push(m1);

    // Mirror 2 (Beta): Located at X = 8, Z = -38
    // Safe Yaw range: facing towards UFO/Mirror Alpha (3.2 to 4.6 rad)
    // Safe Pitch range: (-0.35 to +0.35 rad)
    const randomYaw2 = 3.2 + Math.random() * 1.4;
    const randomPitch2 = (Math.random() - 0.5) * 0.55;

    const m2 = new MirrorProp(
      2,
      'Mirror Beta',
      new THREE.Vector3(8, 0, -38),
      randomYaw2,
      randomPitch2,
      this.scene
    );
    this.mirrors.push(m2);

    this.selectMirror(0);
  }

  setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'Digit1') {
        this.selectMirror(0);
      } else if (e.code === 'Digit2') {
        this.selectMirror(1);
      }
    });
  }

  selectMirror(index) {
    if (index < 0 || index >= this.mirrors.length) return;
    this.selectedMirrorIndex = index;
    this.mirrors.forEach((m, idx) => {
      m.setSelected(idx === index);
    });

    if (window.uiManager) {
      window.uiManager.updateMirrorSelectionUI(this.selectedMirrorIndex, this.getSelectedMirror());
    }
  }

  getSelectedMirror() {
    return this.mirrors[this.selectedMirrorIndex];
  }

  rotateSelected(yawDir, pitchDir, delta) {
    const mirror = this.getSelectedMirror();
    if (!mirror) return;

    const yawStep = yawDir * mirror.rotationSpeed * delta;
    const pitchStep = pitchDir * mirror.rotationSpeed * delta;
    mirror.updateYawPitch(yawStep, pitchStep);
  }

  update(delta, keys) {
    const time = performance.now() * 0.001;
    this.mirrors.forEach(m => m.updateArrowAnimation(time));

    let yawDir = 0;
    let pitchDir = 0;

    if (keys.ArrowLeft) yawDir -= 1;
    if (keys.ArrowRight) yawDir += 1;
    if (keys.ArrowUp) pitchDir -= 1; // tilt up
    if (keys.ArrowDown) pitchDir += 1; // tilt down

    if (yawDir !== 0 || pitchDir !== 0) {
      this.rotateSelected(yawDir, pitchDir, delta);
      if (window.soundFX && window.soundFX.startMirrorMovement) {
        window.soundFX.startMirrorMovement();
      }
    } else {
      if (window.soundFX && window.soundFX.stopMirrorMovement) {
        window.soundFX.stopMirrorMovement();
      }
    }
  }

  renderReflectors(renderer, camera) {
    if (!renderer || !camera) return;
    for (let i = 0; i < this.mirrors.length; i++) {
      const m = this.mirrors[i];
      if (m && m.glass && m.glass.renderReflection) {
        m.glass.renderReflection(renderer, this.scene, camera);
      }
    }
  }

  reset() {
    if (window.soundFX && window.soundFX.stopMirrorMovement) {
      window.soundFX.stopMirrorMovement();
    }

    this.mirrors[0].initialYaw = 2.0 + Math.random() * 1.4;
    this.mirrors[0].initialPitch = (Math.random() - 0.5) * 0.45;
    this.mirrors[1].initialYaw = 3.2 + Math.random() * 1.4;
    this.mirrors[1].initialPitch = (Math.random() - 0.5) * 0.55;

    this.mirrors.forEach(m => m.reset());
    this.selectMirror(0);
  }
}

window.MirrorProp = MirrorProp;
window.MirrorManager = MirrorManager;
