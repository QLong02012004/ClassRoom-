import React from 'react';
import styled from 'styled-components';

interface AnimatedSendButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
}

const AnimatedSendButton: React.FC<AnimatedSendButtonProps> = ({ onClick, disabled, text = "Send", className }) => {
  return (
    <StyledWrapper className={className}>
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
  button {
    font-family: inherit;
    font-size: 14px;
    background: #FE6747;
    color: white;
    padding: 0.5em 0.8em;
    padding-left: 0.9em;
    display: flex;
    align-items: center;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    cursor: pointer;
    margin-left: 8px;
  }

  button:disabled {
    background: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }

  button:disabled svg {
    color: #94a3b8;
  }

  button span {
    display: block;
    margin-left: 0.3em;
    transition: all 0.3s ease-in-out;
    font-weight: bold;
  }

  button svg {
    display: block;
    transform-origin: center center;
    transition: transform 0.3s ease-in-out;
    width: 16px;
    height: 16px;
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
