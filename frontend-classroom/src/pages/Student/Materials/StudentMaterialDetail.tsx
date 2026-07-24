import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FilePdf,
  VideoCamera,
  FileDoc,
  Link as LinkIcon,
  DownloadSimple,
  CalendarBlank,
  HardDrives,
  UserCircle
} from "phosphor-react";
import { materialService } from "../../../service/material.service";
import styles from "./StudentMaterialDetail.module.scss";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton";

export default function StudentMaterialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<any>(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const res = (await materialService.getPublicMaterials()) as any;
        if (res && res.data) {
          const found = res.data.find((m: any) => m._id === id);
          if (found) {
            setMaterial(found);
          }
        }
      } catch (error) {
        console.error("Failed to load material detail", error);
      }
    };
    fetchMaterial();
  }, [id]);

  if (!material) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Đang tải hoặc Không tìm thấy tài liệu</h2>
          <BackButton onClick={() => navigate('/materials')} />
        </div>
      </div>
    );
  }

  const renderPreview = () => {
    switch (material.type) {
      case "video":
        return (
          <div className={styles.videoPreview}>
            <div className={styles.playButton}>
              <VideoCamera size={48} weight="fill" color="white" />
            </div>
          </div>
        );
      case "pdf":
      case "doc":
        return (
          <div className={styles.docPreview}>
            {material.type === "pdf" ? <FilePdf size={80} weight="duotone" color="#f47c20" /> : <FileDoc size={80} weight="duotone" color="#3B82F6" />}
            <p>Bản xem trước không khả dụng cho tài liệu này.</p>
            <PrimaryButton className={styles.previewBtnDownload}>
              Tải xuống để xem ({material.size})
            </PrimaryButton>
          </div>
        );
      case "link":
        return (
          <div className={styles.linkPreview}>
            <LinkIcon size={80} weight="duotone" color="#2f8fa3" />
            <a href={material.fileUrl} target="_blank" rel="noreferrer" className={styles.linkBtn}>Mở liên kết trong tab mới</a>
          </div>
        );
      default:
        return <div className={styles.docPreview}><p>Không có bản xem trước.</p></div>;
    }
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <BackButton onClick={() => navigate('/materials')} />
      </div>

      <div className={styles.contentGrid}>
        {/* PREVIEW COLUMN */}
        <div className={styles.previewColumn}>
          {renderPreview()}
        </div>

        {/* INFO COLUMN */}
        <div className={styles.infoColumn}>
          <div className={styles.infoCard}>
            <span className={styles.subjectTag}>
              {material.subject} - {material.grade}
            </span>
            <h1 className={styles.title}>{material.title}</h1>

            <p className={styles.description}>{material.description}</p>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <UserCircle size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Người tải lên</span>
                  <span className={styles.metaValue}>Giáo viên A</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <CalendarBlank size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Ngày đăng</span>
                  <span className={styles.metaValue}>{new Date(material.createdAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <HardDrives size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Dung lượng</span>
                  <span className={styles.metaValue}>{material.size || "Link"}</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <PrimaryButton className={styles.mainActionBtn}>
                {material.type === "link" ? (
                  <>
                    <LinkIcon size={20} weight="bold" /> Truy cập liên kết
                  </>
                ) : (
                  <>
                    <DownloadSimple size={20} weight="bold" /> Tải tài liệu xuống
                  </>
                )}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
