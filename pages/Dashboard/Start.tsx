
import React, { useEffect, useState } from 'react';
import { Plus, Clock, Star, Users, ArrowRight, BookOpen, Box, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { slideApi } from '../../api/slide';
import { spaceApi } from '../../api/space';
import { userApi } from '../../api/user';
import { Slide, SlideSpace, User } from '../../types';

const StartPage: React.FC = () => {
  const [recentSlides, setRecentSlides] = useState<any[]>([]);
  const [spaces, setSpaces] = useState<SlideSpace[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    userApi.getCurrentUser().then(res => {
      if (res.statusCode === 0) setCurrentUser(res.data);
    });
    slideApi.findRecent(3).then(res => {
      if (res.statusCode === 0) setRecentSlides(res.data);
    });
    spaceApi.findAll({ pageSize: 4 }).then(res => {
      if (res.statusCode === 0) setSpaces(res.data.items);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-12 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tightest">Workdesk</h1>
          <p className="text-white/30 text-xl font-medium">Welcome back, {currentUser?.username || 'User'}. Your workspace is ready.</p>
        </div>
        <button className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs hover:bg-white/90 transition-all shadow-2xl shadow-white/10 active:scale-95">
          <Plus className="w-5 h-5 stroke-[3px]" />
          Create Space
        </button>
      </header>

      {/* Shortcuts - High Visibility */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="group bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 p-10 rounded-[40px] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all" />
          <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-black/40">
            <Plus className="w-8 h-8 text-white/80" />
          </div>
          <h3 className="text-2xl font-black mb-2">Blank Slate</h3>
          <p className="text-white/40 text-sm font-medium leading-relaxed">Start from absolute scratch and build your masterpiece.</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white transition-colors">
             Launch Canvas <ArrowRight className="w-3 h-3" />
          </div>
        </div>
        <div className="group bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 p-10 rounded-[40px] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-black/40">
            <Sparkles className="w-8 h-8 text-white/80" />
          </div>
          <h3 className="text-2xl font-black mb-2">AI Architect</h3>
          <p className="text-white/40 text-sm font-medium leading-relaxed">Describe your idea and let AI generate a full presentation.</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white transition-colors">
             Query Gemini <ArrowRight className="w-3 h-3" />
          </div>
        </div>
        <div className="group bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 p-10 rounded-[40px] hover:border-white/20 transition-all cursor-pointer relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 bg-white/10 rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl shadow-black/40">
            <Box className="w-8 h-8 text-white/80" />
          </div>
          <h3 className="text-2xl font-black mb-2">Import File</h3>
          <p className="text-white/40 text-sm font-medium leading-relaxed">Convert your Markdown or existing PPTX files to Slidev.</p>
          <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white transition-colors">
             Open Local <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Clock className="w-5 h-5 text-white/60" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Recent Artifacts</h2>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white flex items-center gap-2 transition-all">
            History <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentSlides.map(slide => (
            <Link 
              key={`slide-${slide.id}`} 
              to={`/slide/${slide.slideSpace?.id}/${slide.id}`}
              className="bg-[#0c0c0e] border border-white/5 p-6 rounded-[32px] hover:border-white/20 transition-all group flex flex-col shadow-lg"
            >
              <div className="aspect-video bg-[#18181b] rounded-2xl mb-6 overflow-hidden flex items-center justify-center relative">
                <div className="p-6 text-[8px] text-white/5 font-mono opacity-50 select-none group-hover:scale-110 transition-transform duration-700">
                  {slide.title}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-60" />
                <Zap className="absolute bottom-4 right-4 w-6 h-6 text-white/5 group-hover:text-white/40 transition-all group-hover:rotate-12" />
              </div>
              <h4 className="font-bold text-xl group-hover:text-white transition-colors">{slide.title}</h4>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  Edited {new Date(slide.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex -space-x-2">
                   {[1,2].map(i => (
                     <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${slide.id + i}`} className="w-6 h-6 rounded-full border-2 border-[#0c0c0e]" />
                   ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Knowledge Spaces */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-white/60" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Knowledge Spaces</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {spaces.map(space => (
            <Link 
              key={`space-${space.id}`} 
              to={`/slide/${space.id}`}
              className="flex items-center gap-8 p-10 bg-[#0c0c0e] border border-white/5 rounded-[40px] hover:border-white/20 transition-all group shadow-lg"
            >
              <div className="w-20 h-20 bg-[#18181b] rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 group-hover:scale-105 transition-all shadow-2xl">
                <BookOpen className="w-10 h-10 text-white/20 group-hover:text-white/60 transition-colors" />
              </div>
              <div className="min-w-0 space-y-1">
                <h4 className="font-black text-2xl truncate">{space.name}</h4>
                <p className="text-white/40 font-medium truncate leading-relaxed">
                  {space.isPublic ? 'Public Space' : 'Private Space'}
                </p>
                <div className="flex items-center gap-6 mt-6">
                   <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map(i => (
                        <img key={i} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${space.id + i}`} className="w-7 h-7 rounded-full border-4 border-[#0c0c0e]" />
                      ))}
                   </div>
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                     Created {new Date(space.createdAt).toLocaleDateString()}
                   </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StartPage;
