import React from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Comment } from '../../../types';

interface CommentTreeProps {
  comments: Comment[];
  parentId: number | null;
  level: number;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
  onReply: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  collapsedComments: Set<number>;
  onToggleCollapse: (commentId: number) => void;
  parentUsername?: string;
}

export const CommentTree: React.FC<CommentTreeProps> = ({
  comments,
  parentId,
  level,
  currentUser,
  onReply,
  onDelete,
  collapsedComments,
  onToggleCollapse,
  parentUsername,
}) => {
  const children = comments.filter(c => c.replyId === parentId);
  if (children.length === 0) return null;

  const maxIndent = 4;
  const indent = Math.min(level, maxIndent);
  const isNested = level > 0;

  return (
    <div className={`space-y-2 ${isNested ? `ml-${indent * 3} border-l-2 border-white/5 pl-3` : ''}`}>
      {children.map((comment) => {
        const replies = comments.filter(c => c.replyId === comment.id);
        const hasReplies = replies.length > 0;
        const isCollapsed = !collapsedComments.has(comment.id);

        return (
          <div key={comment.id} className="space-y-2">
            <div className={`${isNested ? 'p-2.5 bg-white/[0.03] rounded-lg' : 'p-3 bg-white/5 rounded-xl'} border border-white/5`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {comment.avatarUrl ? (
                    <img src={comment.avatarUrl} alt="" className={isNested ? 'w-4 h-4 rounded-full' : 'w-5 h-5 rounded-full'} />
                  ) : (
                    <div className={`${isNested ? 'w-4 h-4 text-[7px]' : 'w-5 h-5 text-[8px]'} rounded-full bg-white/10 flex items-center justify-center text-white/50`}>
                      {comment.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`${isNested ? 'text-[11px]' : 'text-xs'} font-medium text-white/70`}>{comment.username}</span>
                  {parentUsername && (
                    <>
                      <span className="text-[10px] text-white/20">回复</span>
                      <span className="text-[11px] text-white/40">@{parentUsername}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`${isNested ? 'text-[9px]' : 'text-[10px]'} text-white/30`}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                  {currentUser?.id === comment.userId && (
                    <button
                      onClick={() => onDelete(comment)}
                      className={`${isNested ? 'p-0.5' : 'p-1'} hover:bg-red-500/10 rounded text-white/20 hover:text-red-400 transition-colors`}
                    >
                      <Trash2 className={isNested ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    </button>
                  )}
                </div>
              </div>
              <p className={`${isNested ? 'text-[11px]' : 'text-xs'} text-white/60 leading-relaxed`}>{comment.content}</p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => onReply(comment)}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                >
                  回复
                </button>
                {hasReplies && (
                  <button
                    onClick={() => onToggleCollapse(comment.id)}
                    className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                  >
                    {isCollapsed ? (
                      <><ChevronRight className="w-3 h-3" />{replies.length} 条回复</>
                    ) : (
                      <><ChevronDown className="w-3 h-3" />收起</>
                    )}
                  </button>
                )}
              </div>
            </div>
            {!isCollapsed && (
              <CommentTree
                comments={comments}
                parentId={comment.id}
                level={level + 1}
                currentUser={currentUser}
                onReply={onReply}
                onDelete={onDelete}
                collapsedComments={collapsedComments}
                onToggleCollapse={onToggleCollapse}
                parentUsername={comment.username}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
