
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Sidebar as SidebarIcon, Files, GitBranch, MessageSquare, Sparkles, Code, Home, History, ArrowRight, RotateCcw, GitCommit, Send, Trash2, X } from 'lucide-react';
import { SidebarTab, Slide, Snippet, Version, Comment } from '../../../types';
import FileTree from '../../../components/SpaceTree/FileTree';
import { versionApi } from '../../../api/version';
import { commentApi } from '../../../api/comment';
import { InputModal, ConfirmModal } from '../../../components/Common/Modal';

interface EditorSidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  slides: Slide[];
  slideSpaceId: string | undefined;
  onUpdateSlides: (slides: Slide[]) => void;
  onAddSlide: (parentId: number | null) => void;
  snippets: Snippet[];
  onInsertSnippet: (code: string) => void;
  chatHistory: { role: 'user' | 'ai', text: string }[];
  chatInput: string;
  setChatInput: (input: string) => void;
  onSendChat: () => void;
  slideId?: string;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
  onVersionRollback?: (content: string) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
  slides, slideSpaceId, onUpdateSlides, onAddSlide,
  snippets, onInsertSnippet, chatHistory, chatInput, setChatInput, onSendChat,
  slideId, currentUser, onVersionRollback
}) => {
  const navigate = useNavigate();
  
  // Version state
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionToRollback, setVersionToRollback] = useState<Version | null>(null);
  const [rollbackMessage, setRollbackMessage] = useState('');
  
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  // Load versions when git tab is active
  useEffect(() => {
    if (activeTab === 'git' && slideId) {
      loadVersions();
    }
  }, [activeTab, slideId]);

  // Load comments when comments tab is active
  useEffect(() => {
    if (activeTab === 'comments' && slideId) {
      loadComments();
    }
  }, [activeTab, slideId]);

  const loadVersions = async () => {
    if (!slideId) return;
    setIsLoadingVersions(true);
    try {
      const res = await versionApi.findAll(Number(slideId), { page: 1, pageSize: 20 });
      if (res.statusCode === 0) {
        setVersions(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

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

  const handleCreateVersion = async (commitMsg: string) => {
    if (!slideId) return;
    try {
      const res = await versionApi.create(Number(slideId), { commitMsg });
      if (res.statusCode === 0) {
        setVersions([res.data, ...versions]);
      }
    } catch (err) {
      console.error('Failed to create version:', err);
    }
  };

  const handleRollback = async () => {
    if (!slideId || !versionToRollback) return;
    try {
      const res = await versionApi.rollback(Number(slideId), versionToRollback.id, { 
        commitMsg: rollbackMessage || `回滚到版本 ${versionToRollback.versionNumber}` 
      });
      if (res.statusCode === 0) {
        // Reload versions
        loadVersions();
        // Fetch the rolled back version content
        const versionRes = await versionApi.findOne(Number(slideId), versionToRollback.id);
        if (versionRes.statusCode === 0 && onVersionRollback) {
          onVersionRollback(versionRes.data.content);
        }
      }
    } catch (err) {
      console.error('Failed to rollback:', err);
    } finally {
      setVersionToRollback(null);
      setRollbackMessage('');
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
        setComments([res.data, ...comments]);
        setCommentInput('');
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
        setComments(comments.filter(c => c.id !== commentToDelete.id));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setCommentToDelete(null);
    }
  };

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    setSidebarOpen(true);
  };

  const navButtons = [
    { tab: 'explorer' as SidebarTab, icon: Files },
    { tab: 'snippets' as SidebarTab, icon: Code },
    { tab: 'git' as SidebarTab, icon: GitBranch },
    { tab: 'comments' as SidebarTab, icon: MessageSquare },
    { tab: 'ai' as SidebarTab, icon: Sparkles, pulse: true },
  ];

  return (
    <>
      <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-[#0c0c0e] z-30">
        <Link to="/dashboard" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-xl mb-4">
          <Home className="w-6 h-6" />
        </Link>
        {navButtons.map(({ tab, icon: Icon, pulse }) => (
          <button 
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`p-3 transition-all relative rounded-2xl group ${activeTab === tab && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <Icon className={`w-6 h-6 ${pulse ? 'group-hover:animate-pulse' : ''}`} />
            {activeTab === tab && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
          </button>
        ))}
      </div>

      {sidebarOpen && (
        <div className="w-[260px] flex-shrink-0 border-r border-white/5 bg-[#09090b] flex flex-col min-w-0 animate-in slide-in-from-left-2 duration-200">
          <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0c0c0e]">
            <div className="flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-white/50" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{activeTab}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-colors">
              <SidebarIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
            {activeTab === 'explorer' && (
              <FileTree 
                data={slides} 
                onSelect={(id) => navigate(`/slide/${slideSpaceId}/${id}`)} 
                onUpdate={onUpdateSlides}
                onAddChild={onAddSlide}
                onAddRoot={() => onAddSlide(null)}
              />
            )}
            {activeTab === 'snippets' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Workspace Snippets</span>
                  <Link to="/settings/snippets" className="text-[10px] text-white/20 hover:text-white transition-colors underline">Manage</Link>
                </div>
                {snippets.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => onInsertSnippet(s.content)}
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl text-left group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-white/80 group-hover:text-white">{s.name}</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg text-[8px] font-mono text-white/30 truncate group-hover:text-white/50">
                      {s.content.slice(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'git' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">版本历史</span>
                  <button
                    onClick={() => setShowVersionModal(true)}
                    className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 hover:text-white transition-colors"
                  >
                    <GitCommit className="w-3 h-3" />
                    创建版本
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-2">
                  {isLoadingVersions ? (
                    <div className="text-center py-8 text-white/20 text-xs">加载中...</div>
                  ) : versions.length === 0 ? (
                    <div className="text-center py-8 text-white/20 text-xs">暂无版本记录</div>
                  ) : (
                    versions.map((version) => (
                      <div 
                        key={version.id} 
                        className="flex gap-2 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                      >
                        <History className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-white/40">v{version.versionNumber}</span>
                            <span className="text-xs font-medium text-white/80 truncate">{version.commitMsg}</span>
                          </div>
                          <div className="text-[10px] text-white/30 mt-1">
                            {version.creatorName} • {new Date(version.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => setVersionToRollback(version)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                          title="回滚到此版本"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {activeTab === 'comments' && (
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
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {comment.avatarUrl ? (
                              <img src={comment.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/50">
                                {comment.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs font-medium text-white/70">{comment.username}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {currentUser?.id === comment.userId && (
                              <button
                                onClick={() => setCommentToDelete(comment)}
                                className="p-1 hover:bg-red-500/10 rounded text-white/20 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{comment.content}</p>
                        <button
                          onClick={() => setReplyTo(comment)}
                          className="mt-2 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                        >
                          回复
                        </button>
                      </div>
                    ))
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
            )}
            {activeTab === 'ai' && (
              <div className="flex flex-col h-full bg-[#09090b]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {chatHistory.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                        <Sparkles className="w-12 h-12 text-white/5" />
                        <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest leading-relaxed">Ask AI to design slides, generate content, or fix layouts.</p>
                     </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${msg.role === 'ai' ? 'bg-white/5 border border-white/5 text-white/70 backdrop-blur-sm' : 'bg-white/10 ml-6 text-white border border-white/10 shadow-lg shadow-white/5'}`}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-white/5">
                  <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:ring-2 ring-white/10 transition-all">
                    <input 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                      placeholder="Ask Slidev Assistant..." 
                      className="bg-transparent text-xs w-full focus:outline-none px-3" 
                    />
                    <button onClick={onSendChat} className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Version Create Modal */}
      <InputModal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        onConfirm={handleCreateVersion}
        title="创建新版本"
        placeholder="输入版本提交信息..."
        confirmText="创建"
        cancelText="取消"
      />
      
      {/* Rollback Confirm Modal */}
      <ConfirmModal
        isOpen={!!versionToRollback}
        onClose={() => setVersionToRollback(null)}
        onConfirm={handleRollback}
        title="回滚版本"
        message={versionToRollback 
          ? `确定要回滚到版本 v${versionToRollback.versionNumber} 吗？当前内容将被替换。` 
          : ''}
        confirmText="回滚"
        cancelText="取消"
        type="warning"
      />
      
      {/* Delete Comment Confirm Modal */}
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

export default EditorSidebar;
