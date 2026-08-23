/**
 * Alien UFO Target Module
 * Features realistic volumetric fire, smoke plume, shockwave ring,
 * and high-impact fireball explosion on defeat.
 */
class AlienUFO {
  constructor(scene, position = new THREE.Vector3(0, 10.5, -26), player = null) {
    this.scene = scene;
    this.player = player;
    this.initialPosition = position.clone();
    this.position = position.clone();

    // Health Mechanics: Takes ~5.0 seconds of continuous laser contact to deplete
    this.maxHealth = 5.0; // in seconds
    this.health = this.maxHealth;
    this.isHitThisFrame = false;
    this.isDefeated = false;
    this.hitSoundTimer = 0;

    // Hover Animation & Bomb Throwing Timing
    this.hoverTime = 0;
    this.spinAngle = 0;
    this.bombCooldownTimer = 4.0; // First bomb after 4s, then periodic

    this.createMesh();
    this.createHealthBarBillboard();
    this.createHitShield();
    this.createVolumetricExplosionSystems();
    this.createAlienBombSystem();
  }

  createMesh() {
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    // 1. UFO Saucer Body
    const saucerGeo = new THREE.CylinderGeometry(4.5, 2.5, 1.2, 16);
    const saucerMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.8,
      roughness: 0.2
    });
    this.saucer = new THREE.Mesh(saucerGeo, saucerMat);
    this.saucer.castShadow = true;
    this.group.add(this.saucer);

    // Saucer Outer Rim
    const rimGeo = new THREE.TorusGeometry(4.4, 0.4, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    this.saucer.add(rim);

    // Glowing Neon Rim Orbs
    this.rimLights = [];
    const lightGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const colors = [0x00e676, 0x00a2ff, 0xfacc15, 0xec4899];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const lightMat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const lightOrb = new THREE.Mesh(lightGeo, lightMat);
      lightOrb.position.set(Math.cos(angle) * 4.4, 0, Math.sin(angle) * 4.4);
      this.saucer.add(lightOrb);
      this.rimLights.push(lightOrb);
    }

    // 2. Glass Cockpit Dome with glowing interior
    const domeGeo = new THREE.SphereGeometry(2.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.2
    });
    this.dome = new THREE.Mesh(domeGeo, domeMat);
    this.dome.position.y = 0.6;
    this.group.add(this.dome);

    // 3. Volumetric Downward Tractor Beam / Landing Light Cone
    const beamGeo = new THREE.CylinderGeometry(0.8, 4.2, 14, 16, 1, true);
    this.tractorMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.tractorBeam = new THREE.Mesh(beamGeo, this.tractorMat);
    this.tractorBeam.position.y = -7.6;
    this.group.add(this.tractorBeam);

    // UFO Downward Glow Light
    this.ufoLight = new THREE.PointLight(0xa855f7, 1.8, 30);
    this.ufoLight.position.y = -1.2;
    this.group.add(this.ufoLight);

    // 4. Blocky Alien Inside Cockpit
    this.createAlien();

    // Target Hitbox (Sphere for collision raycasting)
    this.targetRadius = 3.8;

    this.scene.add(this.group);
  }

  createAlien() {
    this.alienGroup = new THREE.Group();
    this.alienGroup.position.set(0, 0.8, 0);

    const alienSkinMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.35,
      metalness: 0.2
    });

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });

    // 1. Armored Torso with Spiked Shoulder Pauldrons
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.9), armorMat);
    body.position.y = 0.65;
    this.alienGroup.add(body);

    const pauldronGeo = new THREE.ConeGeometry(0.35, 0.7, 4);
    const pauldronL = new THREE.Mesh(pauldronGeo, armorMat);
    pauldronL.position.set(-0.85, 1.1, 0);
    pauldronL.rotation.z = 0.6;
    this.alienGroup.add(pauldronL);

    const pauldronR = new THREE.Mesh(pauldronGeo, armorMat);
    pauldronR.position.set(0.85, 1.1, 0);
    pauldronR.rotation.z = -0.6;
    this.alienGroup.add(pauldronR);

    // 2. Menacing Alien Head with Angular Jaw & Brow
    this.alienHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.3), alienSkinMat);
    this.alienHead.position.y = 1.9;
    this.alienGroup.add(this.alienHead);

    // Hyper-Radiant Glowing Slanted Crimson Predator Eyes
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff002b,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    const eyeGeo = new THREE.BoxGeometry(0.44, 0.22, 0.14);

    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.38, 0.12, 0.66);
    eyeL.rotation.z = -0.25; // slanted menace
    this.alienHead.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.38, 0.12, 0.66);
    eyeR.rotation.z = 0.25; // slanted menace
    this.alienHead.add(eyeR);

    // Glowing Red Eye Flare / Corona
    const eyeGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff003b,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const flareL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), eyeGlowMat);
    flareL.position.set(-0.38, 0.12, 0.74);
    this.alienHead.add(flareL);

    const flareR = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), eyeGlowMat);
    flareR.position.set(0.38, 0.12, 0.74);
    this.alienHead.add(flareR);

    // Eye Point Light for Menacing Crimson Face Illumination
    this.eyeLight = new THREE.PointLight(0xff002b, 2.2, 12);
    this.eyeLight.position.set(0, 0.15, 0.9);
    this.alienHead.add(this.eyeLight);

    // Inner Fiery Crimson-Orange Slit Pupils
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    const pupilGeo = new THREE.BoxGeometry(0.09, 0.19, 0.16);
    const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
    pupilL.position.set(-0.38, 0.12, 0.72);
    this.alienHead.add(pupilL);
    const pupilR = new THREE.Mesh(pupilGeo, pupilMat);
    pupilR.position.set(0.38, 0.12, 0.72);
    this.alienHead.add(pupilR);

    // Menacing Crown Horns
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const hornGeo = new THREE.ConeGeometry(0.16, 0.85, 4);

    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.45, 0.95, 0);
    hornL.rotation.z = 0.4;
    this.alienHead.add(hornL);

    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.45, 0.95, 0);
    hornR.rotation.z = -0.4;
    this.alienHead.add(hornR);

    // 3. Outstretched Arms Channeling Psychic Force Field
    const armGeo = new THREE.BoxGeometry(0.24, 0.24, 1.1);
    const armL = new THREE.Mesh(armGeo, alienSkinMat);
    armL.position.set(-0.65, 0.75, 0.6);
    armL.rotation.x = -0.15;
    armL.rotation.y = 0.25;
    this.alienGroup.add(armL);

    const armR = new THREE.Mesh(armGeo, alienSkinMat);
    armR.position.set(0.65, 0.75, 0.6);
    armR.rotation.x = -0.15;
    armR.rotation.y = -0.25;
    this.alienGroup.add(armR);

    // Glowing Cyan Energy Orbs in Hands
    const orbGeo = new THREE.SphereGeometry(0.22, 12, 12);
    const handOrbMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const orbL = new THREE.Mesh(orbGeo, handOrbMat);
    orbL.position.set(-0.65, 0.75, 1.15);
    this.alienGroup.add(orbL);

    const orbR = new THREE.Mesh(orbGeo, handOrbMat);
    orbR.position.set(0.65, 0.75, 1.15);
    this.alienGroup.add(orbR);

    // 4. Force-Field Projection Conduits (Streaming forward to Z = -16 glass barrier)
    this.createProjectionStream();

    this.group.add(this.alienGroup);
  }

  createProjectionStream() {
    this.projectionGroup = new THREE.Group();

    // 4 Force-field corners relative to alien/UFO center
    // Force field is Width 20, Height 14 at Z = -16 (UFO is at Z = -26, Y = 10.5)
    const corners = [
      { x: -10, y: 1.5, z: 10, name: 'TL' },  // Top-Left corner (world Y = 12)
      { x: 10, y: 1.5, z: 10, name: 'TR' },   // Top-Right corner (world Y = 12)
      { x: -10, y: -12.0, z: 10, name: 'BL' }, // Bottom-Left corner (world Y = -1.5)
      { x: 10, y: -12.0, z: 10, name: 'BR' }   // Bottom-Right corner (world Y = -1.5)
    ];

    this.projectionBeams = [];

    corners.forEach((corner, idx) => {
      // Hand origin (left hand for left corners, right hand for right corners)
      const handX = corner.x < 0 ? -0.65 : 0.65;
      const handY = 1.55;
      const handZ = 1.15;

      const pStart = new THREE.Vector3(handX, handY, handZ);
      const pEnd = new THREE.Vector3(corner.x, corner.y, corner.z);
      const length = pStart.distanceTo(pEnd);
      const midPoint = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);

      // Orientation quaternion
      const orientation = new THREE.Matrix4();
      orientation.lookAt(pStart, pEnd, new THREE.Vector3(0, 1, 0));

      // 1. Bright Core Beam
      const coreGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 8, 1);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.copy(midPoint);
      coreMesh.quaternion.setFromRotationMatrix(orientation);
      coreMesh.rotateX(Math.PI / 2);
      this.projectionGroup.add(coreMesh);

      // 2. Soft Outer Glow Beam
      const glowGeo = new THREE.CylinderGeometry(0.16, 0.16, length, 8, 1);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.position.copy(midPoint);
      glowMesh.quaternion.setFromRotationMatrix(orientation);
      glowMesh.rotateX(Math.PI / 2);
      this.projectionGroup.add(glowMesh);

      this.projectionBeams.push({
        coreMat: coreMat,
        glowMat: glowMat,
        phase: idx * (Math.PI / 2)
      });
    });

    this.group.add(this.projectionGroup);
  }

  createHitShield() {
    const shieldGeo = new THREE.SphereGeometry(5.0, 20, 20);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0,
      wireframe: true
    });
    this.shield = new THREE.Mesh(shieldGeo, shieldMat);
    this.shield.position.y = 0.6;
    this.group.add(this.shield);
  }

  createHealthBarBillboard() {
    this.hpCanvas = document.createElement('canvas');
    this.hpCanvas.width = 1024;
    this.hpCanvas.height = 256;
    this.hpCtx = this.hpCanvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(this.hpCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.hpTexture,
      transparent: true,
      depthTest: false
    });
    this.hpSprite = new THREE.Sprite(spriteMat);
    this.hpSprite.position.set(0, 6.2, 0);
    this.hpSprite.scale.set(11, 2.75, 1);
    this.group.add(this.hpSprite);

    this.updateHealthBarCanvas();
  }

  updateHealthBarCanvas() {
    const ctx = this.hpCtx;
    const w = 1024;
    const h = 256;

    ctx.clearRect(0, 0, w, h);

    // Background Container Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(24, 24, w - 48, h - 48, 32);
    } else {
      ctx.rect(24, 24, w - 48, h - 48);
    }
    ctx.fill();
    ctx.stroke();

    const pct = Math.max(0, Math.round((this.health / this.maxHealth) * 100));

    // Title / Status Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🛸 ALIEN RAIDER  [${pct}%]`, w / 2, 92);

    // Subtitle timer
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 30px "JetBrains Mono", monospace';
    const remainingTime = Math.max(0, this.health).toFixed(1);
    ctx.fillText(`SHIELD DEPLETION: ${remainingTime}s / 5.0s`, w / 2, 134);

    // Health Bar Frame
    const barX = 54;
    const barY = 154;
    const barW = w - 108;
    const barH = 56;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barW, barH);

    // Health Bar Fill - Color changes smoothly
    const fillW = (this.health / this.maxHealth) * barW;
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);

    if (pct > 65) {
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#4ade80');
    } else if (pct > 30) {
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, '#facc15');
    } else {
      grad.addColorStop(0, '#b91c1c');
      grad.addColorStop(1, '#ef4444');
    }

    ctx.fillStyle = grad;
    if (fillW > 0) {
      ctx.fillRect(barX, barY, fillW, barH);
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(barX, barY, barW, barH);

    this.hpTexture.needsUpdate = true;
  }

  createVolumetricExplosionSystems() {
    // 1. Continuous Damage Fire & Smoke Puffs
    this.damageParticles = [];
    this.damageGroup = new THREE.Group();

    // 16 animated expanding fire/smoke spheres
    const puffGeo = new THREE.SphereGeometry(1, 10, 10);
    for (let i = 0; i < 20; i++) {
      const puffMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const puff = new THREE.Mesh(puffGeo, puffMat);
      puff.visible = false;
      this.damageGroup.add(puff);
      this.damageParticles.push({
        mesh: puff,
        mat: puffMat,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.6,
        isSmoke: false
      });
    }
    this.scene.add(this.damageGroup);

    // 2. High-Impact Explosion Fireball
    this.fireballGeo = new THREE.SphereGeometry(1, 24, 24);
    this.fireballMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.fireball = new THREE.Mesh(this.fireballGeo, this.fireballMat);
    this.fireball.position.copy(this.position);
    this.fireball.visible = false;
    this.scene.add(this.fireball);

    // Inner White-Hot Plasma Core
    this.innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending
    });
    this.innerCore = new THREE.Mesh(this.fireballGeo, this.innerCoreMat);
    this.innerCore.position.copy(this.position);
    this.innerCore.visible = false;
    this.scene.add(this.innerCore);

    // 3. Expanding Shockwave Ring
    const shockRingGeo = new THREE.RingGeometry(0.5, 1.8, 32);
    this.shockRingMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.shockRing = new THREE.Mesh(shockRingGeo, this.shockRingMat);
    this.shockRing.rotation.x = Math.PI / 2;
    this.shockRing.position.copy(this.position);
    this.shockRing.visible = false;
    this.scene.add(this.shockRing);

    // 4. Explosion Blast Plume Particles (30 large expanding billowing clouds)
    this.blastPuffs = [];
    this.blastGroup = new THREE.Group();
    for (let i = 0; i < 36; i++) {
      const bMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
      });
      const bMesh = new THREE.Mesh(puffGeo, bMat);
      bMesh.visible = false;
      this.blastGroup.add(bMesh);
      this.blastPuffs.push({
        mesh: bMesh,
        mat: bMat,
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1.2
      });
    }
    this.scene.add(this.blastGroup);

    this.explosionActive = false;
    this.explosionTimer = 0;
  }

  emitDamageFireSmoke() {
    const ufoPos = this.position;
    for (let i = 0; i < this.damageParticles.length; i++) {
      const p = this.damageParticles[i];
      if (p.life <= 0) {
        p.isSmoke = Math.random() > 0.4;
        p.maxLife = p.isSmoke ? 0.6 : 0.35;
        p.life = p.maxLife;

        // Position on saucer hull
        p.mesh.position.set(
          ufoPos.x + (Math.random() - 0.5) * 4.0,
          ufoPos.y + (Math.random() - 0.5) * 1.2,
          ufoPos.z + (Math.random() - 0.5) * 4.0
        );

        p.vel.set(
          (Math.random() - 0.5) * 2.0,
          Math.random() * 4.0 + 2.0, // billow upward
          (Math.random() - 0.5) * 2.0
        );

        p.mat.color.set(p.isSmoke ? 0x222222 : (Math.random() > 0.5 ? 0xff3b30 : 0xffaa00));
        p.mat.opacity = 0.8;
        p.mesh.scale.set(0.6, 0.6, 0.6);
        p.mesh.visible = true;
        break;
      }
    }
  }

  updateExplosionEffects(delta) {
    // 1. Update Damage Fire/Smoke Puffs
    for (let i = 0; i < this.damageParticles.length; i++) {
      const p = this.damageParticles[i];
      if (p.life > 0) {
        p.life -= delta;
        p.mesh.position.addScaledVector(p.vel, delta);
        const progress = 1 - (p.life / p.maxLife);

        // Grow and billow outwards
        const s = 0.6 + progress * (p.isSmoke ? 2.2 : 1.4);
        p.mesh.scale.set(s, s, s);

        // Fade opacity
        p.mat.opacity = (1 - progress) * (p.isSmoke ? 0.6 : 0.85);

        if (p.life <= 0) {
          p.mat.opacity = 0;
          p.mesh.visible = false;
        }
      }
    }

    // 2. Update Huge Defeat Explosion
    if (this.explosionActive) {
      this.explosionTimer += delta;

      // Expand main Fireball
      if (this.explosionTimer < 0.9) {
        const fireScale = this.explosionTimer * 24.0;
        this.fireball.scale.set(fireScale, fireScale, fireScale);
        this.fireballMat.opacity = Math.max(0, 1.0 - (this.explosionTimer / 0.9));
        this.fireball.visible = true;

        const coreScale = this.explosionTimer * 16.0;
        this.innerCore.scale.set(coreScale, coreScale, coreScale);
        this.innerCoreMat.opacity = Math.max(0, 1.0 - (this.explosionTimer / 0.6));
        this.innerCore.visible = true;
      } else {
        this.fireballMat.opacity = 0;
        this.innerCoreMat.opacity = 0;
        this.fireball.visible = false;
        this.innerCore.visible = false;
      }

      // Expand Shockwave Ring
      if (this.explosionTimer < 1.1) {
        const ringScale = this.explosionTimer * 28.0;
        this.shockRing.scale.set(ringScale, ringScale, ringScale);
        this.shockRingMat.opacity = Math.max(0, 1.0 - (this.explosionTimer / 1.1));
        this.shockRing.visible = true;
      } else {
        this.shockRingMat.opacity = 0;
        this.shockRing.visible = false;
      }

      // Billow out explosive blast smoke clouds
      for (let i = 0; i < this.blastPuffs.length; i++) {
        const b = this.blastPuffs[i];
        if (b.life > 0) {
          b.life -= delta;
          b.mesh.position.addScaledVector(b.vel, delta);
          b.vel.multiplyScalar(0.96); // air drag

          const progress = 1 - (b.life / b.maxLife);
          const s = 1.0 + progress * 7.5;
          b.mesh.scale.set(s, s, s);

          // Color transition: Fire (Yellow/Orange) -> Dark Smoke
          if (progress < 0.25) {
            b.mat.color.set(0xffea00); // intense yellow
            b.mat.opacity = 0.9;
          } else if (progress < 0.55) {
            b.mat.color.set(0xff3300); // fiery orange
            b.mat.opacity = 0.75 * (1 - progress);
          } else {
            b.mat.color.set(0x1a1a1a); // dark smoke
            b.mat.opacity = 0.45 * (1 - progress);
          }

          if (b.life <= 0) {
            b.mat.opacity = 0;
            b.mesh.visible = false;
          }
        }
      }
    }
  }

  createAlienBombSystem() {
    this.bombs = [];
    this.bombPoolSize = 3;

    // Create pooled bomb projectile meshes
    for (let i = 0; i < this.bombPoolSize; i++) {
      const bombGroup = new THREE.Group();

      // Core Spiked Plasma Bomb Sphere
      const bombCoreGeo = new THREE.SphereGeometry(0.55, 12, 12);
      const bombCoreMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2
      });
      const bombCore = new THREE.Mesh(bombCoreGeo, bombCoreMat);
      bombGroup.add(bombCore);

      // Glowing Magma / Plasma Spikes
      const spikeGeo = new THREE.ConeGeometry(0.18, 0.45, 6);
      const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
      const spikeDirs = [
        [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1],
        [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.7, 0], [-0.7, -0.7, 0]
      ];
      spikeDirs.forEach(([dx, dy, dz]) => {
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set(dx * 0.55, dy * 0.55, dz * 0.55);
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
        bombGroup.add(spike);
      });

      // Flashing Fuse / Core Light
      const fuseLight = new THREE.PointLight(0xff003b, 1.8, 12);
      bombGroup.add(fuseLight);

      bombGroup.visible = false;
      this.scene.add(bombGroup);

      this.bombs.push({
        group: bombGroup,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        active: false,
        fuseLight: fuseLight,
        smokeTimer: 0
      });
    }

    // Bomb Detonation Smoke & Fire Particle Systems (Pooled)
    this.bombBlastPuffs = [];
    for (let i = 0; i < 24; i++) {
      const geo = new THREE.DodecahedronGeometry(0.5, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffea00,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.scene.add(mesh);
      this.bombBlastPuffs.push({
        mesh: mesh,
        mat: mat,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.8
      });
    }
  }

  throwLobbedBomb() {
    if (this.isDefeated) return;

    // Find available bomb in pool
    const bomb = this.bombs.find(b => !b.active);
    if (!bomb) return;

    // Origin: Alien hands / UFO nose (X=0, Y=11.5, Z=-24)
    const origin = this.position.clone().add(new THREE.Vector3(0, 1.0, 2.0));
    bomb.pos.copy(origin);
    bomb.group.position.copy(origin);
    bomb.group.visible = true;
    bomb.active = true;

    // Target: Random location near player's platform (X between -8 and 8, Z between 8 and 22)
    let targetX = (Math.random() - 0.5) * 16;
    let targetZ = 12 + Math.random() * 10;
    if (this.player && this.player.position) {
      targetX = THREE.MathUtils.clamp(this.player.position.x + (Math.random() - 0.5) * 6, -14, 14);
      targetZ = THREE.MathUtils.clamp(this.player.position.z + (Math.random() - 0.5) * 6, 6, 24);
    }
    const targetY = 0.1;

    // Lob flight duration (e.g. 2.0 seconds)
    const flightTime = 2.0;
    const gravity = 24.0; // parabolic gravity pull

    // Calculate initial trajectory velocities to arch over the force field (which is at Y=12, Z=-16)
    // Vy = (Y_target - Y_start + 0.5 * g * t^2) / t
    const vY = (targetY - origin.y + 0.5 * gravity * Math.pow(flightTime, 2)) / flightTime;
    const vX = (targetX - origin.x) / flightTime;
    const vZ = (targetZ - origin.z) / flightTime;

    bomb.vel.set(vX, vY, vZ);
    bomb.gravity = gravity;
  }

  detonateBomb(bomb) {
    bomb.active = false;
    bomb.group.visible = false;

    // Play explosion sound!
    if (window.soundFX && window.soundFX.playExplosion) {
      window.soundFX.playExplosion();
    }

    // Trigger local ground fireball explosion puff
    const blastOrigin = bomb.pos.clone();
    blastOrigin.y = Math.max(0.1, blastOrigin.y);

    for (let i = 0; i < this.bombBlastPuffs.length; i++) {
      const p = this.bombBlastPuffs[i];
      p.pos.copy(blastOrigin);
      p.mesh.position.copy(blastOrigin);
      p.life = 0.6 + Math.random() * 0.4;
      p.maxLife = p.life;
      p.mat.opacity = 0.95;

      const phi = Math.random() * Math.PI * 0.5; // Upper dome
      const theta = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 12;

      p.vel.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed,
        Math.sin(phi) * Math.sin(theta) * speed
      );
    }
  }

  updateBombs(delta) {
    // 1. Update In-Flight Bombs
    this.bombs.forEach(b => {
      if (!b.active) return;

      // Apply parabolic gravity & velocity
      b.vel.y -= b.gravity * delta;
      b.pos.addScaledVector(b.vel, delta);
      b.group.position.copy(b.pos);

      // Rotate bomb as it tumbles in air
      b.group.rotation.x += delta * 6;
      b.group.rotation.y += delta * 8;

      // Flash fuse light
      b.fuseLight.intensity = 1.5 + Math.sin(performance.now() * 0.02) * 1.0;

      // Check ground collision (landed on platform / chasm floor)
      if (b.pos.y <= 0.1 && b.vel.y < 0) {
        this.detonateBomb(b);
      }
    });

    // 2. Update Bomb Blast Particles
    if (this.bombBlastPuffs) {
      this.bombBlastPuffs.forEach(p => {
        if (p.life > 0) {
          p.life -= delta;
          p.pos.addScaledVector(p.vel, delta);
          p.vel.multiplyScalar(0.94);
          p.mesh.position.copy(p.pos);

          const progress = 1 - (p.life / p.maxLife);
          const s = 0.8 + progress * 4.5;
          p.mesh.scale.set(s, s, s);

          if (progress < 0.3) {
            p.mat.color.set(0xffea00);
            p.mat.opacity = 0.95;
          } else if (progress < 0.65) {
            p.mat.color.set(0xff3300);
            p.mat.opacity = 0.8 * (1 - progress);
          } else {
            p.mat.color.set(0x1a1a1a);
            p.mat.opacity = 0.45 * (1 - progress);
          }

          if (p.life <= 0) {
            p.mat.opacity = 0;
          }
        }
      });
    }
  }

  takeLaserDamage(delta) {
    if (this.isDefeated) return;

    this.isHitThisFrame = true;
    this.health = Math.max(0, this.health - delta);
    this.updateHealthBarCanvas();

    // Emit fire and smoke clouds directly on the hull
    this.emitDamageFireSmoke();
    this.emitDamageFireSmoke();

    // Sound effect throttling
    this.hitSoundTimer += delta;
    if (this.hitSoundTimer > 0.08) {
      window.soundFX.playUfoHit();
      this.hitSoundTimer = 0;
    }

    // Shield flash
    this.shield.material.opacity = 0.9;

    // Check Defeat
    if (this.health <= 0 && !this.isDefeated) {
      this.triggerDefeat();
    }
  }

  triggerDefeat() {
    this.isDefeated = true;
    window.soundFX.playVictory();
    window.soundFX.playExplosion();

    // Turn off player laser beam
    if (this.player && this.player.isFiring) {
      this.player.toggleFiring(false);
    } else if (window.game && window.game.player && window.game.player.isFiring) {
      window.game.player.toggleFiring(false);
    }

    // Instantly hide UFO meshes & HP bar
    this.saucer.visible = false;
    this.alienGroup.visible = false;
    this.dome.visible = false;
    this.shield.visible = false;
    this.hpSprite.visible = false;
    if (this.tractorBeam) this.tractorBeam.visible = false;
    if (this.ufoLight) this.ufoLight.visible = false;
    if (this.projectionGroup) this.projectionGroup.visible = false;

    // Clear active in-flight bombs
    if (this.bombs) {
      this.bombs.forEach(b => {
        b.active = false;
        b.group.visible = false;
      });
    }

    // Trigger Volumetric Fireball & Blast
    this.explosionActive = true;
    this.explosionTimer = 0;
    const ufoPos = this.position;

    this.fireball.position.copy(ufoPos);
    this.innerCore.position.copy(ufoPos);
    this.shockRing.position.copy(ufoPos);

    this.fireballMat.opacity = 1.0;
    this.innerCoreMat.opacity = 1.0;
    this.shockRingMat.opacity = 1.0;

    // Initialize blast smoke/fire puffs radiating outward in all 3D directions
    for (let i = 0; i < this.blastPuffs.length; i++) {
      const b = this.blastPuffs[i];
      b.mesh.position.copy(ufoPos);
      b.maxLife = 1.0 + Math.random() * 0.5;
      b.life = b.maxLife;
      b.mat.opacity = 0.95;

      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const speed = 12 + Math.random() * 18;

      b.vel.set(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      );
    }

    setTimeout(() => {
      if (window.uiManager) {
        window.uiManager.showVictoryModal();
      }
    }, 1200);
  }

  update(delta) {
    this.updateExplosionEffects(delta);
    this.updateBombs(delta);

    this.hoverTime += delta;
    this.spinAngle += delta * 1.5;
    this.saucer.rotation.y = this.spinAngle;

    if (!this.isDefeated) {
      this.position.y = this.initialPosition.y + Math.sin(this.hoverTime * 2.2) * 0.4;
      this.group.position.copy(this.position);

      // Periodic lobbed bomb throwing at player
      this.bombCooldownTimer -= delta;
      if (this.bombCooldownTimer <= 0) {
        this.throwLobbedBomb();
        this.bombCooldownTimer = 6.5 + Math.random() * 4.5; // Next bomb in 6.5 - 11.0 seconds
      }

      // Pulse downward tractor beam
      if (this.tractorMat) {
        this.tractorMat.opacity = 0.14 + Math.sin(this.hoverTime * 3.5) * 0.06;
      }
      if (this.ufoLight) {
        this.ufoLight.intensity = 1.6 + Math.sin(this.hoverTime * 3.5) * 0.4;
      }

      // Animate psychic force field projection beams to the 4 barrier corners fading in and out
      if (this.projectionBeams) {
        this.projectionBeams.forEach((beam) => {
          // Subtle individual undulating sine pulse for mystical organic energy
          const pulse = 0.5 + 0.45 * Math.sin(this.hoverTime * 3.2 + beam.phase);
          beam.coreMat.opacity = 0.35 + pulse * 0.55;
          beam.glowMat.opacity = 0.15 + pulse * 0.4;
        });
      }

      // Player Tracking: Alien torso and head smoothly rotate to follow player movement
      let targetYaw = 0;
      let targetPitch = 0;
      if (this.player && this.player.position) {
        const dx = this.player.position.x - this.position.x;
        const dz = this.player.position.z - this.position.z;
        const dy = (this.player.position.y + 1.5) - (this.position.y + 2.0);
        const distHoriz = Math.sqrt(dx * dx + dz * dz);

        targetYaw = Math.atan2(dx, dz);
        targetPitch = -Math.atan2(dy, distHoriz);
      }

      // Smoothly rotate alien body and head toward player
      this.alienGroup.rotation.y = THREE.MathUtils.lerp(this.alienGroup.rotation.y, targetYaw, delta * 4.5);

      if (this.isHitThisFrame) {
        this.alienHead.rotation.z = (Math.random() - 0.5) * 0.5;
        this.alienHead.rotation.x = targetPitch + (Math.random() - 0.5) * 0.4;
      } else {
        this.alienHead.rotation.z = THREE.MathUtils.lerp(this.alienHead.rotation.z, Math.sin(this.hoverTime * 3) * 0.08, delta * 5);
        this.alienHead.rotation.x = THREE.MathUtils.lerp(this.alienHead.rotation.x, targetPitch, delta * 6);
      }

      // Pulse eye point light with subtle menacing breathing flicker
      if (this.eyeLight) {
        this.eyeLight.intensity = 2.0 + Math.sin(this.hoverTime * 8.0) * 0.6;
      }
    }

    if (this.shield.material.opacity > 0) {
      this.shield.material.opacity = Math.max(0, this.shield.material.opacity - delta * 2.5);
    }

    this.isHitThisFrame = false;
  }

  reset() {
    this.health = this.maxHealth;
    this.isDefeated = false;
    this.explosionActive = false;
    this.explosionTimer = 0;
    this.bombCooldownTimer = 4.0;
    this.hoverTime = 0;
    this.spinAngle = 0;

    this.saucer.visible = true;
    this.alienGroup.visible = true;
    this.dome.visible = true;
    this.hpSprite.visible = true;
    if (this.tractorBeam) this.tractorBeam.visible = true;
    if (this.ufoLight) this.ufoLight.visible = true;
    if (this.projectionGroup) this.projectionGroup.visible = true;

    if (this.projectionBeams) {
      this.projectionBeams.forEach((beam) => {
        beam.coreMat.opacity = 0.7;
        beam.glowMat.opacity = 0.4;
      });
    }

    if (this.bombs) {
      this.bombs.forEach(b => {
        b.active = false;
        b.group.visible = false;
      });
    }

    if (this.bombBlastPuffs) {
      this.bombBlastPuffs.forEach(p => {
        p.life = 0;
        p.mat.opacity = 0;
      });
    }

    this.fireballMat.opacity = 0;
    this.innerCoreMat.opacity = 0;
    this.shockRingMat.opacity = 0;
    this.fireball.visible = false;
    this.innerCore.visible = false;
    this.shockRing.visible = false;
    this.fireball.scale.set(0.001, 0.001, 0.001);
    this.innerCore.scale.set(0.001, 0.001, 0.001);
    this.shockRing.scale.set(0.001, 0.001, 0.001);

    for (let i = 0; i < this.blastPuffs.length; i++) {
      this.blastPuffs[i].life = 0;
      this.blastPuffs[i].mat.opacity = 0;
      this.blastPuffs[i].mesh.visible = false;
      this.blastPuffs[i].mesh.scale.set(0.001, 0.001, 0.001);
    }

    for (let i = 0; i < this.damageParticles.length; i++) {
      this.damageParticles[i].life = 0;
      this.damageParticles[i].mat.opacity = 0;
      this.damageParticles[i].mesh.visible = false;
      this.damageParticles[i].mesh.scale.set(0.001, 0.001, 0.001);
    }

    if (this.bombBlastPuffs) {
      this.bombBlastPuffs.forEach(p => {
        p.life = 0;
        p.mat.opacity = 0;
        p.mesh.visible = false;
        p.mesh.scale.set(0.001, 0.001, 0.001);
      });
    }

    this.position.copy(this.initialPosition);
    this.group.position.copy(this.position);
    this.group.rotation.set(0, 0, 0);

    this.updateHealthBarCanvas();
  }
}

window.AlienUFO = AlienUFO;
