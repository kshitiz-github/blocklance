import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Logo 3D Model Component
function LogoModel({ modelPath = '/models/logo.glb' }) {
  const logoRef = useRef();
  const { scene } = useGLTF(modelPath);
  
  useFrame(() => {
    if (logoRef.current) {
      logoRef.current.rotation.y += 0.005;
    }
  });
  
  return (
    <primitive 
      ref={logoRef}
      object={scene} 
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
    />
  );
}

// Chain 3D Model Component
function ChainModel({ modelPath = '/models/chain.glb', isHovered = false }) {
  const chainRef = useRef();
  const { scene } = useGLTF(modelPath);
  
  useFrame(() => {
    if (chainRef.current && isHovered) {
      chainRef.current.rotation.y += 0.02;
      chainRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.1;
    }
  });
  
  return (
    <primitive 
      ref={chainRef}
      object={scene} 
      scale={[1, 1, 1]}
      position={[0, 0, 0]}
    />
  );
}

// Logo 3D Canvas
export function Logo3DCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#d4af37" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4a5568" />
        <LogoModel />
      </Suspense>
    </Canvas>
  );
}

// Chain 3D Canvas
export function Chain3DCanvas({ isHovered = false }) {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#d4af37" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#4a5568" />
        <ChainModel isHovered={isHovered} />
      </Suspense>
    </Canvas>
  );
}