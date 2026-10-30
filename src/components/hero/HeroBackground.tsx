import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HeroBackgroundProps {
  reducedMotion: boolean;
}

export function HeroBackground({ reducedMotion }: HeroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Energy particle field
    const particleCount = 120;
    const positions = new Float32Array(particleCount * 3);
    const velocities: Array<{ vx: number; vy: number; vz: number }> = [];
    const colorBase = new THREE.Color('#2aa89a');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      velocities.push({
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        vz: (Math.random() - 0.5) * 0.02,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.8,
      color: colorBase,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Connection lines between nearby particles
    const maxConnections = 80;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: colorBase,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    const connectionDistance = 25;
    const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;

    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);

      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += velocities[i].vx;
        posArray[i * 3 + 1] += velocities[i].vy;
        posArray[i * 3 + 2] += velocities[i].vz;

        // Wrap around bounds
        if (posArray[i * 3] > 50) posArray[i * 3] = -50;
        if (posArray[i * 3] < -50) posArray[i * 3] = 50;
        if (posArray[i * 3 + 1] > 30) posArray[i * 3 + 1] = -30;
        if (posArray[i * 3 + 1] < -30) posArray[i * 3 + 1] = 30;
      }
      posAttr.needsUpdate = true;

      // Update connection lines
      let lineIdx = 0;
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          if (lineIdx >= maxConnections) break;
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < connectionDistance) {
            linePositions[lineIdx * 6] = posArray[i * 3];
            linePositions[lineIdx * 6 + 1] = posArray[i * 3 + 1];
            linePositions[lineIdx * 6 + 2] = posArray[i * 3 + 2];
            linePositions[lineIdx * 6 + 3] = posArray[j * 3];
            linePositions[lineIdx * 6 + 4] = posArray[j * 3 + 1];
            linePositions[lineIdx * 6 + 5] = posArray[j * 3 + 2];
            lineIdx++;
          }
        }
      }
      // Zero out unused line positions
      for (let k = lineIdx; k < maxConnections; k++) {
        linePositions[k * 6] = 0;
        linePositions[k * 6 + 1] = 0;
        linePositions[k * 6 + 2] = 0;
        linePositions[k * 6 + 3] = 0;
        linePositions[k * 6 + 4] = 0;
        linePositions[k * 6 + 5] = 0;
      }
      (lineGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;

      particles.rotation.y += 0.0008;
      lines.rotation.y = particles.rotation.y;

      renderer.render(scene, camera);
    }
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current !== null) cancelAnimationFrame(animationIdRef.current);
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0"
      aria-hidden="true"
      style={{ pointerEvents: 'none' }}
    />
  );
}
