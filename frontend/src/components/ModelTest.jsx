import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

function TestModel({ path }) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  try {
    const { scene } = useGLTF(path);
    
    useEffect(() => {
      if (scene) {
        console.log('Model loaded successfully:', path);
        setLoading(false);
      }
    }, [scene, path]);
    
    return <primitive object={scene} scale={[1, 1, 1]} />;
  } catch (err) {
    console.error('Model loading error:', err);
    setError(err.message);
    return null;
  }
}

export function ModelDebugger() {
  const [testResults, setTestResults] = useState({});
  
  useEffect(() => {
    // Test if files exist
    const testPaths = ['/models/logo.glb', '/models/chain.glb'];
    
    testPaths.forEach(path => {
      fetch(path)
        .then(response => {
          console.log(`${path} - Status:`, response.status);
          setTestResults(prev => ({
            ...prev,
            [path]: response.status === 200 ? 'Found' : 'Not Found'
          }));
        })
        .catch(err => {
          console.error(`${path} - Error:`, err);
          setTestResults(prev => ({
            ...prev,
            [path]: 'Error: ' + err.message
          }));
        });
    });
  }, []);
  
  return (
    <div style={{ position: 'fixed', top: 10, left: 10, background: 'white', padding: '10px', zIndex: 1000 }}>
      <h3>Model Debug Info:</h3>
      {Object.entries(testResults).map(([path, status]) => (
        <div key={path}>
          {path}: {status}
        </div>
      ))}
      
      <div style={{ width: '200px', height: '200px', border: '1px solid black', marginTop: '10px' }}>
        <Canvas>
          <Suspense fallback={<div>Loading...</div>}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <TestModel path="/models/logo.glb" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}