import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { ShieldStar, Key, LockKey, LockKeyOpen, Trash } from "phosphor-react";

interface ActionMenuProps {
  onRoleChange: () => void;
  onResetPassword: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  isLocked: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  onRoleChange,
  onResetPassword,
  onToggleStatus,
  onDelete,
  isLocked,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Đóng menu sau khi click vào action
  const handleAction = (action: () => void) => {
    if (checkboxRef.current) {
      checkboxRef.current.checked = false;
    }
    action();
  };

  // Click outside để đóng menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.popup')) {
        if (checkboxRef.current) {
          checkboxRef.current.checked = false;
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <StyledWrapper>
      <label className="popup">
        <input type="checkbox" ref={checkboxRef} />
        <div className="burger" tabIndex={0}>
          <span />
          <span />
          <span />
        </div>
        <nav className="popup-window">
          <legend>Tùy chọn</legend>
          <ul>
            <li>
              <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onRoleChange); }}>
                <ShieldStar size={16} weight="bold" className="text-blue-500" />
                <span>Đổi quyền</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onResetPassword); }}>
                <Key size={16} weight="bold" className="text-amber-500" />
                <span>Reset mật khẩu</span>
              </button>
            </li>
            <hr />
            <li>
              <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onToggleStatus); }}>
                {isLocked ? (
                  <>
                    <LockKeyOpen size={16} weight="bold" className="text-emerald-500" />
                    <span>Mở khóa tài khoản</span>
                  </>
                ) : (
                  <>
                    <LockKey size={16} weight="bold" className="text-orange-500" />
                    <span>Khóa tài khoản</span>
                  </>
                )}
              </button>
            </li>
            <hr />
            <li>
              <button type="button" onClick={(e) => { e.preventDefault(); handleAction(onDelete); }}>
                <Trash size={16} weight="bold" className="text-red-500" />
                <span>Xóa tài khoản</span>
              </button>
            </li>
          </ul>
        </nav>
      </label>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  /* The design is inspired from the mockapi.io */

  .popup {
    --burger-line-width: 1.125em;
    --burger-line-height: 0.125em;
    --burger-offset: 0.625em;
    --burger-bg: transparent;
    --burger-color: #64748b; /* slate-500 */
    --burger-line-border-radius: 0.1875em;
    --burger-diameter: 2.125em;
    --burger-btn-border-radius: calc(var(--burger-diameter) / 2);
    --burger-line-transition: .3s;
    --burger-transition: all .1s ease-in-out;
    --burger-hover-scale: 1.1;
    --burger-active-scale: .95;
    --burger-enable-outline-color: var(--burger-bg);
    --burger-enable-outline-width: 0.125em;
    --burger-enable-outline-offset: var(--burger-enable-outline-width);
    /* nav */
    --nav-padding-x: 0.25em;
    --nav-padding-y: 0.625em;
    --nav-border-radius: 0.5rem;
    --nav-border-color: #e2e8f0; /* slate-200 */
    --nav-border-width: 1px;
    --nav-shadow-color: rgba(0, 0, 0, .1);
    --nav-shadow-width: 0 4px 6px -1px;
    --nav-bg: #fff;
    --nav-font-family: inherit;
    --nav-default-scale: .8;
    --nav-active-scale: 1;
    --nav-position-left: unset;
    --nav-position-right: 0;
    /* title */
    --nav-title-size: 0.75rem;
    --nav-title-color: #64748b; /* slate-500 */
    --nav-title-padding-x: 1rem;
    --nav-title-padding-y: 0.5rem;
    /* nav button */
    --nav-button-padding-x: 1rem;
    --nav-button-padding-y: 0.5rem;
    --nav-button-border-radius: 0.375em;
    --nav-button-font-size: 14px;
    --nav-button-hover-bg: #e2e8f0; /* slate-200 */
    --nav-button-hover-text-color: #0f172a; /* slate-900 */
    --nav-button-distance: 0.75em;
    /* underline */
    --underline-border-width: 1px;
    --underline-border-color: #cbd5e1; /* slate-300 */
    --underline-margin-y: 0.5rem;
  }

  /* popup settings 👆 */

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
    transition: var(--burger-transition);
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
    transform: scale(var(--nav-default-scale));
    visibility: hidden;
    opacity: 0;
    position: absolute;
    padding: var(--nav-padding-y) var(--nav-padding-x);
    background: var(--nav-bg);
    font-family: var(--nav-font-family);
    border-radius: var(--nav-border-radius);
    box-shadow: var(--nav-shadow-width) var(--nav-shadow-color);
    border: var(--nav-border-width) solid var(--nav-border-color);
    top: calc(var(--burger-diameter) + var(--burger-enable-outline-width) + var(--burger-enable-outline-offset));
    left: var(--nav-position-left);
    right: var(--nav-position-right);
    transition: var(--burger-transition);
    z-index: 50;
    min-width: 200px;
  }

  .popup-window legend {
    padding: var(--nav-title-padding-y) var(--nav-title-padding-x);
    margin: 0;
    color: var(--nav-title-color);
    font-size: var(--nav-title-size);
    font-weight: 600;
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
    color: #334155; /* slate-700 */
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

  /* actions */

  .popup-window ul button:hover,
  .popup-window ul button:focus-visible {
    color: var(--nav-button-hover-text-color);
    background: var(--nav-button-hover-bg);
  }

  /* Màu đặc biệt cho nút Xóa */
  .popup-window ul li:last-child button:hover,
  .popup-window ul li:last-child button:focus-visible {
    color: #dc2626; /* red-600 */
    background: #fee2e2; /* red-100 */
  }

  .burger:hover {
    transform: scale(var(--burger-hover-scale));
  }

  .burger:active {
    transform: scale(var(--burger-active-scale));
  }

  .burger:focus:not(:hover) {
    outline-color: var(--burger-enable-outline-color);
    outline-offset: var(--burger-enable-outline-offset);
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
    transform: scale(var(--nav-active-scale));
    visibility: visible;
    opacity: 1;
  }
`;
