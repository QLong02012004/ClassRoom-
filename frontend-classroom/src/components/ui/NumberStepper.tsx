import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { CaretUp, CaretDown } from 'phosphor-react';

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  fullWidth?: boolean;
}

const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  fullWidth = false
}) => {
  const [internalValue, setInternalValue] = useState<string>(value.toString());

  useEffect(() => {
    setInternalValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleBlur = () => {
    let parsed = parseInt(internalValue, 10);
    if (isNaN(parsed)) {
      parsed = min;
    } else {
      parsed = Math.max(min, Math.min(max, parsed));
    }
    onChange(parsed);
    setInternalValue(parsed.toString());
  };

  return (
    <StepperContainer $fullWidth={fullWidth}>
      <NumberInput
        type="text"
        $fullWidth={fullWidth}
        value={internalValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
      <ControlsContainer>
        <ControlButton onClick={handleIncrement} type="button">
          <CaretUp size={12} weight="bold" />
        </ControlButton>
        <ControlButton onClick={handleDecrement} type="button">
          <CaretDown size={12} weight="bold" />
        </ControlButton>
      </ControlsContainer>
    </StepperContainer>
  );
};

export default NumberStepper;

const StepperContainer = styled.div<{ $fullWidth?: boolean }>`
  display: inline-flex;
  align-items: stretch;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
  overflow: hidden;
  height: 41px;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  background-color: white;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: #FE6747;
  }
`;

const NumberInput = styled.input<{ $fullWidth?: boolean }>`
  width: ${props => props.$fullWidth ? '100%' : '44px'};
  flex: ${props => props.$fullWidth ? '1' : 'none'};
  border: none !important;
  padding: ${props => props.$fullWidth ? '0 16px !important' : '0 !important'};
  margin: 0 !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  text-align: ${props => props.$fullWidth ? 'left' : 'center'};
  font-size: 1rem;
  font-weight: 700;
  color: #FE6747;
  outline: none;
  background: transparent;
`;

const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #f1f5f9;
  width: 26px;
  border-left: 1.5px solid #cbd5e1;
`;

const ControlButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s, color 0.15s;

  &:hover {
    background-color: #e2e8f0;
    color: #1e293b;
  }

  &:active {
    background-color: #cbd5e1;
  }
  
  &:first-child {
    border-bottom: 1.5px solid #cbd5e1;
  }
`;
