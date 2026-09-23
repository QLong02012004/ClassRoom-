import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FilePdf,
  VideoCamera,
  FileDoc,
  Link as LinkIcon,
  DownloadSimple,
  CalendarBlank,
  HardDrives,
  UserCircle,
  Eye,
  CheckCircle
} from "phosphor-react";
import { materialService } from "../../../service/material.service";
import { useToast } from "../../../components/Styles/ToastContext";
import styles from "./StudentMaterialDetail.module.scss";
import { PrimaryButton } from "../../../components/ui/Buttons/PrimaryButton";
import { BackButton } from "../../../components/ui/Buttons/BackButton";

export default function StudentMaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [material, setMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchMaterial = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Thử lấy chi tiết tài liệu theo ID
        try {
          const detailRes = (await materialService.getMaterialById(id)) as any;
          if (detailRes && detailRes.data) {
            setMaterial(detailRes.data);
            return;
          }
        } catch (e) {
          // Fallback tiếp tục lấy từ getPublicMaterials
        }

        // 2. Fallback tìm trong danh sách công khai
        const res = (await materialService.getPublicMaterials()) as any;
        if (res && res.data) {
          const found = res.data.find((m: any) => m._id === id);
          if (found) {
            setMaterial(found);
          }
        }
      } catch (error) {
        console.error("Failed to load material detail", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterial();
  }, [id]);

  const handleDownload = async () => {
    if (!material?._id) return;
    try {
      setIsDownloading(true);
      toast.info("Đang bắt đầu tải tài liệu về máy tính...");

      // 1. Tải qua API backend an toàn
      try {
        const res: any = await materialService.downloadMaterial(material._id);
        const ext = material.type === "doc" ? "docx" : material.type === "pdf" ? "pdf" : "dat";
        const mimeType =
          material.type === "pdf"
            ? "application/pdf"
            : material.type === "doc"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/octet-stream";

        const blob = new Blob([res], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanTitle = (material.title || "tai_lieu").replace(/[/\\?%*:|"<>]/g, "_");
        a.download = `${cleanTitle}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("Tải tệp tài liệu thành công! Nội dung nguyên vẹn.");
        return;
      } catch (apiErr) {
        console.warn("Backend download failed, falling back to direct URL:", apiErr);
      }

      // 2. Fallback: Mở direct fileUrl nếu có
      if (material.fileUrl) {
        const link = document.createElement("a");
        link.href = material.fileUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const ext = material.type === "doc" ? "docx" : material.type === "pdf" ? "pdf" : "dat";
        link.download = `${material.title || "tai_lieu"}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Đang mở tải tệp tài liệu!");
      } else {
        toast.error("Không tìm thấy đường dẫn tệp để tải về!");
      }
    } catch (err: any) {
      toast.error("Lỗi khi tải tài liệu: " + (err.message || "Lỗi không xác định"));
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Đang tải thông tin tài liệu...</h2>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h2>Không tìm thấy tài liệu học tập</h2>
          <BackButton onClick={() => navigate("/materials")}>Quay lại danh sách</BackButton>
        </div>
      </div>
    );
  }

  const renderPreview = () => {
    switch (material.type) {
      case "video":
        return material.fileUrl && material.fileUrl.startsWith("http") ? (
          <video controls src={material.fileUrl} className={styles.videoPlayer} />
        ) : (
          <div className={styles.videoPreview}>
            <div className={styles.playButton} onClick={handleDownload} title="Phát hoặc tải video">
              <VideoCamera size={48} weight="fill" color="white" />
            </div>
          </div>
        );
      case "pdf":
        return material.fileUrl && material.fileUrl.startsWith("http") ? (
          <iframe
            src={`${material.fileUrl}#toolbar=1`}
            className={styles.pdfIframe}
            title={material.title}
          />
        ) : (
          <div className={styles.docPreview}>
            <FilePdf size={80} weight="duotone" color="#f47c20" />
            <p>Tài liệu định dạng PDF: {material.title}</p>
            <PrimaryButton
              className={styles.previewBtnDownload}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <DownloadSimple size={16} weight="bold" />
              {isDownloading ? "Đang tải..." : `Tải xuống để xem (${material.size || "PDF"})`}
            </PrimaryButton>
          </div>
        );
      case "doc":
        return (
          <div className={styles.docPreview}>
            <FileDoc size={80} weight="duotone" color="#3B82F6" />
            <p>Tài liệu định dạng Word: {material.title}</p>
            <PrimaryButton
              className={styles.previewBtnDownload}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <DownloadSimple size={16} weight="bold" />
              {isDownloading ? "Đang tải..." : `Tải xuống để xem (${material.size || "Word"})`}
            </PrimaryButton>
          </div>
        );
      case "link":
        return (
          <div className={styles.linkPreview}>
            <LinkIcon size={80} weight="duotone" color="#2f8fa3" />
            <a
              href={material.fileUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.linkBtn}
            >
              Mở liên kết trong tab mới
            </a>
          </div>
        );
      default:
        return (
          <div className={styles.docPreview}>
            <FilePdf size={80} weight="duotone" color="#f47c20" />
            <p>{material.title}</p>
            <PrimaryButton
              className={styles.previewBtnDownload}
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <DownloadSimple size={16} weight="bold" />
              Tải tài liệu xuống
            </PrimaryButton>
          </div>
        );
    }
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <BackButton onClick={() => navigate("/materials")}>Quay lại danh sách tài liệu</BackButton>
      </div>

      <div className={styles.contentGrid}>
        {/* PREVIEW COLUMN */}
        <div className={styles.previewColumn}>{renderPreview()}</div>

        {/* INFO COLUMN */}
        <div className={styles.infoColumn}>
          <div className={styles.infoCard}>
            <span className={styles.subjectTag}>
              {material.subject || "TOÁN HỌC"} {material.grade ? `• ${material.grade}` : ""}
            </span>
            <h1 className={styles.title}>{material.title}</h1>

            <p className={styles.description}>
              {material.description || "Tài liệu học tập tham khảo chất lượng cao dành cho học sinh."}
            </p>

            <div className={styles.metaList}>
              <div className={styles.metaItem}>
                <UserCircle size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Người đăng</span>
                  <span className={styles.metaValue}>Giáo viên bộ môn</span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <CalendarBlank size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Ngày đăng</span>
                  <span className={styles.metaValue}>
                    {new Date(material.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>
              <div className={styles.metaItem}>
                <HardDrives size={20} weight="duotone" />
                <div className={styles.metaText}>
                  <span className={styles.metaLabel}>Dung lượng tệp</span>
                  <span className={styles.metaValue}>{material.size || "2.5 MB"}</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              {material.type === "link" ? (
                <PrimaryButton
                  className={styles.mainActionBtn}
                  onClick={() => window.open(material.fileUrl, "_blank")}
                >
                  <LinkIcon size={20} weight="bold" /> Truy cập liên kết
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  className={styles.mainActionBtn}
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <DownloadSimple size={20} weight="bold" />
                  {isDownloading ? "Đang tải xuống..." : "Tải tài liệu xuống"}
                </PrimaryButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
