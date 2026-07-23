import React from 'react';
import styled from 'styled-components';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, className, onClick, ...props }) => {
  return (
    <StyledWrapper>
      <button className={`btn ${className || ''}`} onClick={onClick} {...props}>
        {children || "Button"}
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .btn {
   --color: #f47c20;
   --color2: #ffffff;
   padding: 0.8em 1.75em;
   background-color: transparent;
   border-radius: 6px;
   border: .3px solid var(--color);
   transition: .5s;
   position: relative;
   overflow: hidden;
   cursor: pointer;
   z-index: 1;
   font-weight: 300;
   font-size: 17px;
   font-family: 'Roboto', 'Segoe UI', sans-serif;
   text-transform: uppercase;
   color: var(--color);
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
