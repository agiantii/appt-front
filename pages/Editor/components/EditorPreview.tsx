
import React from 'react';
import { Maximize, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { SlidePageInfo } from '../../../types';

interface EditorPreviewProps {
  previewMode: 'dev' | 'build';
  setPreviewMode: (mode: 'dev' | 'build') => void;
  content: string;
  outlineHeight: number;
  onOutlineResize: (e: React.MouseEvent) => void;
  slidePages: SlidePageInfo[];
  onJumpToSlide: (line: number) => void;
  onScrollOutline: (dir: 'top' | 'bottom') => void;
  outlineScrollRef: React.RefObject<HTMLDivElement>;
}

const EditorPreview: React.FC<EditorPreviewProps> = ({
  previewMode, setPreviewMode, content, outlineHeight, onOutlineResize,
  slidePages, onJumpToSlide, onScrollOutline, outlineScrollRef
}) => {
  const currentTitle = content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || 'New Presentation';

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
          <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-10 bg-[#121214] overflow-hidden flex items-center justify-center relative">
        <div className="aspect-[16/9] w-full bg-[#fafafa] text-black shadow-2xl rounded-xl flex flex-col p-14 transition-all hover:scale-[1.01] duration-700 relative group/preview">
          <div className="absolute top-6 right-8 opacity-0 group-hover/preview:opacity-100 transition-opacity">
            <span className="text-[10px] font-black tracking-widest text-black/20 uppercase">Slidev Core 0.51</span>
          </div>
          <div className="text-5xl font-black tracking-tighter leading-[1.05] selection:bg-black selection:text-white">
            {currentTitle}
          </div>
          <div className="mt-8 text-xl text-black/40 font-medium max-w-xl">
             Developing elegant presentations with real-time markdown and Slidev intelligence.
          </div>
          <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white">
                   <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-black tracking-widest uppercase">Collaborative Platform</span>
             </div>
             <div className="text-[10px] font-bold text-black/20">© 2025 Slidev.ai</div>
          </div>
        </div>
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
              onClick={() => onJumpToSlide(page.lineStart)}
              className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-white/5 rounded-xl group transition-all text-left"
            >
              <span className="text-[10px] font-mono font-bold text-white/10 group-hover:text-white/40 w-4 text-center">{page.index}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-white/50 group-hover:text-white/90 truncate block">{page.title}</span>
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
