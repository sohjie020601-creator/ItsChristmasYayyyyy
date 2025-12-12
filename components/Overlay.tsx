import React from 'react';
import { TreeState } from '../types';

interface OverlayProps {
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ treeState, setTreeState }) => {
  const isTree = treeState === TreeState.TREE_SHAPE;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-10">
      {/* Header */}
      <header className="flex flex-col items-start">
        <h1 
          className="text-5xl md:text-7xl font-serif text-arix-gold tracking-tighter uppercase leading-none"
          style={{
            textShadow: '0 0 25px rgba(212, 175, 55, 0.5), 0 0 50px rgba(212, 175, 55, 0.3)'
          }}
        >
          Merry<br />Christmas
        </h1>
      </header>

      {/* Footer Details (Bottom Left) */}
      <div className="absolute bottom-8 left-8 hidden md:block text-white/20 font-sans text-xs">
        <p>LAT: 40.7128° N</p>
        <p>LNG: 74.0060° W</p>
      </div>

      {/* Controls (Moved to Bottom Right) */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end pointer-events-auto">
        <button
          onClick={() => setTreeState(isTree ? TreeState.SCATTERED : TreeState.TREE_SHAPE)}
          className={`
            group relative px-8 py-4 bg-transparent overflow-hidden transition-all duration-500
            border border-arix-gold/50 hover:border-arix-gold
          `}
        >
          {/* Fill effect */}
          <div className={`
            absolute inset-0 bg-arix-gold transition-transform duration-500 ease-in-out
            ${isTree ? 'translate-x-0' : '-translate-x-full group-hover:translate-x-0 group-hover:opacity-20'}
          `}></div>
          
          <span className={`
            relative z-10 font-serif text-xl tracking-widest transition-colors duration-300
            ${isTree ? 'text-arix-dark' : 'text-arix-gold'}
          `}>
            {isTree ? 'RELEASE' : 'ASSEMBLE'}
          </span>
        </button>
        
        <p className="text-white/40 font-sans text-xs mt-4 tracking-widest opacity-0 md:opacity-100 transition-opacity text-right">
          INTERACTIVE 3D EXPERIENCE
        </p>
      </div>
    </div>
  );
};