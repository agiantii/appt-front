
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Plus, Search, Filter, LayoutGrid, List, ArrowLeft, MoreVertical as MoreIcon } from 'lucide-react';
import { mockSlideSpaces, mockSlides } from '../../data/mock';
import FileTree from '../../components/SpaceTree/FileTree';
import { Slide } from '../../types';

const SpaceDetail: React.FC = () => {
  const { slideSpaceId } = useParams();
  const navigate = useNavigate();
  const space = mockSlideSpaces.find(s => s.id === Number(slideSpaceId));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [slides, setSlides] = useState<Slide[]>(mockSlides);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Filter initial data based on space
    const filtered = mockSlides.filter(s => s.slide_space_id === Number(slideSpaceId));
    setSlides(filtered);
  }, [slideSpaceId]);

  if (!space) return (
    <div className="flex items-center justify-center h-full text-white/40">
      Space not found. <Link to="/dashboard" className="ml-2 text-white hover:underline">Go back</Link>
    </div>
  );

  const handleUpdateSlides = (updated: Slide[]) => {
    setSlides(updated);
  };

  const handleAddSlide = (parentId: number | null = null) => {
    const newId = Math.max(0, ...slides.map(s => s.id)) + 1;
    const newSlide: Slide = {
      id: newId,
      title: 'Untitled Slide',
      content: '---\ntheme: seriph\n---\n# New Slide\nStart editing...',
      slide_space_id: Number(slideSpaceId),
      parent_id: parentId,
      is_public: false,
      allow_comment: true,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };
    
    const updated = [...slides, newSlide];
    setSlides(updated);
    // Automatically navigate to editor for new slide
    navigate(`/slide/${slideSpaceId}/${newId}`);
  };

  const filteredSlides = slides.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#09090b]">
      {/* Space Sidebar */}
      <aside className="w-72 border-r border-white/5 flex flex-col bg-[#0c0c0e]">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold tracking-tight text-white/90 truncate mr-2" title={space.name}>{space.name}</h1>
            <Link to={`/slide/${slideSpaceId}/settings`} className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-white/30 line-clamp-2 leading-relaxed">{space.description}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          <FileTree 
            data={slides} 
            onUpdate={handleUpdateSlides} 
            onSelect={(id) => navigate(`/slide/${slideSpaceId}/${id}`)}
            onAddChild={(pid) => handleAddSlide(pid)}
            onAddRoot={() => handleAddSlide(null)}
          />
        </div>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => handleAddSlide(null)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-xl shadow-white/5 group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> New Slide
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white placeholder:text-white/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-xl flex border border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all text-white/60">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </header>

        {filteredSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/20 border border-dashed border-white/5 rounded-3xl">
            <Search className="w-12 h-12 mb-4 opacity-10" />
            <p className="text-sm font-medium">No documents found matching your search</p>
          </div>
        ) : (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {filteredSlides.map(slide => (
              <Link 
                key={slide.id}
                to={`/slide/${slideSpaceId}/${slide.id}`}
                className={`group bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all flex flex-col shadow-sm hover:shadow-xl hover:shadow-white/5`}
              >
                <div className="aspect-video bg-[#242427] relative group-hover:bg-[#2a2a2e] transition-colors flex items-center justify-center overflow-hidden">
                   <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button className="p-1.5 bg-black/60 rounded-lg backdrop-blur-md border border-white/10 hover:bg-black transition-colors" onClick={(e) => e.preventDefault()}>
                        <MoreIcon className="w-4 h-4 text-white/60" />
                      </button>
                   </div>
                   <div className="p-6 text-[8px] font-mono text-white/5 group-hover:text-white/10 transition-colors select-none">
                     {slide.content.slice(0, 400)}...
                   </div>
                   <Zap className="absolute w-8 h-8 text-white/5 group-hover:text-white/20 transition-all group-hover:scale-125 group-hover:rotate-12" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-white/80 group-hover:text-white transition-colors truncate mb-3" title={slide.title}>{slide.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Edited {slide.updated_at}</span>
                    <div className="flex -space-x-1.5">
                      <img src="https://picsum.photos/seed/u1/20/20" className="w-5 h-5 rounded-full border-2 border-[#18181b]" />
                      <img src="https://picsum.photos/seed/u2/20/20" className="w-5 h-5 rounded-full border-2 border-[#18181b]" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

export default SpaceDetail;
