
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Heart, 
  Bookmark, 
  Share2, 
  Eye,
  Loader2,
  RefreshCw,
  ChevronDown,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { slideApi } from '../../api/slide';
import { commentApi } from '../../api/comment';
import { Slide, Comment } from '../../types';
import { ConfirmModal, Modal } from '../../components/Common/Modal';

// Toast 组件
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      setTimeout(() => onRemove(toast.id), 2000);
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-right duration-200 ${
            toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// 无限嵌套评论组件
const CommentTree: React.FC<{
  comments: Comment[];
  parentId: number | null;
  level: number;
  currentUserId?: number;
  onReply: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  parentUsername?: string;
  collapsedComments: Set<number>;
  onToggleCollapse: (commentId: number) => void;
}> = ({ comments, parentId, level, currentUserId, onReply, onDelete, parentUsername, collapsedComments, onToggleCollapse }) => {
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
        const isCollapsed = collapsedComments.has(comment.id);
        
        return (
          <div key={comment.id} className="space-y-2">
            <div className={`${isNested ? 'p-2.5 bg-white/[0.02] rounded-lg' : 'p-3 bg-white/5 rounded-xl'} border border-white/5`}>
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
                  {currentUserId === comment.userId && (
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
                currentUserId={currentUserId}
                onReply={onReply}
                onDelete={onDelete}
                parentUsername={comment.username}
                collapsedComments={collapsedComments}
                onToggleCollapse={onToggleCollapse}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

const PresentationPage: React.FC = () => {
  const { slideId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Slide 数据
  const [slide, setSlide] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Preview 状态
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 权限状态
  const [permissionDeniedModalOpen, setPermissionDeniedModalOpen] = useState(false);
  const [permissionCountdown, setPermissionCountdown] = useState(2);
  
  // 评论状态
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [collapsedComments, setCollapsedComments] = useState<Set<number>>(new Set());
  
  // 用户状态
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>();
  
  // Toast
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // 初始化加载
  useEffect(() => {
    if (slideId) {
      setLoading(true);
      Promise.all([
        slideApi.findOne(Number(slideId)),
        commentApi.findAll(Number(slideId))
      ]).then(([slideRes, commentsRes]) => {
        if (slideRes.statusCode === 0) {
          setSlide(slideRes.data);
          // 获取 preview
          fetchPreview();
        }
        if (commentsRes.statusCode === 0) {
          setComments(commentsRes.data.items);
        }
      }).finally(() => setLoading(false));
    }
  }, [slideId]);

  // 获取 preview
  const fetchPreview = async () => {
    if (!slideId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await slideApi.preview(Number(slideId), 'build');
      if (res.statusCode === 0 && res.data?.url) {
        setPreviewUrl(res.data.url);
      } else if (res.statusCode === 403 || res.message?.includes('无权') || res.message?.includes('权限')) {
        // 无权访问
        setPermissionDeniedModalOpen(true);
        let count = 2;
        const timer = setInterval(() => {
          count -= 1;
          setPermissionCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            navigate('/');
          }
        }, 1000);
      } else {
        setError('加载预览失败');
      }
    } catch (err: any) {
      if (err?.response?.status === 403 || err?.message?.includes('无权') || err?.message?.includes('权限')) {
        setPermissionDeniedModalOpen(true);
        let count = 2;
        const timer = setInterval(() => {
          count -= 1;
          setPermissionCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            navigate('/');
          }
        }, 1000);
      } else {
        setError('预览服务不可用');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新预览
  const handleRefresh = () => {
    fetchPreview();
  };

  // 全屏切换
  const toggleFullscreen = async () => {
    if (!iframeRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await iframeRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('全屏切换失败:', err);
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 页码变化时更新 iframe URL
  useEffect(() => {
    if (previewUrl) {
      const baseUrl = previewUrl.split('/').slice(0, -1).join('/') || previewUrl;
      setPreviewUrl(`${baseUrl}/${currentPage}`);
    }
  }, [currentPage]);

  // 加载评论
  const loadComments = async () => {
    if (!slideId) return;
    setIsLoadingComments(true);
    try {
      const res = await commentApi.findAll(Number(slideId));
      if (res.statusCode === 0) {
        setComments(res.data.items);
      }
    } catch (err) {
      console.error('加载评论失败:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // 发表评论
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
        addToast('评论成功', 'success');
      }
    } catch (err) {
      addToast('评论失败', 'error');
    }
  };

  // 删除评论
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const res = await commentApi.remove(commentToDelete.id);
      if (res.statusCode === 0) {
        await loadComments();
        addToast('删除成功', 'success');
      }
    } catch (err) {
      addToast('删除失败', 'error');
    } finally {
      setCommentToDelete(null);
    }
  };

  // 切换评论折叠
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

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center text-white/40">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        加载中...
      </div>
    );
  }
  
  if (!slide) {
    return (
      <div className="flex h-screen bg-black items-center justify-center text-white/40">
        幻灯片未找到
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden select-none font-sans">
      {/* 左侧：Preview 区域 */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
        {/* 顶部工具栏 */}
        <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">返回</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all disabled:opacity-50"
              title="刷新预览"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold uppercase">刷新</span>
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button 
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Preview 内容区 */}
        <div className="flex-1 bg-[#121214] overflow-hidden flex items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs">加载中...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <span className="text-sm">{error}</span>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors"
              >
                重试
              </button>
            </div>
          ) : previewUrl ? (
            <iframe
              ref={iframeRef}
              key={currentPage}
              src={previewUrl}
              className="w-full h-full border-0 bg-[#121214]"
              title="Slide Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/40">
              <span className="text-sm">暂无预览</span>
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors disabled:opacity-50"
              >
                重新加载
              </button>
            </div>
          )}
        </div>

        {/* 底部页码控制 */}
        <div className="h-14 border-t border-white/5 flex items-center justify-center gap-4 bg-[#09090b]">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 text-xs font-bold tracking-[0.2em] text-white/40">
            <span className="text-white">{currentPage.toString().padStart(2, '0')}</span>
          </div>
          <button 
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 右侧：互动面板 */}
      <div className="w-[380px] bg-[#0c0c0e] border-l border-white/10 flex flex-col shadow-2xl">
        {/* 头部信息 */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white/90 truncate">{slide.title}</h1>
            <div className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-full">
              <Eye className="w-3 h-3" />
              <span>12</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${liked ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-bold">1.2k</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white/60 transition-all">
              <Bookmark className="w-4 h-4" />
              <span className="text-[10px] font-bold">340</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white/60 transition-all ml-auto">
              <Share2 className="w-4 h-4" />
              <span className="text-[10px] font-bold">分享</span>
            </button>
          </div>
        </div>

        {/* 评论区 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-white/5">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">讨论区</span>
          </div>
          
          {/* 评论列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoadingComments ? (
              <div className="text-center py-8 text-white/20 text-xs">加载中...</div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col h-full items-center justify-center text-white/10 text-center px-6">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Send className="w-5 h-5 opacity-20" />
                </div>
                <span className="text-xs font-semibold tracking-wide uppercase opacity-30">暂无评论</span>
                <p className="text-[10px] mt-2 opacity-20">发表第一条评论吧</p>
              </div>
            ) : (
              <CommentTree 
                comments={comments} 
                parentId={null} 
                level={0}
                currentUserId={currentUserId}
                onReply={setReplyTo}
                onDelete={setCommentToDelete}
                collapsedComments={collapsedComments}
                onToggleCollapse={toggleCommentCollapse}
              />
            )}
          </div>

          {/* 评论输入框 */}
          <div className="p-4 border-t border-white/5 bg-[#09090b]">            {replyTo && (
              <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-white/5 rounded">
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
      </div>

      {/* 删除评论确认弹窗 */}
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

      {/* 权限拒绝弹窗 */}
      <Modal
        isOpen={permissionDeniedModalOpen}
        onClose={() => {}}
        title="访问被拒绝"
        size="sm"
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">无权访问</h3>
          <p className="text-sm text-white/60 mb-4">您没有权限查看此幻灯片</p>
          <div className="text-xs text-white/40">
            {permissionCountdown} 秒后返回主页...
          </div>
        </div>
      </Modal>

      {/* Toast 容器 */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default PresentationPage;
