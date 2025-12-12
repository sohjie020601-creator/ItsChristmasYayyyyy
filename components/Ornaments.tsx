import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { getTreeSpiralPoint, getRandomSpherePoint } from '../utils/math';
import { damp } from 'maath/easing';

interface OrnamentData {
  scatterPos: THREE.Vector3;
  treePos: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  baseScale: number;
  phase: number; 
}

interface OrnamentsProps {
  count: number;
  type: 'box' | 'sphere' | 'diamond';
  color: string;
  treeState: TreeState;
  geometry: THREE.BufferGeometry;
  roughness?: number;
  metalness?: number;
  scaleFactor?: number;
  range?: [number, number]; 
}

export const Ornaments: React.FC<OrnamentsProps> = ({ 
  count, 
  type, 
  color, 
  treeState, 
  geometry,
  roughness = 0.2,
  metalness = 0.8,
  scaleFactor = 1.0,
  range = [0, 1] 
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Pre-calculate positions
  const data = useMemo<OrnamentData[]>(() => {
    const items: OrnamentData[] = [];
    const [minT, maxT] = range;

    for (let i = 0; i < count; i++) {
      // Tree position 
      const rangeSpan = maxT - minT;
      const t = minT + Math.random() * rangeSpan; 

      const treeP = getTreeSpiralPoint(t, 5.5, 13, 15, 1.2); 
      
      const isLargeVariant = i % 2 === 0;
      const variantMultiplier = isLargeVariant ? 1.35 : 1.0; 

      const heightMultiplier = t > 0.66 ? 1.0 : 1.25;

      let baseScale = 0.2; 
      
      if(type === 'box') {
         baseScale = (0.2 + Math.random() * 0.2) * variantMultiplier * heightMultiplier; 
      } else if (type === 'sphere') {
         baseScale = (0.15 + Math.random() * 0.15) * variantMultiplier * heightMultiplier;
      } else {
         baseScale = (0.1 + Math.random() * 0.1) * variantMultiplier * heightMultiplier;
      }
      
      const scatterP = getRandomSpherePoint(14); 

      items.push({
        scatterPos: scatterP,
        treePos: treeP,
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01, 
          (Math.random() - 0.5) * 0.01, 
          (Math.random() - 0.5) * 0.01
        ),
        baseScale: baseScale,
        phase: Math.random() * Math.PI * 2
      });
    }
    return items;
  }, [count, type, range]);

  // Current animation progress
  const progress = useRef(0);
  
  // Rotation burst multiplier
  const burstRef = useRef(1.0);

  // Handle Rotation Burst Logic
  useEffect(() => {
    if (treeState === TreeState.SCATTERED) {
      // Accelerate rotation 2x
      burstRef.current = 2.0;
      
      const timer = setTimeout(() => {
        burstRef.current = 1.0;
      }, 3000); // Lasts 3 seconds
      
      return () => clearTimeout(timer);
    } else {
      burstRef.current = 1.0;
    }
  }, [treeState]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const isTree = treeState === TreeState.TREE_SHAPE;
    // Scatter: 2.5 (Fastish), Tree: 1.0 (Elegant)
    const dampSpeed = isTree ? 1.0 : 2.5;

    damp(progress, 'current', isTree ? 1 : 0, dampSpeed, delta);

    const p = progress.current;
    const time = state.clock.getElapsedTime();
    const burstMult = burstRef.current;
    
    // Update every instance
    data.forEach((item, i) => {
      // Interpolate position
      const currentPos = new THREE.Vector3().lerpVectors(
        item.scatterPos,
        item.treePos,
        p 
      );

      // Add "Floaty" movement (gentle bobbing)
      const floatAmp = 0.2 * (1 - p) + 0.05 * p; 
      const floatY = Math.sin(time * 0.5 + item.phase) * floatAmp; 
      const floatX = Math.cos(time * 0.3 + item.phase) * (floatAmp * 0.5);
      
      currentPos.y += floatY;
      currentPos.x += floatX;

      // Update Rotation with Burst Multiplier
      tempObj.rotation.x += item.rotationSpeed.x * burstMult;
      tempObj.rotation.y += item.rotationSpeed.y * burstMult;
      tempObj.rotation.z += item.rotationSpeed.z * burstMult;

      // Apply
      tempObj.position.copy(currentPos);
      
      // Scale logic
      const pulse = 1 + Math.sin(time * 2 + item.phase) * 0.05; 
      const transitionScale = 0.6 + 0.4 * p; 
      
      const finalScale = item.baseScale * scaleFactor * pulse * transitionScale;
      tempObj.scale.setScalar(finalScale);

      tempObj.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObj.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        envMapIntensity={2.5}
        emissive={type === 'diamond' ? color : '#000000'}
        emissiveIntensity={type === 'diamond' ? 2 : 0}
      />
    </instancedMesh>
  );
};