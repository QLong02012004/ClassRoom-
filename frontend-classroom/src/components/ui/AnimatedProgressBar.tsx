import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface AnimatedProgressBarProps {
  progress?: number;
  width?: string;
  height?: string;
  barColor?: string;
}

const AnimatedProgressBar = ({ 
  progress = 40, 
  width = '100%', 
  height = '100%',
  barColor = 'linear-gradient(90deg, #00f260, #0575e6)' 
}: AnimatedProgressBarProps) => {
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <StyledWrapper $progress={safeProgress} $width={width} $height={height} $barColor={barColor}>
      <div className="progress-container">
        <div className="progress-bar" style={{ '--target-width': `${safeProgress}%` } as React.CSSProperties} />
        <div className="particles">
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const growAnimation = keyframes`
  0% {
    width: 0%;
  }
  100% {
    width: var(--target-width, 0%);
  }
`;

const StyledWrapper = styled.div<{ $progress: number; $width: string; $height: string; $barColor: string }>`
  height: 100%;
  width: 100%;

  .progress-container {
    position: relative;
    width: ${props => props.$width};
    max-width: 100%;
    height: ${props => props.$height};
    background: transparent;
    border-radius: 30px;
    overflow: hidden;
    box-sizing: border-box;
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.$progress}%;
    background: ${props => props.$barColor};
    border-radius: 30px;
    animation: ${growAnimation} 1.5s ease-out forwards;
  }

  .progress-bar::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent);
    opacity: 0.5;
    animation: ripple 3s infinite;
  }

  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    opacity: 0.6;
    animation: float 5s infinite ease-in-out;
  }

  @keyframes ripple {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 0.7;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0) translateX(0);
    }
    50% {
      transform: translateY(-8px) translateX(5px);
    }
    100% {
      transform: translateY(0) translateX(0);
    }
  }
  .particle:nth-child(1) {
    top: 10%;
    left: 20%;
    animation-delay: 0s;
  }
  .particle:nth-child(2) {
    top: 30%;
    left: 70%;
    animation-delay: 1s;
  }
  .particle:nth-child(3) {
    top: 50%;
    left: 50%;
    animation-delay: 2s;
  }
  .particle:nth-child(4) {
    top: 80%;
    left: 40%;
    animation-delay: 1.5s;
  }
  .particle:nth-child(5) {
    top: 90%;
    left: 60%;
    animation-delay: 2.5s;
  }
`;

export default AnimatedProgressBar;
