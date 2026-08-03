import React from 'react';
import styles from './ComicButton.module.scss';

type ComicButtonVariant = 'primary' | 'warning';
type ComicButtonSize = 'default' | 'sm';

interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ComicButtonVariant;
  size?: ComicButtonSize;
  children: React.ReactNode;
}

export const ComicButton: React.FC<ComicButtonProps> = ({
  variant = 'primary',
  size = 'default',
  className = '',
  children,
  ...props
}) => {
  const classes = [
    styles.comicButton,
    variant === 'warning' ? styles.warning : '',
    size === 'sm' ? styles.sm : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default ComicButton;
