import React from 'react';
import styled from 'styled-components';

interface CustomRadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const CustomRadio: React.FC<CustomRadioProps> = ({ label, ...props }) => {
  return (
    <StyledWrapper>
      <label className="radio-button" title={props.title}>
        <input type="radio" {...props} />
        <span className="radio-checkmark" />
        {label && <span className="radio-label">{label}</span>}
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .radio-button {
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    margin: 0;
  }

  .radio-button:hover {
    transform: translateY(-2px);
  }

  .radio-button input[type="radio"] {
    display: none;
  }

  .radio-checkmark {
    display: inline-block;
    position: relative;
    width: 20px;
    height: 20px;
    border: 2px solid #cbd5e1; /* Xám nhạt mặc định */
    border-radius: 50%;
    transition: all 0.2s ease-in-out;
    background-color: #fff;
  }

  .radio-checkmark:before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #2f8fa3; /* Xanh ngọc bích khi checked */
    transition: all 0.2s ease-in-out;
  }

  .radio-button input[type="radio"]:checked ~ .radio-checkmark {
    border-color: #2f8fa3;
  }

  .radio-button input[type="radio"]:checked ~ .radio-checkmark:before {
    transform: translate(-50%, -50%) scale(1);
  }

  .radio-label {
    font-size: 14px;
    font-weight: 600;
    margin-left: 8px;
    color: #475569;
  }
`;

export default CustomRadio;
