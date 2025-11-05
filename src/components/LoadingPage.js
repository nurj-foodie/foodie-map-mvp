import React, { useState, useEffect } from 'react';
import './LoadingPage.css';

const LoadingPage = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Loading maps...' },
      { progress: 40, text: 'Connecting to database...' },
      { progress: 60, text: 'Preparing routes...' },
      { progress: 80, text: 'Loading restaurants...' },
      { progress: 100, text: 'Ready!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);
        currentStep++;
      } else {
        clearInterval(interval);
        // Complete loading after 7 seconds max
        setTimeout(() => {
          onLoadingComplete();
        }, 200);
      }
    }, 1400); // 1400ms per step = 7 seconds total

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className="loading-page">
      <div className="loading-container">
        <div className="loading-logo">
          <div className="logo-icon">🍽️</div>
          <h1>Foodie Map</h1>
        </div>
        
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{loadingText}</div>
          <div className="progress-percentage">{progress}%</div>
        </div>

        <div className="loading-features">
          <div className="feature-item">
            <span className="feature-icon">🧭</span>
            <span>Route Discovery</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span>Restaurant Search</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⭐</span>
            <span>Favorites</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPage;

