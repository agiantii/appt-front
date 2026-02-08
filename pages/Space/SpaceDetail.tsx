
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Settings, Plus, Search, Filter, LayoutGrid, List, ArrowLeft, MoreVertical as MoreIcon, ChevronRight, ChevronDown, Share2, FolderOpen, FileText, Zap as ZapIcon } from 'lucide-react';
import { mockSlideSpaces, mockSlides } from '../../data/mock';
import FileTree from '../../components/SpaceTree/FileTree';
import { Slide, FileTreeNode } from '../../types';

const SpaceDetail: React.FC = () => {
  const { slideSpaceId } = useParams();
  const navigate = useNavigate();
  const space = mockSlideSpaces.find(s => s.id === Number(slideSpaceId));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [slides, setSlides] = useState<Slide[]>(mockSlides);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const filtered = mockSlides.filter(s => s.slide_space_id === Number(slideSpaceId));
    setSlides(filtered);
    // Expand all by default for the main view
    const initialExpanded: Record<number, boolean> = {};
    filtered.forEach(s => initialExpanded[s.id] = true);
    setExpandedNodes(initialExpanded);
  }, [slideSpaceId]);

  const treeData = useMemo(() => {
    const buildTree = (nodes: Slide[], parentId: number | null = null): FileTreeNode[] => {
      return nodes
        .filter(node => node.parent_id === parentId)
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }))
        .map(node => ({
          ...node,
          children: buildTree(nodes, node.id)
        }));
    };
    return buildTree(slides.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())));
  }, [slides, searchQuery]);

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
      title: 'Untitled Presentation',
      content: '---\ntheme: seriph\n---\n# New Content\nStart typing...',
      slide_space_id: Number(slideSpaceId),
      parent_id: parentId,
      is_public: false,
      allow_comment: true,
      created_at: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString().split('T')[0]
    };
    
    const updated = [...slides, newSlide];
    setSlides(updated);
    navigate(`/slide/${slideSpaceId}/${newId}`);
  };

  const toggleNode = (id: number) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const TreeRow: React.FC<{ node: FileTreeNode; level: number }> = ({ node, level }) => {
    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div className="flex flex-col">
        <div 
          className="group flex items-center hover:bg-white/[0.03] transition-colors py-2 px-4 cursor-pointer"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => hasChildren ? toggleNode(node.id) : navigate(`/slide/${slideSpaceId}/${node.id}`)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 text-white/40" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-white/20" />
            )}
            <span className={`text-sm ${hasChildren ? 'text-white/80 font-medium' : 'text-white/60'} truncate`}>
              {node.title}
            </span>
            <div className="flex-1 border-b border-dotted border-white/5 mx-4 min-w-[20px]" />
          </div>
          <div className="text-[11px] font-mono text-white/20 group-hover:text-white/40 transition-colors whitespace-nowrap">
            {node.updated_at}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="flex flex-col">
            {node.children!.map(child => (
              <TreeRow key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      {/* Space Sidebar */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-[#0c0c0e] relative z-20">
        <div className="p-8 pb-4">
          <Link to="/dashboard" className="flex items-center gap-3 text-white/30 hover:text-white text-xs font-black uppercase tracking-widest transition-all mb-10 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Home
          </Link>
          <div className="flex items-start justify-between mb-2">
            <div className="flex flex-col min-w-0">
               <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Active Space</span>
               <h1 className="text-2xl font-black tracking-tight text-white/90 truncate pr-2" title={space.name}>{space.name}</h1>
            </div>
            <Link to={`/slide/${slideSpaceId}/settings`} className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <FileTree 
            data={slides} 
            onUpdate={handleUpdateSlides} 
            onSelect={(id) => navigate(`/slide/${slideSpaceId}/${id}`)}
            onAddChild={(pid) => handleAddSlide(pid)}
            onAddRoot={() => handleAddSlide(null)}
          />
        </div>

        <div className="p-6 border-t border-white/5 bg-[#0c0c0e]/80 backdrop-blur-md">
          <button 
            onClick={() => handleAddSlide(null)}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-white/90 transition-all shadow-2xl shadow-white/5 group active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            New Document
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#09090b] relative flex flex-col">
        <header className="sticky top-0 z-10 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                <FolderOpen className="w-4 h-4" />
                <span>Spaces</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/70">{space.name}</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex -space-x-3 mr-4">
                  {[1,2,3].map(i => (
                    <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} className="w-8 h-8 rounded-full border-4 border-[#09090b]" />
                  ))}
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
                   <Share2 className="w-4 h-4" />
                   Invite
                </button>
             </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full max-w-xl group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presentations, templates, nodes..."
                className="w-full bg-[#18181b] border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-white/5 transition-all text-white placeholder:text-white/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-[#18181b] p-1.5 rounded-2xl flex border border-white/5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-xl' : 'text-white/20 hover:text-white/40'}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-xl' : 'text-white/20 hover:text-white/40'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              <button className="flex items-center gap-3 px-6 py-3 bg-[#18181b] hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-white/40 hover:text-white">
                <Filter className="w-4 h-4" /> Sort: Recently Edited
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {viewMode === 'list' ? (
            <div className="max-w-5xl mx-auto py-8">
              {treeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-white/5 border border-dashed border-white/10 rounded-[48px]">
                  <Search className="w-20 h-20 mb-6 stroke-[1px]" />
                  <p className="text-lg font-black uppercase tracking-widest">Workspace is silent</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {treeData.map(node => (
                    <TreeRow key={node.id} node={node} level={0} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10`}>
              {slides.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map(slide => (
                <Link 
                  key={slide.id}
                  to={`/slide/${slideSpaceId}/${slide.id}`}
                  className={`group bg-[#0c0c0e] border border-white/5 rounded-[40px] overflow-hidden hover:border-white/20 transition-all flex flex-col shadow-lg hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] relative`}
                >
                  <div className="aspect-[16/10] bg-[#18181b] relative group-hover:bg-[#1c1c1f] transition-colors flex items-center justify-center overflow-hidden">
                     <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0">
                        <button className="p-3 bg-black/80 rounded-2xl backdrop-blur-xl border border-white/10 hover:bg-white hover:text-black transition-all" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <MoreIcon className="w-5 h-5" />
                        </button>
                     </div>
                     <div className="p-10 text-[6px] font-mono text-white/5 group-hover:text-white/10 transition-all duration-700 select-none scale-110 group-hover:scale-100">
                       {slide.content.slice(0, 800)}
                     </div>
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-transparent to-transparent opacity-40" />
                     <ZapIcon className="absolute w-12 h-12 text-white/5 group-hover:text-white/10 transition-all group-hover:scale-110 group-hover:rotate-6" />
                  </div>
                  <div className="p-8">
                    <h3 className="font-black text-xl text-white/90 group-hover:text-white transition-colors truncate mb-4" title={slide.title}>{slide.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">Last Update</span>
                        <span className="text-xs font-bold text-white/40">{slide.updated_at}</span>
                      </div>
                      <div className="flex -space-x-2">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${slide.id}`} className="w-7 h-7 rounded-full border-2 border-[#0c0c0e]" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default SpaceDetail;
