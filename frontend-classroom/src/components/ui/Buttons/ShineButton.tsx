import React from 'react';
import styled from 'styled-components';

interface ShineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const ShineButton: React.FC<ShineButtonProps> = ({
  children,
  onClick,
  disabled,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <StyledWrapper>
      <button
        type={type}
        className={`btn-shine ${className || ''}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <span>{children}</span>
      </button>
    </StyledWrapper>
  );
};

export default ShineButton;

const StyledWrapper = styled.div`
  display: inline-block;

  button {
    position: relative;
    margin: 0;
    padding: 0.65em 1.6em;
    outline: none;
    text-decoration: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    text-transform: uppercase;
    background-color: transparent;
    border: 1.5px solid #f47c20;
    border-radius: 10px;
    color: #f47c20;
    font-weight: 700;
    font-family: inherit;
    z-index: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.02, 0.01, 0.47, 1);
    box-shadow: 0 2px 8px rgba(244, 124, 32, 0.1);

    &:disabled {
      background-color: #f1f5f9;
      border-color: #cbd5e1;
      color: #94a3b8;
      cursor: not-allowed;
      box-shadow: none;

      span {
        color: #94a3b8;
      }

      &::after {
        display: none;
      }
    }
  }

  button span {
    color: #f47c20;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.7px;
    display: flex;
    align-items: center;
    gap: 6px;
    z-index: 20;
    transition: color 0.3s ease;
  }

  button:hover:not(:disabled) {
    animation: rotate624 0.7s ease-in-out both;
    background-color: #f47c20;
    border-color: #f47c20;
    box-shadow: 0 4px 12px rgba(244, 124, 32, 0.3);
  }

  button:hover:not(:disabled) span {
    animation: storm1261 0.7s ease-in-out both;
    animation-delay: 0.06s;
    color: #ffffff;
  }

  @keyframes rotate624 {
    0% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }

    25% {
      transform: rotate(3deg) translate3d(0, 0, 0);
    }

    50% {
      transform: rotate(-3deg) translate3d(0, 0, 0);
    }

    75% {
      transform: rotate(1deg) translate3d(0, 0, 0);
    }

    100% {
      transform: rotate(0deg) translate3d(0, 0, 0);
    }
  }

  @keyframes storm1261 {
    0% {
      transform: translate3d(0, 0, 0) translateZ(0);
    }

    25% {
      transform: translate3d(4px, 0, 0) translateZ(0);
    }

    50% {
      transform: translate3d(-3px, 0, 0) translateZ(0);
    }

    75% {
      transform: translate3d(2px, 0, 0) translateZ(0);
    }

    100% {
      transform: translate3d(0, 0, 0) translateZ(0);
    }
  }

  .btn-shine {
    border: 1px solid;
    overflow: hidden;
    position: relative;
  }

  .btn-shine:after {
    background: #2f8fa3; /* secondary Ocean Blue color */
    content: "";
    height: 155px;
    left: -75px;
    opacity: 0.4;
    position: absolute;
    top: -50px;
    transform: rotate(35deg);
    transition: all 550ms cubic-bezier(0.19, 1, 0.22, 1);
    width: 50px;
    z-index: -10;
  }

  button:hover:not(:disabled):after {
    left: 120%;
    transition: all 550ms cubic-bezier(0.19, 1, 0.22, 1);
  }
`;
