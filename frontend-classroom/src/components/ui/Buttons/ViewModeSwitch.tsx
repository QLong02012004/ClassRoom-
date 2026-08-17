import React from 'react';
import styled from 'styled-components';
import { SquaresFour, List } from 'phosphor-react';

interface ViewModeSwitchProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const ViewModeSwitch: React.FC<ViewModeSwitchProps> = ({ viewMode, onViewModeChange }) => {
  const isChecked = viewMode === 'list';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onViewModeChange(e.target.checked ? 'list' : 'grid');
  };

  return (
    <StyledWrapper>
      <label htmlFor="viewModeToggle" className="switch" aria-label="Toggle View Mode">
        <input
          type="checkbox"
          id="viewModeToggle"
          checked={isChecked}
          onChange={handleChange}
        />
        <span className="switch-label">
          <SquaresFour size={16} weight="bold" />
          Lưới
        </span>
        <span className="switch-label">
          <List size={16} weight="bold" />
          Bảng
        </span>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .switch {
    --_switch-bg-clr: #e2e8f0;
    --_switch-padding: 3px; /* padding around button */
    --_slider-bg-clr: #2f8fa3; /* secondary color (Ocean Blue) */
    --_slider-bg-clr-on: #f47c20; /* primary color (Orange) */
    --_slider-txt-clr: #ffffff;
    --_label-padding: 8px 18px; /* balanced padding */
    --_switch-easing: cubic-bezier(0.47, 1.64, 0.41, 0.8);
    
    color: #475569; /* slate-600 */
    width: fit-content;
    display: flex;
    justify-content: center;
    position: relative;
    border-radius: 9999px;
    cursor: pointer;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    isolation: isolate;
    border: 1px solid #cbd5e1;
    background-color: var(--_switch-bg-clr);
    user-select: none;
  }

  .switch input[type="checkbox"] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .switch-label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 700;
    transition: opacity 300ms ease-in-out 150ms, color 300ms ease-in-out;
    padding: var(--_label-padding);
    z-index: 1;
    color: #475569;
  }

  .switch::before,
  .switch::after {
    content: "";
    position: absolute;
    border-radius: inherit;
    transition: inset 150ms ease-in-out;
  }

  /* switch slider */
  .switch::before {
    background-color: var(--_slider-bg-clr);
    inset: var(--_switch-padding) 50% var(--_switch-padding) var(--_switch-padding);
    transition:
      inset 400ms var(--_switch-easing),
      background-color 400ms ease-in-out;
    z-index: -1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  /* switch bg color */
  .switch::after {
    background-color: var(--_switch-bg-clr);
    inset: 0;
    z-index: -2;
  }

  /* switch hover & focus */
  .switch:focus-within::after {
    inset: -2px;
    border-radius: 9999px;
  }

  .switch:has(input:checked):hover > span:first-of-type,
  .switch:has(input:not(:checked)):hover > span:last-of-type {
    opacity: 1;
    transition-delay: 0ms;
    transition-duration: 100ms;
  }

  /* switch hover slide extension */
  .switch:has(input:checked):hover::before {
    inset: var(--_switch-padding) var(--_switch-padding) var(--_switch-padding) 45%;
  }
  .switch:has(input:not(:checked)):hover::before {
    inset: var(--_switch-padding) 45% var(--_switch-padding) var(--_switch-padding);
  }

  /* checked - move slider to right */
  .switch:has(input:checked)::before {
    background-color: var(--_slider-bg-clr-on);
    inset: var(--_switch-padding) var(--_switch-padding) var(--_switch-padding) 50%;
  }

  /* checked - set opacity and text colors */
  .switch > span:last-of-type,
  .switch > input:checked + span:first-of-type {
    opacity: 0.8;
    color: #475569;
  }

  .switch > input:checked ~ span:last-of-type,
  .switch > input:not(:checked) + span:first-of-type {
    opacity: 1;
    color: var(--_slider-txt-clr);
  }
`;

export default ViewModeSwitch;
