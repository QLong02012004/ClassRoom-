import React from 'react';
import styled from 'styled-components';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, onClick, className, ...props }) => {
  return (
    <StyledWrapper>
      <button className={`ui-btn ${className || ''}`} onClick={onClick} {...props}>
        <span>
          {children || "Button"}
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: inline-block;

  .ui-btn {
    --btn-default-bg: #FE6747; /* Orange brand color */
    --btn-padding: 10px 24px; /* Matches builder buttons */
    --btn-hover-bg: #e0583b; /* Darker orange hover */
    --btn-transition: .2s;
    --btn-letter-spacing: .05rem;
    --btn-animation-duration: 1.2s;
    --btn-shadow: 0 4px 12px rgba(254, 103, 71, 0.2);
    --hover-btn-color: #000000; /* Black text on hover */
    --default-btn-color: #fff;
    --font-size: 0.85rem; /* Matches builder buttons */
    --font-weight: 700;
    --font-family: inherit;
    
    box-sizing: border-box;
    padding: var(--btn-padding);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--default-btn-color);
    font: var(--font-weight) var(--font-size) var(--font-family);
    background: var(--btn-default-bg);
    border: none;
    cursor: pointer;
    transition: var(--btn-transition);
    overflow: hidden;
    box-shadow: var(--btn-shadow);
    border-radius: 10px; /* Matches builder buttons */
  }

  .ui-btn span {
    letter-spacing: var(--btn-letter-spacing);
    transition: var(--btn-transition);
    box-sizing: border-box;
    position: relative;
    background: inherit;
  }

  .ui-btn span::before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    background: inherit;
  }

  .ui-btn:hover, .ui-btn:focus {
    background: var(--btn-hover-bg);
  }

  .ui-btn:hover span, .ui-btn:focus span {
    color: var(--hover-btn-color);
  }

  .ui-btn:hover span::before, .ui-btn:focus span::before {
    animation: chitchat linear both var(--btn-animation-duration);
  }

  @keyframes chitchat {
    0% {
      content: "#";
    }

    5% {
      content: ".";
    }

    10% {
      content: "^{";
    }

    15% {
      content: "-!";
    }

    20% {
      content: "#$_";
    }

    25% {
      content: "№:0";
    }

    30% {
      content: "#{+.";
    }

    35% {
      content: "@}-?";
    }

    40% {
      content: "?{4@%";
    }

    45% {
      content: "=.,^!";
    }

    50% {
      content: "?2@%";
    }

    55% {
      content: "\\;1}]";
    }

    60% {
      content: "?{%:%";
      right: 0;
    }

    65% {
      content: "|{f[4";
      right: 0;
    }

    70% {
      content: "{4%0%";
      right: 0;
    }

    75% {
      content: "'1_0<";
      right: 0;
    }

    80% {
      content: "{0%";
      right: 0;
    }

    85% {
      content: "]>'";
      right: 0;
    }

    90% {
      content: "4";
      right: 0;
    }

    95% {
      content: "2";
      right: 0;
    }

    100% {
      content: "";
      right: 0;
    }
  }
`;
