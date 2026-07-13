import React, { useState } from "react";
import styles from "./AssignmentBuilder.module.scss";
import NumberStepper from "../NumberStepper";
import { SecondaryButton } from "../SecondaryButton";

export interface AssignmentBuilderProps {
  initialData?: any;
  onSubmit: (assignmentData: {
    title: string;
    description: string;
    fileUrl: string;
    maxScore: number;
  }) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export default function AssignmentBuilder({
  initialData,
  onSubmit,
  onCancel,
  isSaving = false,
}: AssignmentBuilderProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || "");
  const [maxScore, setMaxScore] = useState(initialData?.maxScore || 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await onSubmit({ title, description, fileUrl, maxScore });
    } catch (error) {
      // handled by parent
    }
  };

  return (
    <div className={styles.createAssignmentView}>
      <div className={styles.formHeader}>
        <h3>Tạo file bài tập / tài liệu mới</h3>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="assignment-title">Tiêu đề bài tập</label>
          <input
            id="assignment-title"
            type="text"
            placeholder="Ví dụ: Bài tập ôn tập chương 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="assignment-desc">Mô tả / Hướng dẫn</label>
          <textarea
            id="assignment-desc"
            placeholder="Nhập hướng dẫn làm bài cho học sinh..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="assignment-file">Đường dẫn tài liệu (URL)</label>
            <input
              id="assignment-file"
              type="url"
              placeholder="Ví dụ: Link Google Drive, Link PDF..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Hãy dán link dẫn tới file tài liệu (nếu có).
            </span>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="assignment-score">Điểm tối đa</label>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <NumberStepper
                value={maxScore}
                onChange={(val) => setMaxScore(Number(val))}
                min={1}
                max={100}
                step={1}
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" className={styles.btnCancel} onClick={onCancel} disabled={isSaving}>
            Hủy bỏ
          </button>
          <SecondaryButton type="submit" className={styles.btnSave} disabled={isSaving || !title.trim()}>
            {isSaving ? "Đang lưu..." : "Lưu bài tập"}
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
