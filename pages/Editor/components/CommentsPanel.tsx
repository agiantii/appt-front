import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Comment } from '../../../types';
import { commentApi } from '../../../api/comment';
import { ConfirmModal } from '../../../components/Common/Modal';
import { CommentTree } from './CommentTree';
import { useToast } from '../../../components/Common/Toast';
import { useTheme } from '../../../contexts/ThemeContext';

interface CommentsPanelProps {
  slideId?: string;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  slideId,
  currentUser,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { addToast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (slideId) {
      loadComments();
    }
  }, [slideId]);

  const loadComments = async () => {
    if (!slideId) return;
    setIsLoadingComments(true);
    try {
      const res = await commentApi.findAll(Number(slideId));
      if (res.statusCode === 0) {
        setComments(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!slideId || !commentInput.trim()) return;
    try {
      const res = await commentApi.create({
        slideId: Number(slideId),
        content: commentInput.trim(),
        replyId: replyTo?.id
      });
      if (res.statusCode === 0) {
        await loadComments();
        setCommentInput('');
        if (replyTo) {
          setCollapsedComments(prev => {
            const next = new Set(prev);
            next.delete(replyTo.id);
            return next;
          });
        }
        addToast('Comment posted successfully', 'success');
        setReplyTo(null);
      }
      else{
        addToast(res.message, 'error');
      }
    } catch (err) {
      addToast('Failed to post comment', 'error');
      console.error('Failed to post comment:', err);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const res = await commentApi.remove(commentToDelete.id);
      if (res.statusCode === 0) {
        await loadComments();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setCommentToDelete(null);
    }
  };

  const toggleCommentCollapse = (commentId: number) => {
    setCollapsedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {isLoadingComments ? (
            <div className="text-center py-8 text-muted-foreground text-xs">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground/30 text-center px-6">
              <MessageSquare className="w-10 h-10 mb-4 opacity-5" />
              <span className="text-xs font-semibold tracking-wide uppercase opacity-30">暂无评论</span>
              <p className="text-[10px] mt-2 opacity-20">协作者可以在这里发表评论</p>
            </div>
          ) : (
            <CommentTree
              comments={comments}
              parentId={null}
              level={0}
              currentUser={currentUser}
              onReply={setReplyTo}
              onDelete={setCommentToDelete}
              collapsedComments={collapsedComments}
              onToggleCollapse={toggleCommentCollapse}
            />
          )}
        </div>
        <div className="p-3 border-t border-border">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-2 py-1 bg-accent rounded">
              <span className="text-[10px] text-muted-foreground">回复 @{replyTo.username}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
              placeholder="发表评论..."
              className={`flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-ring ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500'
                  : 'bg-card border-border text-foreground placeholder:text-muted-foreground'
              }`}
            />
            <button
              onClick={handlePostComment}
              disabled={!commentInput.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteComment}
        title="删除评论"
        message="确定要删除这条评论吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </>
  );
};
