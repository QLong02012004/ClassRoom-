import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FilePdf,
  VideoCamera,
  FileDoc,
  Link as LinkIcon,
  MagnifyingGlass,
  DownloadSimple,
  Funnel,
  CalendarBlank,
  HardDrives,
  CaretDown
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../../components/ui/dropdown-menu";
import styles from "./StudentMaterials.module.scss";

// Mock Data
export const MOCK_MATERIALS = [
  {
    id: "m1",
    title: "Chuyên đề 1: Vectơ trong không gian",
    subject: "Toán học",
    className: "10A1",
    grade: "Khối 10",
    description: "Tài liệu lý thuyết và 50 bài tập trắc nghiệm về vectơ trong không gian. Có lời giải chi tiết ở cuối file.",
    type: "pdf",
    size: "2.4 MB",
    uploadedAt: "2023-10-15",
  },
  {
    id: "m2",
    title: "Video bài giảng: Phương trình đường tròn",
    subject: "Toán học",
    className: "10A1",
    grade: "Khối 10",
    description: "Record lại buổi học ngày 10/10/2023 về phương pháp lập phương trình đường tròn đi qua 3 điểm.",
    type: "video",
    size: "150 MB",
    uploadedAt: "2023-10-11",
  },
  {
    id: "m3",
    title: "Tài liệu ôn tập giữa kỳ 1",
    subject: "Vật Lý",
    className: "10A2",
    grade: "Khối 10",
    description: "Đề cương ôn tập chi tiết các dạng bài tập có khả năng ra thi cao nhất trong kỳ thi giữa kỳ 1 môn Vật Lý.",
    type: "doc",
    size: "1.1 MB",
    uploadedAt: "2023-10-20",
  },
  {
    id: "m4",
    title: "Danh sách 100 câu trắc nghiệm cực hay",
    subject: "Hóa học",
    className: "11B1",
    grade: "Khối 11",
    description: "Các câu hỏi phân loại học sinh khá giỏi được tổng hợp từ các đề thi thử của các trường chuyên.",
    type: "pdf",
    size: "3.5 MB",
    uploadedAt: "2023-10-25",
  },
  {
    id: "m5",
    title: "Website luyện tập vẽ đồ thị hàm số",
    subject: "Toán học",
    className: "Chung",
    grade: "Khối 10",
    description: "Công cụ trực quan giúp học sinh tự vẽ và kiểm tra đồ thị hàm số bậc 2, bậc 3.",
    type: "link",
    size: "Link",
    uploadedAt: "2023-10-22",
  },
];

export default function StudentMaterials() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");

  // Format cho tag hiển thị: Môn học - Khối (ẩn tên lớp cụ thể)
  const formatClassTag = (item: any) => `${item.subject} - ${item.grade}`;

  const uniqueGrades = Array.from(new Set(MOCK_MATERIALS.map(m => m.grade)));
  const uniqueSubjects = Array.from(new Set(MOCK_MATERIALS.map(m => m.subject)));

  const getIconAndColors = (type: string) => {
    switch (type) {
      case "pdf":
        return {
          icon: <FilePdf size={24} weight="duotone" />,
          bg: "rgba(244, 124, 32, 0.1)", // Primary (Orange) with opacity
          accent: "#f47c20"
        };
      case "video":
        return {
          icon: <VideoCamera size={24} weight="duotone" />,
          bg: "rgba(47, 143, 163, 0.1)", // Secondary (Blue) with opacity
          accent: "#2f8fa3"
        };
      case "doc":
        return {
          icon: <FileDoc size={24} weight="duotone" />,
          bg: "rgba(59, 130, 246, 0.1)", // Info (Blue) with opacity
          accent: "#3B82F6"
        };
      case "link":
        return {
          icon: <LinkIcon size={24} weight="duotone" />,
          bg: "rgba(169, 214, 229, 0.2)", // Accent (Light Blue)
          accent: "#2f8fa3"
        };
      default:
        return {
          icon: <FileDoc size={24} weight="duotone" />,
          bg: "#f1f5f9",
          accent: "#64748b"
        };
    }
  };

  const filteredMaterials = MOCK_MATERIALS.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchLower) ||
      item.subject.toLowerCase().includes(searchLower) ||
      item.grade.toLowerCase().includes(searchLower);
    const matchType = filterType === "all" || item.type === filterType;
    const matchSubject = filterSubject === "all" || item.subject === filterSubject;
    const matchGrade = filterGrade === "all" || item.grade === filterGrade;
    return matchSearch && matchType && matchSubject && matchGrade;
  });

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.pageHeader}>
        <div>
          <h2>Tài liệu học tập</h2>
          <p>Truy cập và tải xuống các tài liệu, bài giảng do giáo viên cung cấp</p>
        </div>
      </div>

      {/* TÌM KIẾM & BỘ LỌC */}
      <div className={`${styles.filtersRow} tour-step-material-filters`}>
        <div className={styles.searchBox}>
          <MagnifyingGlass size={20} weight="bold" color="#94a3b8" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, lớp học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className={styles.filterSelect}>
            {filterType === "all" ? "Tất cả định dạng" :
              filterType === "pdf" ? "Tài liệu PDF" :
                filterType === "doc" ? "Văn bản Word" :
                  filterType === "video" ? "Video bài giảng" : "Đường dẫn / Link"}
            <CaretDown size={14} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
              <DropdownMenuRadioItem value="all">Tất cả định dạng</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pdf">Tài liệu PDF</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="doc">Văn bản Word</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="video">Video bài giảng</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="link">Đường dẫn / Link</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={styles.filterSelect}>
            {filterSubject === "all" ? "Tất cả môn học" : filterSubject}
            <CaretDown size={14} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={filterSubject} onValueChange={setFilterSubject}>
              <DropdownMenuRadioItem value="all">Tất cả môn học</DropdownMenuRadioItem>
              {uniqueSubjects.map(sub => (
                <DropdownMenuRadioItem key={sub} value={sub}>{sub}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger className={styles.filterSelect}>
            {filterGrade === "all" ? "Tất cả khối lớp" : filterGrade}
            <CaretDown size={14} weight="bold" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup value={filterGrade} onValueChange={setFilterGrade}>
              <DropdownMenuRadioItem value="all">Tất cả khối lớp</DropdownMenuRadioItem>
              {uniqueGrades.map(gr => (
                <DropdownMenuRadioItem key={gr} value={gr}>{gr}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* DANH SÁCH TÀI LIỆU */}
      <div className={styles.materialsGrid}>
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(item => {
            const { icon, bg, accent } = getIconAndColors(item.type);

            return (
              <div
                key={item.id}
                className={`${styles.materialCard} tour-step-material-card`}
                style={{ '--card-bg': bg, '--card-accent': accent } as React.CSSProperties}
                onClick={() => navigate(`/materials/${item.id}`)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconBox}>
                    {icon}
                  </div>
                  <div className={styles.titleBox}>
                    <h3>{item.title}</h3>
                    <span className={styles.subjectTag}>{formatClassTag(item)}</span>
                  </div>
                </div>

                <p className={styles.cardDesc}>{item.description}</p>

                <div className={styles.cardFooter}>
                  <div className={styles.metaInfo}>
                    <span>
                      <CalendarBlank size={14} weight="bold" />
                      {item.uploadedAt}
                    </span>
                    <span>
                      <HardDrives size={14} weight="bold" />
                      {item.size}
                    </span>
                  </div>
                  <button className={styles.btnDownload} title={item.type === 'link' ? "Truy cập" : "Tải xuống"}>
                    {item.type === 'link' ? <LinkIcon size={18} weight="bold" /> : <DownloadSimple size={18} weight="bold" />}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Funnel size={32} weight="duotone" />
            </div>
            <h3>Không tìm thấy tài liệu</h3>
            <p>Không có tài liệu nào phù hợp với điều kiện tìm kiếm của bạn. Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
          </div>
        )}
      </div>
    </div>
  );
}
