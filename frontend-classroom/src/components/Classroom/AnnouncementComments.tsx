import React, { useState } from 'react';
import styles from './AnnouncementComments.module.scss';
import AnimatedSendButton from '../ui/Buttons/AnimatedSendButton';

export interface CommentType {
  _id?: string;
  authorId?: any;
  authorName: string;
  authorRole?: string;
  avatar?: string;
  content: string;
  createdAt: string | Date;
  likes?: string[];
}

interface AnnouncementCommentsProps {
  announcementId: string;
  comments?: any[];
  user: {
    id?: string;
    _id?: string;
    name?: string;
    role?: string;
    avatar?: string;
  } | null;
  classroomStatus?: string;
  onAddComment: (announcementId: string, content: string) => Promise<void> | void;
  onLikeComment: (announcementId: string, commentId: string) => Promise<void> | void;
  onDeleteComment: (announcementId: string, commentId: string) => Promise<void> | void;
}

const formatTime = (dateStr: string | Date): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Vừa xong';
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

export const AnnouncementComments: React.FC<AnnouncementCommentsProps> = ({
  announcementId,
  comments = [],
  user,
  classroomStatus,
  onAddComment,
  onLikeComment,
  onDeleteComment
}) => {
  const [commentInput, setCommentInput] = useState('');
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [showAllComments, setShowAllComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUserId = user?.id || user?._id;
  const currentUserRole = user?.role?.toUpperCase() || localStorage.getItem('userRole')?.toUpperCase() || '';
  const userAvatar = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;

  // 1. Thread Grouping Logic
  const groupedComments: { parent: CommentType; replies: CommentType[] }[] = [];

  (comments || []).forEach(c => {
    const contentStr = (c.content || '').trim();
    const matchReplyTo = contentStr.match(/<!--replyTo:(.*?)-->/);

    if (matchReplyTo) {
      const targetId = matchReplyTo[1];
      const targetGroup = groupedComments.find(g => String(g.parent._id) === String(targetId));
      if (targetGroup) {
        targetGroup.replies.push(c);
        return;
      }
    }

    if (contentStr.startsWith('@') && groupedComments.length > 0) {
      let matchedGroup = undefined;
      const lowerContent = contentStr.toLowerCase();

      for (let i = groupedComments.length - 1; i >= 0; i--) {
        const group = groupedComments[i];
        const pAuthor = (group.parent.authorName || '').toLowerCase().trim();

        if (pAuthor && lowerContent.startsWith(`@${pAuthor}`)) {
          matchedGroup = group;
          break;
        }

        const hasReplyMatch = group.replies.some(r => {
          const rAuthor = (r.authorName || '').toLowerCase().trim();
          return rAuthor && lowerContent.startsWith(`@${rAuthor}`);
        });

        if (hasReplyMatch) {
          matchedGroup = group;
          break;
        }
      }

      if (matchedGroup) {
        matchedGroup.replies.push(c);
      } else {
        groupedComments[groupedComments.length - 1].replies.push(c);
      }
    } else {
      groupedComments.push({ parent: c, replies: [] });
    }
  });

  const visibleGroups = showAllComments ? groupedComments : groupedComments.slice(0, 2);

  const handleSend = async () => {
    if (!commentInput.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onAddComment(announcementId, commentInput);
      setCommentInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFormattedContent = (contentStr: string) => {
    const clean = (contentStr || '').replace(/<!--replyTo:.*?-->/g, '');
    if (!clean.startsWith('@')) return clean;

    let matchedAuthorName = '';
    const lowerClean = clean.toLowerCase();

    for (const c of comments || []) {
      if (c.authorName) {
        const tagCandidate = `@${c.authorName.toLowerCase()}`;
        if (lowerClean.startsWith(tagCandidate)) {
          matchedAuthorName = clean.slice(0, tagCandidate.length);
          break;
        }
      }
    }

    if (!matchedAuthorName) {
      const fallbackMatch = clean.match(/^(@\S+(?:\s+\S+){0,2})/);
      if (fallbackMatch) {
        matchedAuthorName = fallbackMatch[1];
      }
    }

    if (matchedAuthorName) {
      const restText = clean.slice(matchedAuthorName.length);
      return (
        <>
          <span className={styles.mentionTag}>{matchedAuthorName}</span>
          {restText}
        </>
      );
    }

    return clean;
  };

  const renderSingleComment = (c: CommentType, isReply: boolean) => {
    const commentAvatar = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.authorName)}&background=random`;
    const isTeacher = c.authorRole === 'TEACHER' || c.authorRole === 'ADMIN' || (c.authorRole || '').toLowerCase() === 'teacher';
    const commentAuthorId = String(c.authorId?._id || c.authorId || '');
    const isOwner = commentAuthorId === String(currentUserId || '');
    const canDelete = isOwner || currentUserRole === 'TEACHER' || currentUserRole === 'ADMIN';
    const isLiked = c.likes?.includes(String(currentUserId || ''));

    return (
      <div
        key={c._id || Math.random()}
        className={`${styles.singleCommentWrapper} ${isTeacher ? styles.teacherComment : ''} ${isReply ? styles.replyComment : ''}`}
      >
        <div className={styles.commentBodyWrapper}>
          <div className={styles.user}>
            <div className={styles.userPic}>
              <img src={commentAvatar} alt={c.authorName} />
            </div>
            <div className={styles.userInfo}>
              <div className={styles.nameHeaderRow}>
                <span className={styles.authorNameText}>{c.authorName}</span>
                {isTeacher && <span className={styles.teacherBadge}>Giáo viên</span>}
              </div>
              <div className={styles.metaRow}>
                <p>{formatTime(c.createdAt)}</p>
              </div>
            </div>
          </div>
          <p className={styles.commentContent}>{renderFormattedContent(c.content)}</p>
          <div className={styles.commentActions}>
            <button
              className={`${styles.likeBtn} ${isLiked ? styles.liked : ''}`}
              onClick={() => onLikeComment(announcementId, c._id)}
            >
              <svg
                fill={isLiked ? '#f5356e' : 'none'}
                viewBox="0 0 24 24"
                height={14}
                width={14}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill={isLiked ? '#f5356e' : '#707277'}
                  strokeLinecap="round"
                  strokeWidth={2}
                  stroke={isLiked ? '#f5356e' : '#707277'}
                  d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z"
                />
              </svg>
              Thích {c.likes?.length ? `(${c.likes.length})` : ''}
            </button>
            <button
              className={styles.replyBtn}
              onClick={() => {
                setCommentInput(`@${c.authorName} `);
              }}
            >
              Trả lời
            </button>
            {canDelete && (
              <button
                className={styles.replyBtn}
                onClick={() => onDeleteComment(announcementId, c._id)}
                style={{ color: '#ef4444' }}
                title="Xóa bình luận"
              >
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.commentsContainer}>
      <h4 className={styles.commentsHeader}>Comments ({comments.length})</h4>

      <div className={styles.commentList}>
        {visibleGroups.map(({ parent, replies }) => {
          const isExpanded = !!showReplies[parent._id];

          return (
            <div key={parent._id}>
              {renderSingleComment(parent, false)}

              {replies.length > 0 && !isExpanded && (
                <button
                  className={styles.toggleRepliesBtn}
                  onClick={() => setShowReplies(prev => ({ ...prev, [parent._id]: true }))}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  Xem {replies.length} phản hồi
                </button>
              )}

              {replies.length > 0 && isExpanded && (
                <div>
                  {replies.map(r => renderSingleComment(r, true))}
                  <button
                    className={styles.toggleRepliesBtn}
                    onClick={() => setShowReplies(prev => ({ ...prev, [parent._id]: false }))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Ẩn {replies.length} phản hồi
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {groupedComments.length > 2 && (
          <button
            className={styles.toggleAllCommentsBtn}
            onClick={() => setShowAllComments(prev => !prev)}
          >
            {showAllComments ? 'Thu gọn bình luận' : `Xem thêm ${groupedComments.length - 2} bình luận...`}
          </button>
        )}
      </div>

      {classroomStatus !== 'Closed' && (
        <div className={styles.quickReplyForm}>
          <img src={userAvatar} alt={user?.name || 'User'} className={styles.replyAvatar} />
          <div className={styles.replyInputWrapper}>
            <input
              type="text"
              placeholder="Viết bình luận..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <AnimatedSendButton onClick={handleSend} disabled={!commentInput.trim() || isSubmitting} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementComments;
