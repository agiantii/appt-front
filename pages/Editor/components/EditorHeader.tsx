
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Save, CheckCircle2, Eye, Play, Settings, Globe, MessageSquare, X } from 'lucide-react';
import { Slide, User } from '../../../types';
import { slideApi } from '../../../api/slide';

interface EditorHeaderProps {
  currentSlide: Slide | null;
  collaborators: User[];
  onlineUsers: {name: string; color: string}[];
  isSaving: boolean;
  onSave: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  slideId: string | undefined;
  onOpenCollaboratorModal: () => void;
  onSlideUpdate?: (slide: Slide) => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  currentSlide, 
  collaborators, 
  onlineUsers,
  isSaving, 
  onSave, 
  previewOpen, 
  onTogglePreview,
  slideId,
  onOpenCollaboratorModal,
  onSlideUpdate
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(currentSlide?.isPublic ?? false);
  const [allowComment, setAllowComment] = useState(currentSlide?.allowComment ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 同步当前幻灯片状态
  React.useEffect(() => {
    if (currentSlide) {
      setIsPublic(currentSlide.isPublic);
      setAllowComment(currentSlide.allowComment);
    }
  }, [currentSlide]);

  const handleUpdateSettings = async () => {
    if (!slideId) return;
    setIsUpdating(true);
    try {
      const res = await slideApi.update(Number(slideId), {
        isPublic,
        allowComment
      });
      if (res.statusCode === 0 && onSlideUpdate) {
        onSlideUpdate(res.data);
      }
      setSettingsOpen(false);
    } catch (err) {
      console.error('更新文档设置失败:', err);
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090b] z-20">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Project Space</span>
          <span className="text-sm font-bold truncate max-w-[300px] text-white/90">{currentSlide?.title || 'Loading...'}</span>
        </div>
        <div className="h-6 w-px bg-white/5" />
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {onlineUsers.map((user, index) => (
              <div 
                key={index} 
                className="w-8 h-8 rounded-full border-4 border-[#09090b] shadow-2xl flex items-center justify-center text-[10px] font-bold text-white transition-transform hover:-translate-y-1 cursor-pointer"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineUsers.length === 0 && collaborators.slice(0, 3).map(c => (
              <img key={c.id} src={c.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} className="w-8 h-8 rounded-full border-4 border-[#09090b] shadow-2xl transition-transform hover:-translate-y-1 cursor-pointer" title={c.username} />
            ))}
          </div>
          <button 
            onClick={onOpenCollaboratorModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
          >
             <Share2 className="w-3.5 h-3.5" />
             Collaborate
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button 
          onClick={onSave}
          className={`flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white'}`}
        >
          {isSaving ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          Save
        </button>
        <div className="w-px h-6 bg-white/5 mx-2" />
        <button 
          onClick={onTogglePreview}
          className={`flex items-center gap-2.5 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${previewOpen ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/10 text-white/30 hover:bg-white/5'}`}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <Link to={`/slide/presentation/${slideId}`} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all active:scale-95">
          <Play className="w-5 h-5 fill-current" />
        </Link>
      </div>

      {/* 文档设置弹窗 */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white">文档设置</h3>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 是否公开 */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isPublic ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">公开访问</p>
                    <p className="text-xs text-white/40 mt-0.5">允许所有人查看此文档</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${isPublic ? 'bg-blue-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* 是否允许评论 */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${allowComment ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">允许评论</p>
                    <p className="text-xs text-white/40 mt-0.5">允许其他用户发表评论</p>
                  </div>
                </div>
                <button
                  onClick={() => setAllowComment(!allowComment)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${allowComment ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${allowComment ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                取消
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={isUpdating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isUpdating ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorHeader;
