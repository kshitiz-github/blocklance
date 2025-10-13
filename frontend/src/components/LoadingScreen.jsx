import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading...", progress = 0 }) => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <div className="logo-spinner">
            <div className="spinner-cube">B</div>
          </div>
        </div>
        
        <h2 className="loading-title">BlockLance</h2>
        <p className="loading-message">{message}</p>
        
        {progress > 0 && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
        
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;