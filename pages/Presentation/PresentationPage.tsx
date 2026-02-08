
import React, { useState } from 'react';
import { Maximize2, ChevronLeft, ChevronRight, MessageCircle, Share2, MoreHorizontal, Send, Play, Heart, Bookmark, Eye } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockSlides } from '../../data/mock';

const PresentationPage: React.FC = () => {
  const { slideId } = useParams();
  const navigate = useNavigate();
  const slide = mockSlides.find(s => s.id === Number(slideId)) || mockSlides[0];
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);

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
    <div className="flex h-screen bg-black overflow-hidden select-none font-sans">
      {/* Left: TikTok-style Player Area */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-0 bg-[#000] overflow-hidden group">
        
        {/* Navigation Overlays */}
        <div className="absolute top-8 left-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-2xl border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white transition-all active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            End Session
          </button>
        </div>

        <div className="absolute top-8 right-8 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-2xl rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-white">
              <Eye className="w-4 h-4" /> 12 Active Viewers
           </div>
        </div>

        {/* The Slide "Stage" */}
        <div className="w-full h-full flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-6xl aspect-[16/9] bg-[#fafafa] rounded-[40px] shadow-[0_100px_150px_-30px_rgba(0,0,0,1)] relative overflow-hidden transition-all duration-700 hover:scale-[1.01]">
            {/* Interactive content simulation */}
            <div className="w-full h-full flex flex-col items-center justify-center p-24 text-black text-center animate-in fade-in zoom-in-95 duration-700">
               <div className="mb-12">
                  <span className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Slidev Runtime</span>
               </div>
               <h1 className="text-7xl font-black tracking-tightest leading-[1] mb-8">
                  {slide.title}
               </h1>
               <p className="text-2xl text-black/40 font-medium max-w-3xl mx-auto leading-relaxed">
                  Interactive presentation layer. Real-time synced content from Slidev dev server.
               </p>
               <div className="mt-20 flex gap-6">
                  <div className="flex items-center gap-2 text-black/20 font-black uppercase tracking-widest text-xs">
                     <span className="text-black/60">© 2025</span>
                     <span>Slidev.ai</span>
                  </div>
               </div>
            </div>

            {/* Stage Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/90 backdrop-blur-2xl border border-white/20 p-4 rounded-[32px] shadow-2xl transition-all translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><ChevronLeft className="w-6 h-6 text-white" /></button>
                <div className="px-8 text-xs font-black tracking-[0.25em] text-white/40">
                  <span className="text-white">{currentPage.toString().padStart(2, '0')}</span> / 12
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(12, p+1))} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><ChevronRight className="w-6 h-6 text-white" /></button>
                <div className="w-px h-8 bg-white/10 mx-2" />
                <button onClick={toggleFullscreen} className="p-3 hover:bg-white/10 rounded-2xl transition-colors"><Maximize2 className="w-6 h-6 text-white" /></button>
            </div>
          </div>
        </div>

        {/* Action Sidebar - TikTok Style */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-8 items-center z-20">
           <button 
             onClick={() => setLiked(!liked)}
             className="flex flex-col items-center gap-2 group"
           >
              <div className={`p-4 rounded-full backdrop-blur-2xl border border-white/10 transition-all ${liked ? 'bg-red-500 text-white scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <Heart className={`w-7 h-7 ${liked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase">1.2k</span>
           </button>
           <button className="flex flex-col items-center gap-2 group">
              <div className="p-4 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                <Bookmark className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase">340</span>
           </button>
           <button className="flex flex-col items-center gap-2 group">
              <div className="p-4 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                <Share2 className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase">Share</span>
           </button>
        </div>
      </div>

      {/* Right: Modern Interaction Panel */}
      <div className="w-[400px] bg-[#0c0c0e] border-l border-white/10 flex flex-col shadow-2xl">
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Live Feed</span>
            <h2 className="text-2xl font-black">Discussion</h2>
          </div>
          <div className="flex gap-2">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all"><MoreHorizontal className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-5 group animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} className="w-12 h-12 rounded-[20px] border-2 border-white/10 flex-shrink-0 bg-[#18181b] shadow-xl group-hover:scale-110 transition-transform" />
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-white/90">Curator_{i}</span>
                  <span className="text-[10px] font-bold text-white/20 uppercase">2m ago</span>
                </div>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                  Love the minimalist aesthetic on slide {currentPage}. {i % 2 === 0 ? "Can we see the code block for that animation?" : "The typography here is spot on!"}
                </p>
                <div className="flex items-center gap-4 pt-1">
                   <button className="text-[10px] font-black text-white/20 uppercase hover:text-white transition-colors">Reply</button>
                   <button className="text-[10px] font-black text-white/20 uppercase hover:text-white transition-colors">Like</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-10 border-t border-white/5 bg-[#09090b]">
          <div className="bg-[#18181b] border border-white/10 rounded-[32px] p-6 focus-within:ring-4 ring-white/5 transition-all shadow-2xl relative">
            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Join the conversation..."
              className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[80px] font-medium text-white placeholder:text-white/10"
            />
            <div className="flex items-center justify-between mt-4">
               <div className="flex gap-4">
                  <button className="text-white/20 hover:text-white transition-all"><Paperclip className="w-5 h-5" /></button>
                  <button className="text-white/20 hover:text-white transition-all"><Smile className="w-5 h-5" /></button>
               </div>
               <button 
                 onClick={() => setCommentText("")}
                 className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl hover:bg-white/90 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                 disabled={!commentText.trim()}
               >
                 <Send className="w-4 h-4" />
                 Post
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Utils
const Paperclip = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
);
const Smile = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>
);

export default PresentationPage;
