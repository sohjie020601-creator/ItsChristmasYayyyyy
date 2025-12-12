import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { Overlay } from './components/Overlay';
import { TreeState } from './types';

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  return (
    <div className="w-full h-full relative bg-arix-dark">
      {/* 3D Scene */}
      <Canvas
        shadows
        // Moved camera to z=33
        camera={{ position: [0, 0, 33], fov: 35 }}
        gl={{ 
          antialias: false, 
          stencil: false, 
          depth: true 
        }}
        dpr={[1, 2]} 
      >
        <Suspense fallback={null}>
          <Experience treeState={treeState} />
        </Suspense>
      </Canvas>

      {/* Loading Indicator */}
      <Loader 
        containerStyles={{ background: '#021a0f' }} 
        innerStyles={{ background: '#333', width: '200px' }} 
        barStyles={{ background: '#D4AF37', height: '4px' }}
        dataStyles={{ color: '#D4AF37', fontFamily: 'serif' }}
      />

      {/* UI Overlay */}
      <Overlay treeState={treeState} setTreeState={setTreeState} />
    </div>
  );
}

export default App;