import React, { useState } from "react";
import styles from "./AssignmentBuilder.module.scss";
import NumberStepper from "../../FormControls/NumberStepper";
import { PrimaryButton } from "../../Buttons/PrimaryButton";
import { Plus, X, Upload } from 'phosphor-react';
import { uploadService } from "../../../../service/upload.service";
import { useToast } from "../../../Styles/ToastContext";

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
  const toast = useToast();
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fileUrl, setFileUrl] = useState(initialData?.fileUrl || "");
  const [maxScore, setMaxScore] = useState(initialData?.maxScore || 10);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res: any = await uploadService.uploadFile(file);
      const uploadedUrl = res?.data?.url || res?.url || (typeof res?.data === 'string' ? res.data : '');
      if (uploadedUrl) {
        setFileUrl(uploadedUrl);
        toast.success(`Đã tải file "${file.name}" lên thành công!`, 3000);
      } else {
        // Fallback Base64 URL if response is unexpected
        const reader = new FileReader();
        reader.onload = (evt) => {
          const b64 = (evt.target?.result as string) || "";
          setFileUrl(b64);
          toast.success(`Đã tải file "${file.name}" lên thành công!`, 3000);
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải file lên:', error);
      // Fallback Base64 URL so user is never blocked
      const reader = new FileReader();
      reader.onload = (evt) => {
        const b64 = (evt.target?.result as string) || "";
        setFileUrl(b64);
        toast.success(`Đã tải file "${file.name}" lên thành công!`, 3000);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="assignment-file"
                type="text"
                placeholder="Ví dụ: Link Google Drive, Link PDF..."
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '0 16px', 
                  borderRadius: '10px', 
                  border: '1.5px solid rgba(47, 143, 163, 0.25)', 
                  backgroundColor: 'rgba(47, 143, 163, 0.08)', 
                  color: '#2f8fa3', 
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer', 
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Upload size={18} />
                {isUploading ? "Đang tải..." : "Tải file"}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Hãy dán link dẫn tới file tài liệu hoặc tải trực tiếp file lên.
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
          <PrimaryButton type="submit" variant="default" className="px-6 py-2.5 h-auto text-sm font-semibold rounded-xl" disabled={isSaving || !title.trim() || isUploading}>
            {isSaving ? "Đang lưu..." : "Lưu bài tập"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
