
import React, { useEffect, useState } from 'react';
import { Maximize, RefreshCw, ArrowUp, ArrowDown, Loader2, Square, Hammer, CheckCircle2 } from 'lucide-react';
import { SlidePageInfo } from '../../../types';
import { slideApi } from '../../../api/slide';

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

  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
          {(['dev', 'build'] as const).map(mode => (
            <button 
              key={mode}
              onClick={() => setPreviewMode(mode)}
              className={`px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${previewMode === mode ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/30 hover:text-white/60'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-all disabled:opacity-50"
              title="Stop Dev Server"
            >
              <Square className={`w-3.5 h-3.5 ${isStopping ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold uppercase">Stop</span>
            </button>
          )}
          <button 
            onClick={handleBuild} 
            disabled={isBuilding}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all disabled:opacity-50"
            title="Build"
          >
            <Hammer className={`w-3.5 h-3.5 ${isBuilding ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-bold uppercase">Build</span>
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={fetchPreview} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all" title="Fullscreen">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-[#121214] overflow-hidden flex items-center justify-center relative">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-xs">Loading preview...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <span className="text-sm">{error}</span>
            <button onClick={fetchPreview} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors">
              Retry
            </button>
          </div>
        ) : previewUrl ? (
          <iframe
            key={currentPage}
            src={getIframeSrc()}
            className="w-full h-full border-0"
            title="Slide Preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="text-white/30 text-sm">No preview available</div>
        )}
      </div>

      {/* Toast 提示 */}
      {toast?.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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

      <div 
        onMouseDown={onOutlineResize}
        className="h-1 cursor-row-resize hover:bg-white/10 z-20 flex-shrink-0 transition-colors bg-white/5" 
      />

      <div style={{ height: `${outlineHeight}px` }} className="border-t border-white/5 bg-[#09090b] flex flex-col min-h-[100px] flex-shrink-0">
        <div className="p-3 px-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Outline</span>
            <div className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-[10px] text-white/20 font-mono">{slidePages.length} Slides</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onScrollOutline('top')} className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => onScrollOutline('bottom')} className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all">
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={outlineScrollRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {slidePages.map(page => (
            <button 
              key={page.index}
              onClick={() => handleOutlineClick(page)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl group transition-all text-left ${currentPage === page.index ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <span className={`text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded ${currentPage === page.index ? 'bg-indigo-500 text-white' : 'text-white/20 group-hover:text-white/40'}`}>{page.index}</span>
              <div className="flex-1 min-w-0">
                <span className={`text-xs font-semibold truncate block ${currentPage === page.index ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>{page.title}</span>
                <span className="text-[10px] text-white/20 group-hover:text-white/30 truncate block mt-0.5">{page.preview}...</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorPreview;
