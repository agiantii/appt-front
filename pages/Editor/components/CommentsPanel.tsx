import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Comment } from '../../../types';
import { commentApi } from '../../../api/comment';
import { ConfirmModal } from '../../../components/Common/Modal';
import { CommentTree } from './CommentTree';

interface CommentsPanelProps {
  slideId?: string;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  slideId,
  currentUser,
}) => {
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
        setReplyTo(null);
      }
    } catch (err) {
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
            <div className="text-center py-8 text-white/20 text-xs">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col h-full items-center justify-center text-white/10 text-center px-6">
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
        <div className="p-3 border-t border-white/5">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 px-2 py-1 bg-white/5 rounded">
              <span className="text-[10px] text-white/40">回复 @{replyTo.username}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-white/30 hover:text-white/60"
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
              className="flex-1 bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={handlePostComment}
              disabled={!commentInput.trim()}
              className="p-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
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
