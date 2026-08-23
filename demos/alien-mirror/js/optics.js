/**
 * Optics & Reflection Physics Module
 * Computes multi-bounce specular reflections and renders a BIG, intense, sizzling red laser beam
 * with pulsating plasma aura, sizzling spark particles, and real-time hit detection.
 */
class OpticsEngine {
  constructor(scene, player, mirrorManager, ufo, world) {
    this.scene = scene;
    this.player = player;
    this.mirrorManager = mirrorManager;
    this.ufo = ufo;
    this.world = world;

    this.maxBounces = 4;
    this.beamSegments = [];
    this.sizzleTime = 0;

    this.createHeavyLaserBeamPool();
    this.createSparkParticleSystem();
  }

  createHeavyLaserBeamPool() {
    this.beamGroup = new THREE.Group();

    for (let i = 0; i < this.maxBounces; i++) {
      // 1. White-hot core (Sleek Radius 0.08)
      const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 12);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.98
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.visible = false;
      this.beamGroup.add(coreMesh);

      // 2. Crimson Laser Body (Radius 0.2)
      const midGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 12);
      const midMat = new THREE.MeshBasicMaterial({
        color: 0xff002b,
        transparent: true,
        opacity: 0.85
      });
      const midMesh = new THREE.Mesh(midGeo, midMat);
      midMesh.visible = false;
      this.beamGroup.add(midMesh);

      // 3. Fiery Outer Glow Aura (Radius 0.38)
      const auraGeo = new THREE.CylinderGeometry(0.38, 0.38, 1, 12);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff2a2a,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending
      });
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      auraMesh.visible = false;
      this.beamGroup.add(auraMesh);

      this.beamSegments.push({
        core: coreMesh,
        mid: midMesh,
        aura: auraMesh
      });
    }

    this.scene.add(this.beamGroup);
  }

  createSparkParticleSystem() {
    this.sparkCount = 120;
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.sparkCount * 3);
    const colors = new Float32Array(this.sparkCount * 3);
    const sizes = new Float32Array(this.sparkCount);

    for (let i = 0; i < this.sparkCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;

      // Bright fiery red & yellow spark colors
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.2 + Math.random() * 0.7;
      colors[i * 3 + 2] = 0.1;
      sizes[i] = 0.5 + Math.random() * 0.4;
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    sparkGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const sparkMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    this.sparks = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(this.sparks);

    this.sparkPool = [];
    for (let i = 0; i < this.sparkCount; i++) {
      this.sparkPool.push({
        pos: new THREE.Vector3(0, -100, 0),
        vel: new THREE.Vector3(),
        life: 0
      });
    }
  }

  emitSparks(origin, normal = null, count = 6) {
    let spawned = 0;
    for (let i = 0; i < this.sparkPool.length && spawned < count; i++) {
      const p = this.sparkPool[i];
      if (p.life <= 0) {
        p.pos.copy(origin);
        p.vel.set(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 1.5,
          (Math.random() - 0.5) * 8
        );
        if (normal) {
          p.vel.addScaledVector(normal, 4);
        }
        p.life = 0.25 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  updateSparks(delta) {
    const posAttr = this.sparks.geometry.attributes.position;
    for (let i = 0; i < this.sparkPool.length; i++) {
      const p = this.sparkPool[i];
      if (p.life > 0) {
        p.life -= delta;
        p.vel.y -= 18 * delta; // gravity
        p.pos.addScaledVector(p.vel, delta);
        posAttr.setXYZ(i, p.pos.x, p.pos.y, p.pos.z);
      } else {
        posAttr.setXYZ(i, 0, -100, 0);
      }
    }
    posAttr.needsUpdate = true;
  }

  // Intersect Ray with Mirror surface
  intersectMirror(rayOrigin, rayDir, mirror) {
    const normal = mirror.getNormal();
    const center = mirror.getCenter();

    // Check if ray is traveling towards front face (dot < 0)
    const denom = rayDir.dot(normal);
    if (denom >= -0.001) {
      return null;
    }

    const t = center.clone().sub(rayOrigin).dot(normal) / denom;
    if (t < 0.2) return null;

    const hitPoint = rayOrigin.clone().addScaledVector(rayDir, t);

    // Project hit point into mirror local space
    const localHit = hitPoint.clone().sub(center);
    const quat = new THREE.Quaternion();
    mirror.tiltGroup.getWorldQuaternion(quat);
    localHit.applyQuaternion(quat.clone().invert());

    const halfW = 3.1;
    const halfH = 2.2;

    if (Math.abs(localHit.x) <= halfW && Math.abs(localHit.y) <= halfH) {
      return {
        distance: t,
        point: hitPoint,
        normal: normal,
        mirror: mirror
      };
    }

    return null;
  }

  // Intersect Ray with Scene Obstacles / Barrier Walls
  intersectObstacles(rayOrigin, rayDir, maxDist) {
    const ray = new THREE.Ray(rayOrigin, rayDir);
    const box = new THREE.Box3();
    let closestDist = maxDist;
    let hitObstacle = null;
    let hitPointResult = null;

    for (const obstacle of this.world.obstacles) {
      box.setFromObject(obstacle);
      const hitPoint = new THREE.Vector3();
      if (ray.intersectBox(box, hitPoint)) {
        const d = rayOrigin.distanceTo(hitPoint);
        if (d < closestDist && d > 0.1) {
          closestDist = d;
          hitObstacle = obstacle;
          hitPointResult = hitPoint;
        }
      }
    }
    return { distance: closestDist, obstacle: hitObstacle, point: hitPointResult };
  }

  // Intersect Ray with Alien UFO Target
  intersectUFO(rayOrigin, rayDir, maxDist) {
    const ray = new THREE.Ray(rayOrigin, rayDir);
    const ufoCenter = this.ufo.position.clone().add(new THREE.Vector3(0, 0.6, 0));
    const targetSphere = new THREE.Sphere(ufoCenter, this.ufo.targetRadius);

    const hitPoint = new THREE.Vector3();
    if (ray.intersectSphere(targetSphere, hitPoint)) {
      const d = rayOrigin.distanceTo(hitPoint);
      if (d < maxDist && d > 0.2) {
        return { distance: d, point: hitPoint };
      }
    }
    return null;
  }

  update(delta) {
    this.updateSparks(delta);
    this.sizzleTime += delta * 25;

    // Hide all beam segments if player is not firing
    if (!this.player.isFiring) {
      this.beamSegments.forEach(seg => {
        seg.core.visible = false;
        seg.mid.visible = false;
        seg.aura.visible = false;
      });
      return;
    }

    // Begin Ray Tracing
    let currentOrigin = this.player.getLaserOrigin();
    let currentDir = this.player.getLaserDirection();

    let hitMirror1 = false;
    let hitMirror2 = false;

    let currentSegmentIndex = 0;
    const maxRange = 130;

    for (let bounce = 0; bounce < this.maxBounces; bounce++) {
      if (currentSegmentIndex >= this.beamSegments.length) break;

      let closestHit = null;
      let closestDist = maxRange;

      // 1. Obstacle intersection
      const obsRes = this.intersectObstacles(currentOrigin, currentDir, closestDist);
      if (obsRes.distance < closestDist) {
        closestDist = obsRes.distance;
        closestHit = { type: 'obstacle', obstacle: obsRes.obstacle, point: obsRes.point };
      }

      // 2. Mirrors intersection
      for (const mirror of this.mirrorManager.mirrors) {
        const mHit = this.intersectMirror(currentOrigin, currentDir, mirror);
        if (mHit && mHit.distance < closestDist) {
          closestDist = mHit.distance;
          closestHit = mHit;
        }
      }

      // 3. UFO Target intersection
      const ufoHit = this.intersectUFO(currentOrigin, currentDir, closestDist);
      if (ufoHit && ufoHit.distance <= closestDist) {
        closestDist = ufoHit.distance;
        closestHit = { type: 'ufo', point: ufoHit.point };
      }

      const segmentLength = closestDist;
      const hitPoint = currentOrigin.clone().addScaledVector(currentDir, segmentLength);

      // Render the sizzling red laser segment
      this.renderLaserSegment(currentSegmentIndex, currentOrigin, hitPoint, segmentLength);
      currentSegmentIndex++;

      // Process Hits
      if (closestHit && closestHit.mirror) {
        const mirror = closestHit.mirror;
        const normal = closestHit.normal;

        const reflectedDir = currentDir.clone().sub(normal.clone().multiplyScalar(2 * currentDir.dot(normal))).normalize();

        if (mirror.id === 1) {
          hitMirror1 = true;
        } else if (mirror.id === 2 && hitMirror1) {
          hitMirror2 = true;
        }

        this.emitSparks(hitPoint, normal, 4);

        currentOrigin = hitPoint;
        currentDir = reflectedDir;
      } else if (closestHit && closestHit.type === 'ufo') {
        this.emitSparks(hitPoint, null, 12);

        if (hitMirror1 && hitMirror2) {
          this.ufo.takeLaserDamage(delta);
        }
        break;
      } else if (closestHit && closestHit.type === 'obstacle') {
        // Laser struck an obstacle / see-through glass barrier
        this.emitSparks(hitPoint, null, 3);
        if (closestHit.obstacle === this.world.glassBarrier) {
          this.world.triggerGlassDeflect(hitPoint);
        }
        break;
      } else {
        if (closestDist < maxRange) {
          this.emitSparks(hitPoint, null, 2);
        }
        break;
      }
    }

    // Hide any unused segments
    for (let i = currentSegmentIndex; i < this.beamSegments.length; i++) {
      this.beamSegments[i].core.visible = false;
      this.beamSegments[i].mid.visible = false;
      this.beamSegments[i].aura.visible = false;
    }

    // Update UI Checklist
    if (window.uiManager) {
      window.uiManager.updateChecklist('chk-mirror1', hitMirror1);
      window.uiManager.updateChecklist('chk-mirror2', hitMirror1 && hitMirror2);
    }
  }

  renderLaserSegment(index, start, end, length) {
    const seg = this.beamSegments[index];
    if (!seg) return;

    const midPoint = start.clone().add(end).multiplyScalar(0.5);
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

    // Sizzling pulse dynamic scaling
    const pulse = 1.0 + Math.sin(this.sizzleTime + index * 1.7) * 0.12;
    const auraPulse = 1.0 + Math.cos(this.sizzleTime * 1.4 + index) * 0.22;

    // 1. Core
    seg.core.visible = true;
    seg.core.scale.set(pulse, length, pulse);
    seg.core.position.copy(midPoint);
    seg.core.quaternion.copy(quat);

    // 2. Mid Red Body
    seg.mid.visible = true;
    seg.mid.scale.set(pulse * 1.1, length, pulse * 1.1);
    seg.mid.position.copy(midPoint);
    seg.mid.quaternion.copy(quat);

    // 3. Fiery Outer Glow Aura
    seg.aura.visible = true;
    seg.aura.scale.set(auraPulse * 1.3, length, auraPulse * 1.3);
    seg.aura.position.copy(midPoint);
    seg.aura.quaternion.copy(quat);
  }
}

window.OpticsEngine = OpticsEngine;
