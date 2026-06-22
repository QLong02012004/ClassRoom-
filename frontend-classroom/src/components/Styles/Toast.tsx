import React, { useEffect, useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Warning, 
  Info, 
  X 
} from "phosphor-react";
import type { ToastItem, ToastType } from "./ToastContext.tsx";


import styles from "./Toast.module.scss";


interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onClose: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const duration = toast.duration || 4000;

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Trigger slide-out animation 300ms before removing from DOM

    const removeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle weight="fill" />;
      case "error":
        return <XCircle weight="fill" />;
      case "warning":
        return <Warning weight="fill" />;
      case "info":
        return <Info weight="fill" />;
      default:
        return <Info weight="fill" />;
    }
  };

  const toastClass = `${styles.toastItem} ${styles[toast.type]} ${isExiting ? styles.slideOut : ""}`;

  return (
    <div className={toastClass} role="alert">
      <div className={styles.toastIcon}>{getIcon(toast.type)}</div>
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{toast.message}</p>
      </div>
      <button 
        className={styles.toastClose} 
        onClick={handleManualClose}
        aria-label="Đóng"
        title="Đóng thông báo"
      >
        <X weight="bold" />
      </button>
      <div 
        className={`${styles.progressBar} ${styles.progressActive}`} 
        style={{ animationDuration: `${duration}ms` }} 
      />
    </div>
  );
};

export default ToastContainer;
