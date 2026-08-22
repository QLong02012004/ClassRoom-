import React from 'react';
import styled from 'styled-components';

interface AnimatedSendButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AnimatedSendButton: React.FC<AnimatedSendButtonProps> = ({ onClick, disabled, text = "Send", className, size = "md" }) => {
  return (
    <StyledWrapper className={`${className || ''} ${size}`}>
      <button onClick={onClick} disabled={disabled} style={{ width: '100%', justifyContent: 'center' }}>
        <div className="svg-wrapper-1">
          <div className="svg-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24}>
              <path fill="none" d="M0 0h24v24H0z" />
              <path fill="currentColor" d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
            </svg>
          </div>
        </div>
        <span>{text}</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  &.sm button {
    font-size: 12px;
    padding: 0.35em 0.8em;
    border-radius: 12px;
    border-width: 1.5px;
  }

  &.sm button svg {
    width: 13px;
    height: 13px;
  }

  button {
    font-family: inherit;
    font-size: 14px;
    background: #ffffff;
    color: #f47c20;
    padding: 0.55em 1.2em;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid #f47c20;
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    width: 100%;
    box-shadow: 0 2px 8px rgba(244, 124, 32, 0.12);
  }

  button:disabled {
    background: #ffffff;
    border: 2px solid #f47c20;
    color: #f47c20;
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  button:disabled svg {
    color: #f47c20;
  }

  button:not(:disabled) {
    background: #ffffff;
    color: #f47c20;
    border: 2px solid #f47c20;
    box-shadow: 0 2px 8px rgba(244, 124, 32, 0.12);
  }

  button:not(:disabled) svg {
    color: #f47c20;
  }

  button span {
    display: block;
    margin-left: 0.3em;
    transition: all 0.3s ease-in-out;
    font-weight: 600;
  }

  button svg {
    display: block;
    transform-origin: center center;
    transition: transform 0.3s ease-in-out;
    width: 16px;
    height: 16px;
  }

  button:hover:not(:disabled) {
    background: #f47c20;
    color: #ffffff;
    border-color: #f47c20;
    box-shadow: 0 4px 14px rgba(244, 124, 32, 0.35);
  }

  button:hover:not(:disabled) svg {
    color: #ffffff;
  }

  button:hover:not(:disabled) .svg-wrapper {
    animation: fly-1 0.6s ease-in-out infinite alternate;
  }

  button:hover:not(:disabled) svg {
    transform: translateX(1.2em) rotate(45deg) scale(1.1);
  }

  button:hover:not(:disabled) span {
    transform: translateX(5em);
  }

  button:active:not(:disabled) {
    transform: scale(0.95);
  }

  @keyframes fly-1 {
    from {
      transform: translateY(0.1em);
    }

    to {
      transform: translateY(-0.1em);
    }
  }
`;

export default AnimatedSendButton;
