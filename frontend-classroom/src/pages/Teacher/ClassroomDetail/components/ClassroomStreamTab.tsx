/**
 * @file ClassroomStreamTab.tsx
 * @description Component Tab Bảng tin Lớp học (Classroom Stream / Overview Feed Tab)
 * - Dùng để hiển thị luồng thông báo và hoạt động chính (Feed) của lớp học cho Giáo viên & Học sinh.
 * - Sidebar trái: Hiển thị thông tin lớp học (Giáo viên, môn học, mã gia nhập, sĩ số) và chỉ số tiến độ trung bình (GPA, tỷ lệ hoàn thành).
 * - Khung soạn thông báo (Post Composer): Giáo viên nhập nội dung, đính kèm file tài liệu và đăng thông báo mới.
 * - Danh sách thông báo (Posts Feed): Hiển thị bài đăng ghim lên đầu, đính kèm file và hệ thống bình luận trao đổi lồng nhau (AnnouncementComments).
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  User,
  BookOpen,
  Key,
  Check,
  Copy,
  Users,
  TrendUp,
  FilePdf,
  X,
  PushPin,
  Megaphone,
  DotsThree,
  PencilSimple,
  Trash,
  Paperclip,
} from "phosphor-react";
import AnimatedCounter from "@/components/ui/Counters/AnimatedCounter";
import FolderUpload from "@/components/ui/Uploads/FolderUpload/FolderUpload";
import AnimatedAddButton from "@/components/ui/Buttons/AnimatedAddButton";
import AnnouncementComments from "@/components/Classroom/AnnouncementComments";
import { handleDownloadOrOpenFile } from "@/utils/downloadHelper";
import { formatFileUrl, getFileExt, formatFileSize, formatCleanFileName } from "../utils/classroomUtils";
import styles from "../TeacherClassroomDetail.module.scss";

interface ClassroomStreamTabProps {
  stream?: any;
  classroomData?: any;
  classroom?: any;
  classId?: string;
  userRole?: string;
  user?: any;
  userAvatar?: string;
  postText?: string;
  setPostText?: (text: string) => void;
  attachedFiles?: any[];
  setAttachedFiles?: React.Dispatch<React.SetStateAction<any[]>>;
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
  handleFileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateAnnouncement?: (e?: any) => void;
  isSubmittingPost?: boolean;
  announcements?: any[];
  copiedCode?: boolean;
  handleCopyCode?: () => void;
  editingAnnId?: string | null;
  setEditingAnnId?: (id: string | null) => void;
  editingContent?: string;
  setEditingContent?: (content: string) => void;
  editingFiles?: any[];
  setEditingFiles?: React.Dispatch<React.SetStateAction<any[]>>;
  handleSaveEditAnnouncement?: (annId: string) => void;
  handlePinAnnouncement?: (annId: string, currentPin?: boolean) => void;
  handleDeleteAnnouncement?: (annId: string) => void;
  handleAddComment?: (annId: string, content?: string) => Promise<void> | void;
  handleLikeComment?: (annId: string, commentId: string) => Promise<void> | void;
  handleDeleteComment?: (annId: string, commentId: string) => Promise<void> | void;
}

export default function ClassroomStreamTab(props: ClassroomStreamTabProps) {
  const { stream, classroomData } = props;

  const classroom = props.classroom ?? classroomData?.classroom;
  const classId = props.classId;
  const userRole = props.userRole;
  const user = props.user;
  const userAvatar = props.userAvatar;
  const postText = props.postText ?? stream?.postText ?? "";
  const setPostText = props.setPostText ?? stream?.setPostText;
  const attachedFiles = props.attachedFiles ?? stream?.attachedFiles ?? [];
  const setAttachedFiles = props.setAttachedFiles ?? stream?.setAttachedFiles;
  const composerRef = props.composerRef ?? stream?.composerRef;
  const handleFileChange = props.handleFileChange ?? stream?.handleFileChange;
  const handleCreateAnnouncement = props.handleCreateAnnouncement ?? stream?.handleCreatePost;
  const isSubmittingPost = props.isSubmittingPost ?? stream?.isPosting ?? false;
  const announcements = props.announcements ?? classroomData?.announcements ?? [];
  const copiedCode = props.copiedCode ?? classroomData?.copiedCode ?? false;
  const handleCopyCode = props.handleCopyCode ?? classroomData?.handleCopyCode;
  const editingAnnId = props.editingAnnId ?? stream?.editingAnnId ?? null;
  const setEditingAnnId = props.setEditingAnnId ?? stream?.setEditingAnnId;
  const editingContent = props.editingContent ?? stream?.editingContent ?? "";
  const setEditingContent = props.setEditingContent ?? stream?.setEditingContent;
  const editingFiles = props.editingFiles ?? stream?.editingFiles ?? [];
  const setEditingFiles = props.setEditingFiles ?? stream?.setEditingFiles;
  const handleSaveEditAnnouncement = props.handleSaveEditAnnouncement ?? stream?.handleSaveEditAnnouncement;
  const handlePinAnnouncement = props.handlePinAnnouncement ?? stream?.handleTogglePin;
  const handleDeleteAnnouncement = props.handleDeleteAnnouncement ?? stream?.handleDeletePostClick;
  const handleAddComment = props.handleAddComment ?? stream?.handleAddComment;
  const handleLikeComment = props.handleLikeComment ?? stream?.handleLikeComment;
  const handleDeleteComment = props.handleDeleteComment ?? stream?.handleDeleteComment;
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  return (
    <div className={styles.feedLayout}>
      {/* THÔNG BÁO LỚP ĐÓNG */}
      {classroom?.status === "Closed" && (
        <div className="col-span-full mb-4 w-full bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4 shadow-sm items-start">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-full shrink-0">
            <Archive size={20} weight="fill" />
          </div>
          <div>
            <h4 className="text-amber-800 font-bold text-sm mb-1">Lớp học đang bị đóng</h4>
            <p className="text-amber-700/90 text-[13px] leading-relaxed">
              Lớp học này đã bị đóng. Học sinh chỉ có thể xem lại dữ liệu cũ, không thể nộp bài mới hay bình luận.
            </p>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR: CLASS INFO & PROGRESS */}
      <div className={styles.classSidebar}>
        <div className={styles.classInfoCard}>
          {/* TÊN LỚP HỌC */}
          <div className="flex flex-col border-b border-slate-100 pb-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lớp học</span>
            <h2 className="text-base font-black text-[#f47c20] m-0 tracking-tight leading-snug">
              {classroom?.className || "Lớp học"}
            </h2>
          </div>

          <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Thông tin chi tiết</h4>

          {/* 4 MỤC THÔNG TIN */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* GIÁO VIÊN */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs min-w-0 transition-all hover:bg-[#2f8fa3]/15 hover:border-[#2f8fa3]/50">
              <div className="w-7 h-7 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                <User size={15} weight="bold" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider truncate">Giáo viên</span>
                <span className="text-xs font-black text-[#0F172A] truncate capitalize" title={classroom?.teacherName || user?.name || "—"}>
                  {classroom?.teacherName || user?.name || "—"}
                </span>
              </div>
            </div>

            {/* MÔN HỌC */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f47c20]/10 border border-[#f47c20]/30 shadow-2xs min-w-0 transition-all hover:bg-[#f47c20]/15 hover:border-[#f47c20]/50">
              <div className="w-7 h-7 rounded-lg bg-[#f47c20]/20 text-[#f47c20] flex items-center justify-center shrink-0 font-bold">
                <BookOpen size={15} weight="bold" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-[#f47c20] font-bold uppercase tracking-wider truncate">Môn học</span>
                <span className="text-xs font-black text-[#0F172A] truncate">{classroom?.subject || "Môn học chung"}</span>
              </div>
            </div>

            {/* MÃ GIA NHẬP */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/35 shadow-2xs min-w-0 transition-all hover:bg-[#F59E0B]/15">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/20 text-[#d97706] flex items-center justify-center shrink-0 font-bold">
                  <Key size={15} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#b45309] font-bold uppercase tracking-wider truncate">Mã gia nhập</span>
                  <span className="text-xs font-black font-mono text-[#78350f] tracking-wider truncate">{classroom?.code || "—"}</span>
                </div>
              </div>
              {classroom?.code && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 text-[#b45309] hover:bg-[#F59E0B]/25 rounded-md transition-colors cursor-pointer border-none shrink-0"
                  title="Sao chép mã lớp"
                >
                  {copiedCode ? <Check size={14} weight="bold" className="text-emerald-600" /> : <Copy size={14} weight="bold" />}
                </button>
              )}
            </div>

            {/* SĨ SỐ LỚP */}
            <div
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#2f8fa3]/10 border border-[#2f8fa3]/30 shadow-2xs hover:bg-[#2f8fa3]/15 hover:border-[#2f8fa3]/50 transition-all cursor-pointer min-w-0"
              onClick={() => navigate(`/classrooms/${classId}/students`)}
              title="Quản lý danh sách học sinh"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#2f8fa3]/20 text-[#2f8fa3] flex items-center justify-center shrink-0 font-bold">
                  <Users size={15} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-[#2f8fa3] font-bold uppercase tracking-wider truncate">Sĩ số lớp</span>
                  <span className="text-xs font-black text-[#0F172A] truncate">{classroom?.studentCount || 0} học sinh</span>
                </div>
              </div>
              <span className="text-[11px] text-[#2f8fa3] font-bold shrink-0">&rarr;</span>
            </div>
          </div>
        </div>

        {/* CARD 2: TIẾN ĐỘ TRUNG BÌNH */}
        <div className={styles.reportCardMini}>
          <div className={styles.reportHeader}>
            <div className={styles.headerIcon}>
              <TrendUp size={18} weight="bold" className="text-[#2f8fa3]" />
            </div>
            <h3>Tiến độ trung bình</h3>
          </div>
          <div className={styles.reportMetricsMini}>
            <div className={styles.statMetricMini}>
              <span className={styles.statNumMini}>
                <AnimatedCounter end={92} suffix="%" />
              </span>
              <span className={styles.statDescMini}>Hoàn thành</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statMetricMini}>
              <span className={styles.statNumMini}>
                <AnimatedCounter end={8.4} decimals={1} />
              </span>
              <span className={styles.statDescMini}>GPA</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statMetricMini}>
              <span className={styles.statNumMini}>
                <AnimatedCounter end={96} suffix="%" />
              </span>
              <span className={styles.statDescMini}>Chuyên cần</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN FEED */}
      <div className={styles.feedMain}>
        {/* POST COMPOSER */}
        {userRole === "TEACHER" && (
          <div className={styles.postComposer}>
            <div className={styles.composerTop}>
              <img src={userAvatar} alt="Avatar" className={styles.avatarMini} />
              <textarea
                ref={composerRef}
                placeholder="Bạn muốn thông báo gì cho cả lớp hôm nay?"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
            </div>

            <div style={{ padding: "0 16px" }}>
              <FolderUpload
                label="Không có tệp nào được chọn"
                onFileSelect={(files) => handleFileChange({ target: { files } } as any)}
                value={attachedFiles.length > 0 ? attachedFiles.map((f) => f.name).join(", ") : ""}
              />
            </div>

            {/* Tệp đính kèm đã chọn */}
            {attachedFiles.length > 0 && (
              <div className={styles.composerAttachments}>
                {attachedFiles.map((file, index) => (
                  <div key={index} className={styles.attachedFileItem}>
                    <FilePdf size={16} weight="fill" color="#EF4444" />
                    <span>
                      {file.name} <em>({file.size})</em>
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachedFiles(attachedFiles.filter((_, i) => i !== index))}
                      className={styles.removeAttachBtn}
                    >
                      <X size={13} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <AnimatedAddButton onClick={handleCreateAnnouncement} disabled={isSubmittingPost || !postText.trim()}>
                {isSubmittingPost ? "Đang đăng..." : "Đăng thông báo"}
              </AnimatedAddButton>
            </div>
          </div>
        )}

        {/* FEED POSTS LIST */}
        <div className={styles.postsList}>
          {announcements.map((ann) => {
            const authorName = (ann.teacherId as any)?.name || (ann.author as any)?.name || "Giáo viên";
            const authorAvatar =
              (ann.teacherId as any)?.avatar ||
              (ann.author as any)?.avatar ||
              "https://ui-avatars.com/api/?name=" + encodeURIComponent(authorName) + "&background=f47c20&color=fff";
            const isEditing = editingAnnId === ann._id;

            return (
              <div key={ann._id} className={`${styles.postCard} ${ann.isPinned ? styles.pinnedPost : ""}`}>
                {ann.isPinned && (
                  <div className={styles.pinBadge}>
                    <PushPin size={12} weight="fill" />
                    <span>Đã ghim lên đầu bảng tin</span>
                  </div>
                )}

                <div className={styles.postHeader}>
                  <img src={authorAvatar} alt="Avatar" className={styles.postAvatar} />
                  <div className={styles.postMeta}>
                    <div className={styles.authorRow}>
                      <h4>{authorName}</h4>
                      <span className={styles.roleTag}>Giáo viên</span>
                    </div>
                    <span className={styles.postTime}>
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                    </span>
                  </div>

                  {userRole === "TEACHER" && (
                    <div className={styles.postMenu}>
                      <button
                        type="button"
                        className={styles.menuBtn}
                        onClick={() => setActiveMenuId(activeMenuId === ann._id ? null : ann._id)}
                        title="Tùy chọn bài đăng"
                      >
                        <DotsThree size={20} weight="bold" />
                      </button>
                      {activeMenuId === ann._id && (
                        <div className={styles.dropdownMenu}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingAnnId(ann._id);
                              setEditingContent(ann.content);
                              setEditingFiles(ann.attachments || []);
                            }}
                          >
                            <PencilSimple size={16} /> Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handlePinAnnouncement(ann._id, ann.isPinned);
                            }}
                          >
                            <PushPin size={16} /> {ann.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                          </button>
                          <button
                            type="button"
                            className={styles.deleteOption}
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDeleteAnnouncement(ann._id);
                            }}
                          >
                            <Trash size={16} /> Xóa bài đăng
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.postContent}>
                  {isEditing ? (
                    <div className="flex flex-col gap-3 mt-2">
                      <textarea
                        rows={3}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full p-3 border border-orange-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingAnnId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEditAnnouncement(ann._id)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-[#f47c20] hover:bg-[#e0650d] rounded-lg"
                        >
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p>{ann.content}</p>
                  )}

                  {/* Attachments Card */}
                  {ann.attachments && ann.attachments.length > 0 && (
                    <div className={styles.postAttachments}>
                      {ann.attachments.map((file: any, idx: number) => {
                        const cleanName = formatCleanFileName(file.name, file.url);
                        const fileUrl = formatFileUrl(file.url);
                        const ext = getFileExt(cleanName);

                        return (
                          <div key={idx} className={styles.attachCard}>
                            <div className={styles.fileIcon}>
                              {ext === "pdf" ? (
                                <FilePdf size={24} weight="fill" color="#EF4444" />
                              ) : (
                                <Paperclip size={24} weight="bold" color="#f47c20" />
                              )}
                            </div>
                            <div className={styles.fileDetails}>
                              <span className={styles.fileName}>{cleanName}</span>
                              <span className={styles.fileSize}>Tài liệu đính kèm</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownloadOrOpenFile(fileUrl, cleanName)}
                              className={styles.downloadBtn}
                              title="Tải về máy hoặc mở file"
                            >
                              Tải / Mở file
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* COMMENTS SECTION */}
                <AnnouncementComments
                  announcementId={ann._id}
                  comments={ann.comments || []}
                  user={user}
                  classroomStatus={classroom?.status}
                  onAddComment={handleAddComment}
                  onLikeComment={handleLikeComment}
                  onDeleteComment={handleDeleteComment}
                />
              </div>
            );
          })}

          {announcements.length === 0 && (
            <div className={styles.emptyFeed}>
              <Megaphone size={40} color="#cbd5e1" weight="duotone" />
              <p>Chưa có thông báo nào trong lớp học này</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
