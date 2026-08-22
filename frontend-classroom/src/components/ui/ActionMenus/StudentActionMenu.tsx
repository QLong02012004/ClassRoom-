import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Chalkboard, ClipboardText, Users, ChartBar, PencilSimple, Trash } from "phosphor-react";

interface StudentActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onEnterClass?: () => void;
  onViewActivities?: () => void;
  onViewMembers?: () => void;
  onViewGrades?: () => void;
}

export const StudentActionMenu: React.FC<StudentActionMenuProps> = ({
  onEdit,
  onDelete,
  onEnterClass,
  onViewActivities,
  onViewMembers,
  onViewGrades,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLLabelElement>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');
  const [fixedStyle, setFixedStyle] = useState<React.CSSProperties>({});

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 99999,
        right: window.innerWidth - rect.right + "px",
      };

      if (window.innerHeight - rect.bottom < 250) {
        setPlacement('top');
        style.bottom = window.innerHeight - rect.top + 5 + "px";
        style.top = 'auto';
      } else {
        setPlacement('bottom');
        style.top = rect.bottom + 5 + "px";
        style.bottom = 'auto';
      }
      setFixedStyle(style);
    }
  };

  const handleAction = (action?: () => void) => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
    if (action) action();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        if (checkboxRef.current) {
          checkboxRef.current.checked = false;
        }
      }
    };
    const handleClose = () => {
      if (checkboxRef.current && checkboxRef.current.checked) {
        checkboxRef.current.checked = false;
      }
    };
    document.addEventListener('click', handleClickOutside, true);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose, true);
    };
  }, []);

  return (
    <StyledWrapper
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <label className="popup" ref={popupRef}>
        <input type="checkbox" ref={checkboxRef} onChange={handleCheckboxChange} />
        <div className="burger" tabIndex={0}>
          <span />
          <span />
          <span />
        </div>
        <nav className={`popup-window ${placement}`} style={fixedStyle}>
          <legend>Tùy chọn thao tác</legend>
          <ul>
            {onEdit && (
              <li>
                <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onEdit); }}>
                  <PencilSimple size={16} weight="bold" className="text-orange-500" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              </li>
            )}
            {onEnterClass && (
              <li>
                <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onEnterClass); }}>
                  <Chalkboard size={16} weight="bold" className="text-orange-500" />
                  <span>Vào lớp học</span>
                </button>
              </li>
            )}
            {onViewActivities && (
              <li>
                <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onViewActivities); }}>
                  <ClipboardText size={16} weight="bold" className="text-blue-500" />
                  <span>Bài tập & Bài thi</span>
                </button>
              </li>
            )}
            {onViewMembers && (
              <li>
                <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onViewMembers); }}>
                  <Users size={16} weight="bold" className="text-indigo-500" />
                  <span>Xem thành viên</span>
                </button>
              </li>
            )}
            {onViewGrades && (
              <li>
                <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onViewGrades); }}>
                  <ChartBar size={16} weight="bold" className="text-emerald-500" />
                  <span>Bảng điểm cá nhân</span>
                </button>
              </li>
            )}
            {onDelete && (
              <>
                <hr />
                <li>
                  <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onDelete); }}>
                    <Trash size={16} weight="bold" className="text-red-500" />
                    <span>Xóa tài khoản</span>
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .popup {
    --burger-line-width: 1.125em;
    --burger-line-height: 0.125em;
    --burger-offset: 0.625em;
    --burger-bg: transparent;
    --burger-color: #64748b;
    --burger-line-border-radius: 0.1875em;
    --burger-diameter: 2.125em;
    --burger-btn-border-radius: calc(var(--burger-diameter) / 2);
    --burger-line-transition: .3s;
    --burger-transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
    --burger-hover-scale: 1;
    --burger-active-scale: 1;
    --burger-enable-outline-color: var(--burger-bg);
    --burger-enable-outline-width: 0.125em;
    --burger-enable-outline-offset: var(--burger-enable-outline-width);
    --nav-padding-x: 0.25em;
    --nav-padding-y: 0.625em;
    --nav-border-radius: 0.5rem;
    --nav-border-color: #e2e8f0;
    --nav-border-width: 1px;
    --nav-shadow-color: rgba(0, 0, 0, .1);
    --nav-shadow-width: 0 4px 6px -1px;
    --nav-bg: #fff;
    --nav-font-family: inherit;
    --nav-default-scale: .8;
    --nav-[#2f8fa3]: 1;
    --nav-position-left: unset;
    --nav-position-right: 0;
    --nav-title-size: 0.75rem;
    --nav-title-color: #64748b;
    --nav-title-padding-x: 1rem;
    --nav-title-padding-y: 0.5rem;
    --nav-button-padding-x: 1rem;
    --nav-button-padding-y: 0.5rem;
    --nav-button-border-radius: 0.375em;
    --nav-button-font-size: 14px;
    --nav-button-hover-bg: #e2e8f0;
    --nav-button-hover-text-color: #0f172a;
    --nav-button-distance: 0.75em;
    --underline-border-width: 1px;
    --underline-border-color: #cbd5e1;
    --underline-margin-y: 0.5rem;
  }

  .popup {
    display: inline-block;
    text-rendering: optimizeLegibility;
    position: relative;
    z-index: 1;
  }

  .popup:has(input:checked) {
    z-index: 50;
  }

  .popup input {
    display: none;
  }

  .burger {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    background: var(--burger-bg);
    width: var(--burger-diameter);
    height: var(--burger-diameter);
    border-radius: var(--burger-btn-border-radius);
    border: none;
    cursor: pointer;
    overflow: hidden;
    transition: background-color 0.2s ease;
    outline: var(--burger-enable-outline-width) solid transparent;
    outline-offset: 0;
  }

  .burger:hover {
    background: #f1f5f9;
  }

  .burger span {
    height: var(--burger-line-height);
    width: var(--burger-line-width);
    background: var(--burger-color);
    border-radius: var(--burger-line-border-radius);
    position: absolute;
    transition: var(--burger-line-transition);
  }

  .burger span:nth-child(1) {
    top: var(--burger-offset);
  }

  .burger span:nth-child(2) {
    bottom: var(--burger-offset);
  }

  .burger span:nth-child(3) {
    top: 50%;
    transform: translateY(-50%);
  }

  .popup-window {
    transform: scale(0.8);
    visibility: hidden;
    opacity: 0;
    position: absolute;
    right: 0;
    padding: var(--nav-padding-y) var(--nav-padding-x);
    background: var(--nav-bg);
    font-family: var(--nav-font-family);
    border-radius: var(--nav-border-radius);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    border: var(--nav-border-width) solid var(--nav-border-color);
    transition: var(--burger-transition);
    min-width: 190px;
    z-index: 99999;
  }

  .popup-window.bottom {
    top: calc(var(--burger-diameter) + 0.25em);
  }

  .popup-window.top {
    bottom: calc(var(--burger-diameter) + 0.25em);
  }

  .popup-window legend {
    padding: var(--nav-title-padding-y) var(--nav-title-padding-x);
    margin: 0;
    color: var(--nav-title-color);
    font-size: var(--nav-title-size);
    font-weight: 600;
    text-align: left;
    display: block;
    width: 100%;
  }

  .popup-window ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }

  .popup-window ul button {
    outline: none;
    width: 100%;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    color: #334155;
    font-size: var(--nav-button-font-size);
    font-weight: 500;
    padding: var(--nav-button-padding-y) var(--nav-button-padding-x);
    white-space: nowrap;
    border-radius: var(--nav-button-border-radius);
    cursor: pointer;
    column-gap: var(--nav-button-distance);
  }

  .popup-window hr {
    margin: var(--underline-margin-y) 0;
    border: none;
    border-bottom: var(--underline-border-width) solid var(--underline-border-color);
  }

  .popup-window ul button:hover,
  .popup-window ul button:focus-visible {
    color: var(--nav-button-hover-text-color);
    background: var(--nav-button-hover-bg);
  }

  .popup-window ul li:last-child button:hover,
  .popup-window ul li:last-child button:focus-visible {
    color: #dc2626;
    background: #fee2e2;
  }

  .popup input:checked+.burger span:nth-child(1) {
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }

  .popup input:checked+.burger span:nth-child(2) {
    bottom: 50%;
    transform: translateY(50%) rotate(-45deg);
  }

  .popup input:checked+.burger span:nth-child(3) {
    transform: translateX(calc(var(--burger-diameter) * -1 - var(--burger-line-width)));
  }

  .popup input:checked~nav {
    transform: scale(1);
    visibility: visible;
    opacity: 1;
  }
`;
