
import React, { useState, useEffect, useRef } from 'react';
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
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { slideApi } from '../../api/slide';
import { commentApi } from '../../api/comment';
import { Slide, Comment } from '../../types';
import { ConfirmModal, Modal } from '../../components/Common/Modal';
import { CommentTree } from '../Editor/components/CommentTree';
import { useTheme } from '../../contexts/ThemeContext';

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
            toast.type === 'success' ? 'bg-success/90 text-white' : 'bg-destructive/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};



const PresentationPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  // 初始化加载 - 先获取 presentation，成功后再获取 comments
  useEffect(() => {
    if (slideId) {
      setLoading(true);
      // 首先获取 presentation
      fetchPreview().then(() => {
        // presentation 获取成功后，再获取 comments
        return commentApi.findAll(Number(slideId)).then((commentsRes) => {
          if (commentsRes.statusCode === 0) {
            setComments(commentsRes.data.items);
          }
        });
      }).finally(() => setLoading(false));
    }
  }, [slideId]);

  // 获取 presentation Url 
  const fetchPreview = async () => {
    if (!slideId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await slideApi.getPresentation(Number(slideId));
      if (res.statusCode === 0 && res.data?.buildPath) {
        if (res.data.isBuild) {
          setPreviewUrl(res.data.buildPath);
        } else {
          setError('文档尚未构建，请先构建文档');
        }
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
      <div className={`flex h-screen items-center justify-center ${
        isDark ? 'bg-black text-white/40' : 'bg-gray-50 text-gray-400'
      }`}>
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        加载中...
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden select-none font-sans ${
      isDark ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* 左侧：Preview 区域 */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        isDark ? 'bg-[#09090b]' : 'bg-white'
      }`}>
        {/* 顶部工具栏 */}
        <div className={`h-10 flex items-center justify-between px-4 ${
          isDark 
            ? 'border-b border-white/5 bg-[#09090b]' 
            : 'border-b border-gray-200 bg-white'
        }`}>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                isDark 
                  ? 'hover:bg-white/5 text-white/40 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">返回</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                isDark 
                  ? 'hover:bg-white/5 text-white/40 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              title="刷新预览"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold uppercase">刷新</span>
            </button>
            <div className={`w-px h-4 mx-1 ${
              isDark ? 'bg-white/10' : 'bg-gray-300'
            }`} />
            <button 
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-lg transition-all ${
                isDark 
                  ? 'hover:bg-white/5 text-white/40 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Preview 内容区 */}
        <div className={`flex-1 overflow-hidden flex items-center justify-center relative ${
          isDark ? 'bg-[#121214]' : 'bg-gray-100'
        }`}>
          {isLoading ? (
            <div className={`flex flex-col items-center gap-3 ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs">加载中...</span>
            </div>
          ) : error ? (
            <div className={`flex flex-col items-center gap-3 ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>
              <span className="text-sm">{error}</span>
              <button 
                onClick={handleRefresh}
                className={`px-4 py-2 rounded-lg text-xs transition-colors ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                重试
              </button>
            </div>
          ) : previewUrl ? (
            <iframe
              ref={iframeRef}
              key={currentPage}
              src={previewUrl}
              className={`w-full h-full border-0 ${
                isDark ? 'bg-[#121214]' : 'bg-gray-100'
              }`}
              title="Slide Preview"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          ) : (
            <div className={`flex flex-col items-center gap-3 ${
              isDark ? 'text-white/40' : 'text-gray-400'
            }`}>
              <span className="text-sm">暂无预览</span>
              <button 
                onClick={handleRefresh}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg text-xs transition-colors disabled:opacity-50 ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                重新加载
              </button>
            </div>
          )}
        </div>

      </div>

      {/* 右侧：互动面板 */}
      <div className={`w-[380px] flex flex-col shadow-2xl ${
        isDark 
          ? 'bg-[#0c0c0e] border-l border-white/10' 
          : 'bg-white border-l border-gray-200'
      }`}>
        {/* 头部信息 */}
        <div className={`p-6 ${
          isDark ? 'border-b border-white/5' : 'border-b border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-lg font-bold truncate ${
              isDark ? 'text-white/90' : 'text-gray-900'
            }`}>讨论区</h1>
          </div>
        </div>

        {/* 评论区 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className={`p-4 ${
            isDark ? 'border-b border-white/5' : 'border-b border-gray-200'
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              isDark ? 'text-white/30' : 'text-gray-400'
            }`}>讨论区</span>
          </div>
          
          {/* 评论列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {isLoadingComments ? (
              <div className={`text-center py-8 text-xs ${
                isDark ? 'text-white/20' : 'text-gray-300'
              }`}>加载中...</div>
            ) : comments.length === 0 ? (
              <div className={`flex flex-col h-full items-center justify-center text-center px-6 ${
                isDark ? 'text-white/10' : 'text-gray-300'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-white/5' : 'bg-gray-100'
                }`}>
                  <Send className={`w-5 h-5 ${
                    isDark ? 'opacity-20' : 'opacity-30'
                  }`} />
                </div>
                <span className={`text-xs font-semibold tracking-wide uppercase ${
                  isDark ? 'opacity-30' : 'opacity-40'
                }`}>暂无评论</span>
                <p className={`text-[10px] mt-2 ${
                  isDark ? 'opacity-20' : 'opacity-30'
                }`}>发表第一条评论吧</p>
              </div>
            ) : (
              <CommentTree
                comments={comments}
                parentId={null}
                level={0}
                currentUser={currentUserId ? { id: currentUserId, username: '', avatarUrl: null } : null}
                onReply={setReplyTo}
                onDelete={setCommentToDelete}
                collapsedComments={collapsedComments}
                onToggleCollapse={toggleCommentCollapse}
              />
            )}
          </div>

          {/* 评论输入框 */}
          <div className={`p-4 border-t ${
            isDark ? 'border-white/5 bg-[#09090b]' : 'border-gray-200 bg-gray-50'
          }`}>            {replyTo && (
              <div className={`flex items-center justify-between mb-2 px-2 py-1.5 rounded ${
                isDark ? 'bg-white/5' : 'bg-gray-200'
              }`}>
                <span className={`text-[10px] ${
                  isDark ? 'text-white/40' : 'text-gray-500'
                }`}>回复 @{replyTo.username}</span>
                <button
                  onClick={() => setReplyTo(null)}
                  className={`${
                    isDark ? 'text-white/30 hover:text-white/60' : 'text-gray-400 hover:text-gray-600'
                  }`}
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
                className={`flex-1 border rounded-lg px-3 py-2 text-xs focus:outline-none ${
                  isDark 
                    ? 'bg-[#0c0c0e] border-white/10 text-white/80 placeholder:text-white/30 focus:border-white/30' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gray-400'
                }`}
              />
              <button
                onClick={handlePostComment}
                disabled={!commentInput.trim()}
                className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${
                  isDark 
                    ? 'bg-white text-black hover:bg-white/90' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
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
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isDark ? 'bg-red-500/10' : 'bg-red-50'
          }`}>
            <AlertCircle className={`w-8 h-8 ${
              isDark ? 'text-red-400' : 'text-red-500'
            }`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>无权访问</h3>
          <p className={`text-sm mb-4 ${
            isDark ? 'text-white/60' : 'text-gray-600'
          }`}>您没有权限查看此幻灯片</p>
          <div className={`text-xs ${
            isDark ? 'text-white/40' : 'text-gray-500'
          }`}>
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
