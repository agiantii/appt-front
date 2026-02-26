
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Share2, Save, CheckCircle2, Eye, Play, Settings, Globe, MessageSquare, X, ImageIcon } from 'lucide-react';
import { Slide, SlideSpace, User } from '../../../types';
import { slideApi } from '../../../api/slide';
import { uploadApi } from '../../../api/upload';

interface EditorHeaderProps {
  currentSlide: Slide | null;
  currentSpace: SlideSpace | null;
  collaborators: User[];
  onlineUsers: {name: string; color: string}[];
  isSaving: boolean;
  onSave: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  slideId: string | undefined;
  slideSpaceId: string | undefined;
  onOpenCollaboratorModal: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  currentSlide, 
  currentSpace,
  collaborators, 
  onlineUsers,
  isSaving, 
  onSave, 
  previewOpen, 
  onTogglePreview,
  slideId,
  slideSpaceId,
  onOpenCollaboratorModal
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(currentSlide?.isPublic ?? false);
  const [allowComment, setAllowComment] = useState(currentSlide?.allowComment ?? true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(currentSlide?.previewUrl || null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 同步当前幻灯片状态
  React.useEffect(() => {
    if (currentSlide) {
      setIsPublic(currentSlide.isPublic);
      setAllowComment(currentSlide.allowComment);
      setCoverPreview(currentSlide.previewUrl || null);
    }
  }, [currentSlide]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 2000);
  };

  const handleCoverFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleCoverFileSelect(file);
  }, []);

  const handleCoverPaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleCoverFileSelect(file);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      document.addEventListener('paste', handleCoverPaste);
      return () => document.removeEventListener('paste', handleCoverPaste);
    }
  }, [settingsOpen, handleCoverPaste]);

  const handleUpdateSettings = async () => {
    if (!slideId) return;
    setIsUpdating(true);
    try {
      let previewUrl = currentSlide?.previewUrl;
      
      // 如果有新上传的封面，先上传图片
      if (coverFile) {
        setIsUploadingCover(true);
        const uploadRes = await uploadApi.uploadImage(coverFile);
        if (uploadRes.statusCode === 0 && uploadRes.data?.url) {
          previewUrl = uploadRes.data.url;
        } else {
          showToast('封面上传失败', 'error');
          setIsUploadingCover(false);
          setIsUpdating(false);
          return;
        }
        setIsUploadingCover(false);
      }
      
      const res = await slideApi.update(Number(slideId), {
        isPublic,
        allowComment,
        previewUrl
      });
      if (res.statusCode === 0) {
        showToast('设置保存成功', 'success');
      } else {
        showToast(res.message || '保存失败', 'error');
      }
      setSettingsOpen(false);
      setCoverFile(null);
    } catch (err) {
      console.error('更新文档设置失败:', err);
      showToast('保存失败', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setCoverFile(null);
    setCoverPreview(currentSlide?.previewUrl || null);
  };
  return (
    <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090b] z-20">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Project Space</span>
          <Link 
            to={`/slide/${slideSpaceId}`}
            className="text-sm font-bold truncate max-w-[300px] text-white/90 hover:text-white/70 transition-colors cursor-pointer"
          >
            {currentSpace?.name || 'Loading...'}
          </Link>
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
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 w-[400px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white">文档设置</h3>
              <button 
                onClick={handleCloseSettings}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* 封面设置 */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">封面图片</p>
                    <p className="text-xs text-white/40 mt-0.5">拖拽或粘贴上传</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleCoverFileSelect(e.target.files[0])}
                />
                {coverPreview ? (
                  <div className="relative">
                    <img src={coverPreview} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-lg text-white/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleCoverDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-white/10 hover:border-white/30 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ImageIcon className="w-6 h-6 text-white/30" />
                    <p className="text-xs text-white/40">点击、拖拽或 Ctrl+V 粘贴</p>
                  </div>
                )}
              </div>

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
                onClick={handleCloseSettings}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
              >
                取消
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={isUpdating || isUploadingCover}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isUpdating || isUploadingCover ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast?.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ${
            toast.type === 'success' 
              ? 'bg-[#09090b] border-green-500/30 text-green-400' 
              : 'bg-[#09090b] border-red-500/30 text-red-400'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorHeader;
