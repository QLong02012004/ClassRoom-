import React from 'react';
import styled from 'styled-components';

interface NewChatButtonProps {
  onClick?: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <StyledWrapper onClick={onClick}>
      <div className="btn-wrapper">
        <button className="btn" type="button">
          <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
          <div className="txt-wrapper">
            <div className="txt-1">
              <span className="btn-letter">T</span>
              <span className="btn-letter">ạ</span>
              <span className="btn-letter">o</span>
              <span className="btn-letter">&nbsp;</span>
              <span className="btn-letter">c</span>
              <span className="btn-letter">h</span>
              <span className="btn-letter">a</span>
              <span className="btn-letter">t</span>
              <span className="btn-letter">&nbsp;</span>
              <span className="btn-letter">m</span>
              <span className="btn-letter">ớ</span>
              <span className="btn-letter">i</span>
            </div>
            <div className="txt-2">
              <span className="btn-letter">Đ</span>
              <span className="btn-letter">a</span>
              <span className="btn-letter">n</span>
              <span className="btn-letter">g</span>
              <span className="btn-letter">&nbsp;</span>
              <span className="btn-letter">t</span>
              <span className="btn-letter">ạ</span>
              <span className="btn-letter">o</span>
              <span className="btn-letter">.</span>
              <span className="btn-letter">.</span>
              <span className="btn-letter">.</span>
            </div>
          </div>
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  width: 100%;

  .btn-wrapper {
    position: relative;
    display: block;
    width: 100%;
  }

  .btn {
    --border-radius: 14px;
    --padding: 3px;
    --transition: 0.3s;
    --button-color: #ffffff;
    --orange-primary: #f47c20;
    --orange-hover: #ea580c;
    --orange-active: #c2410c;

    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.65em 1em;
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 0.95rem;
    font-weight: 700;

    background-color: var(--button-color);

    box-shadow:
      0 2px 8px rgba(244, 124, 32, 0.12),
      inset 0 1px 1px rgba(255, 255, 255, 0.8);

    border: 2px solid var(--orange-primary);
    border-radius: var(--border-radius);
    cursor: pointer;

    transition:
      box-shadow var(--transition),
      border-color var(--transition),
      background-color var(--transition),
      transform 0.15s ease;
  }

  .btn::before {
    content: "";
    position: absolute;
    top: calc(0px - var(--padding));
    left: calc(0px - var(--padding));
    width: calc(100% + var(--padding) * 2);
    height: calc(100% + var(--padding) * 2);
    border-radius: calc(var(--border-radius) + var(--padding));
    pointer-events: none;
    background-image: linear-gradient(0deg, rgba(244, 124, 32, 0.05), rgba(244, 124, 32, 0.15));
    z-index: -1;
    transition: box-shadow var(--transition), filter var(--transition);
  }

  .btn::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    pointer-events: none;
    background-image: linear-gradient(
      0deg,
      rgba(244, 124, 32, 0.1),
      rgba(244, 124, 32, 0.2),
      transparent
    );
    background-position: 0 0;
    opacity: 0;
    transition: opacity var(--transition);
  }

  .btn-letter {
    position: relative;
    display: inline-block;
    color: var(--orange-primary);
    font-weight: 700;
    animation: letter-anim 2s ease-in-out infinite;
    transition:
      color var(--transition),
      text-shadow var(--transition),
      opacity var(--transition);
  }

  @keyframes letter-anim {
    50% {
      text-shadow: 0 0 6px rgba(244, 124, 32, 0.5);
      color: var(--orange-hover);
    }
  }

  .btn-svg {
    height: 20px;
    width: 20px;
    margin-right: 0.5rem;
    fill: var(--orange-primary);
    animation: flicker 2s linear infinite;
    animation-delay: 0.5s;
    filter: drop-shadow(0 0 3px rgba(244, 124, 32, 0.5));
    transition:
      fill var(--transition),
      filter var(--transition),
      opacity var(--transition);
    flex-shrink: 0;
  }

  @keyframes flicker {
    50% {
      opacity: 0.5;
    }
  }

  .txt-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 6.8em;
    height: 1.4em;
  }

  .txt-1,
  .txt-2 {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .txt-1 {
    animation: appear-anim 1s ease-in-out forwards;
  }

  .txt-2 {
    opacity: 0;
  }

  @keyframes appear-anim {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  .btn:focus .txt-1 {
    animation: opacity-anim 0.3s ease-in-out forwards;
    animation-delay: 1s;
  }

  .btn:focus .txt-2 {
    animation: opacity-anim 0.3s ease-in-out reverse forwards;
    animation-delay: 1s;
  }

  @keyframes opacity-anim {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  .btn:focus .btn-letter {
    animation:
      focused-letter-anim 1s ease-in-out forwards,
      letter-anim 1.2s ease-in-out infinite;
    animation-delay: 0s, 1s;
  }

  @keyframes focused-letter-anim {
    0%, 100% { filter: blur(0px); }
    50% {
      transform: scale(1.3);
      filter: drop-shadow(0 0 8px rgba(244, 124, 32, 0.6));
    }
  }

  .btn:focus .btn-svg {
    animation-duration: 1.2s;
    animation-delay: 0.2s;
  }

  /* Hover state - Trắng viền cam sang trọng */
  .btn:hover {
    background-color: #fff7ed;
    border-color: var(--orange-hover);
    box-shadow: 0 4px 16px rgba(244, 124, 32, 0.25);
    transform: translateY(-1px);
  }

  .btn:hover::after {
    opacity: 1;
  }

  .btn:hover .btn-svg {
    fill: var(--orange-hover);
    filter: drop-shadow(0 0 6px rgba(244, 124, 32, 0.8));
    animation: none;
  }

  .btn:hover .btn-letter {
    color: var(--orange-hover);
  }

  /* Active state */
  .btn:active {
    background-color: #ffedd5;
    border-color: var(--orange-active);
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(244, 124, 32, 0.2);
  }

  .btn:active .btn-letter {
    color: var(--orange-active);
    text-shadow: none;
    animation: none;
  }

  /* Animation delays for .btn-letter elements */
  .btn-letter:nth-child(1), .btn:focus .btn-letter:nth-child(1) { animation-delay: 0s; }
  .btn-letter:nth-child(2), .btn:focus .btn-letter:nth-child(2) { animation-delay: 0.08s; }
  .btn-letter:nth-child(3), .btn:focus .btn-letter:nth-child(3) { animation-delay: 0.16s; }
  .btn-letter:nth-child(4), .btn:focus .btn-letter:nth-child(4) { animation-delay: 0.24s; }
  .btn-letter:nth-child(5), .btn:focus .btn-letter:nth-child(5) { animation-delay: 0.32s; }
  .btn-letter:nth-child(6), .btn:focus .btn-letter:nth-child(6) { animation-delay: 0.4s; }
  .btn-letter:nth-child(7), .btn:focus .btn-letter:nth-child(7) { animation-delay: 0.48s; }
  .btn-letter:nth-child(8), .btn:focus .btn-letter:nth-child(8) { animation-delay: 0.56s; }
  .btn-letter:nth-child(9), .btn:focus .btn-letter:nth-child(9) { animation-delay: 0.64s; }
  .btn-letter:nth-child(10), .btn:focus .btn-letter:nth-child(10) { animation-delay: 0.72s; }
  .btn-letter:nth-child(11), .btn:focus .btn-letter:nth-child(11) { animation-delay: 0.8s; }
  .btn-letter:nth-child(12), .btn:focus .btn-letter:nth-child(12) { animation-delay: 0.88s; }
`;

export default NewChatButton;
