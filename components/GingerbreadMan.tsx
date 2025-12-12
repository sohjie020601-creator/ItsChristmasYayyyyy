import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { damp } from 'maath/easing';
import { TreeState } from '../types';
import { getRandomSpherePoint } from '../utils/math';

interface Props {
  treeState: TreeState;
}

export const GingerbreadMan: React.FC<Props> = ({ treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  // Handle cursor change
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; }
  }, [hovered]);

  // 1. Define Geometry (The Cookie Shape)
  const cookieGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const headR = 0.35;
    
    // Start at neck right
    shape.moveTo(0.2, 0.3);
    
    // Head (Circle)
    shape.absarc(0, 0.55, headR, -0.5, Math.PI + 0.5, false);
    
    // Left Arm
    shape.lineTo(-0.8, 0.3); 
    shape.bezierCurveTo(-1.0, 0.3, -1.0, 0.0, -0.8, 0.0); 
    shape.lineTo(-0.35, 0.0); 
    
    // Left Body Side
    shape.lineTo(-0.35, -0.5); 
    
    // Left Leg
    shape.lineTo(-0.6, -1.0);
    shape.bezierCurveTo(-0.6, -1.2, -0.2, -1.2, -0.2, -1.0); 
    shape.lineTo(0.0, -0.6); 
    
    // Right Leg
    shape.lineTo(0.2, -1.0);
    shape.bezierCurveTo(0.2, -1.2, 0.6, -1.2, 0.6, -1.0); 
    
    // Right Body Side
    shape.lineTo(0.35, -0.5);
    
    // Right Arm
    shape.lineTo(0.35, 0.0); 
    shape.lineTo(0.8, 0.0); 
    shape.bezierCurveTo(1.0, 0.0, 1.0, 0.3, 0.8, 0.3); 
    
    // Back to start
    shape.lineTo(0.2, 0.3);
    
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3
    });
    geom.center();
    return geom;
  }, []);

  // 2. Positions
  const { treePos, scatterPos } = useMemo(() => {
    // Hidden spot: Lower branch
    const angle = Math.PI * 0.25; 
    const r = 3.2; 
    const y = -2.5;
    
    const tPos = new THREE.Vector3(
      Math.cos(angle) * r,
      y,
      Math.sin(angle) * r
    );
    
    const sPos = getRandomSpherePoint(15);
    return { treePos: tPos, scatterPos: sPos };
  }, []);
  
  // Animation refs
  const progress = useRef(0); // 0 = Scattered, 1 = Tree
  const modeRef = useRef(0); // 0 = Normal, 1 = Active (Front)

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    const isTree = treeState === TreeState.TREE_SHAPE;
    // Assemble slower for dramatic effect, scatter fast
    damp(progress, 'current', isTree ? 1 : 0, isTree ? 1.0 : 2.0, delta);
    
    // Transition "Mode" based on active state
    // Very snappy transition for the "jump" to front
    damp(modeRef, 'current', active ? 1 : 0, 3.0, delta);
    
    const p = progress.current;
    const m = modeRef.current;
    
    // --- POSITION CALCULATION ---
    // 1. Calculate normal tree/scatter position
    const normalPos = new THREE.Vector3().lerpVectors(scatterPos, treePos, p);
    
    // 2. Calculate "Front of Camera" position
    // We want him fixed relative to the camera lens so he stays in frame
    const cameraPos = state.camera.position;
    const cameraDir = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDir);
    
    // 5 units in front of the camera
    const frontPos = cameraPos.clone().add(cameraDir.multiplyScalar(5));
    // Move slightly down relative to camera center to not block view completely
    // We approximate "down" in camera space by using camera's up vector inverted? 
    // Actually, just putting him centered is fine, maybe slightly lower in Y world space?
    // Let's just keep him centered in view.
    
    // 3. Final Position Blend
    const currentPos = new THREE.Vector3().lerpVectors(normalPos, frontPos, m);
    groupRef.current.position.copy(currentPos);
    
    // --- ROTATION / LOOK AT ---
    // We need to blend where he looks.
    // Target A: Center of tree (0, -2.5, 0) - or random when scattered
    const center = new THREE.Vector3(0, -2.5, 0);
    // Target B: Camera position (to look at user)
    const lookAtTarget = new THREE.Vector3().lerpVectors(center, cameraPos, m);
    
    // If scattered and not active, tumble around
    if (p < 0.9 && m < 0.1) {
       groupRef.current.rotation.x += delta * 0.5;
       groupRef.current.rotation.y += delta * 0.5;
    } else {
       groupRef.current.lookAt(lookAtTarget);
       
       // --- WIGGLE ANIMATION ---
       // Intensity increases when active
       const wiggleSpeed = active ? 12 : 4;
       const wiggleAmp = active ? 0.3 : 0.1; // Big wave when active
       
       const t = state.clock.elapsedTime;
       groupRef.current.rotateZ(Math.sin(t * wiggleSpeed) * wiggleAmp); 
    }
    
    // Scale transition
    // Normal scale ~0.6 (tree) or 0.3 (scatter)
    // Front scale: maybe a bit smaller visually because he is close to camera? 
    // Or keep consistent. 
    // Actually, at distance 5 (frontPos) vs distance 33 (treePos), perspective makes him HUGE.
    // We must scale him DOWN when he comes close to maintain "toy size" illusion, 
    // OR let him be huge. Let's scale him down significantly when m -> 1.
    const baseScale = 0.6 * p + 0.3 * (1 - p);
    // When m=1 (close), we want visual consistency. 
    // Tree distance ~33. Front distance ~5. Ratio ~1/6.
    // So scale should be roughly 1/6th to look same size? 
    // No, let him be a bit bigger to show details. Let's scale to 0.15 when close.
    const targetScale = active ? 0.15 : baseScale;
    
    // Smoothly interpolate scale
    const finalScale = THREE.MathUtils.lerp(baseScale, targetScale, m);
    groupRef.current.scale.setScalar(finalScale);
  });

  return (
    <group 
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        setActive(!active);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Cookie Body */}
      <mesh geometry={cookieGeometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#C48149" 
          roughness={0.9} 
          metalness={0.0}
          emissive="#C48149"
          emissiveIntensity={hovered ? 0.5 : 0} // Glow when hovered
        />
      </mesh>
      
      {/* Buttons (Icing) */}
      <mesh position={[0, 0.1, 0.06]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#8B0000" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.15, 0.06]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#006400" roughness={0.5} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.15, 0.55, 0.06]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.15, 0.55, 0.06]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Smile */}
      <group position={[0, 0.45, 0.06]}>
         <mesh position={[-0.1, 0.02, 0]}>
            <sphereGeometry args={[0.03]} />
            <meshStandardMaterial color="white" />
         </mesh>
         <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.03]} />
            <meshStandardMaterial color="white" />
         </mesh>
         <mesh position={[0.1, 0.02, 0]}>
            <sphereGeometry args={[0.03]} />
            <meshStandardMaterial color="white" />
         </mesh>
      </group>
    </group>
  );
};