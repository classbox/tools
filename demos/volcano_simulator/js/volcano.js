/* =====================================================================
   Little Volcano Lab – 3D volcano simulator for Grade 2 Geography
   Three.js r128 (classic scripts, works from file:// or any web host)
   ===================================================================== */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  if (!window.THREE || !THREE.OrbitControls) {
    $('loading').textContent = '⚠️ Could not load the 3D engine. Please check the internet connection.';
    return;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
  const rand = (a, b) => a + Math.random() * (b - a);
  const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const F = (v) => v.toFixed(4);
  const TAU = Math.PI * 2;

  // ------------------------------------------------------------------
  // Volcano dimensions (world units)
  // ------------------------------------------------------------------
  const GROUND_R = 9, BOTTOM = -6;
  const CONE_BASE = 6, RIM_R = 1.0, PEAK = 5.0, CRATER_FLOOR = 4.2;
  const CH = { y: -3.8, rx: 2.8, ry: 1.25 };            // magma chamber (ellipsoid)
  const CONDUIT_BOTTOM = -2.9, CONDUIT_R = 0.32;         // main vent
  const SIDE_R = 0.17, SIDE_OUT = { x: 3.25, z: 0 };     // side vent
  const MAGMA_LOW = -2.4, MAGMA_HIGH = 4.35;

  function profile(r) {
    if (r < RIM_R) { const u = r / RIM_R; return CRATER_FLOOR + (PEAK - CRATER_FLOOR) * u * u; }
    if (r < CONE_BASE) { const t = (r - RIM_R) / (CONE_BASE - RIM_R); return PEAK * Math.pow(1 - t, 1.7); }
    return 0;
  }
  const conduitX = (y) => 0.12 * Math.sin(y * 1.3);

  function disp(x, z) {
    const r = Math.hypot(x, z), th = Math.atan2(z, x);
    const coneW = 1 - smooth(CONE_BASE - 1.0, CONE_BASE + 0.6, r);
    const edgeW = 1 - smooth(GROUND_R - 1.4, GROUND_R - 0.2, r);
    const craterW = lerp(0.35, 1, smooth(0.3, RIM_R + 0.3, r));
    let d = 0.12 * Math.sin(x * 1.7 + z * 0.9) * Math.sin(z * 1.9 - x * 0.6)
          + 0.06 * Math.sin(x * 3.1 + 1.0) * Math.sin(z * 2.7 + 2.0);
    d *= lerp(0.45, 1, coneW);
    d += coneW * smooth(1.0, 2.2, r) * 0.11 * Math.sin(th * 13 + r * 0.9) * (0.6 + 0.4 * Math.sin(th * 5));
    const dx = x - SIDE_OUT.x, dz = z - SIDE_OUT.z, d2 = dx * dx + dz * dz;
    d += 0.42 * Math.exp(-d2 / 0.35) - 0.22 * Math.exp(-d2 / 0.035);
    return d * edgeW * craterW;
  }
  function surfY(x, z) {
    const r = Math.hypot(x, z);
    if (r > GROUND_R) return -1e9;
    return profile(r) + disp(x, z);
  }

  const SIDE_A = new THREE.Vector3(conduitX(1.4), 1.4, 0);
  const SIDE_B = new THREE.Vector3(SIDE_OUT.x, surfY(SIDE_OUT.x, SIDE_OUT.z) + 0.1, SIDE_OUT.z);

  function segDist(px, py, pz, a, b) {
    const bax = b.x - a.x, bay = b.y - a.y, baz = b.z - a.z;
    const pax = px - a.x, pay = py - a.y, paz = pz - a.z;
    const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
    return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h);
  }
  // Region ids: 1 chamber, 2 main vent, 3 side vent, 6 layers (cone), 7 crust
  function regionAt(x, y, z) {
    const r = Math.hypot(x, z);
    const ex = x / CH.rx, ey = (y - CH.y) / CH.ry, ez = z / CH.rx;
    if (ex * ex + ey * ey + ez * ez < 0.92) return 1;
    const cr = CONDUIT_R + Math.max(0, y - 3.4) * 0.35;
    if (y > CONDUIT_BOTTOM && Math.hypot(x - conduitX(y), z) < cr) return 2;
    if (segDist(x, y, z, SIDE_A, SIDE_B) < SIDE_R) return 3;
    if (y > 0 && r < CONE_BASE) return 6;
    return 7;
  }
  const insideSolid = (p) => Math.hypot(p.x, p.z) < GROUND_R && p.y > BOTTOM && p.y < surfY(p.x, p.z);

  // ------------------------------------------------------------------
  // Teaching content
  // ------------------------------------------------------------------
  const PARTS = [
    { key: 'chamber', id: 1, name: 'Magma Chamber', emoji: '🔥', color: '#ff5a1f', inside: true,
      text: 'Deep under the ground there is a giant pool of super hot, melted rock. This melted rock is called MAGMA. The magma chamber is where the magma waits.',
      tip: 'Magma is so hot that it glows orange and red!' },
    { key: 'vent', id: 2, name: 'Main Vent', emoji: '⬆️', color: '#ff9f1c', inside: true,
      text: 'The main vent is like a long pipe or a straw. Magma pushes up the vent from the magma chamber to the top of the volcano.',
      tip: 'Build up the pressure and watch the magma climb up the vent!' },
    { key: 'side', id: 3, name: 'Side Vent', emoji: '↗️', color: '#e6b400', inside: true,
      text: 'Sometimes magma finds another way out. A side vent is a smaller pipe that opens on the side of the volcano.',
      tip: 'In a big eruption, lava pours out of the side vent too!' },
    { key: 'crater', id: 4, name: 'Crater', emoji: '🕳️', color: '#9b5de5', inside: false,
      text: 'The crater is the bowl-shaped hole at the very top of the volcano. Lava, ash and rocks shoot out of the crater.',
      tip: 'When the pressure is high, you can see a glowing lava lake inside!' },
    { key: 'layers', id: 6, name: 'Layers of Ash & Lava', emoji: '🍰', color: '#b5733a', inside: true,
      text: 'Every eruption leaves a new layer of ash and cooled lava. Layer on layer, the volcano grows taller and taller, like a giant layer cake!',
      tip: 'Cut it open and count the stripes inside the cone!' },
    { key: 'crust', id: 7, name: "Earth's Crust", emoji: '🌍', color: '#3a86c8', inside: true,
      text: "The crust is the hard, rocky outside layer of our planet. We live on the crust! Magma comes from deep below it.",
      tip: 'Look at the rock layers on the side of the ground.' },
    { key: 'lava', id: 5, name: 'Lava', emoji: '🌋', color: '#ff3c00', erupt: true,
      text: 'When magma comes OUT of the volcano, we call it LAVA! Lava is red-hot and flows down the sides like thick, hot syrup. When it cools, it turns into hard, black rock.',
      tip: 'Magma = inside the Earth. Lava = outside!' },
    { key: 'fountain', id: 10, name: 'Lava Fountain', emoji: '⛲', color: '#f59f00', erupt: true,
      text: 'Gas inside the magma pushes lava high into the sky. It looks like a fountain of fire!',
      tip: '' },
    { key: 'bombs', id: 9, name: 'Volcanic Bombs', emoji: '🪨', color: '#6d597a', erupt: true,
      text: 'Big blobs of lava and rock thrown out of the volcano are called volcanic bombs. They cool down while flying and land as boulders. Some are as big as a car!',
      tip: '' },
    { key: 'ash', id: 8, name: 'Ash Cloud', emoji: '☁️', color: '#7d8597', erupt: true,
      text: 'An explosive eruption blasts tiny bits of rock high into the sky. They make a huge, dark ash cloud. Wind can carry ash very far away. Sometimes there is even lightning inside!',
      tip: '' },
  ];
  const PART = {}; PARTS.forEach((p) => (PART[p.key] = p));
  const REGION_PART = { 1: 'chamber', 2: 'vent', 3: 'side', 6: 'layers', 7: 'crust' };
  const PRESSURE_FACT = {
    key: 'pressure', name: 'Pressure', emoji: '🥤', color: '#e01b24',
    text: 'Magma is full of gas bubbles, like a shaken bottle of soda. The bubbles push and push. When the pressure gets too strong… the volcano ERUPTS!',
    tip: 'Press 🔥 Build pressure and watch the gauge fill up.',
  };

  // ------------------------------------------------------------------
  // Renderer, scene, camera
  // ------------------------------------------------------------------
  const host = $('canvasHost');
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500);
  camera.position.set(0, 5.5, 19);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 7;
  controls.maxDistance = 40;
  controls.maxPolarAngle = Math.PI * 0.6;
  controls.enablePan = false;
  controls.autoRotateSpeed = 0.8;

  // Lights
  const hemi = new THREE.HemisphereLight(0xdfefff, 0x5a4a3a, 0.65);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 0.95);
  sun.position.set(10, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const craterLight = new THREE.PointLight(0xff6a20, 0, 16, 2);
  craterLight.position.set(0, 5.4, 0);
  scene.add(craterLight);
  const flashLight = new THREE.PointLight(0xdde6ff, 0, 70, 1.2);
  scene.add(flashLight);

  // Sky dome
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color(0.36, 0.62, 0.92) },
      uHorizon: { value: new THREE.Color(0.80, 0.89, 0.97) },
    },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uTop; uniform vec3 uHorizon; varying vec3 vP;
      void main(){ float h = clamp(vP.y*1.4+0.15, 0.0, 1.0); gl_FragColor = vec4(mix(uHorizon, uTop, h), 1.0); }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), skyMat));
  scene.fog = new THREE.Fog(0xcce3f7, 45, 110);

  // Table / display base under the diorama
  const table = new THREE.Mesh(
    new THREE.CircleGeometry(80, 64),
    new THREE.MeshStandardMaterial({ color: 0xb9c7a0, roughness: 1 })
  );
  table.rotation.x = -Math.PI / 2;
  table.position.y = BOTTOM - 0.02;
  table.receiveShadow = true;
  scene.add(table);

  // The cutting plane (keeps points where n·p + c >= 0)
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000);
  const CLIP = [cutPlane];

  // ------------------------------------------------------------------
  // Volcano terrain (one closed solid: top surface + side wall + bottom)
  // ------------------------------------------------------------------
  const NR = 100, NS = 180, NW = 110;
  const ringR = (i) => GROUND_R * Math.pow(i / NR, 1.35);

  const C = {
    grass: [0.33, 0.58, 0.24], grass2: [0.44, 0.66, 0.28], soil: [0.47, 0.37, 0.26],
    rock: [0.44, 0.38, 0.33], rockDark: [0.29, 0.25, 0.24], crater: [0.17, 0.13, 0.12],
    glow: [0.55, 0.16, 0.06], basalt: [0.12, 0.105, 0.10],
  };
  function topColor(x, z, y) {
    const r = Math.hypot(x, z), th = Math.atan2(z, x);
    const n = 0.5 + 0.5 * Math.sin(x * 2.3 + z * 1.7) * Math.sin(z * 2.9 - x * 1.1);
    let c = mixC(C.grass, C.grass2, n);
    const coneT = smooth(CONE_BASE + 0.7, CONE_BASE - 0.7, r);
    c = mixC(c, mixC(C.soil, C.rock, smooth(5.4, 3.6, r)), coneT);
    c = mixC(c, C.rockDark, smooth(2.6, 1.2, r) * 0.8);
    const g = 0.92 + 0.08 * Math.sin(th * 13 + r * 0.9) * coneT;
    c = [c[0] * g, c[1] * g, c[2] * g];
    if (r < RIM_R * 1.1) {
      c = mixC(c, C.crater, smooth(RIM_R * 1.1, RIM_R * 0.7, r));
      c = mixC(c, C.glow, smooth(0.6, 0.0, r) * 0.6);
    }
    const ds = Math.hypot(x - SIDE_OUT.x, z - SIDE_OUT.z);
    c = mixC(c, C.rockDark, smooth(0.8, 0.2, ds) * 0.7);
    return c;
  }
  function crustColor(x, y, z) {
    const b2 = -1.6 + 0.15 * Math.sin(x * 0.8 + z * 0.5);
    const b3 = -3.0 + 0.2 * Math.sin(x * 0.6 - z * 0.7 + 1.0);
    if (y > -0.08) return [0.30, 0.52, 0.22];
    if (y > -0.35) return [0.40, 0.28, 0.18];
    if (y > b2) return [0.74, 0.60, 0.40];
    if (y > b3) return [0.60, 0.36, 0.25];
    return [0.40, 0.40, 0.44];
  }

  const pos = [], col = [], idx = [];
  // top surface
  pos.push(0, surfY(0, 0), 0); col.push(...topColor(0, 0, 0));
  for (let i = 1; i <= NR; i++) {
    const r = ringR(i);
    for (let j = 0; j < NS; j++) {
      const th = (j / NS) * TAU, x = r * Math.cos(th), z = r * Math.sin(th);
      const y = i === NR ? 0 : surfY(x, z);
      pos.push(x, y, z); col.push(...topColor(x, z, y));
    }
  }
  const ti = (i, j) => (i === 0 ? 0 : 1 + (i - 1) * NS + (((j % NS) + NS) % NS));
  for (let j = 0; j < NS; j++) idx.push(0, ti(1, j + 1), ti(1, j));
  for (let i = 1; i < NR; i++) {
    for (let j = 0; j < NS; j++) {
      const a = ti(i, j), b = ti(i, j + 1), c = ti(i + 1, j), d = ti(i + 1, j + 1);
      idx.push(a, b, c, b, d, c);
    }
  }
  const TOP_VERTS = 1 + NR * NS;
  // side wall
  const wallStart = pos.length / 3;
  for (let k = 0; k <= NW; k++) {
    const y = lerp(0, BOTTOM, k / NW);
    for (let j = 0; j < NS; j++) {
      const th = (j / NS) * TAU, x = GROUND_R * Math.cos(th), z = GROUND_R * Math.sin(th);
      pos.push(x, y, z); col.push(...crustColor(x, y, z));
    }
  }
  const wi = (k, j) => wallStart + k * NS + (j % NS);
  for (let k = 0; k < NW; k++) {
    for (let j = 0; j < NS; j++) {
      const a = wi(k, j), b = wi(k, j + 1), c = wi(k + 1, j), d = wi(k + 1, j + 1);
      idx.push(a, b, c, b, d, c);
    }
  }
  // bottom
  const bc = pos.length / 3;
  pos.push(0, BOTTOM, 0); col.push(0.3, 0.3, 0.33);
  for (let j = 0; j < NS; j++) {
    const th = (j / NS) * TAU;
    pos.push(GROUND_R * Math.cos(th), BOTTOM, GROUND_R * Math.sin(th)); col.push(0.3, 0.3, 0.33);
  }
  for (let j = 0; j < NS; j++) idx.push(bc, bc + 1 + j, bc + 1 + ((j + 1) % NS));

  const terrainGeo = new THREE.BufferGeometry();
  terrainGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const colorAttr = new THREE.Float32BufferAttribute(col, 3);
  terrainGeo.setAttribute('color', colorAttr);
  terrainGeo.setIndex(idx);
  terrainGeo.computeVertexNormals();
  const originalColors = Float32Array.from(colorAttr.array);
  let colorsDirty = false;

  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.95, metalness: 0, clippingPlanes: CLIP, clipShadows: true,
  });
  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.castShadow = true;
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Paint cooled lava (dark basalt) onto the terrain
  function topVertexAt(x, z) {
    const r = Math.hypot(x, z);
    let i = Math.round(NR * Math.pow(Math.min(r, GROUND_R) / GROUND_R, 1 / 1.35));
    if (i < 1) return 0;
    i = Math.min(i, NR - 1);
    let th = Math.atan2(z, x); if (th < 0) th += TAU;
    return ti(i, Math.round((th / TAU) * NS));
  }
  function paintVertex(v, amt) {
    const a = colorAttr.array, o = v * 3;
    a[o] = lerp(a[o], C.basalt[0], amt);
    a[o + 1] = lerp(a[o + 1], C.basalt[1], amt);
    a[o + 2] = lerp(a[o + 2], C.basalt[2], amt);
  }
  function paint(x, z, amt) {
    const v = topVertexAt(x, z);
    paintVertex(v, amt);
    if (v > 0) {
      const i = Math.floor((v - 1) / NS) + 1, j = (v - 1) % NS;
      paintVertex(ti(i, j + 1), amt * 0.5); paintVertex(ti(i, j - 1), amt * 0.5);
      if (i + 1 < NR) paintVertex(ti(i + 1, j), amt * 0.5);
      if (i > 1) paintVertex(ti(i - 1, j), amt * 0.5);
    }
    colorsDirty = true;
    checkTrees(x, z);
  }

  // ------------------------------------------------------------------
  // Cross-section "cap": back faces painted with what lies on the cut plane
  // ------------------------------------------------------------------
  const capMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    clipping: true,
    clippingPlanes: CLIP,
    uniforms: {
      uPlane: { value: new THREE.Vector4(0, 0, -1, 1000) },
      uTime: { value: 0 },
      uMagma: { value: MAGMA_LOW },
      uHeat: { value: 0 },
      uHighlight: { value: -1 },
      uSideA: { value: SIDE_A },
      uSideB: { value: SIDE_B },
    },
    vertexShader: `
      #include <clipping_planes_pars_vertex>
      varying vec3 vWorld;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: `
      uniform vec4 uPlane; uniform float uTime; uniform float uMagma; uniform float uHeat;
      uniform float uHighlight; uniform vec3 uSideA; uniform vec3 uSideB;
      varying vec3 vWorld;
      #include <clipping_planes_pars_fragment>

      float hash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      float vnoise(vec3 x){
        vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(hash(i+vec3(0.,0.,0.)),hash(i+vec3(1.,0.,0.)),f.x), mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),f.x),f.y),
                   mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),f.x), mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),f.x),f.y), f.z);
      }
      float profileH(float r){
        if (r < ${F(RIM_R)}) { float u = r / ${F(RIM_R)}; return ${F(CRATER_FLOOR)} + ${F(PEAK - CRATER_FLOOR)}*u*u; }
        if (r < ${F(CONE_BASE)}) { float t = (r - ${F(RIM_R)}) / ${F(CONE_BASE - RIM_R)}; return ${F(PEAK)} * pow(1.0 - t, 1.7); }
        return 0.0;
      }
      float sdSeg(vec3 p, vec3 a, vec3 b){ vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0); return length(pa - ba*h); }

      vec3 magmaCol(vec3 p){
        float n = vnoise(p*3.0 + vec3(0.0, -uTime*0.7, uTime*0.25));
        float n2 = vnoise(p*7.0 + vec3(uTime*0.4, 0.0, 0.0));
        vec3 c = mix(vec3(0.78,0.10,0.02), vec3(1.0,0.55,0.08), smoothstep(0.25,0.75,n));
        c = mix(c, vec3(1.0,0.88,0.40), smoothstep(0.7,0.95,n2)*0.6);
        // rising gas bubbles
        float b = vnoise(vec3(p.x*9.0, p.y*9.0 - uTime*(1.0+4.0*uHeat), p.z*9.0));
        c = mix(c, vec3(1.0,0.96,0.75), smoothstep(0.80,0.88,b)*(0.25+0.75*uHeat));
        return c * (0.72 + 0.5*uHeat);
      }
      vec3 plugCol(vec3 p){ return vec3(0.21,0.19,0.19) + vnoise(p*6.0)*0.07; }
      vec3 crustCol(vec3 p, float r){
        float n = vnoise(p*5.0);
        float b2 = -1.6 + 0.15*sin(p.x*0.8 + p.z*0.5);
        float b3 = -3.0 + 0.2*sin(p.x*0.6 - p.z*0.7 + 1.0);
        if (p.y > -0.08 && r > ${F(CONE_BASE - 0.3)}) return vec3(0.30,0.52,0.22);
        if (p.y > -0.35) return vec3(0.40,0.28,0.18) + n*0.05;
        if (p.y > b2) return vec3(0.74,0.60,0.40) + n*0.06;
        if (p.y > b3) return vec3(0.60,0.36,0.25) + n*0.06;
        float sp = smoothstep(0.75, 0.8, vnoise(p*14.0));
        return vec3(0.40,0.40,0.44) + n*0.07 - sp*0.09;
      }
      vec3 strataCol(vec3 p, float r){
        float d = profileH(r) - p.y;
        float w = (vnoise(p*1.7) - 0.5)*0.18;
        float L = floor(max(d + w, 0.0) / 0.36);
        float h = hash(vec3(L, 1.7, 3.1));
        vec3 c = mod(L, 2.0) < 0.5 ? vec3(0.73,0.67,0.58) : vec3(0.37,0.25,0.20);
        c *= 0.9 + 0.2*h;
        c += (vnoise(p*9.0) - 0.5)*0.05;
        return c;
      }

      void main(){
        #include <clipping_planes_fragment>
        // find the point where the view ray meets the cutting plane
        vec3 rd = normalize(vWorld - cameraPosition);
        float den = dot(uPlane.xyz, rd);
        vec3 p = vWorld;
        if (abs(den) > 1e-5) {
          float t = -(dot(uPlane.xyz, cameraPosition) + uPlane.w) / den;
          if (t > 0.0) p = cameraPosition + rd*t;
        }
        float r = length(p.xz);
        vec3 q = vec3(p.x / ${F(CH.rx)}, (p.y - ${F(CH.y)}) / ${F(CH.ry)}, p.z / ${F(CH.rx)});
        float e = dot(q,q) + (vnoise(p*1.3) - 0.5)*0.35;
        float cr = ${F(CONDUIT_R)} + max(0.0, p.y - 3.4)*0.35 + (vnoise(vec3(p.y*2.0, 0.5, 0.5)) - 0.5)*0.06;
        float dc = length(vec2(p.x - 0.12*sin(p.y*1.3), p.z));
        float ds = sdSeg(p, uSideA, uSideB);
        bool inVent = p.y > ${F(CONDUIT_BOTTOM)} && dc < cr;

        float id; vec3 col;
        if (e < 1.0)              { id = 1.0; col = magmaCol(p); }
        else if (inVent)          { id = 2.0; col = p.y < uMagma ? magmaCol(p) : plugCol(p); }
        else if (ds < ${F(SIDE_R)}) { id = 3.0; col = p.y < uMagma ? magmaCol(p) : plugCol(p); }
        else if (p.y > 0.0 && r < ${F(CONE_BASE)}) { id = 6.0; col = strataCol(p, r); }
        else                      { id = 7.0; col = crustCol(p, r); }

        if (id > 5.0) {
          // rock warmed by nearby magma
          float halo = smoothstep(1.6, 1.0, e)*0.55;
          float hv = smoothstep(cr + 0.35, cr, dc) * step(${F(CONDUIT_BOTTOM)}, p.y) * step(p.y, uMagma + 0.3) * 0.5;
          float hs = smoothstep(${F(SIDE_R + 0.25)}, ${F(SIDE_R)}, ds) * step(p.y, uMagma) * 0.5;
          col = mix(col, vec3(0.62,0.17,0.05), max(halo, max(hv, hs)) * (0.45 + 0.55*uHeat));
          // dark outline around the pipes and chamber
          float ol = max(smoothstep(1.12, 1.0, e), max(smoothstep(cr + 0.07, cr, dc)*step(${F(CONDUIT_BOTTOM)}, p.y), smoothstep(${F(SIDE_R + 0.06)}, ${F(SIDE_R)}, ds)));
          col = mix(col, vec3(0.12,0.08,0.07), ol*0.65);
        }
        if (abs(id - uHighlight) < 0.5) {
          float pulse = 0.5 + 0.5*sin(uTime*5.0);
          col = mix(col, vec3(1.0,1.0,0.55), 0.22 + 0.3*pulse);
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const capMesh = new THREE.Mesh(terrainGeo, capMat);
  capMesh.visible = false;
  scene.add(capMesh);

  // Glowing lava lake in the crater
  const lakeMat = new THREE.MeshBasicMaterial({ color: 0xff6a10, clippingPlanes: CLIP });
  const lake = new THREE.Mesh(new THREE.CircleGeometry(1, 40), lakeMat);
  lake.rotation.x = -Math.PI / 2;
  lake.visible = false;
  scene.add(lake);

  // ------------------------------------------------------------------
  // Trees, Houses & Drifting Sky Clouds
  // ------------------------------------------------------------------
  const trees = [];
  {
    const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.3, 6);
    const leafGeo = new THREE.ConeGeometry(0.28, 0.75, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 1, clippingPlanes: CLIP });
    let tries = 0;
    while (trees.length < 34 && tries++ < 400) {
      const th = Math.random() * TAU, r = rand(6.8, 8.5);
      const x = r * Math.cos(th), z = r * Math.sin(th);
      if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 0.6)) continue;
      const y = surfY(x, z);
      const leafColor = new THREE.Color().setHSL(rand(0.26, 0.36), rand(0.45, 0.65), rand(0.25, 0.35));
      const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.9, clippingPlanes: CLIP });
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.position.y = 0.15;
      const leaf = new THREE.Mesh(leafGeo, leafMat); leaf.position.y = 0.6;
      trunk.castShadow = leaf.castShadow = true;
      g.add(trunk, leaf);
      const s = rand(0.8, 1.3);
      g.scale.set(s, s, s);
      g.position.set(x, y - 0.02, z);
      scene.add(g);
      trees.push({ x, z, mat: leafMat, color: leafColor.clone(), burnt: false });
    }

    // Little village houses at the edge of the island for Grade 2 scale
    const wallGeo = new THREE.BoxGeometry(0.42, 0.3, 0.34);
    const roofGeo = new THREE.ConeGeometry(0.36, 0.26, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfff3d6, roughness: 0.9, clippingPlanes: CLIP });
    const roofColors = [0xd9480f, 0xc92a2a, 0x3b5bdb, 0xe67700];
    [0.55, 1.15, 2.35, 3.85].forEach((ang, idx) => {
      const r = 7.9, x = r * Math.cos(ang), z = r * Math.sin(ang), y = surfY(x, z);
      const h = new THREE.Group();
      const w = new THREE.Mesh(wallGeo, wallMat); w.position.y = 0.15;
      const rf = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: roofColors[idx % roofColors.length], roughness: 0.85, clippingPlanes: CLIP }));
      rf.position.y = 0.42; rf.rotation.y = Math.PI / 4;
      w.castShadow = rf.castShadow = true;
      h.add(w, rf);
      h.position.set(x, y - 0.02, z);
      h.rotation.y = -ang + rand(-0.3, 0.3);
      scene.add(h);
    });
  }

  // Fluffy drifting clouds high in the sky
  const skyClouds = [];
  {
    const puffGeo = new THREE.SphereGeometry(1, 9, 7);
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
    for (let i = 0; i < 6; i++) {
      const cg = new THREE.Group();
      const count = 4 + (i % 3);
      for (let j = 0; j < count; j++) {
        const m = new THREE.Mesh(puffGeo, cloudMat);
        m.position.set((j - (count - 1) / 2) * 1.1 + rand(-0.2, 0.2), rand(-0.15, 0.25), rand(-0.4, 0.4));
        const sc = rand(0.65, 1.15);
        m.scale.set(sc * 1.2, sc * 0.75, sc);
        cg.add(m);
      }
      cg.position.set(rand(-28, 28), rand(11.5, 16.5), rand(-22, -6));
      const s = rand(0.8, 1.35);
      cg.scale.setScalar(s);
      scene.add(cg);
      skyClouds.push({ mesh: cg, speed: rand(0.35, 0.75) });
    }
  }

  // Expanding blast shockwave ring at the moment of eruption
  const shockGeo = new THREE.RingGeometry(0.7, 1.0, 48);
  const shockMat = new THREE.MeshBasicMaterial({ color: 0xfff3bf, side: THREE.DoubleSide, transparent: true, opacity: 0, depthWrite: false });
  const shockRing = new THREE.Mesh(shockGeo, shockMat);
  shockRing.rotation.x = -Math.PI / 2;
  shockRing.position.set(0, PEAK + 0.15, 0);
  shockRing.visible = false;
  scene.add(shockRing);
  let shockTimer = 0;
  function checkTrees(x, z) {
    for (const t of trees) {
      if (!t.burnt && (t.x - x) ** 2 + (t.z - z) ** 2 < 0.3) {
        t.burnt = true;
        t.mat.color.setRGB(0.13, 0.11, 0.1);
        for (let k = 0; k < 6; k++) dust.spawn(t.x, surfY(t.x, t.z) + 0.6, t.z, rand(-0.2, 0.2), rand(0.5, 1), rand(-0.2, 0.2), 2.5, 0.5, 0.25);
      }
    }
  }

  // ------------------------------------------------------------------
  // Particle systems
  // ------------------------------------------------------------------
  function softTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.45, 'rgba(255,255,255,0.8)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  function puffTex() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    for (let k = 0; k < 16; k++) {
      const a = Math.random() * TAU, d = Math.random() * 26;
      const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d, r = rand(16, 34);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,0.42)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    return new THREE.CanvasTexture(c);
  }
  const TEX_SOFT = softTex(), TEX_PUFF = puffTex();

  const P_VERT = `
    attribute float aSize; attribute vec4 aColor;
    uniform float uScale; varying vec4 vColor;
    #include <clipping_planes_pars_vertex>
    void main(){
      vColor = aColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale / max(0.1, -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      #include <clipping_planes_vertex>
    }`;
  const P_FRAG = `
    uniform sampler2D uTex; varying vec4 vColor;
    #include <clipping_planes_pars_fragment>
    void main(){
      #include <clipping_planes_fragment>
      vec4 t = texture2D(uTex, gl_PointCoord);
      float a = vColor.a * t.a;
      if (a < 0.01) discard;
      gl_FragColor = vec4(vColor.rgb, a);
    }`;
  const pointMats = [];

  class Pool {
    constructor(max, opts) {
      this.max = max;
      this.pos = new Float32Array(max * 3);
      this.vel = new Float32Array(max * 3);
      this.col = new Float32Array(max * 4);
      this.size = new Float32Array(max);
      this.base = new Float32Array(max);
      this.life = new Float32Array(max);
      this.maxLife = new Float32Array(max);
      this.seed = new Float32Array(max);
      this.alive = new Uint8Array(max);
      this.cursor = 0; this.count = 0;
      const g = new THREE.BufferGeometry();
      this.aPos = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
      this.aCol = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
      this.aSize = new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aPos);
      g.setAttribute('aColor', this.aCol);
      g.setAttribute('aSize', this.aSize);
      this.mat = new THREE.ShaderMaterial({
        uniforms: { uTex: { value: opts.tex }, uScale: { value: 600 } },
        vertexShader: P_VERT, fragmentShader: P_FRAG,
        transparent: true, depthWrite: false,
        blending: opts.blending || THREE.NormalBlending,
        clipping: !!opts.clip, clippingPlanes: opts.clip ? CLIP : [],
      });
      pointMats.push(this.mat);
      this.points = new THREE.Points(g, this.mat);
      this.points.frustumCulled = false;
      this.points.renderOrder = opts.order || 10;
      scene.add(this.points);
    }
    spawn(x, y, z, vx, vy, vz, life, size, alpha) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.max;
      const o = i * 3;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z;
      this.vel[o] = vx; this.vel[o + 1] = vy; this.vel[o + 2] = vz;
      this.life[i] = 0; this.maxLife[i] = life; this.base[i] = size; this.size[i] = size;
      this.col[i * 4 + 3] = alpha == null ? 1 : alpha;
      this.seed[i] = Math.random(); this.alive[i] = 1;
      return i;
    }
    kill(i) { this.alive[i] = 0; this.size[i] = 0; this.col[i * 4 + 3] = 0; }
    setColor(i, r, g, b, a) { const o = i * 4; this.col[o] = r; this.col[o + 1] = g; this.col[o + 2] = b; this.col[o + 3] = a; }
    update(dt, fn) {
      let n = 0;
      for (let i = 0; i < this.max; i++) {
        if (!this.alive[i]) continue;
        this.life[i] += dt;
        if (this.life[i] >= this.maxLife[i]) {
          this.kill(i);
          if (this.onDeath) this.onDeath(i);
          continue;
        }
        n++;
        fn(i, this.life[i] / this.maxLife[i], dt);
      }
      this.count = n;
      this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSize.needsUpdate = true;
    }
    clear() {
      this.alive.fill(0); this.size.fill(0); this.col.fill(0); this.count = 0;
      this.aSize.needsUpdate = this.aCol.needsUpdate = true;
    }
  }

  const fountain = new Pool(3000, { tex: TEX_SOFT, blending: THREE.AdditiveBlending, order: 12 });
  const flows = new Pool(5000, { tex: TEX_SOFT, clip: true, order: 11 });
  const ash = new Pool(2600, { tex: TEX_PUFF, order: 20 });
  const steam = new Pool(500, { tex: TEX_PUFF, order: 19 });
  const dust = new Pool(900, { tex: TEX_PUFF, clip: true, order: 18 });

  flows.onDeath = (i) => paint(flows.pos[i * 3], flows.pos[i * 3 + 2], 0.3);

  // ------------------------------------------------------------------
  // Boulders (volcanic bombs)
  // ------------------------------------------------------------------
  function rockGeo(seed) {
    const g = new THREE.IcosahedronGeometry(1, 1);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = Math.sin(v.x * 3.1 + seed) * Math.sin(v.y * 2.7 + seed * 1.3) * Math.sin(v.z * 3.7 + seed * 0.7);
      v.multiplyScalar(1 + 0.3 * n + 0.1 * Math.sin(v.x * 7 + seed));
      v.y *= 0.8;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }
  const ROCK_GEOS = [1.3, 2.9, 4.1, 5.7, 7.2].map(rockGeo);
  const boulders = [];
  for (let k = 0; k < 80; k++) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x3b312c, roughness: 1, flatShading: true, emissive: 0xff5a10, emissiveIntensity: 0,
      clippingPlanes: CLIP, clipShadows: true,
    });
    const m = new THREE.Mesh(ROCK_GEOS[k % ROCK_GEOS.length], mat);
    m.castShadow = true; m.visible = false;
    scene.add(m);
    boulders.push({ mesh: m, mat, active: false, state: 'off', vel: new THREE.Vector3(), spin: new THREE.Vector3(), s: 0.2, heat: 0 });
  }
  let boulderCursor = 0;
  function spawnBoulder(power) {
    const b = boulders[boulderCursor]; boulderCursor = (boulderCursor + 1) % boulders.length;
    const a = Math.random() * TAU, h = rand(1.0, 4.0) * (0.6 + 0.5 * power);
    b.s = rand(0.12, 0.32);
    b.mesh.scale.setScalar(b.s);
    b.mesh.position.set(rand(-0.3, 0.3), CRATER_FLOOR + 0.4, rand(-0.3, 0.3));
    b.vel.set(Math.cos(a) * h, rand(8, 13) * (0.7 + 0.4 * power), Math.sin(a) * h);
    b.spin.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
    b.heat = 1; b.active = true; b.state = 'fly';
    b.mesh.visible = true;
  }
  const _n = new THREE.Vector3();
  function updateBoulders(dt) {
    for (const b of boulders) {
      if (!b.active) continue;
      b.heat = Math.max(0, b.heat - dt / 7);
      b.mat.emissiveIntensity = b.heat * 1.6;
      if (b.state === 'rest') continue;
      const m = b.mesh;
      b.vel.y -= 9 * dt;
      m.position.addScaledVector(b.vel, dt);
      m.rotation.x += b.spin.x * dt; m.rotation.y += b.spin.y * dt; m.rotation.z += b.spin.z * dt;
      const p = m.position;
      if (Math.random() < dt * 30 && b.state === 'fly') {
        dust.spawn(p.x, p.y, p.z, 0, 0.3, 0, 1.2, 0.25, 0.5);
      }
      const r = Math.hypot(p.x, p.z);
      if (r < GROUND_R) {
        const sy = surfY(p.x, p.z), rad = b.s * 0.8;
        if (p.y - rad < sy) {
          p.y = sy + rad;
          const e = 0.1;
          const gx = (surfY(p.x + e, p.z) - sy) / e, gz = (surfY(p.x, p.z + e) - sy) / e;
          _n.set(-gx, 1, -gz).normalize();
          const vn = b.vel.dot(_n);
          if (vn < 0) {
            const impact = -vn;
            b.vel.addScaledVector(_n, -1.3 * vn);
            b.vel.x *= 0.72; b.vel.z *= 0.72;
            b.spin.multiplyScalar(0.7);
            if (impact > 2.5) {
              for (let k = 0; k < 6; k++) dust.spawn(p.x, sy + 0.1, p.z, rand(-0.8, 0.8), rand(0.3, 1.2), rand(-0.8, 0.8), rand(1.2, 2), rand(0.3, 0.5), 0.55);
              if (b.heat > 0.3) paint(p.x, p.z, 0.2);
              if (Math.random() < 0.3) audio.thud(impact);
            }
            b.state = 'roll';
            if (b.vel.length() < 0.7) { b.state = 'rest'; b.vel.set(0, 0, 0); }
          }
        }
      } else if (p.y < BOTTOM - 3) {
        b.active = false; b.state = 'off'; m.visible = false;
      }
    }
  }

  // ------------------------------------------------------------------
  // Volcanic lightning
  // ------------------------------------------------------------------
  const BOLT_N = 14;
  const boltGeo = new THREE.BufferGeometry();
  boltGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BOLT_N * 3), 3));
  const boltMat = new THREE.LineBasicMaterial({ color: 0xeef3ff, transparent: true, opacity: 1 });
  const bolt = new THREE.Line(boltGeo, boltMat);
  bolt.frustumCulled = false; bolt.visible = false; bolt.renderOrder = 30;
  scene.add(bolt);
  let boltTimer = 0, flash = 0;
  const ashCentroid = new THREE.Vector3(0, 10, 0);
  function strike() {
    const a = boltGeo.attributes.position;
    let x = ashCentroid.x + rand(-3, 3), y = ashCentroid.y + rand(-1, 2), z = ashCentroid.z + rand(-3, 3);
    const dx = rand(-3, 3), dy = -rand(3, 6), dz = rand(-3, 3);
    for (let k = 0; k < BOLT_N; k++) {
      a.setXYZ(k, x, y, z);
      x += dx / BOLT_N + rand(-0.4, 0.4); y += dy / BOLT_N + rand(-0.2, 0.2); z += dz / BOLT_N + rand(-0.4, 0.4);
    }
    a.needsUpdate = true;
    bolt.visible = true; boltTimer = 0.22; flash = 1;
    flashLight.position.set(ashCentroid.x, ashCentroid.y, ashCentroid.z);
    audio.crack();
  }

  // ------------------------------------------------------------------
  // Slice-plane frame (shows where the cut is while adjusting)
  // ------------------------------------------------------------------
  const frame = new THREE.Group();
  {
    const W = GROUND_R + 1, Y0 = BOTTOM - 0.6, Y1 = 9;
    const pts = [new THREE.Vector3(-W, Y0, 0), new THREE.Vector3(W, Y0, 0), new THREE.Vector3(W, Y1, 0), new THREE.Vector3(-W, Y1, 0)];
    const lm = new THREE.LineBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0, depthTest: false });
    frame.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lm));
    const pm = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, Y1 - Y0), pm);
    pl.position.y = (Y0 + Y1) / 2;
    frame.add(pl);
    frame.userData = { lm, pm, show: 0 };
    frame.renderOrder = 40;
    scene.add(frame);
  }

  // ------------------------------------------------------------------
  // Simulation state
  // ------------------------------------------------------------------
  const audio = new window.VolcanoAudio();
  const S = {
    time: 0, pressure: 0, heating: false, phase: 'calm', er: null, intensity: 0,
    magma: MAGMA_LOW, blast: 0, shake: 0, ashLevel: 0,
    cutOn: false, cutAmt: 0, sliceDepth: 0, sliceAngle: 0, follow: true,
    showLabels: true, highlight: null, autoErupt: true, slowMo: false, sound: true,
    fx: { fountain: true, bombs: true, ash: true, flows: true, lightning: true },
    acc: {}, channels: [0], msLevel: 0, fountainTop: 0, lavaIdx: -1,
  };

  function speakText(text) {
    if (!S.sound || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 0.96;
      u.pitch = 1.08;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  const MILESTONES = [
    [0.25, '⬆️ Magma is rising up the main vent!'],
    [0.5, '🫧 Gas bubbles push harder and harder… the ground shakes!'],
    [0.75, '💨 Steam and gas puff out of the crater!'],
    [0.92, '⚠️ The pressure is too strong! Get ready…'],
  ];

  function erupt() {
    if (S.phase === 'erupting') return;
    if (S.pressure < 0.25) { toast('Not enough pressure yet! Press 🔥 Build pressure first.'); return; }
    audio.init();
    const strength = clamp(S.pressure, 0.25, 1);
    S.phase = 'erupting'; S.heating = false;
    S.er = { t: 0, dur: 9 + 14 * strength, strength, p0: S.pressure, ceil: 9 + 7 * strength };
    S.blast = 0.6 + 0.4 * strength;
    const base = Math.random() * TAU;
    S.channels = [base, base + rand(1.6, 2.4), base + rand(3.6, 4.6), 0];
    if (S.fx.bombs) for (let k = 0; k < Math.round(8 + 22 * strength); k++) spawnBoulder(strength);
    if (S.fx.ash) {
      for (let k = 0; k < 160 * strength; k++) {
        const a = Math.random() * TAU, sp = rand(2.5, 5.5) * strength;
        ash.spawn(Math.cos(a) * 0.8, 4.9, Math.sin(a) * 0.8, Math.cos(a) * sp, rand(0.3, 2.5), Math.sin(a) * sp, rand(5, 9), rand(0.8, 1.4), 0);
      }
    }
    if (S.fx.fountain) for (let k = 0; k < 250 * strength; k++) spawnFountain(1.3);
    audio.boom(strength);
    flash = 1; flashLight.position.set(0, 7, 0);
    shockTimer = 1.1; shockRing.visible = true; shockRing.scale.setScalar(1); shockMat.opacity = 0.85;
    toast('💥 KABOOM! The volcano erupts! Magma that comes out is called LAVA.', 5500);
    refreshButtons();
  }

  function resetAll() {
    S.pressure = 0; S.heating = false; S.phase = 'calm'; S.er = null; S.intensity = 0;
    S.magma = MAGMA_LOW; S.blast = 0; S.msLevel = 0; S.lavaIdx = -1;
    [fountain, flows, ash, steam, dust].forEach((p) => p.clear());
    boulders.forEach((b) => { b.active = false; b.state = 'off'; b.mesh.visible = false; });
    colorAttr.array.set(originalColors); colorAttr.needsUpdate = true;
    trees.forEach((t) => { t.burnt = false; t.mat.color.copy(t.color); });
    bolt.visible = false; shockRing.visible = false; shockTimer = 0;
    refreshButtons();
    toast('🔄 The volcano is calm and sleeping again.');
  }

  // --- spawners ---
  function spawnSteam() {
    steam.spawn(rand(-0.5, 0.5), CRATER_FLOOR + 0.3, rand(-0.5, 0.5), rand(-0.15, 0.15), rand(0.7, 1.4), rand(-0.15, 0.15), rand(4, 6), rand(0.35, 0.6), 0);
  }
  function spawnFountain(boost) {
    const k = (boost || 1) * (0.6 + 0.5 * Math.sqrt(Math.max(S.intensity, 0.2)));
    const a = Math.random() * TAU, h = rand(0.2, 1.8);
    fountain.spawn(rand(-0.25, 0.25), CRATER_FLOOR + 0.3, rand(-0.25, 0.25), Math.cos(a) * h, rand(6.5, 12) * k, Math.sin(a) * h, 3.2, rand(0.18, 0.36), 0.9);
  }
  function spawnFlow(x, y, z, vx, vz) {
    flows.spawn(x, y, z, vx, 0, vz, rand(12, 20), rand(0.26, 0.38), 1);
  }
  function spawnRimFlow() {
    const ch = S.channels[Math.floor(Math.random() * 3)];
    const a = ch + rand(-0.25, 0.25), r = RIM_R + 0.1;
    const x = r * Math.cos(a), z = r * Math.sin(a);
    spawnFlow(x, surfY(x, z) + 0.05, z, Math.cos(a) * 0.6, Math.sin(a) * 0.6);
  }
  function spawnSideFlow() {
    const x = SIDE_OUT.x + rand(-0.12, 0.12), z = SIDE_OUT.z + rand(-0.12, 0.12);
    spawnFlow(x, surfY(x, z) + 0.05, z, rand(0.2, 0.6), rand(-0.3, 0.3));
  }
  function spawnAsh() {
    const k = 0.6 + 0.6 * S.intensity;
    ash.spawn(rand(-0.4, 0.4), 4.9, rand(-0.4, 0.4), rand(-0.6, 0.6), rand(4, 7) * k, rand(-0.6, 0.6), rand(7, 12), rand(0.8, 1.4), 0);
  }

  function emit(key, rate, dt, fn) {
    S.acc[key] = (S.acc[key] || 0) + rate * dt;
    let guard = 0;
    while (S.acc[key] >= 1 && guard++ < 200) { S.acc[key] -= 1; fn(); }
  }

  // --- particle behaviour ---
  const WIND = 0.7;
  function updateParticles(dt) {
    // lava fountain
    let fy = 0, fn = 0;
    fountain.update(dt, (i, t) => {
      const o = i * 3, P = fountain.pos, V = fountain.vel;
      V[o + 1] -= 9 * dt;
      P[o] += V[o] * dt; P[o + 1] += V[o + 1] * dt; P[o + 2] += V[o + 2] * dt;
      const x = P[o], y = P[o + 1], z = P[o + 2];
      fy += y; fn++;
      if (V[o + 1] < 0) {
        const sy = surfY(x, z);
        if (y < sy) {
          if (Math.hypot(x, z) > RIM_R * 0.9 && S.fx.flows && Math.random() < 0.45) spawnFlow(x, sy + 0.05, z, V[o] * 0.3, V[o + 2] * 0.3);
          fountain.kill(i); return;
        }
      }
      let c;
      if (t < 0.5) c = mixC([1, 0.93, 0.55], [1, 0.48, 0.08], t * 2);
      else c = mixC([1, 0.48, 0.08], [0.75, 0.1, 0.02], (t - 0.5) * 2);
      fountain.setColor(i, c[0], c[1], c[2], 0.9 * (1 - smooth(0.85, 1, t)));
      fountain.size[i] = fountain.base[i] * (1 - 0.3 * t);
    });
    S.fountainTop = fn > 30 ? fy / fn : 0;

    // lava flows creeping downhill
    flows.update(dt, (i, t) => {
      const o = i * 3, P = flows.pos, V = flows.vel;
      let x = P[o], z = P[o + 2];
      const e = 0.12, h = surfY(x, z);
      const gx = (surfY(x + e, z) - h) / e, gz = (surfY(x, z + e) - h) / e;
      const k = 1.2 + 5 * t;
      V[o] += -gx * 2.2 * dt; V[o + 2] += -gz * 2.2 * dt;
      const damp = Math.max(0, 1 - k * dt);
      V[o] *= damp; V[o + 2] *= damp;
      x += V[o] * dt; z += V[o + 2] * dt;
      const r = Math.hypot(x, z);
      if (r > GROUND_R - 0.15) { const f = (GROUND_R - 0.15) / r; x *= f; z *= f; V[o] = V[o + 2] = 0; }
      P[o] = x; P[o + 2] = z; P[o + 1] = surfY(x, z) + 0.05;
      let c;
      if (t < 0.15) c = mixC([1, 0.9, 0.4], [1, 0.45, 0.06], t / 0.15);
      else if (t < 0.45) c = mixC([1, 0.45, 0.06], [0.85, 0.16, 0.03], (t - 0.15) / 0.3);
      else if (t < 0.75) c = mixC([0.85, 0.16, 0.03], [0.3, 0.08, 0.04], (t - 0.45) / 0.3);
      else c = mixC([0.3, 0.08, 0.04], C.basalt, (t - 0.75) / 0.25);
      flows.setColor(i, c[0], c[1], c[2], 1 - smooth(0.88, 1, t));
      if (t > 0.55 && Math.random() < dt * 0.7) paint(x, z, 0.1);
    });

    // ash cloud
    const ceil = S.er ? S.er.ceil : 12;
    let ax = 0, ay = 0, az = 0, an = 0;
    ash.update(dt, (i, t) => {
      const o = i * 3, P = ash.pos, V = ash.vel;
      const x = P[o], y = P[o + 1], z = P[o + 2];
      const tv = y < ceil ? 3.6 * (1 - y / ceil) + 0.35 : -0.08;
      V[o + 1] = lerp(V[o + 1], tv, Math.min(1, dt * 0.9));
      const r = Math.hypot(x, z) + 0.01;
      const spread = smooth(ceil - 3, ceil, y) * 1.8;
      V[o] = lerp(V[o], (x / r) * spread + WIND * smooth(4, ceil, y), dt * 0.5);
      V[o + 2] = lerp(V[o + 2], (z / r) * spread, dt * 0.5);
      P[o] += V[o] * dt; P[o + 1] += V[o + 1] * dt; P[o + 2] += V[o + 2] * dt;
      const g = lerp(0.22, 0.5, t) + ash.seed[i] * 0.08;
      ash.setColor(i, g, g * 0.95, g * 0.9, smooth(0, 0.08, t) * (1 - smooth(0.6, 1, t)) * 0.62);
      ash.size[i] = ash.base[i] * (1 + 3.5 * Math.sqrt(t));
      if (y > 6) { ax += x; ay += y; az += z; an++; }
    });
    if (an > 20) ashCentroid.set(ax / an, ay / an, az / an);

    // steam
    steam.update(dt, (i, t) => {
      const o = i * 3, P = steam.pos, V = steam.vel;
      V[o] = lerp(V[o], WIND * 0.6, dt * 0.4);
      P[o] += V[o] * dt; P[o + 1] += V[o + 1] * dt; P[o + 2] += V[o + 2] * dt;
      steam.setColor(i, 0.95, 0.95, 0.95, smooth(0, 0.1, t) * (1 - t) * 0.45);
      steam.size[i] = steam.base[i] * (1 + 3 * t);
    });

    // dust & smoke
    dust.update(dt, (i, t) => {
      const o = i * 3, P = dust.pos, V = dust.vel;
      V[o] *= 1 - dt; V[o + 2] *= 1 - dt;
      P[o] += V[o] * dt; P[o + 1] += V[o + 1] * dt; P[o + 2] += V[o + 2] * dt;
      const a = dust.col[i * 4 + 3] > 0 ? 1 : 0;
      dust.setColor(i, 0.42, 0.37, 0.33, a ? (1 - t) * 0.5 : 0);
      dust.size[i] = dust.base[i] * (1 + 2.5 * t);
    });
  }

  // ------------------------------------------------------------------
  // Main simulation step
  // ------------------------------------------------------------------
  function step(dt) {
    S.time += dt;
    if (S.phase === 'calm') {
      if (S.heating) {
        S.pressure = Math.min(1, S.pressure + dt * 0.065);
        if (S.pressure >= 1 && !S.autoErupt) {
          S.heating = false; refreshButtons();
          toast('🤯 The pressure is FULL! Press 💥 ERUPT!');
        }
      }
      if (S.pressure >= 1 && S.autoErupt) erupt();
      S.intensity = lerp(S.intensity, 0, Math.min(1, dt * 2));
      // milestone narration
      for (let k = 0; k < MILESTONES.length; k++) {
        if (S.pressure >= MILESTONES[k][0] && S.msLevel <= k) { S.msLevel = k + 1; toast(MILESTONES[k][1]); }
      }
      while (S.msLevel > 0 && S.pressure < MILESTONES[S.msLevel - 1][0] - 0.1) S.msLevel--;
    } else {
      const E = S.er;
      E.t += dt;
      const u = E.t / E.dur;
      S.intensity = E.strength * (E.t < 1 ? 1 : Math.pow(Math.max(0, 1 - u), 0.8));
      S.pressure = E.p0 * Math.max(0, 1 - u);
      if (u >= 1) {
        S.phase = 'calm'; S.er = null; S.pressure = 0; S.msLevel = 0;
        toast('😌 The eruption is over. The lava cools down and becomes new black rock.', 5500);
        refreshButtons();
      }
    }

    const magmaTarget = S.phase === 'erupting'
      ? (S.intensity > 0.08 ? 4.6 : 1.0)
      : lerp(MAGMA_LOW, MAGMA_HIGH, S.pressure);
    S.magma = lerp(S.magma, magmaTarget, 1 - Math.exp(-dt * 1.5));

    S.blast = Math.max(0, S.blast - dt * 1.2);
    S.shake = Math.max(0, S.pressure - 0.5) * 0.09 + S.intensity * 0.08 + S.blast * 0.35;

    emit('steam', S.phase === 'calm' ? 1.5 + S.pressure * 28 : 6, dt, spawnSteam);
    if (S.phase === 'erupting') {
      const I = S.intensity;
      if (S.fx.fountain) emit('fountain', 520 * I, dt, () => spawnFountain(1));
      if (S.fx.flows) {
        emit('flow', 90 * I, dt, spawnRimFlow);
        if (S.magma > SIDE_B.y && I > 0.1) emit('side', 30 * I, dt, spawnSideFlow);
      }
      if (S.fx.ash) emit('ash', 200 * I, dt, spawnAsh);
      if (S.fx.bombs) emit('bomb', 2.5 * I, dt, () => spawnBoulder(I));
    }

    updateParticles(dt);
    updateBoulders(dt);

    S.ashLevel = lerp(S.ashLevel, clamp(ash.count / 1500, 0, 1), Math.min(1, dt * 0.6));
    if (S.fx.lightning && ash.count > 250 && Math.random() < dt * 0.9 * S.ashLevel) strike();

    if (S.sound) {
      audio.setLevels(Math.pow(S.pressure, 2) * 0.7 + S.intensity * 0.6 + S.blast * 0.5, S.intensity * 0.55);
    } else audio.setLevels(0, 0);
  }

  // ------------------------------------------------------------------
  // Visual updates
  // ------------------------------------------------------------------
  const SKY = {
    top: new THREE.Color(0.36, 0.62, 0.92), hor: new THREE.Color(0.80, 0.89, 0.97),
    ashTop: new THREE.Color(0.20, 0.18, 0.18), ashHor: new THREE.Color(0.48, 0.42, 0.38),
  };
  const _c = new THREE.Color();
  function updateVisuals(dt) {
    const heat = Math.max(S.pressure, S.intensity);
    const U = capMat.uniforms;
    U.uTime.value = S.time;
    U.uMagma.value = S.magma;
    U.uHeat.value = heat;
    U.uHighlight.value = S.highlight && PART[S.highlight] ? PART[S.highlight].id : -1;

    // crater glow & lava lake
    const lakeOn = S.magma > CRATER_FLOOR - 0.05;
    const flick = 0.85 + 0.15 * Math.sin(S.time * 17) * Math.sin(S.time * 5.3);
    craterLight.intensity = (clamp((S.magma - 2.5) / 2, 0, 1) * 1.3 + S.intensity * 2.5) * flick;
    lake.visible = lakeOn;
    if (lakeOn) {
      const h = clamp(S.magma, CRATER_FLOOR + 0.02, CRATER_FLOOR + 0.4);
      const lr = RIM_R * Math.sqrt((h - CRATER_FLOOR) / (PEAK - CRATER_FLOOR)) + 0.12;
      lake.position.set(0, h, 0);
      lake.scale.setScalar(lr);
      lakeMat.color.setRGB(1, 0.35 + 0.25 * flick * heat, 0.05);
    }

    // flashes, shockwave & drifting clouds
    flash = Math.max(0, flash - dt * 4);
    flashLight.intensity = flash * 4;
    if (boltTimer > 0) {
      boltTimer -= dt;
      boltMat.opacity = Math.random() > 0.3 ? 1 : 0.2;
      if (boltTimer <= 0) bolt.visible = false;
    }
    if (shockTimer > 0) {
      shockTimer = Math.max(0, shockTimer - dt);
      const u = 1 - shockTimer / 1.1;
      shockRing.scale.setScalar(1 + u * 11);
      shockMat.opacity = (1 - u) * 0.85;
      if (shockTimer <= 0) shockRing.visible = false;
    }
    for (const cl of skyClouds) {
      cl.mesh.position.x += cl.speed * dt;
      if (cl.mesh.position.x > 34) cl.mesh.position.x = -34;
    }

    // sky darkens with ash
    const a = S.ashLevel;
    skyMat.uniforms.uTop.value.copy(SKY.top).lerp(SKY.ashTop, a);
    skyMat.uniforms.uHorizon.value.copy(SKY.hor).lerp(SKY.ashHor, a);
    _c.copy(SKY.hor).lerp(SKY.ashHor, a);
    scene.fog.color.copy(_c);
    sun.intensity = 0.95 - 0.45 * a;
    hemi.intensity = 0.65 - 0.2 * a;

    if (colorsDirty) { colorAttr.needsUpdate = true; colorsDirty = false; }
  }

  // ------------------------------------------------------------------
  // Cutting plane
  // ------------------------------------------------------------------
  const sliceN = new THREE.Vector3(0, 0, -1);
  const sliceT = new THREE.Vector3(1, 0, 0);
  const _m4 = new THREE.Matrix4();
  const ease = (t) => t * t * (3 - 2 * t);
  function updatePlane(dt) {
    const target = S.cutOn ? 1 : 0;
    const spd = dt * 1.4;
    S.cutAmt = S.cutAmt < target ? Math.min(target, S.cutAmt + spd) : Math.max(target, S.cutAmt - spd);
    if (S.follow) {
      const cx = camera.position.x, cz = camera.position.z;
      if (Math.hypot(cx, cz) > 0.3) S.sliceAngle = Math.atan2(cx, cz);
    }
    sliceN.set(-Math.sin(S.sliceAngle), 0, -Math.cos(S.sliceAngle));
    sliceT.set(-sliceN.z, 0, sliceN.x);
    const active = S.cutAmt > 0.001;
    const c = active ? lerp(GROUND_R + 2, -S.sliceDepth, ease(S.cutAmt)) : 1000;
    cutPlane.normal.copy(sliceN);
    cutPlane.constant = c;
    capMat.uniforms.uPlane.value.set(sliceN.x, 0, sliceN.z, c);
    capMesh.visible = active;

    // frame visual
    const fd = frame.userData;
    fd.show = Math.max(0, fd.show - dt);
    const op = active ? Math.min(1, fd.show) : 0;
    fd.lm.opacity = op; fd.pm.opacity = op * 0.12;
    frame.visible = op > 0.01;
    if (frame.visible) {
      frame.position.copy(sliceN).multiplyScalar(-c);
      _m4.makeBasis(sliceT.clone().negate(), new THREE.Vector3(0, 1, 0), sliceN);
      frame.quaternion.setFromRotationMatrix(_m4);
    }
  }
  const cutActive = () => S.cutAmt > 0.001;
  const isKept = (p) => !cutActive() || cutPlane.distanceToPoint(p) >= -0.02;

  // ------------------------------------------------------------------
  // Labels
  // ------------------------------------------------------------------
  const labelsEl = $('labels');
  const LABELS = PARTS.map((p) => {
    const el = document.createElement('div');
    el.className = 'label';
    el.style.setProperty('--c', p.color);
    el.innerHTML = `<div class="tag">${p.emoji} ${p.name}</div><div class="stick"></div><div class="dot"></div>`;
    el.querySelector('.tag').addEventListener('click', (e) => { e.stopPropagation(); showFact(p.key); });
    labelsEl.appendChild(el);
    return { part: p, el, shown: false };
  });

  const _v = new THREE.Vector3(), _w = new THREE.Vector3();
  function occluded(p) {
    const cp = camera.position, steps = 30;
    for (let k = 2; k < steps - 1; k++) {
      const f = k / steps;
      _w.set(lerp(cp.x, p.x, f), lerp(cp.y, p.y, f), lerp(cp.z, p.z, f));
      if (Math.hypot(_w.x, _w.z) < GROUND_R && _w.y > BOTTOM && _w.y < surfY(_w.x, _w.z) - 0.05 && isKept(_w)) return true;
    }
    return false;
  }
  function onPlane(p) { return p.addScaledVector(sliceN, -(sliceN.dot(p) + cutPlane.constant)); }
  function interiorReady() {
    return cutActive() && S.cutAmt > 0.6 && cutPlane.distanceToPoint(camera.position) < 0;
  }
  function planePoint(s, y) {
    return new THREE.Vector3().copy(sliceN).multiplyScalar(-cutPlane.constant).addScaledVector(sliceT, s).setY(y);
  }
  function anchorFor(key) {
    const inside = interiorReady();
    const c = Math.abs(cutPlane.constant);
    let p;
    switch (key) {
      case 'chamber':
        if (!inside) return null;
        p = planePoint(0, CH.y);
        return regionAt(p.x, p.y, p.z) === 1 ? p : null;
      case 'vent':
        if (!inside) return null;
        p = onPlane(new THREE.Vector3(conduitX(0.6), 0.6, 0));
        return regionAt(p.x, p.y, p.z) === 2 ? p : null;
      case 'side':
        if (inside) {
          p = onPlane(new THREE.Vector3().addVectors(SIDE_A, SIDE_B).multiplyScalar(0.5));
          if (regionAt(p.x, p.y, p.z) === 3) return p;
        }
        p = new THREE.Vector3(SIDE_OUT.x, surfY(SIDE_OUT.x, SIDE_OUT.z) + 0.15, SIDE_OUT.z);
        return isKept(p) && !occluded(p) ? p : null;
      case 'layers': {
        if (!inside) return null;
        const s = -Math.sqrt(Math.max(0, 2.6 * 2.6 - c * c));
        const r = Math.hypot(s, c);
        p = planePoint(s, profile(r) * 0.45);
        return regionAt(p.x, p.y, p.z) === 6 ? p : null;
      }
      case 'crust': {
        if (inside) {
          const s = Math.sqrt(Math.max(0, 5.3 * 5.3 - c * c));
          p = planePoint(s, -1.0);
          if (regionAt(p.x, p.y, p.z) === 7) return p;
        }
        const d = Math.hypot(camera.position.x, camera.position.z) || 1;
        p = new THREE.Vector3((camera.position.x / d) * GROUND_R, -2.3, (camera.position.z / d) * GROUND_R);
        return isKept(p) ? p : null;
      }
      case 'crater':
        p = new THREE.Vector3(0, PEAK + 0.25, 0);
        return isKept(p) && !occluded(p) ? p : null;
      case 'lava': {
        if (flows.count < 20) return null;
        let i = S.lavaIdx;
        const ok = (j) => j >= 0 && flows.alive[j] && flows.life[j] / flows.maxLife[j] < 0.6 && isKept(_v.fromArray(flows.pos, j * 3));
        if (!ok(i)) {
          i = -1;
          const start = Math.floor(Math.random() * flows.max);
          for (let k = 0; k < 600; k++) {
            const j = (start + k) % flows.max;
            if (flows.alive[j] && flows.life[j] / flows.maxLife[j] < 0.3 && isKept(_v.fromArray(flows.pos, j * 3))) { i = j; break; }
          }
          S.lavaIdx = i;
        }
        return i >= 0 ? new THREE.Vector3().fromArray(flows.pos, i * 3).add(new THREE.Vector3(0, 0.12, 0)) : null;
      }
      case 'fountain':
        return S.fountainTop > CRATER_FLOOR + 1 ? new THREE.Vector3(0, S.fountainTop + 1.5, 0) : null;
      case 'bombs': {
        const b = boulders.find((b) => b.active && b.state === 'fly' && b.mesh.position.y > 6 && isKept(b.mesh.position));
        return b ? b.mesh.position.clone() : null;
      }
      case 'ash':
        return ash.count > 150 && S.ashLevel > 0.05 ? ashCentroid.clone().add(new THREE.Vector3(0, 1.5, 0)) : null;
    }
    return null;
  }
  let labelTick = 0;
  function updateLabels() {
    const w = host.clientWidth, h = host.clientHeight;
    labelTick++;
    for (const L of LABELS) {
      const key = L.part.key;
      const want = S.showLabels || S.highlight === key;
      let p = want ? anchorFor(key) : null;
      if (p) {
        _v.copy(p).project(camera);
        if (_v.z > 1 || Math.abs(_v.x) > 1.1 || Math.abs(_v.y) > 1.1) p = null;
      }
      if (p) {
        const x = (_v.x * 0.5 + 0.5) * w, y = (-_v.y * 0.5 + 0.5) * h;
        L.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        if (!L.shown) { L.el.classList.add('show'); L.shown = true; }
      } else if (L.shown) { L.el.classList.remove('show'); L.shown = false; }
      L.el.classList.toggle('active', S.highlight === key);
    }
  }

  // ------------------------------------------------------------------
  // Fact card & toast
  // ------------------------------------------------------------------
  const factCard = $('factCard');
  function showFact(key) {
    const p = key === 'pressure' ? PRESSURE_FACT : PART[key];
    if (!p) return;
    S.highlight = key;
    factCard.style.setProperty('--c', p.color);
    $('factEmoji').textContent = p.emoji;
    $('factTitle').textContent = p.name;
    $('factText').textContent = p.text;
    let tip = p.tip || '';
    if (p.erupt && S.phase !== 'erupting') tip = (tip ? tip + ' ' : '') + 'Build pressure and press 💥 ERUPT to see it!';
    $('factTip').textContent = tip;
    factCard.classList.remove('hidden');
    if (p.inside && !S.cutOn && PART[key] && key !== 'crust') setCut(true);
    document.querySelectorAll('.part-btn').forEach((b) => b.classList.toggle('active', b.dataset.part === key));
  }
  function hideFact() {
    factCard.classList.add('hidden');
    S.highlight = null;
    document.querySelectorAll('.part-btn').forEach((b) => b.classList.remove('active'));
  }
  $('factClose').addEventListener('click', hideFact);
  $('factSpeak').addEventListener('click', () => {
    const p = S.highlight === 'pressure' ? PRESSURE_FACT : PART[S.highlight];
    if (p) speakText(`${p.name}. ${p.text} ${p.tip || ''}`);
  });

  let toastTimer = 0;
  function toast(msg, ms) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms || 3500);
  }

  // ------------------------------------------------------------------
  // Picking (tap a part to learn)
  // ------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function surfacePart(p) {
    const r = Math.hypot(p.x, p.z);
    if (p.y < -0.05 && r > GROUND_R - 0.2) return 'crust';
    if (r < RIM_R * 1.15) return 'crater';
    if (Math.hypot(p.x - SIDE_OUT.x, p.z - SIDE_OUT.z) < 0.55) return 'side';
    if (r < CONE_BASE - 0.3) return 'layers';
    return 'crust';
  }
  function pick(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const ray = raycaster.ray;
    let best = null, bestT = Infinity;
    const consider = (t, part) => { if (t < bestT) { bestT = t; best = part; } };

    const active = boulders.filter((b) => b.active).map((b) => b.mesh);
    for (const h of raycaster.intersectObjects(active)) { if (isKept(h.point)) { consider(h.distance, 'bombs'); break; } }
    for (const h of raycaster.intersectObject(terrain)) {
      if (!isKept(h.point)) continue;
      consider(h.distance, surfacePart(h.point)); break;
    }
    if (cutActive()) {
      const t = ray.distanceToPlane(cutPlane);
      if (t !== null && t < bestT) {
        const p = ray.at(t, new THREE.Vector3());
        if (insideSolid(p)) consider(t, REGION_PART[regionAt(p.x, p.y, p.z)]);
      }
    }
    if (S.ashLevel > 0.08 && ray.distanceToPoint(ashCentroid) < 3.5) consider(ray.origin.distanceTo(ashCentroid) - 3, 'ash');
    if (S.fountainTop > CRATER_FLOOR + 1) {
      const top = new THREE.Vector3(0, S.fountainTop, 0);
      if (ray.distanceToPoint(top) < 1.5) consider(ray.origin.distanceTo(top) - 1, 'fountain');
    }
    if (best) showFact(best);
  }
  let downX = 0, downY = 0, downT = 0;
  renderer.domElement.addEventListener('pointerdown', (e) => { downX = e.clientX; downY = e.clientY; downT = performance.now(); });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6 && performance.now() - downT < 600) pick(e.clientX, e.clientY);
  });

  // ------------------------------------------------------------------
  // UI wiring
  // ------------------------------------------------------------------
  const btnCut = $('btnCut'), btnHeat = $('btnHeat'), btnErupt = $('btnErupt');
  const pressureSlider = $('pressure');

  function setCut(on) {
    S.cutOn = on;
    frame.userData.show = 1.6;
    btnCut.classList.toggle('on', on);
    btnCut.textContent = on ? '🌋 Close it up' : '✂️ Cut it open!';
    if (on) toast('✂️ Look inside! Tap any part to learn its name.');
  }
  function refreshButtons() {
    btnHeat.classList.toggle('on', S.heating);
    btnHeat.textContent = S.heating ? '⏸️ Stop building' : '🔥 Build pressure';
    btnHeat.disabled = S.phase === 'erupting';
    btnErupt.disabled = S.phase === 'erupting';
    pressureSlider.disabled = S.phase === 'erupting';
  }
  btnCut.addEventListener('click', () => setCut(!S.cutOn));
  $('sliceDepth').addEventListener('input', (e) => { S.sliceDepth = parseFloat(e.target.value); frame.userData.show = 1.6; if (!S.cutOn) setCut(true); });
  $('sliceFollow').addEventListener('change', (e) => {
    S.follow = e.target.checked;
    $('sliceAngle').disabled = S.follow;
    $('angleRow').classList.toggle('disabled', S.follow);
    if (!S.follow) {
      let deg = (S.sliceAngle * 180) / Math.PI; deg = ((deg % 360) + 360) % 360;
      $('sliceAngle').value = deg;
    }
  });
  $('angleRow').classList.add('disabled');
  $('sliceAngle').addEventListener('input', (e) => { S.sliceAngle = (parseFloat(e.target.value) * Math.PI) / 180; frame.userData.show = 1.6; });
  $('showLabels').addEventListener('change', (e) => { S.showLabels = e.target.checked; });

  pressureSlider.addEventListener('input', (e) => {
    if (S.phase !== 'calm') return;
    audio.init();
    S.pressure = parseFloat(e.target.value) / 100;
  });
  btnHeat.addEventListener('click', () => {
    audio.init();
    if (S.phase !== 'calm') return;
    S.heating = !S.heating;
    if (S.heating && S.pressure >= 1 && !S.autoErupt) S.heating = false;
    refreshButtons();
  });
  btnErupt.addEventListener('click', erupt);
  $('btnReset').addEventListener('click', resetAll);
  const fxMap = { fxFountain: 'fountain', fxBombs: 'bombs', fxAsh: 'ash', fxFlows: 'flows', fxLightning: 'lightning' };
  Object.keys(fxMap).forEach((id) => $(id).addEventListener('change', (e) => { S.fx[fxMap[id]] = e.target.checked; }));
  $('autoErupt').addEventListener('change', (e) => { S.autoErupt = e.target.checked; });
  $('slowMo').addEventListener('change', (e) => { S.slowMo = e.target.checked; toast(S.slowMo ? '🐢 Slow motion ON!' : '🐇 Normal speed'); });
  $('soundOn').addEventListener('change', (e) => {
    S.sound = e.target.checked;
    audio.setMuted(!S.sound);
    if (!S.sound && window.speechSynthesis) window.speechSynthesis.cancel();
  });
  $('gauge').addEventListener('click', () => showFact('pressure'));

  // parts grid
  const grid = $('partsGrid');
  PARTS.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'part-btn';
    b.dataset.part = p.key;
    b.style.setProperty('--c', p.color);
    b.innerHTML = `<span class="em">${p.emoji}</span><span>${p.name}</span>`;
    b.addEventListener('click', () => (S.highlight === p.key ? hideFact() : showFact(p.key)));
    grid.appendChild(b);
  });

  // camera views
  let camTween = null;
  const VIEWS = {
    front: new THREE.Vector3(0, 5.5, 19),
    side: new THREE.Vector3(19, 5.5, 0.01),
    top: new THREE.Vector3(0.01, 24, 2),
    low: new THREE.Vector3(11, -0.8, 12),
  };
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
    camTween = { from: camera.position.clone(), to: VIEWS[b.dataset.view].clone(), t: 0 };
  }));
  function tweenCamera(dt) {
    if (!camTween) return;
    camTween.t = Math.min(1, camTween.t + dt / 1.2);
    const k = ease(camTween.t);
    // move along a sphere-ish path (lerp then fix distance)
    const d = lerp(camTween.from.distanceTo(controls.target), camTween.to.distanceTo(controls.target), k);
    camera.position.lerpVectors(camTween.from, camTween.to, k).sub(controls.target).setLength(d).add(controls.target);
    if (camTween.t >= 1) camTween = null;
  }
  $('btnSpin').addEventListener('click', (e) => {
    controls.autoRotate = !controls.autoRotate;
    e.currentTarget.classList.toggle('on', controls.autoRotate);
  });
  $('btnFull').addEventListener('click', () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  });
  $('panelToggle').addEventListener('click', () => $('app').classList.toggle('panel-open'));
  if (window.innerWidth < 900) $('app').classList.remove('panel-open');

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'range') return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); erupt(); }
    else if (k === 'c') setCut(!S.cutOn);
    else if (k === 'p') btnHeat.click();
    else if (k === 'r') resetAll();
    else if (k === 'l') { S.showLabels = !S.showLabels; $('showLabels').checked = S.showLabels; }
    else if (k === 'escape') hideFact();
  });
  document.addEventListener('pointerdown', () => audio.init(), { once: true });

  // gauge
  const gFill = $('gaugeFill'), gFace = $('gaugeFace'), gText = $('gaugeText'), gPct = $('gaugePct'), gauge = $('gauge');
  let lastGauge = '';
  function updateUI() {
    const p = S.pressure;
    const pct = Math.round(p * 100);
    let face, text;
    if (S.phase === 'erupting') { face = '🌋'; text = 'ERUPTING!'; }
    else if (p < 0.25) { face = '😴'; text = 'Sleeping'; }
    else if (p < 0.5) { face = '🙂'; text = 'Bubbling'; }
    else if (p < 0.75) { face = '😬'; text = 'Rumbling!'; }
    else if (p < 0.95) { face = '😨'; text = 'Getting ready!'; }
    else { face = '🤯'; text = 'DANGER!'; }
    const sig = pct + face;
    if (sig !== lastGauge) {
      lastGauge = sig;
      gFill.style.height = pct + '%';
      gFace.textContent = face; gText.textContent = text; gPct.textContent = pct + '%';
      gauge.classList.toggle('danger', p > 0.75 && S.phase === 'calm');
      gauge.classList.toggle('erupting', S.phase === 'erupting');
      btnErupt.classList.toggle('ready', p >= 0.25 && S.phase === 'calm');
      btnErupt.classList.toggle('dim', p < 0.25 && S.phase === 'calm');
      if (document.activeElement !== pressureSlider || S.phase !== 'calm') pressureSlider.value = pct;
    }
  }

  // ------------------------------------------------------------------
  // Resize & main loop
  // ------------------------------------------------------------------
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const scale = (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
    pointMats.forEach((m) => (m.uniforms.uScale.value = scale));
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  window.addEventListener('resize', resize);
  resize();

  const shakeOff = new THREE.Vector3();
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const rawDt = Math.min(0.05, (now - last) / 1000);
    const simDt = S.slowMo ? rawDt * 0.35 : rawDt;
    last = now;
    camera.position.sub(shakeOff);
    tweenCamera(rawDt);
    controls.update();
    step(simDt);
    updatePlane(rawDt);
    updateVisuals(simDt);
    shakeOff.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(S.shake);
    camera.position.add(shakeOff);
    renderer.render(scene, camera);
    updateLabels();
    updateUI();
  }
  refreshButtons();
  requestAnimationFrame(loop);
  setTimeout(() => $('loading').classList.add('done'), 300);
  setTimeout(() => toast('👋 Welcome! Press ✂️ Cut it open! to look inside the volcano.', 5000), 900);
})();
