import React, { useState, useEffect } from "react";
import ScrambledText from "./components/ScrambledText";
import MagnetLines from "./components/MagnetLines";
import BlurText from "./components/BlurText";
import "./LandingPage.css";

const LandingPage = ({ onConnect, account }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await onConnect();
    setIsConnecting(false);
  };

  return (
    <div className="landing-container">
      <MagnetLines
        rows={20}
        columns={20}
        containerSize="100vw"
        lineColor="#d1d5db"
        lineWidth="0.5vmin"
        lineHeight="3.5vmin"
        baseAngle={0}
        style={{ height: "100vh", position: "fixed", top: 0, left: 0, zIndex: 0 }}
      />

      {/* Main Content */}
      <main className="landing-main">
        <div className="hero-section">
          {/* Centered Logo */}
          <div className="logo-container-center">
            <div className="logo-3d">
              <div className="logo-cube">
                <div className="cube-face front">B</div>
                <div className="cube-face back">L</div>
                <div className="cube-face right">O</div>
                <div className="cube-face left">C</div>
                <div className="cube-face top">K</div>
                <div className="cube-face bottom">L</div>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <BlurText
            text="BlockLance"
            delay={50}
            animateBy="words"
            direction="top"
            className="main-title"
            stepDuration={0.25}
          />

          {/* Quotes with Scrambled Text */}
          <div className="hero-quotes">
            <ScrambledText
              className="quote-line"
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:*#@"
            >
              Secure and Transparent
            </ScrambledText>
            <ScrambledText
              className="quote-line quote-line-second"
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:*#@"
            >
              Blockchain powered Freelancing
            </ScrambledText>
          </div>

          {/* Connect Wallet Section */}
          <div className="connect-section">
            {!account ? (
              <>
                <button
                  className={`connect-wallet-btn ${
                    isConnecting ? "connecting" : ""
                  }`}
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <span className="btn-text">
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </span>
                  <div className="btn-glow"></div>
                </button>
                <p className="connect-hint">
                  Connect your MetaMask wallet to start freelancing on the
                  blockchain
                </p>
              </>
            ) : (
              <div className="wallet-connected">
                <div className="success-icon">✓</div>
                <span>Wallet Connected Successfully!</span>
                <div className="wallet-address">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <p className="redirect-text">Redirecting to dashboard...</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10A2,2 0 0,1 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17Z" />
              </svg>
            </div>
            <h3>Secure Escrow</h3>
            <p>Smart contract-based escrow system ensures safe transactions</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z" />
              </svg>
            </div>
            <h3>Instant Payments</h3>
            <p>Automated milestone-based payments via blockchain</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
            </div>
            <h3>Global Access</h3>
            <p>Decentralized platform accessible worldwide</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
