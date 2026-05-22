import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ThreeBg = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particles Geometry
    const particlesCount = 700;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);

    const themeColors = [
      new THREE.Color('#7c3aed'), // Purple
      new THREE.Color('#06b6d4'), // Cyan
      new THREE.Color('#d946ef'), // Neon pink
    ];

    for (let i = 0; i < particlesCount * 3; i += 3) {
      // Coordinates (spread out)
      positions[i] = (Math.random() - 0.5) * 80;     // X
      positions[i + 1] = (Math.random() - 0.5) * 80; // Y
      positions[i + 2] = (Math.random() - 0.5) * 50; // Z

      // Color choice
      const randomColor = themeColors[Math.floor(Math.random() * themeColors.length)];
      colors[i] = randomColor.r;
      colors[i + 1] = randomColor.g;
      colors[i + 2] = randomColor.b;
    }

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle Texture (draw a soft circle using canvas)
    const createCircleTexture = () => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }
      return new THREE.CanvasTexture(canvas);
    };

    // Particle Material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.45,
      map: createCircleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true,
    });

    // Particle System
    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particleSystem);

    // Grid Node helper (to give subtle geometric structural depth)
    const geometryLines = new THREE.BufferGeometry();
    const linePositions = [];
    // Select some random particles to connect
    for (let i = 0; i < 50; i++) {
      const p1 = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30
      );
      const p2 = new THREE.Vector3(
        p1.x + (Math.random() - 0.5) * 15,
        p1.y + (Math.random() - 0.5) * 15,
        p1.z + (Math.random() - 0.5) * 10
      );
      linePositions.push(p1.x, p1.y, p1.z);
      linePositions.push(p2.x, p2.y, p2.z);
    }
    geometryLines.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0.12,
    });
    const lineSystem = new THREE.LineSegments(geometryLines, lineMaterial);
    scene.add(lineSystem);

    // Mouse Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.05;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.05;
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize Handler
    const onWindowResize = () => {
      if (!containerRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', onWindowResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Rotate particle system slowly
      particleSystem.rotation.y = elapsedTime * 0.04;
      particleSystem.rotation.x = elapsedTime * 0.02;
      lineSystem.rotation.y = elapsedTime * 0.03;

      // Smooth camera movement based on mouse
      targetX = mouseX * 0.15;
      targetY = -mouseY * 0.15;

      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      lineMaterial.dispose();
      geometryLines.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none opacity-80" />;
};

export default ThreeBg;
