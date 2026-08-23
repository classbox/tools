/**
 * World & Environment Module
 * Creates a stunning atmospheric night-time world with glowing alive lava,
 * floating volcanic embers, twinkling starry sky, volumetric moonlight,
 * bioluminescent crystals, and glowing cybernetic platforms.
 */
class GameWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.obstacles = [];
    this.animTime = 0;

    this.createLighting();
    this.createNightSky();
    this.createEnvironment();
    this.createLavaEmbersSystem();
    this.createChasmMist();
  }

  // Generate procedural Roblox Stud texture for platforms
  createStudTexture(color = '#1e293b', studColor = '#334155') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);

    const drawStud = (cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = studColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy - 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fill();
    };

    drawStud(32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // Generate high-resolution procedural molten magma texture
  createLavaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Deep burning magma background
    const bgGrad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600);
    bgGrad.addColorStop(0, '#ff3b00');
    bgGrad.addColorStop(0.5, '#dc2626');
    bgGrad.addColorStop(1, '#991b1b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Glowing intense white-hot / yellow magma currents
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawMagmaStream = (x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2, width, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      ctx.stroke();
    };

    // Layer 1: Broad fiery orange under-glow streams
    drawMagmaStream(0, 200, 300, 450, 700, 150, 1024, 400, 70, 'rgba(255, 106, 0, 0.85)');
    drawMagmaStream(200, 0, 450, 400, 500, 800, 350, 1024, 60, 'rgba(255, 80, 0, 0.85)');
    drawMagmaStream(0, 800, 400, 600, 600, 900, 1024, 750, 65, 'rgba(255, 120, 0, 0.85)');
    drawMagmaStream(750, 0, 850, 500, 650, 700, 900, 1024, 55, 'rgba(255, 90, 0, 0.85)');

    // Layer 2: Intense bright yellow core veins
    drawMagmaStream(0, 200, 300, 450, 700, 150, 1024, 400, 26, '#fde047');
    drawMagmaStream(200, 0, 450, 400, 500, 800, 350, 1024, 22, '#facc15');
    drawMagmaStream(0, 800, 400, 600, 600, 900, 1024, 750, 24, '#fef08a');
    drawMagmaStream(750, 0, 850, 500, 650, 700, 900, 1024, 20, '#fde047');

    // Layer 3: White-hot superheated centerline
    drawMagmaStream(0, 200, 300, 450, 700, 150, 1024, 400, 8, '#ffffff');
    drawMagmaStream(200, 0, 450, 400, 500, 800, 350, 1024, 7, '#ffffff');
    drawMagmaStream(0, 800, 400, 600, 600, 900, 1024, 750, 8, '#ffffff');

    // Layer 4: Hardened basalt crust islands
    ctx.fillStyle = '#1c1917';
    for (let i = 0; i < 65; i++) {
      const cx = (i * 137.5) % 1024;
      const cy = (i * 223.7) % 1024;
      const r = 24 + (i % 7) * 9;

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Basalt crust border rim
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }

  createLighting() {
    // Deep twilight atmospheric ambient
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 0.65);
    this.scene.add(ambientLight);

    // Silvery cool moonlight casting long dramatic shadows
    this.moonLight = new THREE.DirectionalLight(0xc7d2fe, 0.9);
    this.moonLight.position.set(-50, 75, 40);
    this.moonLight.castShadow = true;
    this.moonLight.shadow.mapSize.width = 2048;
    this.moonLight.shadow.mapSize.height = 2048;
    this.moonLight.shadow.camera.near = 1.0;
    this.moonLight.shadow.camera.far = 220;
    this.moonLight.shadow.camera.left = -60;
    this.moonLight.shadow.camera.right = 60;
    this.moonLight.shadow.camera.top = 60;
    this.moonLight.shadow.camera.bottom = -60;
    this.moonLight.shadow.bias = -0.0004;
    this.scene.add(this.moonLight);

    // Sky / Ground bounce hemisphere light (Deep night sky vs glowing magma ground)
    const hemiLight = new THREE.HemisphereLight(0x312e81, 0xb45309, 0.45);
    this.scene.add(hemiLight);

    // Flickering lava ambient point lights in the chasm
    this.lavaLight1 = new THREE.PointLight(0xff4500, 2.5, 90);
    this.lavaLight1.position.set(16, -3, -6);
    this.scene.add(this.lavaLight1);

    this.lavaLight2 = new THREE.PointLight(0xff3300, 2.2, 90);
    this.lavaLight2.position.set(8, -3, -38);
    this.scene.add(this.lavaLight2);

    this.lavaLightCenter = new THREE.PointLight(0xff5500, 2.0, 110);
    this.lavaLightCenter.position.set(0, -4, -18);
    this.scene.add(this.lavaLightCenter);
  }

  createNightSky() {
    // Deep midnight indigo fog
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.008);

    // 1. Shimmering Starfield (1,200 stars)
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    this.starTwinkleSeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Hemisphere dome distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0) * 0.5; // Upper half dome
      const radius = 220 + Math.random() * 80;

      starPos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.max(15, radius * Math.cos(phi));
      starPos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Star hues: Diamond white, ice blue, cyan, pale gold
      const tone = Math.random();
      if (tone > 0.7) {
        starColors[i * 3] = 0.75;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 1.0;
      } else if (tone > 0.4) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 1.0;
        starColors[i * 3 + 2] = 1.0;
      } else {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 0.6;
      }

      this.starTwinkleSeeds[i] = Math.random() * Math.PI * 2;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starPoints);

    // 2. Stylized Glowing Moon in the night sky
    this.createMoon();

    // 3. Drifting Night Clouds with Moonlight Rim Highlights
    this.createNightClouds();
  }

  createMoon() {
    this.moonGroup = new THREE.Group();
    this.moonGroup.position.set(-65, 85, -80);

    // Moon Sphere Core
    const moonGeo = new THREE.SphereGeometry(7.5, 24, 24);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xf1f5f9
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(moonMesh);

    // Glowing Moon Atmospheric Glow Halo
    const haloGeo = new THREE.PlaneGeometry(36, 36);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(224, 242, 254, 0.8)');
    grad.addColorStop(0.35, 'rgba(186, 230, 253, 0.35)');
    grad.addColorStop(0.7, 'rgba(147, 197, 253, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const haloTex = new THREE.CanvasTexture(canvas);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.lookAt(0, 0, 16);
    this.moonGroup.add(haloMesh);

    this.scene.add(this.moonGroup);
  }

  createNightClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0x1e293b,
      emissive: 0x0f172a,
      transparent: true,
      opacity: 0.65
    });

    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group();
      const numBlocks = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < numBlocks; b++) {
        const sizeX = 14 + Math.random() * 12;
        const sizeY = 3 + Math.random() * 3;
        const sizeZ = 12 + Math.random() * 10;
        const blockGeo = new THREE.BoxGeometry(sizeX, sizeY, sizeZ);
        const block = new THREE.Mesh(blockGeo, cloudMat);
        block.position.set(
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 16
        );
        cloud.add(block);
      }
      cloud.position.set(
        (Math.random() - 0.5) * 240,
        42 + Math.random() * 18,
        (Math.random() - 0.5) * 240
      );
      this.cloudGroup.add(cloud);
    }
    this.scene.add(this.cloudGroup);
  }

  createEnvironment() {
    // 1. Player Platform (Sci-Fi Cybernetic Outpost with Dark Studs & Glowing Edges)
    const platformTex = this.createStudTexture('#0f172a', '#1e293b');
    platformTex.repeat.set(16, 16);

    const playerPlatGeo = new THREE.BoxGeometry(34, 4, 24);
    const playerPlatMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      map: platformTex,
      roughness: 0.4,
      metalness: 0.6
    });
    const playerPlatform = new THREE.Mesh(playerPlatGeo, playerPlatMat);
    playerPlatform.position.set(0, -2, 16);
    playerPlatform.receiveShadow = true;
    this.scene.add(playerPlatform);
    this.colliders.push(playerPlatform);

    // Platform Glowing Neon Edge Trims
    const edgeTrimMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const edgeFront = new THREE.Mesh(new THREE.BoxGeometry(34.2, 0.3, 0.4), edgeTrimMat);
    edgeFront.position.set(0, 0.05, 4.0);
    this.scene.add(edgeFront);

    // Platform Obsidian Cliff Foundation
    const baseGeo = new THREE.BoxGeometry(36, 14, 26);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.85,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, -9, 16);
    this.scene.add(baseMesh);

    // 2. Alive Molten Magma Sea in the Chasm
    this.lavaTex = this.createLavaTexture();
    const lavaGeo = new THREE.PlaneGeometry(360, 360, 48, 48);
    this.lavaMat = new THREE.MeshStandardMaterial({
      map: this.lavaTex,
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 0.95,
      roughness: 0.25,
      metalness: 0.1
    });
    this.lavaFloor = new THREE.Mesh(lavaGeo, this.lavaMat);
    this.lavaFloor.rotation.x = -Math.PI / 2;
    this.lavaFloor.position.y = -6.5;
    this.scene.add(this.lavaFloor);

    // 3. Mirror Pedestals with Glowing Runes / Basalt Pillars
    this.createMirrorPedestals();

    // 4. See-Through Energy Force Field Barrier in front of Alien UFO
    this.createSeeThroughBarrier();

    // 5. Bioluminescent Alien Flora & Glowing Crystals
    this.createBioluminescentCrystals();

    // 6. Platform Corner Light Beacons & Sci-Fi Guardrails
    this.createGuardRailsAndBeacons();
  }

  createMirrorPedestals() {
    // Pedestal 1 (Alpha): X = 16, Z = -6
    const pedGeo = new THREE.CylinderGeometry(4.4, 5.8, 16, 20);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.7,
      metalness: 0.5
    });

    const m1Pedestal = new THREE.Mesh(pedGeo, pedMat);
    m1Pedestal.position.set(16, -7.5, -6);
    m1Pedestal.receiveShadow = true;
    m1Pedestal.castShadow = true;
    this.scene.add(m1Pedestal);

    // Glowing Neon Base Ring (Cyan)
    const ringGeo = new THREE.TorusGeometry(4.5, 0.22, 12, 32);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(16, 0.08, -6);
    this.scene.add(ring1);

    // Pedestal 2 (Beta): X = 8, Z = -38
    const m2Pedestal = m1Pedestal.clone();
    m2Pedestal.position.set(8, -7.5, -38);
    this.scene.add(m2Pedestal);

    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(8, 0.08, -38);
    this.scene.add(ring2);
  }

  createBioluminescentCrystals() {
    this.crystals = [];
    const crystalGeo = new THREE.ConeGeometry(0.6, 2.2, 5);
    const colors = [0x00ffff, 0xa855f7, 0x38bdf8, 0x10b981];

    const spawnCluster = (cx, cy, cz) => {
      const clusterGroup = new THREE.Group();
      clusterGroup.position.set(cx, cy, cz);

      for (let i = 0; i < 4; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i % colors.length],
          emissive: colors[i % colors.length],
          emissiveIntensity: 0.85,
          roughness: 0.1,
          metalness: 0.8
        });
        const crystal = new THREE.Mesh(crystalGeo, mat);
        crystal.position.set(
          (Math.random() - 0.5) * 1.4,
          1.1,
          (Math.random() - 0.5) * 1.4
        );
        crystal.rotation.set(
          (Math.random() - 0.5) * 0.4,
          Math.random() * Math.PI,
          (Math.random() - 0.5) * 0.4
        );
        const s = 0.6 + Math.random() * 0.6;
        crystal.scale.set(s, s, s);
        clusterGroup.add(crystal);
        this.crystals.push(mat);
      }
      this.scene.add(clusterGroup);
    };

    // Place crystal clusters along player platform edges
    spawnCluster(-15, 0, 8);
    spawnCluster(15, 0, 8);
    spawnCluster(-15, 0, 24);
    spawnCluster(15, 0, 24);

    // Place crystal clusters near mirror pedestals
    spawnCluster(13, 0.1, -4);
    spawnCluster(10, 0.1, -36);
  }

  createLavaEmbersSystem() {
    this.emberCount = 180;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.emberCount * 3);
    const colors = new Float32Array(this.emberCount * 3);

    this.emberPool = [];

    for (let i = 0; i < this.emberCount; i++) {
      const x = (Math.random() - 0.5) * 160;
      const y = -6.0 + Math.random() * 35;
      const z = (Math.random() - 0.5) * 160 - 15;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Magma embers: Fiery Gold -> Bright Orange
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.3 + Math.random() * 0.6;
      colors[i * 3 + 2] = 0.05;

      this.emberPool.push({
        x: x,
        y: y,
        z: z,
        speedY: 1.5 + Math.random() * 3.2,
        driftX: (Math.random() - 0.5) * 1.2,
        driftZ: (Math.random() - 0.5) * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    emberGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const emberMat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.emberPoints = new THREE.Points(emberGeo, emberMat);
    this.scene.add(this.emberPoints);
  }

  createChasmMist() {
    // Low-density drifting chasm haze
    this.mistCount = 28;
    this.mistGroup = new THREE.Group();
    const mistGeo = new THREE.SphereGeometry(3.5, 8, 8);

    this.mistParticles = [];
    for (let i = 0; i < this.mistCount; i++) {
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(mistGeo, mistMat);
      mesh.position.set(
        (Math.random() - 0.5) * 120,
        -4.5 + Math.random() * 4.0,
        (Math.random() - 0.5) * 120 - 15
      );
      const s = 1.5 + Math.random() * 2.0;
      mesh.scale.set(s, s * 0.5, s);
      this.mistGroup.add(mesh);
      this.mistParticles.push({
        mesh: mesh,
        speedX: (Math.random() - 0.5) * 1.0,
        speedZ: (Math.random() - 0.5) * 1.0
      });
    }
    this.scene.add(this.mistGroup);
  }

  createSeeThroughBarrier() {
    const shieldWidth = 20;
    const shieldHeight = 14;

    const shieldGeo = new THREE.PlaneGeometry(shieldWidth, shieldHeight);

    // Glowing futuristic energy matrix texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    const size = 32;
    for (let x = 0; x < 512; x += size) {
      for (let y = 0; y < 512; y += size) {
        ctx.strokeRect(x, y, size, size);
      }
    }

    this.shieldTex = new THREE.CanvasTexture(canvas);
    this.shieldTex.wrapS = THREE.RepeatWrapping;
    this.shieldTex.wrapT = THREE.RepeatWrapping;
    this.shieldTex.repeat.set(5, 3);

    this.shieldMat = new THREE.MeshBasicMaterial({
      map: this.shieldTex,
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.shieldMesh = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shieldMesh.position.set(0, 5, -16);
    this.scene.add(this.shieldMesh);
    this.obstacles.push(this.shieldMesh);
    this.glassBarrier = this.shieldMesh;

    // Hex Deflection Ring Ripple mesh on glass
    const rippleGeo = new THREE.RingGeometry(0.5, 3.2, 6);
    this.rippleMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.glassRipple = new THREE.Mesh(rippleGeo, this.rippleMat);
    this.glassRipple.position.set(0, 5, -15.9);
    this.glassRipple.visible = false;
    this.scene.add(this.glassRipple);

    // Neon Frame around the See-Through Barrier
    const frameGeo = new THREE.BoxGeometry(shieldWidth + 0.6, shieldHeight + 0.6, 0.4);
    const edges = new THREE.EdgesGeometry(frameGeo);
    this.barrierFrame = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00e5ff, linewidth: 3 }));
    this.barrierFrame.position.set(0, 5, -16);
    this.scene.add(this.barrierFrame);

    this.glassHitTimer = 0;
  }

  triggerGlassDeflect(hitPoint) {
    if (this.glassRipple) {
      this.glassRipple.visible = true;
      this.glassRipple.position.set(hitPoint.x, hitPoint.y, -15.88);
      this.glassRipple.scale.set(0.4, 0.4, 0.4);
      this.rippleMat.opacity = 1.0;
      this.glassHitTimer = 0.3;
    }
    if (this.shieldMat) {
      this.shieldMat.color.set(0xffffff);
      this.shieldMat.opacity = 1.0;
    }
  }

  clearGlassDeflect() {
    this.glassHitTimer = 0;
    if (this.glassRipple) {
      this.glassRipple.visible = false;
      this.rippleMat.opacity = 0;
    }
    if (this.shieldMat) {
      this.shieldMat.color.set(0x00e5ff);
      this.shieldMat.opacity = 0.75;
    }
  }

  updateGlassBarrier(delta) {
    if (this.glassHitTimer > 0) {
      this.glassHitTimer -= delta;
      const progress = 1 - (this.glassHitTimer / 0.3);

      const s = 0.4 + progress * 2.8;
      this.glassRipple.scale.set(s, s, s);
      this.glassRipple.rotation.z += delta * 6;
      this.rippleMat.opacity = Math.max(0, 1.0 - progress);

      if (this.shieldMat) {
        this.shieldMat.color.set(0x00ffff);
        this.shieldMat.opacity = 0.95;
      }

      if (this.glassHitTimer <= 0) {
        this.clearGlassDeflect();
      }
    }
  }

  createGuardRailsAndBeacons() {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2
    });

    const neonRailMat = new THREE.MeshBasicMaterial({ color: 0x00a2ff });

    // Guard rails
    const railGeoL = new THREE.BoxGeometry(0.35, 1.2, 24);
    const railL = new THREE.Mesh(railGeoL, railMat);
    railL.position.set(-16.8, 0.6, 16);
    this.scene.add(railL);

    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 24), neonRailMat);
    stripL.position.set(-16.8, 1.15, 16);
    this.scene.add(stripL);

    const railR = new THREE.Mesh(railGeoL, railMat);
    railR.position.set(16.8, 0.6, 16);
    this.scene.add(railR);

    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 24), neonRailMat);
    stripR.position.set(16.8, 1.15, 16);
    this.scene.add(stripR);

    const railBackGeo = new THREE.BoxGeometry(34, 1.2, 0.35);
    const railB = new THREE.Mesh(railBackGeo, railMat);
    railB.position.set(0, 0.6, 27.8);
    this.scene.add(railB);

    const stripB = new THREE.Mesh(new THREE.BoxGeometry(34, 0.1, 0.4), neonRailMat);
    stripB.position.set(0, 1.15, 27.8);
    this.scene.add(stripB);

    // Glowing Cybernetic Light Pylons at the forward edge corners
    this.createBeaconPylon(-16.5, 0, 4.2, 0x00e5ff);
    this.createBeaconPylon(16.5, 0, 4.2, 0x00e5ff);
  }

  createBeaconPylon(x, y, z, colorHex) {
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(x, y, z);

    const poleGeo = new THREE.CylinderGeometry(0.25, 0.35, 3.2, 12);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.6;
    pylonGroup.add(pole);

    const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
    const crystalMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3.4;
    pylonGroup.add(crystal);

    const pylonLight = new THREE.PointLight(colorHex, 1.5, 18);
    pylonLight.position.y = 3.4;
    pylonGroup.add(pylonLight);

    this.scene.add(pylonGroup);
  }

  // Update dynamic atmospheric animations
  update(delta) {
    this.animTime += delta;

    // 1. Update Glass Deflection animation
    this.updateGlassBarrier(delta);

    // 2. Animate Alive Molten Lava Sea (Texture UV oscillation + Emissive Heat Breathing)
    if (this.lavaTex) {
      this.lavaTex.offset.x = (this.animTime * 0.015) % 1;
      this.lavaTex.offset.y = (this.animTime * 0.022) % 1;
    }
    if (this.lavaMat) {
      this.lavaMat.emissiveIntensity = 0.85 + Math.sin(this.animTime * 2.5) * 0.25;
    }

    // 3. Flicker Lava Point Lights
    if (this.lavaLight1) {
      this.lavaLight1.intensity = 2.2 + Math.sin(this.animTime * 7.1) * 0.4;
    }
    if (this.lavaLight2) {
      this.lavaLight2.intensity = 2.0 + Math.cos(this.animTime * 6.3) * 0.35;
    }
    if (this.lavaLightCenter) {
      this.lavaLightCenter.intensity = 1.8 + Math.sin(this.animTime * 5.5) * 0.3;
    }

    // 4. Animate Rising Lava Embers
    if (this.emberPoints) {
      const pos = this.emberPoints.geometry.attributes.position;
      for (let i = 0; i < this.emberCount; i++) {
        const e = this.emberPool[i];
        e.y += e.speedY * delta;
        e.x += (e.driftX + Math.sin(this.animTime * 2 + e.phase) * 0.8) * delta;
        e.z += (e.driftZ + Math.cos(this.animTime * 2 + e.phase) * 0.8) * delta;

        // Reset ember when it rises high
        if (e.y > 38.0) {
          e.y = -6.5;
          e.x = (Math.random() - 0.5) * 160;
          e.z = (Math.random() - 0.5) * 160 - 15;
        }

        pos.setXYZ(i, e.x, e.y, e.z);
      }
      pos.needsUpdate = true;
    }

    // 5. Slowly Drift Clouds in the Night Sky
    if (this.cloudGroup) {
      this.cloudGroup.children.forEach(cloud => {
        cloud.position.x += delta * 1.2;
        if (cloud.position.x > 140) {
          cloud.position.x = -140;
        }
      });
    }

    // 6. Slowly Drift Chasm Mist
    if (this.mistParticles) {
      this.mistParticles.forEach(p => {
        p.mesh.position.x += p.speedX * delta;
        p.mesh.position.z += p.speedZ * delta;
        if (p.mesh.position.x > 70) p.mesh.position.x = -70;
        if (p.mesh.position.x < -70) p.mesh.position.x = 70;
        if (p.mesh.position.z > 50) p.mesh.position.z = -70;
        if (p.mesh.position.z < -70) p.mesh.position.z = 50;
      });
    }

    // 7. Pulse Bioluminescent Crystals
    if (this.crystals) {
      const pulse = 0.75 + Math.sin(this.animTime * 3.0) * 0.25;
      this.crystals.forEach(mat => {
        mat.emissiveIntensity = pulse;
      });
    }
  }

  reset() {
    this.animTime = 0;
    this.clearGlassDeflect();
    if (this.shieldMesh) {
      this.shieldMesh.visible = true;
    }
    if (this.shieldMat) {
      this.shieldMat.color.set(0x00e5ff);
      this.shieldMat.opacity = 0.75;
      this.shieldMat.needsUpdate = true;
    }
    if (this.shieldTex) {
      this.shieldTex.needsUpdate = true;
    }
    if (this.barrierFrame) {
      this.barrierFrame.visible = true;
    }
    if (this.glassRipple) {
      this.glassRipple.visible = false;
      this.rippleMat.opacity = 0;
    }
  }
}

window.GameWorld = GameWorld;
