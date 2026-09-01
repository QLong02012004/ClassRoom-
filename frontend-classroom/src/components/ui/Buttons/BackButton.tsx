import React from 'react';
import styled from 'styled-components';

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const BackButton: React.FC<BackButtonProps> = ({ children, onClick, className, ...props }) => {
  return (
    <StyledWrapper>
      <button className={`button ${className || ''}`} onClick={onClick} {...props}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 43" className="back-arrow">
          <polygon points="39.58,4.46 44.11,0 66,21.5 44.11,43 39.58,38.54 56.94,21.5" />
          <polygon points="19.79,4.46 24.32,0 46.21,21.5 24.32,43 19.79,38.54 37.15,21.5" />
          <polygon points="0,4.46 4.53,0 26.42,21.5 4.53,43 0,38.54 17.36,21.5" />
        </svg>
        <span>{children || "QUAY LẠI"}</span>
      </button>
    </StyledWrapper>
  );
};

export default BackButton;

const StyledWrapper = styled.div`
  display: inline-block;
  
  .button {
    --main-size: 0.9rem;
    --color-text: #0F172A;
    --color-text-hover: #ffffff;
    --color-background: #ffffff;
    --color-background-hover: #f47c20;
    --color-outline: rgba(244, 124, 32, 0.25);
    --color-shadow: rgba(0, 0, 0, 0.25);
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    text-decoration: none;
    border: 1px solid #e2e8f0;
    border-radius: calc(var(--main-size) * 100);
    padding: 0.5em 1em 0.5em 0.8em;
    font-family: inherit;
    font-weight: 600;
    font-size: var(--main-size);
    color: var(--color-text);
    background: var(--color-background);
    transition: all 0.5s;
  }

  .button:active {
    transform: scale(0.95);
  }

  .button:hover {
    outline: 0.1em solid transparent;
    outline-offset: 0.2em;
    box-shadow: 0 0 1em 0 var(--color-background-hover);
    animation: ripple 1s linear infinite;
    background: var(--color-background-hover);
    color: var(--color-text-hover);
    border-color: var(--color-background-hover);
    transition: all 0.5s;
  }

  .button span {
    margin-left: 0.4em;
    transition: 0.5s;
  }

  .button:hover span {
    text-shadow: 2px 2px 4px var(--color-shadow);
  }

  .button:active span {
    text-shadow: none;
  }

  .button svg.back-arrow {
    height: 0.8em;
    fill: var(--color-text);
    margin-left: -0.1em;
    position: relative;
    transition: 0.5s;
    transform: scaleX(-1); /* Flip horizontally to make it point left */
  }

  .button:hover svg.back-arrow {
    margin-left: -0.3em;
    margin-right: 0.3em;
    fill: var(--color-text-hover);
    transition: 0.5s;
    filter: drop-shadow(2px 2px 2px var(--color-shadow));
  }

  .button:active svg.back-arrow {
    filter: none;
  }

  .button svg polygon:nth-child(1) {
    transition: 0.4s;
    transform: translateX(-60%);
  }

  .button svg polygon:nth-child(2) {
    transition: 0.5s;
    transform: translateX(-30%);
  }

  /* When flipped, translate directions flip as well, so we keep animation properties */
  .button:hover svg polygon:nth-child(1) {
    transform: translateX(0%);
    animation: opacity-anim 1s infinite 0.6s;
  }

  .button:hover svg polygon:nth-child(2) {
    transform: translateX(0%);
    animation: opacity-anim 1s infinite 0.4s;
  }

  .button:hover svg polygon:nth-child(3) {
    animation: opacity-anim 1s infinite 0.2s;
  }

  @keyframes opacity-anim {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  /* Removed colorize keyframes since background transition is used directly on hover */

  @keyframes ripple {
    0% {
      outline: 0em solid transparent;
      outline-offset: -0.1em;
    }
    50% {
      outline: 0.2em solid var(--color-outline);
      outline-offset: 0.2em;
    }
    100% {
      outline: 0.4em solid transparent;
      outline-offset: 0.4em;
    }
  }
`;
