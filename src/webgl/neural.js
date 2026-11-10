/* ==========================================================================
   WebGL neural network field (Three.js).

   ~2,000 particles (650 on mobile / touch) float in a box. Every frame:
   1. Each particle drifts around its home position and is pushed away from
      the cursor; a spring pulls the push back (velocity + damping).
   2. A spatial hash finds pairs closer than LINK units; each pair becomes a
      line whose opacity fades with distance.
   3. "Signals" (bright accent points) travel along those links from neuron
      to neuron, choosing a random neighbour at each hop.

   Controls (driven by Motion values in src/components/Layers.jsx):
   setFly(0..1)       camera flies through the field (hero scroll-out)
   setConverge(0..1)  particles gather into a ring (contact section)
   setVisible(bool)   pauses rendering while the canvas is faded out
   syncColors()       re-reads the --neural-* colour tokens (theme change)
   burst()            pushes every particle outward (Easter egg)

   Rendering stops when the canvas is hidden or the tab is in the
   background. With reduced motion a single still frame is drawn.
   ========================================================================== */

import * as THREE from 'three';
import { cssNumber, cssVar, tokenRgb } from '../lib/color.js';

const VERT = /* glsl */ `
  attribute float aSize;
  uniform float uSize;
  uniform float uPR;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = clamp(uSize * aSize * uPR * (60.0 / max(depth, 1.0)), 0.0, 48.0 * uPR);
    // Fade points that are about to hit the camera, and very distant ones
    vFade = smoothstep(2.0, 14.0, depth) * (1.0 - smoothstep(110.0, 160.0, depth));
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(uColor, a * a * uOpacity * vFade);
  }
`;

/* Colours come from the --neural-* tokens in src/index.css (read again on
   every theme change), so the field always matches the page palette. */
function readPalette() {
  const color = (token) => new THREE.Color().setRGB(...tokenRgb(token).map((c) => c / 255), THREE.SRGBColorSpace);
  return {
    point: color('--neural-point'),
    line: color('--neural-line'),
    signal: color('--neural-signal'),
    pointAlpha: cssNumber('--neural-point-alpha', 0.85),
    lineAlpha: cssNumber('--neural-line-alpha', 0.3),
    blending: cssVar('--neural-blend') === 'normal' ? THREE.NormalBlending : THREE.AdditiveBlending
  };
}

export function createNeural(canvas, { mobile = false, reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }

  const COUNT = mobile ? 650 : 2000;
  const LINK = mobile ? 11.5 : 8.5;
  const MAX_LINKS = mobile ? 1800 : 5600;
  const SIGNALS = mobile ? 26 : 80;
  const BX = 85, BY = 48, BZ = 40;               // half-size of the particle box
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6);

  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
  camera.position.set(0, 0, 60);

  /* ----- Particle data ----- */
  const home = new Float32Array(COUNT * 3);
  const ring = new Float32Array(COUNT * 3);
  const pos = new Float32Array(COUNT * 3);
  const off = new Float32Array(COUNT * 3);
  const vel = new Float32Array(COUNT * 3);
  const phase = new Float32Array(COUNT);
  const sizes = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    home[i * 3] = (Math.random() * 2 - 1) * BX;
    home[i * 3 + 1] = (Math.random() * 2 - 1) * BY;
    home[i * 3 + 2] = (Math.random() * 2 - 1) * BZ;
    phase[i] = Math.random() * Math.PI * 2;
    sizes[i] = Math.random() < 0.04 ? 2.6 : 0.6 + Math.random() * 1.1;

    // Ring formation for the contact section
    const a = i * 2.399963;
    const r = 26 + (Math.random() - 0.5) * 5;
    ring[i * 3] = Math.cos(a) * r;
    ring[i * 3 + 1] = Math.sin(a) * r;
    ring[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  pos.set(home);

  const pGeo = new THREE.BufferGeometry();
  const pAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  pGeo.setAttribute('position', pAttr);
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uOpacity: { value: 1 }, uSize: { value: mobile ? 2.8 : 2.3 }, uPR: { value: dpr } },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false
  });
  const points = new THREE.Points(pGeo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  /* ----- Links ----- */
  const lPos = new Float32Array(MAX_LINKS * 6);
  const lCol = new Float32Array(MAX_LINKS * 8);
  const lGeo = new THREE.BufferGeometry();
  const lPosAttr = new THREE.BufferAttribute(lPos, 3).setUsage(THREE.DynamicDrawUsage);
  const lColAttr = new THREE.BufferAttribute(lCol, 4).setUsage(THREE.DynamicDrawUsage);
  lGeo.setAttribute('position', lPosAttr);
  lGeo.setAttribute('color', lColAttr);
  const lMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false });
  const lines = new THREE.LineSegments(lGeo, lMat);
  lines.frustumCulled = false;
  scene.add(lines);

  /* ----- Signals travelling along links ----- */
  const sPos = new Float32Array(SIGNALS * 3);
  const sSize = new Float32Array(SIGNALS).fill(3.2);
  const sGeo = new THREE.BufferGeometry();
  const sAttr = new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage);
  sGeo.setAttribute('position', sAttr);
  sGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
  const sMat = pMat.clone();
  sMat.uniforms = THREE.UniformsUtils.clone(pMat.uniforms);
  sMat.uniforms.uSize.value = mobile ? 3.4 : 2.8;
  const signalPoints = new THREE.Points(sGeo, sMat);
  signalPoints.frustumCulled = false;
  scene.add(signalPoints);

  const signals = Array.from({ length: SIGNALS }, () => ({
    a: (Math.random() * COUNT) | 0,
    b: (Math.random() * COUNT) | 0,
    t: Math.random(),
    speed: 0.5 + Math.random() * 0.9
  }));

  /* ----- Spatial hash ----- */
  const GX = Math.ceil((BX * 2) / LINK) + 2;
  const GY = Math.ceil((BY * 2) / LINK) + 2;
  const GZ = Math.ceil((BZ * 2) / LINK) + 2;
  const cellCount = GX * GY * GZ;
  const cellStart = new Int32Array(cellCount + 1);
  const cellFill = new Int32Array(cellCount);
  const cellOf = new Int32Array(COUNT);
  const sorted = new Int32Array(COUNT);
  const NEIGH = 4;
  const neighbours = new Int32Array(COUNT * NEIGH);
  const neighCount = new Uint8Array(COUNT);
  const cellCoord = (v, half, n) => Math.min(n - 1, Math.max(0, Math.floor((v + half) / LINK) + 1));

  /* ----- State ----- */
  let fly = 0, flyNow = 0;
  let converge = 0, convNow = 0;
  let visible = false;
  let running = false;
  let raf = 0;
  let last = performance.now();
  let lineRGB = new THREE.Color();
  let lineAlpha = 0.3;
  const mouse = { x: 0, y: 0, active: false, wx: 1e4, wy: 1e4 };
  const ndc = new THREE.Vector3();
  const dir = new THREE.Vector3();

  function syncColors() {
    const p = readPalette();
    pMat.uniforms.uColor.value.copy(p.point);
    pMat.uniforms.uOpacity.value = p.pointAlpha;
    sMat.uniforms.uColor.value.copy(p.signal);
    pMat.blending = sMat.blending = lMat.blending = p.blending;
    pMat.needsUpdate = sMat.needsUpdate = lMat.needsUpdate = true;
    lineRGB.copy(p.line);
    lineAlpha = p.lineAlpha;
    if (!running) renderOnce();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (!running) renderOnce();
  }

  function update(dt, time) {
    flyNow += (fly - flyNow) * 0.08;
    convNow += (converge - convNow) * 0.05;

    // Camera: fly-through on z, gentle sway toward the cursor
    camera.position.z = 60 - flyNow * 54;
    camera.position.x += ((mouse.active ? mouse.x * 4 : 0) - camera.position.x) * 0.03;
    camera.position.y += ((mouse.active ? mouse.y * 3 : 0) - camera.position.y) * 0.03;
    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 60);
    camera.updateMatrixWorld();

    // Cursor position projected onto the z = 0 plane
    if (mouse.active) {
      ndc.set(mouse.x, mouse.y, 0.5).unproject(camera);
      dir.copy(ndc).sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      mouse.wx = camera.position.x + dir.x * dist;
      mouse.wy = camera.position.y + dir.y * dist;
    } else {
      mouse.wx = mouse.wy = 1e4;
    }

    const R = 15;
    const c = convNow;
    for (let i = 0; i < COUNT; i++) {
      const o = i * 3;
      const ph = phase[i];
      const hx = home[o] + (ring[o] - home[o]) * c;
      const hy = home[o + 1] + (ring[o + 1] - home[o + 1]) * c;
      const hz = home[o + 2] + (ring[o + 2] - home[o + 2]) * c;
      const drift = 1 - c * 0.7;
      const x = hx + Math.sin(time * 0.31 + ph) * 1.6 * drift;
      const y = hy + Math.cos(time * 0.27 + ph * 1.3) * 1.6 * drift;
      const z = hz + Math.sin(time * 0.23 + ph * 0.7) * 1.6 * drift;

      // Repel from the cursor
      const dx = x + off[o] - mouse.wx;
      const dy = y + off[o + 1] - mouse.wy;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 0.55;
        vel[o] += (dx / d) * f;
        vel[o + 1] += (dy / d) * f;
      }
      // Spring back
      vel[o] = (vel[o] - off[o] * 0.03) * 0.9;
      vel[o + 1] = (vel[o + 1] - off[o + 1] * 0.03) * 0.9;
      vel[o + 2] = (vel[o + 2] - off[o + 2] * 0.03) * 0.9;
      off[o] += vel[o]; off[o + 1] += vel[o + 1]; off[o + 2] += vel[o + 2];

      pos[o] = x + off[o];
      pos[o + 1] = y + off[o + 1];
      pos[o + 2] = z + off[o + 2];
    }
    pAttr.needsUpdate = true;

    buildLinks();
    moveSignals(dt);

    // Fade lines while flying through so the camera is not inside a web
    lMat.opacity = 1 - flyNow * 0.75;
  }

  function buildLinks() {
    cellFill.fill(0);
    for (let i = 0; i < COUNT; i++) {
      const o = i * 3;
      const cx = cellCoord(pos[o], BX, GX);
      const cy = cellCoord(pos[o + 1], BY, GY);
      const cz = cellCoord(pos[o + 2], BZ, GZ);
      const cell = (cz * GY + cy) * GX + cx;
      cellOf[i] = cell;
      cellFill[cell]++;
    }
    let acc = 0;
    for (let k = 0; k < cellCount; k++) { cellStart[k] = acc; acc += cellFill[k]; cellFill[k] = 0; }
    cellStart[cellCount] = acc;
    for (let i = 0; i < COUNT; i++) {
      const cell = cellOf[i];
      sorted[cellStart[cell] + cellFill[cell]++] = i;
    }

    neighCount.fill(0);
    const L2 = LINK * LINK;
    const alphaScale = lineAlpha * (1 - convNow * 0.55);   // the dense ring needs lighter lines
    let n = 0;
    for (let i = 0; i < COUNT && n < MAX_LINKS; i++) {
      const o = i * 3;
      const cell = cellOf[i];
      const cx = cell % GX;
      const cy = ((cell / GX) | 0) % GY;
      const cz = (cell / (GX * GY)) | 0;
      for (let dz = -1; dz <= 1; dz++) {
        const zz = cz + dz;
        if (zz < 0 || zz >= GZ) continue;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = cy + dy;
          if (yy < 0 || yy >= GY) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = cx + dx;
            if (xx < 0 || xx >= GX) continue;
            const c2 = (zz * GY + yy) * GX + xx;
            for (let k = cellStart[c2]; k < cellStart[c2 + 1]; k++) {
              const j = sorted[k];
              if (j <= i) continue;
              const p = j * 3;
              const ex = pos[p] - pos[o];
              const ey = pos[p + 1] - pos[o + 1];
              const ez = pos[p + 2] - pos[o + 2];
              const d2 = ex * ex + ey * ey + ez * ez;
              if (d2 > L2) continue;

              const a = (1 - Math.sqrt(d2) / LINK) * alphaScale;
              const lp = n * 6;
              lPos[lp] = pos[o]; lPos[lp + 1] = pos[o + 1]; lPos[lp + 2] = pos[o + 2];
              lPos[lp + 3] = pos[p]; lPos[lp + 4] = pos[p + 1]; lPos[lp + 5] = pos[p + 2];
              const lc = n * 8;
              lCol[lc] = lCol[lc + 4] = lineRGB.r;
              lCol[lc + 1] = lCol[lc + 5] = lineRGB.g;
              lCol[lc + 2] = lCol[lc + 6] = lineRGB.b;
              lCol[lc + 3] = lCol[lc + 7] = a;

              if (neighCount[i] < NEIGH) neighbours[i * NEIGH + neighCount[i]++] = j;
              if (neighCount[j] < NEIGH) neighbours[j * NEIGH + neighCount[j]++] = i;
              if (++n >= MAX_LINKS) break;
            }
            if (n >= MAX_LINKS) break;
          }
        }
      }
    }
    lGeo.setDrawRange(0, n * 2);
    lPosAttr.needsUpdate = true;
    lColAttr.needsUpdate = true;
  }

  function moveSignals(dt) {
    for (let s = 0; s < SIGNALS; s++) {
      const sig = signals[s];
      sig.t += dt * sig.speed * 1.6;
      if (sig.t >= 1) {
        sig.a = sig.b;
        const count = neighCount[sig.a];
        sig.b = count ? neighbours[sig.a * NEIGH + ((Math.random() * count) | 0)] : (Math.random() * COUNT) | 0;
        sig.t = 0;
      }
      const a = sig.a * 3;
      const b = sig.b * 3;
      const t = sig.t;
      sPos[s * 3] = pos[a] + (pos[b] - pos[a]) * t;
      sPos[s * 3 + 1] = pos[a + 1] + (pos[b + 1] - pos[a + 1]) * t;
      sPos[s * 3 + 2] = pos[a + 2] + (pos[b + 2] - pos[a + 2]) * t;
    }
    sAttr.needsUpdate = true;
  }

  function renderOnce() {
    update(0, performance.now() / 1000);
    renderer.render(scene, camera);
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt, now / 1000);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduced || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /* ----- Events ----- */
  const onPointer = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouse.active = e.pointerType === 'mouse';
  };
  const onLeave = () => { mouse.active = false; };
  const onVisibility = () => {
    if (document.hidden) stop();
    else if (visible) start();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('mouseleave', onLeave);
  document.addEventListener('visibilitychange', onVisibility);

  let hideTimer = 0;
  syncColors();
  resize();

  return {
    setFly(v) { fly = v; },
    setConverge(v) { converge = v; },
    setVisible(v) {
      if (v === visible) return;
      visible = v;
      clearTimeout(hideTimer);
      if (v) start();
      else hideTimer = setTimeout(() => { if (!visible) stop(); }, 900);   // after the fade-out
    },
    syncColors,
    burst() {
      for (let i = 0; i < COUNT; i++) {
        const o = i * 3;
        const len = Math.hypot(pos[o], pos[o + 1], pos[o + 2]) || 1;
        const f = 2 + Math.random() * 4;
        vel[o] += (pos[o] / len) * f;
        vel[o + 1] += (pos[o + 1] / len) * f;
        vel[o + 2] += (pos[o + 2] / len) * f;
      }
      signals.forEach((s) => { s.speed *= 2.5; setTimeout(() => { s.speed /= 2.5; }, 1500); });
      if (reduced) renderOnce();
    },
    destroy() {
      stop();
      clearTimeout(hideTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.dispose();
    }
  };
}
