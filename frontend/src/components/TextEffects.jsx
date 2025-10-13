import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Text Pressure Effect for "BlockLance"
export const TextPressure = ({ children, className = "" }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      className={`text-pressure ${className}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      animate={{
        scale: isPressed ? 0.95 : 1,
        rotateX: isPressed ? 5 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      style={{
        transformStyle: "preserve-3d",
        cursor: "pointer"
      }}
    >
      {children}
    </motion.div>
  );
};

// Scrambled Text Effect for quotes
export const ScrambledText = ({ children, trigger = true }) => {
  const [displayText, setDisplayText] = useState(children);
  const [isScrambling, setIsScrambling] = useState(false);

  const scrambleText = (text) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    return text
      .split('')
      .map(char => char === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)])
      .join('');
  };

  useEffect(() => {
    if (!trigger) return;

    setIsScrambling(true);
    const originalText = children;
    let iteration = 0;

    const interval = setInterval(() => {
      setDisplayText(prevText => {
        const newText = originalText
          .split('')
          .map((char, index) => {
            if (index < iteration) {
              return originalText[index];
            }
            return char === ' ' ? ' ' : scrambleText(char)[0];
          })
          .join('');

        if (iteration >= originalText.length) {
          clearInterval(interval);
          setIsScrambling(false);
          return originalText;
        }

        iteration += 1/3;
        return newText;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [trigger, children]);

  return (
    <span className={`scrambled-text ${isScrambling ? 'scrambling' : ''}`}>
      {displayText}
    </span>
  );
};

// Magnet Lines Background
export const MagnetLines = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="magnet-lines">
      <svg
        className="magnet-lines-svg"
        width="100%"
        height="100%"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(74, 85, 104, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Magnetic lines that follow cursor */}
        {[...Array(3)].map((_, i) => (
          <motion.line
            key={i}
            x1={mousePos.x - 100 + i * 50}
            y1={mousePos.y - 50}
            x2={mousePos.x + 100 - i * 50}
            y2={mousePos.y + 50}
            stroke="rgba(212, 175, 55, 0.3)"
            strokeWidth="2"
            animate={{
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </svg>
    </div>
  );
};