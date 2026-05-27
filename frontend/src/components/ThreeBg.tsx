/**
 * ThreeBg.tsx  — Smart background switcher
 *
 * • Dark  mode → classic Three.js neon particles (additive blending)
 * • Light mode → React Three Fiber "Knowledge Web" (LightModeBg)
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAppSelector } from '../hooks/redux';
import LightModeBg from './LightModeBg';

// ─── Dark-mode Three.js scene (unchanged, battle-tested) ────────────────────
const DarkBg = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width  = window.innerWidth;
    const height = window.innerHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.domElement);

    // Particles
    const count    = 700;
    const positions = new Float32Array(count * 3);
    const colors    = new Float32Array(count * 3);
    const palette   = [
      new THREE.Color('#7c3aed'),
      new THREE.Color('#06b6d4'),
      new THREE.Color('#d946ef'),
    ];

    for (let i = 0; i < count * 3; i += 3) {
      positions[i]     = (Math.random() - 0.5) * 80;
      positions[i + 1] = (Math.random() - 0.5) * 80;
      positions[i + 2] = (Math.random() - 0.5) * 50;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i]     = c.r;
      colors[i + 1] = c.g;
      colors[i + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    // Soft glow texture
    const texCanvas = document.createElement('canvas');
    texCanvas.width = texCanvas.height = 64;
    const ctx = texCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,   'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(texCanvas);

    const mat = new THREE.PointsMaterial({
      size: 0.45,
      map: tex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Lines
    const lineGeo  = new THREE.BufferGeometry();
    const lineVerts: number[] = [];
    for (let i = 0; i < 50; i++) {
      const p1 = new THREE.Vector3((Math.random()-0.5)*40,(Math.random()-0.5)*40,(Math.random()-0.5)*30);
      const p2 = new THREE.Vector3(p1.x+(Math.random()-0.5)*15,p1.y+(Math.random()-0.5)*15,p1.z+(Math.random()-0.5)*10);
      lineVerts.push(p1.x,p1.y,p1.z,p2.x,p2.y,p2.z);
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: 0.12 });
    const lines   = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // Mouse
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX - window.innerWidth  / 2) * 0.05;
      my = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener('mousemove', onMouse);

    // Resize
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Loop
    let id: number;
    const startTime = performance.now();
    const loop = () => {
      id = requestAnimationFrame(loop);
      const t = (performance.now() - startTime) / 1000;
      particles.rotation.y = t * 0.04;
      particles.rotation.x = t * 0.02;
      lines.rotation.y     = t * 0.03;
      camera.position.x += (mx * 0.15 - camera.position.x) * 0.05;
      camera.position.y += (-my * 0.15 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      if (containerRef.current?.contains(renderer.domElement)) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      geo.dispose(); mat.dispose(); tex.dispose();
      lineGeo.dispose(); lineMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      {/* Dark gradient base layer */}
      <div
        className="fixed inset-0 -z-20 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 0% 0%, rgba(124,58,237,0.10) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.10) 0%, transparent 55%),' +
            '#050212',
        }}
      />
      <div
        ref={containerRef}
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ opacity: 0.85 }}
      />
    </>
  );
};

// ─── Main exported switcher ───────────────────────────────────────────────────
const ThreeBg = () => {
  const isDark = useAppSelector((state) => state.theme.mode === 'dark');

  if (isDark) return <DarkBg />;

  return <LightModeBg />;
};

export default ThreeBg;
