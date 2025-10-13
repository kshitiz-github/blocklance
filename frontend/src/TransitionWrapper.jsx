import React, { useState, useEffect } from 'react';
import './TransitionWrapper.css';

const TransitionWrapper = ({ children, isVisible, onTransitionComplete }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setAnimationClass('fade-in');
    } else {
      setAnimationClass('fade-out');
      const timer = setTimeout(() => {
        setShouldRender(false);
        onTransitionComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onTransitionComplete]);

  if (!shouldRender) return null;

  return (
    <div className={`transition-wrapper ${animationClass}`}>
      {children}
    </div>
  );
};

export default TransitionWrapper;