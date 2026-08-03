import React from 'react';
import styled from 'styled-components';
import { CheckCircle } from 'phosphor-react';

interface SaveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
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
        className={`save-btn ${className || ''}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <span className="circle circle1" />
        <span className="circle circle2" />
        <span className="circle circle3" />
        <span className="circle circle4" />
        <span className="circle circle5" />
        <span className="text-content">
          {children || (
            <>
              <CheckCircle size={18} weight="bold" />
              <span>Lưu bảng điểm</span>
            </>
          )}
        </span>
      </button>
    </StyledWrapper>
  );
};

export default SaveButton;

const StyledWrapper = styled.div`
  display: inline-block;

  button {
    font-family: inherit;
    font-weight: 750;
    font-size: 0.9rem;
    color: #f47c20;
    background-color: #ffffff;
    border: 1.5px solid #f47c20;
    padding: 0.65em 1.6em;
    border-radius: 0.75rem;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(244, 124, 32, 0.15);
    transition: background-color 1.2s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.3s ease;

    &:disabled {
      background-color: #f1f5f9 !important;
      border-color: #cbd5e1 !important;
      color: #94a3b8 !important;
      box-shadow: none !important;
      cursor: not-allowed;
      opacity: 0.7;

      .circle {
        display: none;
      }

      .text-content {
        color: #94a3b8 !important;
      }
    }
  }

  button .circle {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    height: 32px;
    width: 32px;
    background-color: #f47c20;
    border-radius: 50%;
    transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1);
    pointer-events: none;
  }

  button .text-content {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #f47c20;
    font-weight: 750;
    transition: color 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }

  button .circle1 {
    transform: translate(-3.5em, -4.2em);
  }

  button .circle2 {
    transform: translate(-6.5em, 1.5em);
  }

  button .circle3 {
    transform: translate(-0.2em, 2.2em);
  }

  button .circle4 {
    transform: translate(4em, 1.6em);
  }

  button .circle5 {
    transform: translate(4em, -4em);
  }

  button:hover:not(:disabled) .circle {
    transform: translate(-50%, -50%) scale(10);
    transition: transform 2.2s cubic-bezier(0.25, 1, 0.5, 1);
  }

  button:hover:not(:disabled) .text-content {
    color: #ffffff;
  }

  button:hover:not(:disabled) {
    background-color: #f47c20;
    box-shadow: 0 6px 20px rgba(244, 124, 32, 0.45);
    transform: translateY(-1px);
  }

  button:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
`;
