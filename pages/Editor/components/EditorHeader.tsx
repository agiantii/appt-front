
import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Save, CheckCircle2, Eye, Play } from 'lucide-react';
import { Slide, User } from '../../../types';

interface EditorHeaderProps {
  currentSlide: Slide;
  collaborators: User[];
  isSaving: boolean;
  onSave: () => void;
  previewOpen: boolean;
  onTogglePreview: () => void;
  slideId: string | undefined;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ 
  currentSlide, 
  collaborators, 
  isSaving, 
  onSave, 
  previewOpen, 
  onTogglePreview,
  slideId
}) => {
  return (
    <div className="h-14 border-b border-white/5 flex items-center justify-between px-8 bg-[#09090b] z-20">
      <div className="flex items-center gap-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Project Space</span>
          <span className="text-sm font-bold truncate max-w-[300px] text-white/90">{currentSlide.title}</span>
        </div>
        <div className="h-6 w-px bg-white/5" />
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {collaborators.map(c => (
              <img key={c.id} src={c.avatar} className="w-8 h-8 rounded-full border-4 border-[#09090b] shadow-2xl transition-transform hover:-translate-y-1 cursor-pointer" title={c.name} />
            ))}
            <div className="w-8 h-8 rounded-full bg-[#18181b] border-4 border-[#09090b] flex items-center justify-center text-[10px] font-black text-white/20 hover:text-white transition-all cursor-pointer">
              +3
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
             <Share2 className="w-3.5 h-3.5" />
             Collaborate
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
    </div>
  );
};

export default EditorHeader;
