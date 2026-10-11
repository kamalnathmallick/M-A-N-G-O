import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * HeroBotanicalScene: High-fidelity interactive 3D Mango & Botanical scene.
 * Features:
 * - Procedurally sculpted ripe mango with gradient surface materials (blush to gold to fresh green)
 * - Stem with natural woody curvature
 * - Lush glossy mango leaves with delicate vein grooves
 * - Flowering panicle axis with floral bud nodes
 * - Gentle ambient floating, orbital rotation, and smooth mouse-follow parallax
 * - Golden agricultural pollen/spores drifting through an emerald light field
 * - Respects prefers-reduced-motion and gracefully degrades
 */
const checkWebGL = () => {
  if (typeof window === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

export default function HeroBotanicalScene({ className = '' }) {
  const mountRef = useRef(null);
  const [webglSupported] = useState(checkWebGL);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 4.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- Lighting Setup (Emerald atmospheric & sunny warm highlights) ---
    const ambientLight = new THREE.AmbientLight(0xdcfce7, 1.4); // soft pale green/emerald ambient
    scene.add(ambientLight);

    const keySunLight = new THREE.DirectionalLight(0xfffbeb, 2.8); // warm orchard sun
    keySunLight.position.set(4, 5, 4);
    keySunLight.castShadow = true;
    keySunLight.shadow.mapSize.width = 1024;
    keySunLight.shadow.mapSize.height = 1024;
    keySunLight.shadow.bias = -0.001;
    scene.add(keySunLight);

    const emeraldRimLight = new THREE.DirectionalLight(0x10b981, 2.2); // emerald canopy rim
    emeraldRimLight.position.set(-4, -2, -3);
    scene.add(emeraldRimLight);

    const goldenBounceLight = new THREE.PointLight(0xf59e0b, 1.8, 10); // mango glow
    goldenBounceLight.position.set(0, -1.8, 2);
    scene.add(goldenBounceLight);

    // --- Main Botanical Group ---
    const botanicalGroup = new THREE.Group();
    scene.add(botanicalGroup);

    // 1. Procedural Mango Fruit
    // Sculpt an organic mango shape: asymmetrically tapered ellipsoid with gentle cheek curve
    const mangoGeo = new THREE.SphereGeometry(1, 64, 64);
    const posAttr = mangoGeo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < posAttr.count; i++) {
      v.fromBufferAttribute(posAttr, i);

      // Y-axis height stretching (elongation)
      v.y *= 1.35;

      // Asymmetric cheek curve: fuller on one side (+x) and tapering toward beak (-y)
      const taper = 1.0 - (v.y + 0.6) * 0.18;
      v.x *= taper;
      v.z *= taper * 0.88; // mango lateral flattening

      // Characteristic mango beak curve at bottom apex
      if (v.y < -0.5) {
        const factor = (-v.y - 0.5) * 0.45;
        v.x += factor * 0.4;
        v.z += factor * 0.15;
      }

      // Stem cavity depression at top (+y)
      if (v.y > 1.1) {
        const cavity = (v.y - 1.1) * 0.35;
        v.y -= cavity * (1.0 - Math.min(1.0, Math.sqrt(v.x * v.x + v.z * v.z) * 1.5));
      }

      posAttr.setXYZ(i, v.x, v.y, v.z);
    }
    mangoGeo.computeVertexNormals();

    // Custom gradient-like canvas texture for ripe Alphonso/Kesar mango skin
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 512);
      grad.addColorStop(0.0, '#15803d'); // fresh orchard green near stem
      grad.addColorStop(0.2, '#84cc16'); // lime yellow-green transition
      grad.addColorStop(0.5, '#f59e0b'); // golden mango yellow
      grad.addColorStop(0.8, '#ea580c'); // warm blushing orange
      grad.addColorStop(1.0, '#dc2626'); // ripe crimson sun-kissed cheek
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Add gentle microscopic lenticel stippling (organic mango skin pores)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.35)';
      for (let p = 0; p < 800; p++) {
        const rx = Math.random() * 512;
        const ry = Math.random() * 512;
        ctx.beginPath();
        ctx.arc(rx, ry, Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const mangoSkinTexture = new THREE.CanvasTexture(canvas);

    const mangoMat = new THREE.MeshStandardMaterial({
      map: mangoSkinTexture,
      roughness: 0.38,
      metalness: 0.04,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25
    });

    const mangoMesh = new THREE.Mesh(mangoGeo, mangoMat);
    mangoMesh.scale.set(0.9, 0.9, 0.9);
    mangoMesh.position.set(0, -0.15, 0);
    mangoMesh.rotation.set(0.1, -0.3, -0.12);
    mangoMesh.castShadow = true;
    mangoMesh.receiveShadow = true;
    botanicalGroup.add(mangoMesh);

    // 2. Mango Stem (Pedicel)
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.05, 0),
      new THREE.Vector3(0.04, 1.35, 0.05),
      new THREE.Vector3(0.08, 1.65, 0.08)
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 16, 0.048, 12, false);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x4d3822, // woody olive-brown
      roughness: 0.85,
      metalness: 0.05
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    botanicalGroup.add(stemMesh);

    // 3. Realistic Mango Leaves
    const createMangoLeaf = (length = 1.6, width = 0.42, curveZ = 0.2) => {
      const leafShape = new THREE.Shape();
      leafShape.moveTo(0, 0);
      leafShape.bezierCurveTo(width * 0.7, length * 0.25, width, length * 0.55, 0, length);
      leafShape.bezierCurveTo(-width, length * 0.55, -width * 0.7, length * 0.25, 0, 0);

      const leafGeo = new THREE.ShapeGeometry(leafShape, 24);
      // Curve the leaf geometry along length and cross-section (V-shape vein groove)
      const lPos = leafGeo.attributes.position;
      const lv = new THREE.Vector3();
      for (let k = 0; k < lPos.count; k++) {
        lv.fromBufferAttribute(lPos, k);
        // cross-section V fold
        const fold = Math.abs(lv.x) * 0.35;
        // longitudinal downward arc
        const arc = Math.pow(lv.y / length, 2) * curveZ;
        lv.z = -fold - arc;
        lPos.setXYZ(k, lv.x, lv.y, lv.z);
      }
      leafGeo.computeVertexNormals();

      const leafMat = new THREE.MeshStandardMaterial({
        color: 0x15803d, // deep forest green
        roughness: 0.28,
        metalness: 0.08,
        side: THREE.DoubleSide
      });

      return new THREE.Mesh(leafGeo, leafMat);
    };

    // Primary Top Leaf
    const leaf1 = createMangoLeaf(1.7, 0.46, 0.35);
    leaf1.position.set(0.06, 1.45, 0.04);
    leaf1.rotation.set(-0.6, 0.8, -0.4);
    botanicalGroup.add(leaf1);

    // Secondary Accent Leaf
    const leaf2 = createMangoLeaf(1.5, 0.42, 0.3);
    leaf2.position.set(-0.02, 1.48, 0.02);
    leaf2.rotation.set(-0.4, -1.2, 0.6);
    botanicalGroup.add(leaf2);

    // Third Background Leaf
    const leaf3 = createMangoLeaf(1.3, 0.38, 0.25);
    leaf3.position.set(0.04, 1.55, -0.05);
    leaf3.rotation.set(-1.1, 0.1, -0.15);
    botanicalGroup.add(leaf3);

    // 4. Mango Flowering Panicle (Early Bud Cluster representing bud health research)
    const panicleGroup = new THREE.Group();
    const panicleStemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.08, 1.65, 0.08),
      new THREE.Vector3(0.4, 2.05, 0.3),
      new THREE.Vector3(0.7, 2.35, 0.45)
    ]);
    const panicleStemGeo = new THREE.TubeGeometry(panicleStemCurve, 20, 0.024, 8, false);
    const panicleStemMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // distinctive reddish rachis of mango panicles
      roughness: 0.6
    });
    const panicleStemMesh = new THREE.Mesh(panicleStemGeo, panicleStemMat);
    panicleGroup.add(panicleStemMesh);

    // Flower buds / panicle floral branchlets
    const budGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const budMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // creamy yellow flower bud
      roughness: 0.4,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.25
    });

    const budPoints = [
      [0.2, 1.85, 0.18],
      [0.25, 1.95, 0.24],
      [0.32, 1.9, 0.3],
      [0.38, 2.08, 0.32],
      [0.45, 2.02, 0.38],
      [0.52, 2.18, 0.4],
      [0.58, 2.12, 0.44],
      [0.64, 2.28, 0.42],
      [0.72, 2.38, 0.46]
    ];

    budPoints.forEach(([bx, by, bz]) => {
      const budMesh = new THREE.Mesh(budGeo, budMat);
      budMesh.position.set(bx, by, bz);
      panicleGroup.add(budMesh);
    });
    botanicalGroup.add(panicleGroup);

    // 5. Ambient Pollen & Orchard Particles
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 6.0;
      particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 5.0;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 3.5;
      particleSpeeds[p] = 0.2 + Math.random() * 0.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Adjust entire botanical group position
    botanicalGroup.position.set(0, -0.3, 0);

    // --- Interactive Mouse Movement / Parallax ---
    let targetRotY = 0;
    let targetRotX = 0;
    let targetCamX = 0;
    let targetCamY = 0;

    const handleMouseMove = (e) => {
      if (prefersReducedMotion) return;
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      targetRotY = nx * 0.45;
      targetRotX = -ny * 0.3;
      targetCamX = nx * 0.25;
      targetCamY = 0.4 + ny * 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w && h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      if (!prefersReducedMotion) {
        // Smooth floating bob and breathing rotation
        botanicalGroup.position.y = -0.3 + Math.sin(elapsedTime * 1.2) * 0.08;
        
        // Parallax damping
        botanicalGroup.rotation.y += (targetRotY + Math.sin(elapsedTime * 0.5) * 0.12 - botanicalGroup.rotation.y) * 0.05;
        botanicalGroup.rotation.x += (targetRotX + Math.cos(elapsedTime * 0.8) * 0.06 - botanicalGroup.rotation.x) * 0.05;

        camera.position.x += (targetCamX - camera.position.x) * 0.05;
        camera.position.y += (targetCamY - camera.position.y) * 0.05;
        camera.lookAt(0, 0.1, 0);

        // Slow organic wave on leaves
        leaf1.rotation.z = -0.4 + Math.sin(elapsedTime * 1.4) * 0.04;
        leaf2.rotation.z = 0.6 + Math.cos(elapsedTime * 1.4) * 0.04;

        // Animate particles drifting upwards like orchard pollen
        const pPositions = particleGeo.attributes.position.array;
        for (let p = 0; p < particleCount; p++) {
          pPositions[p * 3 + 1] += particleSpeeds[p] * 0.005;
          pPositions[p * 3] += Math.sin(elapsedTime + p) * 0.002;
          if (pPositions[p * 3 + 1] > 2.8) {
            pPositions[p * 3 + 1] = -2.5;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      mangoGeo.dispose();
      mangoMat.dispose();
      mangoSkinTexture.dispose();
    };
  }, [webglSupported]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-[450px] sm:h-[500px] lg:h-[560px] flex items-center justify-center select-none overflow-visible ${className}`}
      aria-label="Interactive 3D model of a mango crop with healthy foliage and panicle buds"
    >
      {!webglSupported && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/samples/landing_orchard.jpg"
            alt="Mango crop illustration"
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
      )}
    </div>
  );
}
