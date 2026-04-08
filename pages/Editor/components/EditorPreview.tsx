
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Maximize, Minimize, RefreshCw, ArrowUp, ArrowDown, Loader2, Square, Hammer, CheckCircle2, Camera, Upload, X, ImageIcon } from 'lucide-react';
import { Modal } from '../../../components/Common/Modal';
import { SlidePageInfo } from '../../../types';
import { slideApi } from '../../../api/slide';
import { uploadApi } from '../../../api/upload';

interface EditorPreviewProps {
  previewMode: 'dev' | 'build';
  setPreviewMode: (mode: 'dev' | 'build') => void;
  content: string | null | undefined;
  outlineHeight: number;
  onOutlineResize: (e: React.MouseEvent) => void;
  slidePages: SlidePageInfo[];
  onJumpToSlide: (line: number) => void;
  onScrollOutline: (dir: 'top' | 'bottom') => void;
  outlineScrollRef: React.RefObject<HTMLDivElement>;
  slideId?: string;
}

const EditorPreview: React.FC<EditorPreviewProps> = ({
  previewMode, setPreviewMode, content, outlineHeight, onOutlineResize,
  slidePages, onJumpToSlide, onScrollOutline, outlineScrollRef, slideId
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [buildPath, setBuildPath] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeWrapperRef = useRef<HTMLDivElement>(null);

  const getIframeSrc = () => {
    if (previewMode === 'build' && buildPath) {
      // build 模式使用 buildPath
      console.log('buildPath', buildPath)
      return `${buildPath}${currentPage}`;
    }
    if (!previewUrl) return '';
    // dev 模式使用 previewUrl
    const baseUrl = previewUrl.split('#')[0];
    return `${baseUrl}/${currentPage}`;
  };

  const handleOutlineClick = (page: { index: number; lineStart: number }) => {
    onJumpToSlide(page.lineStart);
    setCurrentPage(page.index);
  };

  const fetchPreview = async () => {
    if (!slideId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await slideApi.preview(Number(slideId), previewMode);
      if (res.statusCode === 0 && res.data?.url) {
        setPreviewUrl(res.data.url);
      } else {
        setError('Failed to load preview');
      }
    } catch (err) {
      setError('Preview service unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopDev = async () => {
    if (!slideId) return;
    setIsStopping(true);
    try {
      const res = await slideApi.stopDev(Number(slideId));
      if (res.statusCode === 0) {
        setPreviewUrl(null);
        setError('Dev server stopped');
      }
    } catch (err) {
      console.error('停止 Dev 服务失败:', err);
    } finally {
      setIsStopping(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(null);
    }, 2000);
  };

  const handleBuild = async () => {
    if (!slideId) return;
    setIsBuilding(true);
    try {
      const res = await slideApi.build(Number(slideId));
      if (res.statusCode === 0 && res.data?.buildPath) {
        // 构建完成后切换到 build 模式并使用 buildPath
        setBuildPath(res.data.buildPath);
        setPreviewMode('build');
        setPreviewUrl(null);
        showToast('构建成功', 'success');
      } else {
        showToast('构建失败', 'error');
      }
    } catch (err) {
      console.error('构建失败:', err);
      showToast('构建失败', 'error');
    } finally {
      setIsBuilding(false);
    }
  };

  useEffect(() => {
    if (previewMode === 'build' && buildPath) {
      // build 模式且已有 buildPath，不需要重新获取
      return;
    }
    fetchPreview();
  }, [slideId, previewMode]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = () => {
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('请选择图片文件', 'error');
      return;
    }
    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFileSelect(file);
        break;
      }
    }
  }, []);

  useEffect(() => {
    if (isUploadModalOpen) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
  }
  }, [isUploadModalOpen, handlePaste]);

  const handleUpload = async () => {
    if (!uploadFile || !slideId) return;
    setIsUploading(true);
    try {
      const uploadRes = await uploadApi.uploadImage(uploadFile);
      if (uploadRes.statusCode === 0 && uploadRes.data?.url) {
        const updateRes = await slideApi.update(Number(slideId), { previewUrl: uploadRes.data.url });
        if (updateRes.statusCode === 0) {
          showToast('上传成功', 'success');
          setIsUploadModalOpen(false);
          setUploadPreview(null);
          setUploadFile(null);
        } else {
          showToast('更新失败', 'error');
        }
      } else {
        showToast('上传失败', 'error');
      }
    } catch (err) {
      console.error('上传失败:', err);
      showToast('上传失败', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadPreview(null);
    setUploadFile(null);
  };

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-background">
        <div className="flex gap-1.5 bg-accent p-1 rounded-xl">
          {(['dev', 'build'] as const).map(mode => (
            <button 
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${previewMode === mode ? 'bg-primary text-primary-foreground shadow-lg shadow-white/5' : 'text-muted-foreground hover:text-muted-foreground'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {previewMode === 'dev' && (
            <button 
              onClick={handleStopDev} 
              disabled={isStopping}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-red-400 transition-all disabled:opacity-50"
              title="Stop Dev Server"
            >
              <Square className={`w-3.5 h-3.5 ${isStopping ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold uppercase">Stop</span>
            </button>
          )}
          <button 
            onClick={handleBuild} 
            disabled={isBuilding}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all disabled:opacity-50"
            title="Build"
          >
            <Hammer className={`w-3.5 h-3.5 ${isBuilding ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold uppercase">Build</span>
          </button>
          <div className="w-px h-4 bg-accent/50 mx-1" />
          <button onClick={fetchPreview} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleCapture}
            disabled={isCapturing || !previewUrl}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all disabled:opacity-50" 
            title="Capture"
          >
            <Camera className={`w-3.5 h-3.5 ${isCapturing ? 'animate-pulse' : ''}`} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all" 
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      
      <div ref={iframeWrapperRef} className="flex-1 bg-card overflow-hidden flex items-center justify-center relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs">Loading preview...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <span className="text-sm">{error}</span>
            <button onClick={fetchPreview} className="px-4 py-2 bg-accent/50 hover:bg-white/20 rounded-lg text-xs transition-colors">
              Retry
            </button>
          </div>
        ) : previewUrl ? (
          <iframe
            ref={iframeRef}
            key={currentPage}
            src={getIframeSrc()}
            className="w-full h-full border-0 bg-card"
            title="Slide Preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="text-muted-foreground text-sm">No preview available</div>
        )}
      </div>

      {/* Toast 提示 */}
      {toast?.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ${
            toast.type === 'success' 
              ? 'bg-background border-green-500/30 text-green-400' 
              : 'bg-background border-red-500/30 text-red-400'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* 图片上传弹框 */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="上传预览图片"
        size="md"
        footer={
          <>
            <button
              onClick={closeUploadModal}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-white hover:bg-accent rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadFile || isUploading}
              className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? '上传中...' : '确认'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          {uploadPreview ? (
            <div className="relative">
              <img src={uploadPreview} alt="Preview" className="w-full h-48 object-contain rounded-lg bg-card" />
              <button
                onClick={() => { setUploadPreview(null); setUploadFile(null); }}
                className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-lg text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="h-48 border-2 border-dashed border-border hover:border-border rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors"
            >
              <div className="p-3 bg-accent rounded-full">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">点击选择图片或拖拽到此处</p>
                <p className="text-xs text-muted-foreground mt-1">支持 Ctrl+V 粘贴图片</p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <div 
        onMouseDown={onOutlineResize}
        className="h-1 cursor-row-resize hover:bg-accent/50 z-20 flex-shrink-0 transition-colors bg-accent" 
      />

      <div style={{ height: `${outlineHeight}px` }} className="border-t border-border bg-background flex flex-col min-h-[100px] flex-shrink-0">
        <div className="p-3 px-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Outline</span>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-[10px] text-muted-foreground font-mono">{slidePages.length} Slides</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onScrollOutline('top')} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => onScrollOutline('bottom')} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-white transition-all">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={outlineScrollRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {slidePages.map(page => (
            <button 
              key={page.index}
              onClick={() => handleOutlineClick(page)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl group transition-all text-left ${currentPage === page.index ? 'bg-primary/20 border border-primary/30' : 'hover:bg-accent border border-transparent'}`}
            >
              <span className={`text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded ${currentPage === page.index ? 'bg-primary text-white' : 'text-muted-foreground group-hover:text-muted-foreground'}`}>{page.index}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold truncate block ${currentPage === page.index ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>{page.title}</span>
                <span className="text-[10px] text-muted-foreground group-hover:text-muted-foreground truncate block mt-0.5">{page.preview}...</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPreview;
