import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getTreeSpiralPoint, getRandomSpherePoint } from '../utils/math';
import { TreeState } from '../types';
import { damp } from 'maath/easing';

// Custom Shader for the Foliage
const vertexShader = `
  uniform float uTime;
  uniform float uProgress;
  
  attribute vec3 aScatterPos;
  attribute vec3 aTreePos;
  attribute float aRandom;
  
  varying float vAlpha;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    
    // Interpolate between scatter and tree positions
    vec3 targetPos = mix(aScatterPos, aTreePos, uProgress);
    
    // Add "Breathing" animation
    float breathe = sin(uTime * 1.5 + aRandom * 10.0) * 0.1;
    float chaotic = sin(uTime * 0.5 + aRandom * 5.0) * 0.5;
    
    // Apply movement based on progress
    vec3 movement = vec3(0.0, 1.0, 0.0) * mix(chaotic, breathe, uProgress);
    
    vec3 finalPos = targetPos + movement;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    
    // Size attenuation
    gl_PointSize = (80.0 * aRandom + 20.0) * (1.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    vAlpha = 0.8 + 0.2 * sin(uTime * 3.0 + aRandom * 10.0);
  }
`;

const fragmentShader = `
  varying float vAlpha;
  varying vec2 vUv;

  void main() {
    // Circular particle
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if(ll > 0.5) discard;
    
    // Gradient: Emerald Center -> Gold Rim
    vec3 colorCore = vec3(0.0, 0.4, 0.15); // Deep Emerald
    vec3 colorRim = vec3(1.0, 0.8, 0.2);   // Gold
    
    // Soft mix based on distance from center
    float mixFactor = smoothstep(0.0, 0.5, ll);
    vec3 finalColor = mix(colorCore, colorRim, pow(mixFactor, 3.0)); // Bias towards emerald
    
    // Add extra glow brightness
    gl_FragColor = vec4(finalColor * 2.0, vAlpha); 
  }
`;

interface FoliageProps {
  count?: number;
  treeState: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ count = 6000, treeState }) => {
  const meshRef = useRef<THREE.Points>(null);
  
  // Create buffers
  const { positions, scatterPositions, treePositions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3); // Current positions (dummy)
    const scatter = new Float32Array(count * 3);
    const tree = new Float32Array(count * 3);
    const rnd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Tree Shape
      const t = Math.pow(Math.random(), 0.8); 
      const treeP = getTreeSpiralPoint(t, 6, 14, 15, 0.6);
      tree[i * 3] = treeP.x;
      tree[i * 3 + 1] = treeP.y;
      tree[i * 3 + 2] = treeP.z;

      // Scatter Shape
      const scatterP = getRandomSpherePoint(15); 
      scatter[i * 3] = scatterP.x;
      scatter[i * 3 + 1] = scatterP.y;
      scatter[i * 3 + 2] = scatterP.z;

      rnd[i] = Math.random();
    }
    
    return { 
      positions: pos, 
      scatterPositions: scatter, 
      treePositions: tree, 
      randoms: rnd 
    };
  }, [count]);

  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 }
  }), []);

  // Use a ref for the progress value so we can damp it manually outside shader uniforms
  const progress = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value += delta;
      
      const isTree = treeState === TreeState.TREE_SHAPE;
      
      // Scatter: 2.5 (Fastish, ~1s settle time), Tree: 1.0 (Slow/Elegant)
      const dampSpeed = isTree ? 1.0 : 2.5;

      damp(progress, 'current', isTree ? 1 : 0, dampSpeed, delta);
      material.uniforms.uProgress.value = progress.current;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScatterPos"
          count={scatterPositions.length / 3}
          array={scatterPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTreePos"
          count={treePositions.length / 3}
          array={treePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          count={randoms.length}
          array={randoms}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};