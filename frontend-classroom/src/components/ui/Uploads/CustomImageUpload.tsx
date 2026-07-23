import React, { useId } from 'react';
import styled from 'styled-components';

interface CustomImageUploadProps {
  imageUrl?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  title?: string;
}

const CustomImageUpload: React.FC<CustomImageUploadProps> = ({ 
  imageUrl, 
  onChange, 
  onRemove, 
  title = "Click to upload image" 
}) => {
  const inputId = useId();

  return (
    <StyledWrapper>
      {imageUrl ? (
        <div className="preview-container">
          <img src={imageUrl} alt="Uploaded" className="preview-image" />
          <button type="button" className="remove-btn" onClick={onRemove} title="Xóa ảnh">✕</button>
        </div>
      ) : (
        <label className="custum-file-upload" htmlFor={inputId}>
          <div className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="" viewBox="0 0 24 24">
              <g strokeWidth={0} id="SVGRepo_bgCarrier" />
              <g strokeLinejoin="round" strokeLinecap="round" id="SVGRepo_tracerCarrier" />
              <g id="SVGRepo_iconCarrier"> 
                <path fill="" d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z" clipRule="evenodd" fillRule="evenodd" /> 
              </g>
            </svg>
          </div>
          <div className="text">
            <span>{title}</span>
          </div>
          <input 
            type="file" 
            id={inputId} 
            accept="image/*" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onChange(e.target.files[0]);
              }
              // Reset input so the same file can be selected again
              e.target.value = '';
            }} 
          />
        </label>
      )}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  margin-top: 16px;
  margin-bottom: 16px;
  
  .custum-file-upload {
    height: 160px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: space-between;
    gap: 16px;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    border: 2px dashed #cacaca;
    background-color: rgba(255, 255, 255, 1);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0px 10px 20px -10px rgba(0,0,0,0.05);
    transition: all 0.2s ease-in-out;
  }

  .custum-file-upload:hover {
    border-color: #FE6747;
    background-color: #fff9f8;
  }

  .custum-file-upload .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .custum-file-upload .icon svg {
    height: 60px;
    fill: #9ca3af;
    transition: fill 0.2s ease-in-out;
  }

  .custum-file-upload:hover .icon svg {
    fill: #FE6747;
  }

  .custum-file-upload .text {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .custum-file-upload .text span {
    font-weight: 500;
    color: #6b7280;
  }

  .custum-file-upload input {
    display: none;
  }
  
  .preview-container {
    position: relative;
    width: 100%;
    height: 200px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .remove-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: white;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    color: #ef4444;
    font-weight: bold;
    font-size: 14px;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: #fef2f2;
    border-color: #fca5a5;
  }
`;

export default CustomImageUpload;
