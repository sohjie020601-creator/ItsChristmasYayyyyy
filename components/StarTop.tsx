import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { getRandomSpherePoint } from '../utils/math';
import { damp } from 'maath/easing';

interface StarTopProps {
  treeState: TreeState;
}

export const StarTop: React.FC<StarTopProps> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate positions
  const { scatterPos, treePos } = useMemo(() => {
    // Top of the tree is roughly at y = 7 (since height is 14 centered at 0)
    // We add a little offset to sit perfectly on top
    const treePos = new THREE.Vector3(0, 7.8, 0); 
    const scatterPos = getRandomSpherePoint(12);
    // Ensure scatter pos is somewhat high up so it doesn't fall into the floor too much
    scatterPos.y = Math.abs(scatterPos.y) + 5; 
    
    return { scatterPos, treePos };
  }, []);

  // Create 3D Star Geometry
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.4;

    // Draw the star shape
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      // Use sin/cos to plot points
      const x = Math.sin(angle) * r;
      const y = Math.cos(angle) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    // Extrude to make it 3D
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.3,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    });
    
    // Center the geometry so it rotates around its center
    geom.center();
    return geom;
  }, []);

  const progress = useRef(0);
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
    if (!groupRef.current || !meshRef.current) return;

    const isTree = treeState === TreeState.TREE_SHAPE;
    // Scatter: 2.5 (Fastish), Tree: 1.0 (Elegant)
    const dampSpeed = isTree ? 1.0 : 2.5;

    // Damp progress
    damp(progress, 'current', isTree ? 1 : 0, dampSpeed, delta);
    const p = progress.current;

    // Interpolate Position
    const currentPos = new THREE.Vector3().lerpVectors(scatterPos, treePos, p);
    
    // Add hovering motion
    const time = state.clock.getElapsedTime();
    currentPos.y += Math.sin(time * 2) * 0.1;

    groupRef.current.position.copy(currentPos);

    // Rotate the star mesh continuously to show off the 3D shape
    // Apply burst multiplier
    meshRef.current.rotation.y += delta * 1.5 * burstRef.current; 
    meshRef.current.rotation.z = Math.sin(time * 1.5) * 0.1; // Gentle wobble

    // Scale up when formed, scale down slightly when scattered
    const scale = 1.0 * p + 0.4 * (1 - p);
    groupRef.current.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} geometry={starGeometry} castShadow>
        <meshStandardMaterial 
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={3} // Very bright glow
          toneMapped={false} // Helps with bloom
          roughness={0.1}
          metalness={1}
        />
      </mesh>
      
      {/* Light emitted by the star */}
      <pointLight 
        intensity={60} 
        distance={15} 
        color="#FFD700" 
        decay={2}
      />
    </group>
  );
};