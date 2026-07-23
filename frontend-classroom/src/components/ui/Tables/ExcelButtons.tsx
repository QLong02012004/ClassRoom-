import React from 'react';
import styled from 'styled-components';

interface ExcelImportButtonProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const ExcelImportButton: React.FC<ExcelImportButtonProps> = ({ onFileSelect, disabled }) => {
  return (
    <StyledWrapper>
      <div className={`container-btn-file ${disabled ? 'disabled' : ''}`}>
        <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 50 50">
          <path d="M28.8125 .03125L.8125 5.34375C.339844 
        5.433594 0 5.863281 0 6.34375L0 43.65625C0 
        44.136719 .339844 44.566406 .8125 44.65625L28.8125 
        49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 
        50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 
        30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 
        .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 
        6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 
        29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 
        43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM36 13L44 
        13L44 15L36 15ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 
        21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 
        22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 
        15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 
        28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 
        27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 
        14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 
        20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z" />
        </svg>
        Nhập điểm (Excel)
        <input 
          className="file-input" 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={onFileSelect} 
          disabled={disabled}
        />
      </div>
    </StyledWrapper>
  );
};

interface ExcelExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ExcelExportButton: React.FC<ExcelExportButtonProps> = ({ onClick, disabled }) => {
  return (
    <StyledWrapper>
      <button 
        type="button" 
        className={`container-btn-file export-btn ${disabled ? 'disabled' : ''}`} 
        onClick={onClick} 
        disabled={disabled}
      >
        <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 50 50">
          <path d="M28.8125 .03125L.8125 5.34375C.339844 
        5.433594 0 5.863281 0 6.34375L0 43.65625C0 
        44.136719 .339844 44.566406 .8125 44.65625L28.8125 
        49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 
        50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 
        30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 
        .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 
        6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 
        29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 
        43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM36 13L44 
        13L44 15L36 15ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 
        21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 
        22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 
        15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 
        28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 
        27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 
        14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 
        20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z" />
        </svg>
        Xuất bảng điểm
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .container-btn-file {
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
    background-color: #307750;
    color: #fff;
    border: none;
    padding: 0.6rem 1.2rem;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 10px;
    overflow: hidden;
    z-index: 1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 250ms ease;
    cursor: pointer;
    user-select: none;
    height: 38px;
    outline: none;
  }
  
  .container-btn-file.export-btn {
    background-color: #1e6d42;
  }

  .container-btn-file.disabled {
    opacity: 0.6;
    pointer-events: none;
    cursor: not-allowed;
  }

  .container-btn-file input[type="file"] {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }

  .container-btn-file > svg {
    margin-right: 0.5rem;
    flex-shrink: 0;
  }

  .container-btn-file::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, 0.15);
    z-index: -1;
    transition: all 350ms ease;
  }

  .container-btn-file:hover::before {
    width: 100%;
  }

  .container-btn-file:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15), 0 3px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .container-btn-file:active {
    transform: translateY(0);
  }
`;
