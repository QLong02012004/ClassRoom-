import React from 'react';
import styled from 'styled-components';

interface DownloadButtonProps {
  href?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  href,
  onClick,
  label = "Tải xuống tài liệu",
  className,
}) => {
  const buttonContent = (
    <button className="button" type="button" onClick={onClick}>
      <span className="button__text">{label}</span>
      <span className="button__icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 35 35"
          className="svg"
        >
          <path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z" />
          <path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z" />
          <path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z" />
        </svg>
      </span>
    </button>
  );

  if (href) {
    return (
      <StyledWrapper className={className}>
        <a href={href} target="_blank" rel="noreferrer" className="block no-underline">
          {buttonContent}
        </a>
      </StyledWrapper>
    );
  }

  return <StyledWrapper className={className}>{buttonContent}</StyledWrapper>;
};

const StyledWrapper = styled.div`
  display: inline-block;

  .button {
    --main-focus: #2f8fa3;
    --font-color: #0f172a;
    --bg-color-sub: #2f8fa3;
    --bg-color: #f8fafc;
    --main-color: #0f172a;
    position: relative;
    min-width: 200px;
    height: 46px;
    padding-left: 20px;
    padding-right: 56px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--main-color);
    box-shadow: 3.5px 3.5px var(--main-color);
    background-color: var(--bg-color);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .button, .button__icon, .button__text {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .button .button__text {
    color: var(--font-color);
    font-weight: 800;
    font-size: 13.5px;
    white-space: nowrap;
    z-index: 1;
  }

  .button .button__icon {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    width: 46px;
    background-color: var(--bg-color-sub);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .button .svg {
    width: 20px;
    fill: #ffffff;
  }

  .button:hover {
    background: #f1f5f9;
  }

  .button:hover .button__text {
    opacity: 0;
  }

  .button:hover .button__icon {
    width: 100%;
  }

  .button:active {
    transform: translate(3px, 3px);
    box-shadow: 0px 0px var(--main-color);
  }
`;

export default DownloadButton;
