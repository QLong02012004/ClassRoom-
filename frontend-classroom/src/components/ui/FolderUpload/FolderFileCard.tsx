import React from 'react';
import { DownloadSimple } from 'phosphor-react';
import styles from './FolderUpload.module.scss';

interface FolderFileCardProps {
  fileName: string;
  fileSize: string;
  downloadUrl: string;
}

const FolderFileCard: React.FC<FolderFileCardProps> = ({ fileName, fileSize, downloadUrl }) => {
  return (
    <div className={styles.folderFileCard}>
      {/* Mini folder icon with hover animation */}
      <div className={styles.miniFolder}>
        <div className={styles.miniFrontSide}>
          <div className={styles.miniTip} />
          <div className={styles.miniCover} />
        </div>
        <div className={`${styles.miniBackSide} ${styles.miniCover}`} />
      </div>

      {/* File info */}
      <div className={styles.fileMeta}>
        <span className={styles.fileName}>{fileName}</span>
        <span className={styles.fileSize}>{fileSize} • Tài liệu đính kèm</span>
      </div>

      {/* Download button */}
      <a
        href={downloadUrl}
        target="_blank"
        rel="noreferrer"
        className={styles.downloadBtn}
        title="Tải xuống tệp"
        onClick={(e) => e.stopPropagation()}
      >
        <DownloadSimple size={18} weight="bold" />
      </a>
    </div>
  );
};

export default FolderFileCard;
