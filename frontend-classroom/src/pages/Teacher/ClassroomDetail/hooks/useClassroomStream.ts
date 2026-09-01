import { useState, useRef } from "react";
import { announcementService, type IAnnouncement } from "@/service/announcement.service";
import { uploadService } from "@/service/upload.service";
import { useToast } from "@/components/Styles/ToastContext";

interface UseClassroomStreamProps {
  classId?: string;
  setAnnouncements: React.Dispatch<React.SetStateAction<IAnnouncement[]>>;
  loadData: () => void;
}

export function useClassroomStream({
  classId,
  setAnnouncements,
  loadData,
}: UseClassroomStreamProps) {
  const toast = useToast();

  const [postText, setPostText] = useState("");
  const [postType, setPostType] = useState<"announcement" | "reminder" | "material">("announcement");
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; url: string }[]>([]);
  const [attachedLink, setAttachedLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Edit State
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingFiles, setEditingFiles] = useState<{ name: string; size: string; url: string }[]>([]);

  // Delete State
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Comments State
  const [commentInputs, setCommentInputs] = useState<{ [annId: string]: string }>({});
  const [replyToMap, setReplyToMap] = useState<{ [annId: string]: string }>({});
  const [sendingComment, setSendingComment] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  // Xử lý chọn file từ máy tính
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileList = Array.from(files);

    const filePromises = fileList.map(async (file) => {
      const formattedSize =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

      try {
        const res: any = await uploadService.uploadFile(file);
        const serverUrl = res?.data?.url || res?.url || (typeof res?.data === "string" ? res.data : "");
        if (serverUrl) {
          return { name: file.name, size: formattedSize, url: serverUrl };
        }
      } catch (err) {
        console.warn("Upload file to server failed, fallback Base64:", err);
      }

      return new Promise<{ name: string; size: string; url: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            size: formattedSize,
            url: (event.target?.result as string) || "",
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newFiles = await Promise.all(filePromises);
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Đăng bài mới
  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classId) return;
    if (!postText.trim() && !attachedLink.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo hoặc chèn link!");
      return;
    }

    setIsPosting(true);
    try {
      let finalContent = postText.trim();
      if (attachedLink.trim()) {
        finalContent = finalContent ? `${finalContent}\n\n${attachedLink.trim()}` : attachedLink.trim();
      }

      await announcementService.createAnnouncement({
        classId,
        content: finalContent,
        type: postType,
        attachments: attachedFiles.map((f) => ({ name: f.name, url: f.url, size: f.size })),
      });
      toast.success("Đăng bài thông báo thành công!");
      setPostText("");
      setAttachedLink("");
      setShowLinkInput(false);
      setPostType("announcement");
      setAttachedFiles([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đăng bài!");
    } finally {
      setIsPosting(false);
    }
  };

  // Lưu chỉnh sửa bài đăng
  const handleSaveEditAnnouncement = async (annId: string) => {
    try {
      const res = await announcementService.updateAnnouncement(annId, {
        content: editingContent,
        attachments: editingFiles,
      });
      if (res && res.data) {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? (res.data as any) : ann))
        );
        toast.success("Cập nhật bài đăng thành công!");
        setEditingAnnId(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi cập nhật bài đăng!");
    }
  };

  // Xóa bài đăng
  const handleDeletePostClick = (annId: string) => {
    setPostToDelete(annId);
    setIsDeletePostDialogOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      await announcementService.deleteAnnouncement(postToDelete);
      setAnnouncements((prev) => prev.filter((ann) => ann._id !== postToDelete));
      toast.success("Đã xóa thông báo!");
      setIsDeletePostDialogOpen(false);
      setPostToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa thông báo. Bạn có phải tác giả không?");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Ghim bài đăng
  const handleTogglePin = async (annId: string) => {
    try {
      const res = await announcementService.togglePin(annId);
      if (res && res.data) {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? (res.data as IAnnouncement) : ann))
        );
        toast.success(res.data.isPinned ? "Đã ghim thông báo!" : "Đã bỏ ghim thông báo!");
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi ghim thông báo!");
    }
  };

  // Thích bài đăng
  const handleLikeAnnouncement = async (annId: string) => {
    try {
      const res = await announcementService.likeAnnouncement(annId);
      if (res && res.data) {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? (res.data as IAnnouncement) : ann))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích thông báo!");
    }
  };

  // Thích bình luận
  const handleLikeComment = async (annId: string, commentId: string) => {
    try {
      const res = await announcementService.likeComment(annId, commentId);
      if (res && res.data) {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? (res.data as IAnnouncement) : ann))
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi thích bình luận!");
    }
  };

  // Đăng bình luận
  const handleAddComment = async (annId: string, contentFromComponent?: string) => {
    let commentContent = (contentFromComponent || commentInputs[annId] || "").trim();
    if (!commentContent) return;

    const parentId = replyToMap[annId];
    if (parentId && commentContent.startsWith("@")) {
      commentContent = `<!--replyTo:${parentId}-->${commentContent}`;
    }

    setSendingComment(annId);
    try {
      const res = await announcementService.addComment(annId, commentContent);
      if (res && res.data) {
        const comments = res.data.comments;
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? { ...ann, comments } : ann))
        );
        setCommentInputs((prev) => ({ ...prev, [annId]: "" }));
        setReplyToMap((prev) => ({ ...prev, [annId]: "" }));
        toast.success("Đã gửi bình luận!");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể đăng bình luận!");
    } finally {
      setSendingComment(null);
    }
  };

  // Xóa bình luận
  const handleDeleteComment = async (annId: string, commentId: string) => {
    try {
      const res = await announcementService.deleteComment(annId, commentId);
      if (res && res.data) {
        setAnnouncements((prev) =>
          prev.map((ann) => (ann._id === annId ? (res.data as IAnnouncement) : ann))
        );
        toast.success("Đã xóa bình luận thành công!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Không thể xóa bình luận này!");
    }
  };

  return {
    postText,
    setPostText,
    postType,
    setPostType,
    attachedFiles,
    setAttachedFiles,
    attachedLink,
    setAttachedLink,
    showLinkInput,
    setShowLinkInput,
    isPosting,
    editingAnnId,
    setEditingAnnId,
    editingContent,
    setEditingContent,
    editingFiles,
    setEditingFiles,
    postToDelete,
    isDeletePostDialogOpen,
    setIsDeletePostDialogOpen,
    isDeletingPost,
    commentInputs,
    setCommentInputs,
    replyToMap,
    setReplyToMap,
    sendingComment,
    fileInputRef,
    composerRef,
    handleFileChange,
    handleCreatePost,
    handleSaveEditAnnouncement,
    handleDeletePostClick,
    confirmDeletePost,
    handleTogglePin,
    handleLikeAnnouncement,
    handleLikeComment,
    handleAddComment,
    handleDeleteComment,
  };
}
