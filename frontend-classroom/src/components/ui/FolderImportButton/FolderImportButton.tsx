import React from 'react';
import styled from 'styled-components';

interface FolderImportButtonProps {
  onClick: () => void;
  title?: string;
}

const FolderImportButton: React.FC<FolderImportButtonProps> = ({ onClick, title = "Nhập dữ liệu (Word/Excel)" }) => {
  return (
    <StyledWrapper>
      <button className="button" onClick={onClick} type="button">
        <div className="container">
          <div className="folder folder_one" />
          <div className="folder folder_two" />
          <div className="folder folder_three" />
          <div className="folder folder_four" />
        </div>
        <div className="active_line" />
        <span className="text">{title}</span>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  flex-shrink: 0;
  
  .button {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7.5px; /* Chìa khóa để scale toàn bộ button về chiều cao ~40px */
    width: 5.3em;
    height: 5.3em;
    border: none;
    cursor: pointer;
    border-radius: 0.5em;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    transition: transform 0.2s;
  }
  
  .button:hover {
    transform: scale(1.05);
  }

  .container {
    position: relative;
    width: 3.5em;
    height: 3.1em;
    background: none;
    overflow: hidden;
    flex-shrink: 0;
  }

  .folder {
    content: "";
    position: absolute;
    /* box-shadow: 0 0 5px rgba(0, 0, 0, .3); */
  }

  .folder_one {
    bottom: 0;
    width: 100%;
    height: 88%;
    border-radius: 3px;
    border-top: 2px solid rgb(206, 167, 39);
    /* background-color: rgb(252, 212, 80); */
    background: linear-gradient(-35deg, rgb(238, 194, 47) 5%, rgb(255, 223, 118));
  }

  .folder_two {
    top: 5%;
    width: 38%;
    height: 19%;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
    background-color: rgb(206, 167, 39);
    box-shadow: 0 1px 5px -2px rgba(0, 0, 0, 0.5);
  }

  .folder_two::before {
    content: "";
    position: absolute;
    display: inline;
    left: 88%;
    width: 0;
    height: 0;
    border-left: 7px solid rgb(206, 167, 39);
    border-top: 0.3em solid transparent;
    border-bottom: 0.3em solid transparent;
    /* background-color: rgb(206, 167, 39); */
  }

  .folder_three {
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0.5em;
    bottom: 0;
    width: 2.5em;
    height: 0.9em;
    border-radius: 4px 4px 0 0;
    background: linear-gradient(-35deg, rgb(25, 102, 218), rgb(109, 165, 249));
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.4);
  }

  .folder_four {
    left: 1em;
    bottom: 0.3em;
    width: 1.5em;
    height: 0.18em;
    border-radius: 1em;
    background-color: rgb(20, 77, 163);
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .active_line {
    content: "";
    position: absolute;
    bottom: 0;
    width: 0.9em;
    height: 0.4em;
    background-color: #999;
    border: none;
    border-radius: 1em;
    transition: all 0.15s linear;
  }

  .button:active .active_line,
  .button:focus .active_line,
  .button:hover .active_line {
    width: 2.3em;
    background-color: rgb(41, 126, 255);
  }

  .button:focus .container,
  .button:hover .container {
    animation: wow 1s forwards;
  }

  @keyframes wow {
    20% {
      scale: 0.8;
    }

    30% {
      scale: 1;
      transform: translateY(0);
    }

    50% {
      transform: translateY(-6px);
    }

    65% {
      transform: translateY(4px);
    }

    80% {
      transform: translateY(0);
    }

    100% {
      scale: 1;
    }
  }

  .text {
    position: absolute;
    top: -45px;
    width: max-content;
    height: 32px;
    padding: 0 12px;
    background-color: #FFFFFF;
    color: #0F172A;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    opacity: 0;
    transition: all 0.2s ease-in-out;
    pointer-events: none; /* Tránh cản trở click */
    z-index: 10;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  /* Thêm mũi tên cho tooltip */
  .text::after {
    content: "";
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px 5px 0;
    border-style: solid;
    border-color: #FFFFFF transparent transparent transparent;
  }

  /* Thêm viền mũi tên cho tooltip */
  .text::before {
    content: "";
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 6px 6px 0;
    border-style: solid;
    border-color: #E2E8F0 transparent transparent transparent;
    z-index: -1;
  }

  .button:hover .text {
    opacity: 1;
  }
`;

export default FolderImportButton;
