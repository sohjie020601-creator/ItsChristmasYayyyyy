import * as THREE from 'three';

// Generate a random point inside a sphere
export const getRandomSpherePoint = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const sinPhi = Math.sin(phi);
  const x = r * sinPhi * Math.cos(theta);
  const y = r * sinPhi * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Generate a point on a conical spiral (The Christmas Tree shape)
export const getTreeSpiralPoint = (
  t: number, // 0 to 1 normalized height
  maxRadius: number,
  height: number,
  spirals: number = 8,
  jitter: number = 0.5
): THREE.Vector3 => {
  // y goes from -height/2 to height/2
  const y = (t - 0.5) * height;
  
  // Radius decreases as we go up
  // Taper function: widest at bottom (t=0), zero at top (t=1)
  const currentRadius = maxRadius * (1 - t);
  
  // Angle for spiral
  const angle = t * Math.PI * 2 * spirals;
  
  const x = Math.cos(angle) * currentRadius;
  const z = Math.sin(angle) * currentRadius;

  // Add some randomness so it's not a perfect line
  const randX = (Math.random() - 0.5) * jitter;
  const randY = (Math.random() - 0.5) * jitter;
  const randZ = (Math.random() - 0.5) * jitter;

  return new THREE.Vector3(x + randX, y + randY, z + randZ);
};

export const normalize = (val: number, max: number, min: number) => { 
  return (val - min) / (max - min); 
}