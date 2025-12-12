import React, { useMemo, useEffect, useRef } from 'react';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Foliage } from './Foliage';
import { Ornaments } from './Ornaments';
import { PostProcessing } from './PostProcessing';
import { StarTop } from './StarTop';
import { MagicSpiral } from './MagicSpiral';
import { GingerbreadMan } from './GingerbreadMan';
import { TreeState } from '../types';

interface ExperienceProps {
  treeState: TreeState;
}

export const Experience: React.FC<ExperienceProps> = ({ treeState }) => {
  // Shared Geometries
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []); 
  const diamondGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Handle Rotation Burst on Release
  useEffect(() => {
    if (controlsRef.current) {
      if (treeState === TreeState.SCATTERED) {
        // Burst speed: 2.0 (feels energetic but not dizzying)
        controlsRef.current.autoRotateSpeed = 2.0;
        
        // Duration: 3 seconds (synced with ornaments)
        const timer = setTimeout(() => {
          if (controlsRef.current) {
            controlsRef.current.autoRotateSpeed = 0.3; // Restore to slow drift
          }
        }, 3000);

        return () => clearTimeout(timer);
      } else {
        // When assembling, keep it slow
        controlsRef.current.autoRotateSpeed = 0.3;
      }
    }
  }, [treeState]);

  // Handle Camera Zoom / Fly-in Effect
  useFrame((state, delta) => {
    // Clamp delta to prevent huge jumps if tab was inactive
    const safeDelta = Math.min(delta, 0.1);
    
    const isTree = treeState === TreeState.TREE_SHAPE;
    
    // Target Distance: 
    // Tree Shape = 33 (Requested adjustment)
    // Scattered = 5 (Super close, "face-to-face" / immersive inside the cloud)
    const targetDist = isTree ? 33 : 5;

    // Smoothly interpolate the camera's distance from the center [0,0,0]
    // We modify the length of the position vector to preserve the user's rotation angle
    const currentLen = camera.position.length();
    
    // Use a slightly different damper for smooth zoom
    const diff = targetDist - currentLen;
    // Speed 2.5 provides a satisfying "whoosh" fly-in
    const move = diff * safeDelta * 2.5; 
    
    // Apply if significant to avoid infinite micro-updates
    if (Math.abs(diff) > 0.1) {
       const newLen = currentLen + move;
       // Safety check to avoid setting invalid length
       if (!isNaN(newLen) && newLen > 0.1) {
         camera.position.setLength(newLen);
       }
    }
  });

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        makeDefault // Important for correctly handling camera events
        enablePan={false} 
        maxPolarAngle={Math.PI / 1.8} 
        minDistance={2} // CRITICAL: Allow camera to get very close for the "manual zoom" effect
        maxDistance={50}
        autoRotate={true}
        autoRotateSpeed={0.3} // Default slow speed
      />

      {/* Luxury Cinematic Lighting */}
      <Environment preset="city" />
      <ambientLight intensity={0.4} color="#001100" />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.3} 
        penumbra={1} 
        intensity={150} 
        color="#fff5cc" 
        castShadow 
      />
      <pointLight position={[-10, 5, -10]} intensity={50} color="#0B3E25" />

      {/* The Core Tree Elements */}
      <group position={[0, -1, 0]}>
        
        {/* The Glowing Top Star */}
        <StarTop treeState={treeState} />

        {/* The Needles/Foliage */}
        <Foliage count={6000} treeState={treeState} />

        {/* The White Glowing Magic Spiral */}
        <MagicSpiral treeState={treeState} />

        {/* The Hidden Gingerbread Man Surprise */}
        <GingerbreadMan treeState={treeState} />

        {/* --- REFINED ORNAMENTS --- */}

        {/* 1. Deep Red Metallic Boxes */}
        <Ornaments 
          count={60} 
          type="box" 
          color="#8B0000" 
          treeState={treeState}
          geometry={boxGeo}
          metalness={0.9}
          roughness={0.15}
          scaleFactor={0.8} 
        />

        {/* 2. Emerald Boxes */}
        <Ornaments 
          count={80} 
          type="box" 
          color="#0B3E25" 
          treeState={treeState}
          geometry={boxGeo}
          metalness={0.8}
          roughness={0.2}
          scaleFactor={0.7} 
        />

        {/* 3. Gold Spheres */}
        <Ornaments 
          count={150} 
          type="sphere" 
          color="#FFD700" 
          treeState={treeState}
          geometry={sphereGeo}
          metalness={1.0}
          roughness={0.1}
          scaleFactor={0.5} 
        />

        {/* 4. Champagne Spheres */}
        <Ornaments 
          count={50} 
          type="sphere" 
          color="#F5E6C8" 
          treeState={treeState}
          geometry={sphereGeo}
          metalness={0.9}
          roughness={0.15}
          scaleFactor={0.9} 
        />

        {/* 5. Diamond Sparkles */}
        <Ornaments 
          count={100} 
          type="diamond" 
          color="#FFFFE0" 
          treeState={treeState}
          geometry={diamondGeo}
          scaleFactor={0.4} 
        />

        {/* --- BOTTOM FILLERS --- */}
        <Ornaments 
          count={30} 
          type="box" 
          color="#A00000" 
          treeState={treeState}
          geometry={boxGeo}
          metalness={0.95}
          roughness={0.2}
          scaleFactor={0.9}
          range={[0, 0.45]} 
        />

        <Ornaments 
          count={40} 
          type="sphere" 
          color="#D4AF37" 
          treeState={treeState}
          geometry={sphereGeo}
          metalness={1.0}
          roughness={0.15}
          scaleFactor={0.6}
          range={[0, 0.4]} 
        />

        {/* --- BASE ANCHOR --- */}
        <Ornaments 
          count={15} 
          type="box" 
          color="#B8860B" 
          treeState={treeState}
          geometry={boxGeo}
          metalness={0.9}
          roughness={0.3} 
          scaleFactor={1.2} 
          range={[0, 0.15]} 
        />
        
      </group>

      <ContactShadows 
        opacity={0.6} 
        scale={40} 
        blur={2} 
        far={10} 
        resolution={256} 
        color="#000000" 
      />
      
      <PostProcessing treeState={treeState} />
    </>
  );
};