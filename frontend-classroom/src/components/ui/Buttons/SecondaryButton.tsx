import React from 'react';
import styled from 'styled-components';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, className, size = 'md', onClick, ...props }) => {
  return (
    <StyledWrapper $size={size}>
      <button className={`btn ${className || ''}`} onClick={onClick} {...props}>
        {children || "Button"}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $size?: 'sm' | 'md' | 'lg' }>`
  display: inline-block;

  .btn {
   --color: #f47c20;
   --color2: #ffffff;
   padding: ${props => props.$size === 'lg' ? '0.7em 1.8em' : props.$size === 'sm' ? '0.4em 1em' : '0.55em 1.4em'};
   background-color: transparent;
   border-radius: 8px;
   border: 1.5px solid var(--color);
   transition: .5s;
   position: relative;
   overflow: hidden;
   cursor: pointer;
   z-index: 1;
   font-weight: 700;
   font-size: ${props => props.$size === 'lg' ? '15px' : props.$size === 'sm' ? '13px' : '14px'};
   font-family: inherit;
   color: var(--color);
   display: inline-flex;
   align-items: center;
   justify-content: center;
   gap: 6px;
  }

  .btn::after, .btn::before {
   content: '';
   display: block;
   height: 100%;
   width: 100%;
   transform: skew(90deg) translate(-50%, -50%);
   position: absolute;
   inset: 50%;
   left: 25%;
   z-index: -1;
   transition: .5s ease-out;
   background-color: var(--color);
  }

  .btn::before {
   top: -50%;
   left: -25%;
   transform: skew(90deg) rotate(180deg) translate(-50%, -50%);
  }

  .btn:hover::before {
   transform: skew(45deg) rotate(180deg) translate(-50%, -50%);
  }

  .btn:hover::after {
   transform: skew(45deg) translate(-50%, -50%);
  }

  .btn:hover {
   color: var(--color2);
  }

  .btn:active {
   filter: brightness(.7);
   transform: scale(.98);
  }
`;
