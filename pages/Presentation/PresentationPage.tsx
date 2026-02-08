
import React, { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockSlides } from '../../data/mock';

const PresentationPage: React.FC = () => {
  const { slideId } = useParams();
  const navigate = useNavigate();
  const slide = mockSlides.find(s => s.id === Number(slideId)) || mockSlides[0];
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentText, setCommentText] = useState("");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Left: Presentation Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <div className="absolute top-6 left-6 z-20">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/60 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Exit
          </button>
        </div>

        <div className="w-full max-w-5xl aspect-[16/9] bg-white rounded-lg shadow-2xl relative overflow-hidden group">
          <div className="w-full h-full flex flex-col items-center justify-center p-20 text-black">
            <h1 className="text-6xl font-black tracking-tighter text-center">
               {slide.title}
            </h1>
            <p className="mt-8 text-2xl text-black/50 text-center font-medium max-w-2xl">
               Presentation Mode active. Interactive Slidev content would render here via iframe.
            </p>
          </div>

          {/* Overlay Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl shadow-black">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-2 hover:bg-white/10 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                <div className="px-4 text-xs font-bold tracking-widest text-white/40">
                  PAGE <span className="text-white">{currentPage}</span> / 12
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(12, p+1))} className="p-2 hover:bg-white/10 rounded-xl"><ChevronRight className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-xl"><Maximize2 className="w-5 h-5" /></button>
             </div>
          </div>
        </div>
      </div>

      {/* Right: Interaction Panel */}
      <div className="w-96 border-l border-white/5 bg-[#09090b] flex flex-col">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-white/40" />
            <h2 className="font-bold">Discussion</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40"><Share2 className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-4">
              <img src={`https://picsum.photos/seed/${i}/40/40`} className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">User {i}</span>
                  <span className="text-[10px] text-white/20">2m ago</span>
                </div>
                <p className="text-sm text-white/70 leading-relaxed">
                  The design on slide {i+1} looks really clean! Can we try a darker theme for the code blocks?
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/5">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 focus-within:ring-1 ring-white/20 transition-all">
            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the discussion..."
              className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[60px]"
            />
            <div className="flex items-center justify-between mt-2">
               <button className="p-1 text-white/20 hover:text-white transition-colors">
                 <Paperclip className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setCommentText("")}
                 className="bg-white text-black text-xs font-bold px-4 py-1.5 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
               >
                 <Send className="w-3.5 h-3.5" />
                 Post
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utils for the presentation
const Paperclip = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);

export default PresentationPage;
