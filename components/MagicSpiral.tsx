import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { getRandomSpherePoint } from '../utils/math';
import { damp } from 'maath/easing';

// Custom shader for soft, blurry, faint light dots
const vertexShader = `
  attribute float aSize;
  varying float vAlpha;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation (objects get smaller when far away)
    // Multiplied by aSize attribute for individual variation
    gl_PointSize = aSize * (400.0 / -mvPosition.z);
  }
`;

const fragmentShader = `
  void main() {
    // Calculate distance from center of the point (0.0 to 0.5)
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float r = length(xy);
    
    // Circular clipping
    if (r > 0.5) discard;

    // Soft blur calculation
    // 1.0 at center, 0.0 at edge
    float glow = 1.0 - (r * 2.0);
    
    // Smooth out the falloff to make it look "blurry" / foggy
    glow = pow(glow, 2.0); 

    // Final color: Boosted White for extra glow
    // RGB = 2.0 pushes it into HDR territory for the Bloom effect
    // Alpha = glow * 0.6 (slightly increased from 0.5 for visibility)
    gl_FragColor = vec4(2.0, 2.0, 2.0, glow * 0.6); 
  }
`;

interface MagicSpiralProps {
  treeState: TreeState;
  count?: number;
  radius?: number;
  height?: number;
}

export const MagicSpiral: React.FC<MagicSpiralProps> = ({ 
  treeState, 
  count = 120, // Drastically reduced for "spaced out" look
  radius = 7.0, 
  height = 15 
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate data for Dual Positions
  const { positions, scatterPositions, treePositions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const tree = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = i / count; // Normalized 0 -> 1
      
      // --- Tree Spiral Shape ---
      const loops = 4; 
      const angle = t * Math.PI * 2 * loops; 
      
      const currentRadius = radius * (1 - t) + 0.5; 
      
      const y = (t - 0.5) * height; // Bottom to Top
      const x = Math.cos(angle) * currentRadius;
      const z = Math.sin(angle) * currentRadius;

      tree[i * 3] = x;
      tree[i * 3 + 1] = y;
      tree[i * 3 + 2] = z;

      // --- Scatter Shape ---
      const scatterP = getRandomSpherePoint(20);
      scatter[i * 3] = scatterP.x;
      scatter[i * 3 + 1] = scatterP.y;
      scatter[i * 3 + 2] = scatterP.z;

      // Initial pos
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      // --- Random Size for "Fairy Light" feel ---
      // Randomize size slightly so they aren't uniform
      sz[i] = 0.5 + Math.random() * 0.5; 
    }

    return { 
      positions: pos, 
      scatterPositions: scatter, 
      treePositions: tree, 
      sizes: sz
    };
  }, [count, radius, height]);

  // Animation State
  const progress = useRef(0);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const isTree = treeState === TreeState.TREE_SHAPE;
    // Scatter: 2.5 (Fastish), Tree: 1.0 (Elegant)
    const dampSpeed = isTree ? 1.0 : 2.5;

    // 1. Handle State Transition
    damp(progress, 'current', isTree ? 1 : 0, dampSpeed, delta);
    const p = progress.current;

    const positionsAttribute = pointsRef.current.geometry.attributes.position;
    
    // 2. Rotate
    pointsRef.current.rotation.y += delta * 0.15; 

    // 3. Update Particle Positions
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const tx = treePositions[ix];
      const ty = treePositions[iy];
      const tz = treePositions[iz];

      const sx = scatterPositions[ix];
      const sy = scatterPositions[iy];
      const sz = scatterPositions[iz];

      // Slower, dreamy wave
      const time = state.clock.getElapsedTime();
      const wave = Math.sin(time * 1.0 + i * 0.2) * 0.1 * p;

      positionsAttribute.setXYZ(
        i,
        sx + (tx - sx) * p,
        sy + (ty - sy) * p + wave,
        sz + (tz - sz) * p
      );
    }
    
    positionsAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      {/* 
        Using shaderMaterial for "Blurry/Faint" look.
        - AdditiveBlending ensures they still glow against the dark background.
        - depthWrite=false prevents them from occluding each other weirdly.
      */}
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};