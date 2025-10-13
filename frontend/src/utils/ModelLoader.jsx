import React, { Suspense } from 'react';
import { useGLTF, Html, useProgress } from '@react-three/drei';

// Loading component for 3D models
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: '#007aff',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        Loading 3D Model... {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

// Generic 3D model component
export function Model3D({ 
  modelPath, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 1,
  autoRotate = false,
  rotationSpeed = 1
}) {
  const { scene } = useGLTF(modelPath);
  
  return (
    <Suspense fallback={<Loader />}>
      <primitive 
        object={scene} 
        position={position}
        rotation={rotation}
        scale={scale}
      />
    </Suspense>
  );
}

// Preload models for better performance
export function preloadModel(modelPath) {
  useGLTF.preload(modelPath);
}

// Chain link component for the blockchain visualization
export function ChainLink({ position, color = '#007aff', index = 0 }) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 4]}>
      <torusGeometry args={[0.8, 0.3, 8, 16]} />
      <meshStandardMaterial 
        color={index % 2 === 0 ? color : '#0056cc'} 
        metalness={0.8} 
        roughness={0.2} 
      />
    </mesh>
  );
}

// Animated cube for logo
export function LogoCube({ size = 1, color = '#007aff' }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color={color} 
        metalness={0.8} 
        roughness={0.2} 
      />
    </mesh>
  );
}

// Scene lighting setup
export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#007aff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />
    </>
  );
}