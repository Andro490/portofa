/**
 * LightModeBg.tsx
 *
 * Interactive Knowledge-Web background — vanilla Three.js (React 19 safe)
 * Designed for the light / white mode of a Cinema E-Learning Platform.
 *
 * Features:
 *  • Floating constellation of sphere nodes connected by elegant thin lines
 *  • Soft lavender / sky-blue / cyan palette at 15-25% opacity
 *  • Organic morphing float animation
 *  • Smooth mouse-parallax camera (magnetic pull effect)
 *  • Pure white (#f8f9fa) gradient CSS base — nothing blocks UI
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ─── Config ────────────────────────────────────────────────────────────────────
const NODE_COUNT  = 80;
const LINE_PAIRS  = 110;
const SPREAD      = 24;
const CONNECT_D   = 9.5;   // max distance to draw a line between two nodes
const FLOAT_SPD   = 0.16;  // base animation speed

// Soft professional palette for white background
const PALETTE = [
  new THREE.Color('#7c9cef'),  // soft blue
  new THREE.Color('#a78bfa'),  // lavender
  new THREE.Color('#67e8f9'),  // cyan
  new THREE.Color('#93c5fd'),  // sky blue
  new THREE.Color('#c4b5fd'),  // light purple
  new THREE.Color('#6ee7b7'),  // soft mint
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Build initial random node positions */
function makeNodes(count: number, spread: number) {
  const base:    THREE.Vector3[] = [];
  const offsets: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    base.push(new THREE.Vector3(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread * 0.65,
      (Math.random() - 0.5) * spread * 0.4,
    ));
    offsets.push(new THREE.Vector3(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
    ));
  }
  return { base, offsets };
}

/** Recompute line vertex buffer from current node world positions */
function updateLineBuffer(
  positions: THREE.Vector3[],
  buf: Float32Array,
  maxPairs: number,
  maxDist: number,
): number {
  let ptr = 0;
  const max = maxPairs * 6;

  for (let i = 0; i < positions.length && ptr < max; i++) {
    for (let j = i + 1; j < positions.length && ptr < max; j++) {
      if (positions[i].distanceTo(positions[j]) < maxDist) {
        buf[ptr++] = positions[i].x;
        buf[ptr++] = positions[i].y;
        buf[ptr++] = positions[i].z;
        buf[ptr++] = positions[j].x;
        buf[ptr++] = positions[j].y;
        buf[ptr++] = positions[j].z;
      }
    }
  }

  return ptr; // number of floats written
}

// ─── Component ─────────────────────────────────────────────────────────────────
const LightModeBg = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── Scene / Camera / Renderer ──────────────────────────────────────────
    const W = window.innerWidth;
    const H = window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(65, W / H, 0.1, 200);
    camera.position.z = 32;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // fully transparent canvas
    el.appendChild(renderer.domElement);

    // ── Node spheres ───────────────────────────────────────────────────────
    const { base, offsets } = makeNodes(NODE_COUNT, SPREAD);
    const currentPos: THREE.Vector3[] = base.map(v => v.clone());

    // Each node = tiny sphere mesh
    const nodeMeshes: THREE.Mesh[] = [];
    const sphereGeo  = new THREE.SphereGeometry(0.07, 7, 7); // shared geo

    base.forEach((p, i) => {
      const col  = PALETTE[i % PALETTE.length].clone();
      const mesh = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshBasicMaterial({
          color:       col,
          transparent: true,
          opacity:     0.18 + Math.random() * 0.12, // 18-30%
          depthWrite:  false,
        }),
      );
      mesh.position.copy(p);
      scene.add(mesh);
      nodeMeshes.push(mesh);
    });

    // ── Connection Lines ────────────────────────────────────────────────────
    const lineBuf    = new Float32Array(LINE_PAIRS * 6);
    const lineGeo    = new THREE.BufferGeometry();
    const linePosAttr = new THREE.BufferAttribute(lineBuf, 3);
    linePosAttr.setUsage(THREE.DynamicDrawUsage);
    lineGeo.setAttribute('position', linePosAttr);

    const lineMat = new THREE.LineBasicMaterial({
      color:       new THREE.Color('#a78bfa'), // lavender lines
      transparent: true,
      opacity:     0.13,
      depthWrite:  false,
      blending:    THREE.NormalBlending,
    });

    const lineSegs = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineSegs);

    // Do initial line build
    const written = updateLineBuffer(currentPos, lineBuf, LINE_PAIRS, CONNECT_D);
    linePosAttr.needsUpdate = true;
    lineGeo.setDrawRange(0, written / 3);

    // ── Soft ambient glow points (depth accent) ─────────────────────────────
    const glowCount = 25;
    const glowPos   = new Float32Array(glowCount * 3);
    const glowCol   = new Float32Array(glowCount * 3);
    for (let i = 0; i < glowCount * 3; i += 3) {
      glowPos[i]     = (Math.random() - 0.5) * SPREAD * 1.2;
      glowPos[i + 1] = (Math.random() - 0.5) * SPREAD * 0.8;
      glowPos[i + 2] = (Math.random() - 0.5) * SPREAD * 0.3 - 5;
      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      glowCol[i]     = c.r;
      glowCol[i + 1] = c.g;
      glowCol[i + 2] = c.b;
    }

    // Canvas texture: soft circle for glow points
    const texSize = 64;
    const tc = document.createElement('canvas');
    tc.width = tc.height = texSize;
    const tctx = tc.getContext('2d')!;
    const g = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0,   'rgba(167,139,250,0.9)');
    g.addColorStop(0.3, 'rgba(167,139,250,0.5)');
    g.addColorStop(0.7, 'rgba(167,139,250,0.1)');
    g.addColorStop(1,   'rgba(167,139,250,0)');
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, texSize, texSize);
    const glowTex = new THREE.CanvasTexture(tc);

    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPos, 3));
    glowGeo.setAttribute('color',    new THREE.BufferAttribute(glowCol, 3));

    const glowMat = new THREE.PointsMaterial({
      size:         1.8,
      map:          glowTex,
      transparent:  true,
      opacity:      0.25,
      blending:     THREE.NormalBlending,
      depthWrite:   false,
      vertexColors: true,
    });

    const glowPoints = new THREE.Points(glowGeo, glowMat);
    scene.add(glowPoints);

    // ── Mouse tracking ──────────────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1..1
      my = (e.clientY / window.innerHeight - 0.5) * 2; // -1..1
    };
    window.addEventListener('mousemove', onMouse);

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animation Loop ──────────────────────────────────────────────────────
    let animId: number;
    let frame  = 0;
    const startTime = performance.now();

    const loop = () => {
      animId = requestAnimationFrame(loop);
      const t = ((performance.now() - startTime) / 1000) * FLOAT_SPD;
      frame++;

      // Update every node position (organic float)
      for (let i = 0; i < NODE_COUNT; i++) {
        const ox = offsets[i].x;
        const oy = offsets[i].y;
        const oz = offsets[i].z;

        const nx = base[i].x + Math.sin(t + ox) * 0.55;
        const ny = base[i].y + Math.cos(t + oy) * 0.45;
        const nz = base[i].z + Math.sin(t * 0.7 + oz) * 0.35;

        nodeMeshes[i].position.set(nx, ny, nz);
        currentPos[i].set(nx, ny, nz);

        // Subtle scale pulse
        const s = 1 + Math.sin(t * 1.8 + ox) * 0.18;
        nodeMeshes[i].scale.setScalar(s);
      }

      // Rebuild lines every 2 frames (performance trade-off)
      if (frame % 2 === 0) {
        const w = updateLineBuffer(currentPos, lineBuf, LINE_PAIRS, CONNECT_D);
        linePosAttr.needsUpdate = true;
        lineGeo.setDrawRange(0, w / 3);
      }

      // Slow glow rotation
      glowPoints.rotation.y = t * 0.05;
      glowPoints.rotation.z = t * 0.02;

      // Smooth camera parallax (magnetic pull)
      const tx =  mx * 3.0;
      const ty = -my * 2.0;
      camera.position.x += (tx - camera.position.x) * 0.025;
      camera.position.y += (ty - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    loop();

    // ── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);

      sphereGeo.dispose();
      nodeMeshes.forEach(m => (m.material as THREE.Material).dispose());
      lineGeo.dispose();
      lineMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      glowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      {/* CSS gradient base — clean white with soft lavender/cyan blobs */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          zIndex: -20,
          background:
            'radial-gradient(ellipse at 20% 15%, rgba(167,139,250,0.16) 0%, transparent 45%),' +
            'radial-gradient(ellipse at 80% 80%, rgba(103,232,249,0.13) 0%, transparent 45%),' +
            'radial-gradient(ellipse at 55% 45%, rgba(147,197,253,0.10) 0%, transparent 60%),' +
            '#f8f9fa',
        }}
      />

      {/* Three.js canvas — transparent, above the gradient */}
      <div
        ref={containerRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -10, opacity: 0.75 }}
      />
    </>
  );
};

export default LightModeBg;
