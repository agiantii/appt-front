
import React from 'react';
import { Plus, Clock, Star, Users, ArrowRight } from 'lucide-react';
import { mockSlideSpaces, mockSlides } from '../../data/mock';
import { Link } from 'react-router-dom';

const StartPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workdesk</h1>
          <p className="text-white/40 mt-1">Ready to create something amazing today?</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-white/90 transition-all shadow-xl shadow-white/5">
          <Plus className="w-5 h-5" />
          New Space
        </button>
      </header>

      {/* Shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-3xl group hover:border-white/20 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">New Project</h3>
          <p className="text-white/40 text-sm mt-1">Start from a blank canvas or AI assistant</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-3xl group hover:border-white/20 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Collaborate</h3>
          <p className="text-white/40 text-sm mt-1">Join a team space and build together</p>
        </div>
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-3xl group hover:border-white/20 transition-all cursor-pointer">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 transition-all">
            <Star className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Templates</h3>
          <p className="text-white/40 text-sm mt-1">Pick from curated professional themes</p>
        </div>
      </section>

      {/* Recently Edited */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold">Recent Documents</h2>
          </div>
          <button className="text-sm text-white/40 hover:text-white flex items-center gap-1 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockSlides.slice(0, 3).map(slide => (
            <Link 
              key={slide.id} 
              to={`/slide/${slide.slide_space_id}/${slide.id}`}
              className="bg-[#18181b] border border-white/5 p-5 rounded-2xl hover:border-white/20 transition-all group"
            >
              <div className="aspect-video bg-white/5 rounded-xl mb-4 overflow-hidden">
                <div className="p-4 text-[10px] text-white/20 font-mono overflow-hidden h-full">
                  {slide.content.slice(0, 300)}...
                </div>
              </div>
              <h4 className="font-semibold group-hover:text-white transition-colors">{slide.title}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-white/30">Updated {slide.updated_at}</span>
                <span className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded uppercase tracking-widest font-bold">Slidev</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Spaces */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/40" />
            <h2 className="text-xl font-bold">Knowledge Spaces</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockSlideSpaces.map(space => (
            <Link 
              key={space.id} 
              to={`/slide/${space.id}`}
              className="flex items-center gap-6 p-6 bg-[#18181b] border border-white/5 rounded-3xl hover:border-white/20 transition-all group"
            >
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-all">
                <Box className="w-8 h-8 text-white/30" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-lg truncate">{space.name}</h4>
                <p className="text-sm text-white/40 truncate">{space.description}</p>
                <div className="flex gap-2 mt-2">
                   <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <img key={i} src={`https://picsum.photos/seed/${space.id + i}/40/40`} className="w-6 h-6 rounded-full border-2 border-[#18181b]" />
                      ))}
                   </div>
                   <span className="text-xs text-white/30">+12 others</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

// Local component
const Box = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);

export default StartPage;
