import React, { useState, useEffect } from "react";
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
  CaretDown,
  BookOpen
} from "phosphor-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../../components/ui/dropdown-menu";
import { bankService } from "../../../service/bank.service";
import styles from "./StudentMaterials.module.scss";

export default function StudentMaterials() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = (await bankService.getMyBankItems()) as any;
        if (res && res.data) {
          setMaterials(res.data);
        }
      } catch (error) {
        console.error("Failed to load materials", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  // Format cho tag hiển thị: Môn học
  const formatClassTag = (item: any) => `${item.subject || 'Chung'}`;

  const uniqueSubjects = Array.from(new Set(materials.map(m => m.subject).filter(Boolean)));

  const getIconAndColors = (type: string) => {
    switch (type) {
      case "quiz":
        return {
          icon: <HardDrives size={24} weight="duotone" />,
          bg: "rgba(244, 124, 32, 0.1)", // Primary (Orange)
          accent: "#f47c20"
        };
      case "document":
        return {
          icon: <FileDoc size={24} weight="duotone" />,
          bg: "rgba(59, 130, 246, 0.1)", // Info (Blue)
          accent: "#3B82F6"
        };
      default:
        return {
          icon: <FileDoc size={24} weight="duotone" />,
          bg: "#f1f5f9",
          accent: "#64748b"
        };
    }
  };

  const filteredMaterials = materials.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = item.title.toLowerCase().includes(searchLower) ||
      (item.subject && item.subject.toLowerCase().includes(searchLower));
    const matchType = filterType === "all" || item.type === filterType;
    const matchSubject = filterSubject === "all" || item.subject === filterSubject;
    return matchSearch && matchType && matchSubject;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Kho Tài Liệu Chung</h2>
          <p>Truy cập ngân hàng đề thi và tài liệu được chia sẻ từ nhà trường</p>
        </div>
      </div>

      <div className={styles.filtersRow}>
        <div className={styles.searchBox}>
          <MagnifyingGlass size={20} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu, đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.filterSelect}>
              <Funnel size={16} className="text-slate-500" />
              <span>{filterType === "all" ? "Tất cả định dạng" : filterType === "quiz" ? "Trắc nghiệm" : "Tài liệu"}</span>
              <CaretDown size={14} className="text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 min-w-[160px]">
            <DropdownMenuRadioGroup value={filterType} onValueChange={setFilterType}>
              <DropdownMenuRadioItem value="all" className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">Tất cả định dạng</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="quiz" className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">Trắc nghiệm</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="document" className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">Tài liệu</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={styles.filterSelect}>
              <BookOpen size={16} className="text-slate-500" />
              <span>{filterSubject === "all" ? "Tất cả môn học" : filterSubject}</span>
              <CaretDown size={14} className="text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 min-w-[160px]">
            <DropdownMenuRadioGroup value={filterSubject} onValueChange={setFilterSubject}>
              <DropdownMenuRadioItem value="all" className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">Tất cả môn học</DropdownMenuRadioItem>
              {uniqueSubjects.map((sub: any) => (
                <DropdownMenuRadioItem key={sub} value={sub} className="px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer text-sm font-medium">{sub}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* DANH SÁCH TÀI LIỆU */}
      <div className={styles.materialsGrid}>
        {loading ? (
          <div className="col-span-full text-center py-10 text-slate-500">Đang tải tài liệu...</div>
        ) : filteredMaterials.length > 0 ? (
          filteredMaterials.map(item => {
            const { icon, bg, accent } = getIconAndColors(item.type);

            return (
              <div
                key={item._id}
                className={`${styles.materialCard} tour-step-material-card`}
                style={{ '--card-bg': bg, '--card-accent': accent } as React.CSSProperties}
                onClick={() => {
                  if (item.type === 'document' && item.fileUrl) {
                    window.open(item.fileUrl, '_blank');
                  } else if (item.type === 'quiz') {
                    // Navigate to a practice route or just show a message since we don't have a direct bank practice route yet
                    console.log("Tính năng luyện tập ngân hàng đề đang được phát triển!");
                  }
                }}
              >
                <div className={styles.cardTop}>
                  <div className={styles.iconBox}>
                    {icon}
                  </div>
                  <div className={styles.titleBox}>
                    <h3 className="line-clamp-2">{item.title}</h3>
                    <span className={styles.subjectTag}>{formatClassTag(item)}</span>
                  </div>
                </div>

                <p className={styles.cardDesc}>{item.description}</p>

                <div className={styles.cardFooter}>
                  <div className={styles.metaInfo}>
                    <span>
                      <CalendarBlank size={14} weight="bold" />
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span>
                      <HardDrives size={14} weight="bold" />
                      {item.type === 'quiz' ? `${item.maxScore} điểm` : "Tài liệu"}
                    </span>
                  </div>
                  <button className={styles.btnDownload} title={item.type === 'document' ? "Tải xuống" : "Luyện tập"}>
                    {item.type === 'document' ? <DownloadSimple size={18} weight="bold" /> : <BookOpen size={18} weight="bold" />}
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
