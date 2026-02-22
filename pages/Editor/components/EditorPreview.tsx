
import React, { useEffect, useState } from 'react';
import { Maximize, RefreshCw, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
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

  const getIframeSrc = () => {
    if (!previewUrl) return '';
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

  useEffect(() => {
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
        <div className="flex items-center gap-3">
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
