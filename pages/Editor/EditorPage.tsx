
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Sidebar as SidebarIcon, 
  Home, 
  Files, 
  GitBranch, 
  MessageSquare, 
  Sparkles, 
  Save, 
  History, 
  Eye, 
  Maximize,
  Play,
  CheckCircle2,
  Terminal,
  ArrowRight,
  Plus,
  Zap
} from 'lucide-react';
import { mockSlides, mockUser } from '../../data/mock';
import { SidebarTab, Slide } from '../../types';
import FileTree from '../../components/SpaceTree/FileTree';
import ResizableLayout from '../../components/Editor/ResizablePanels';
import { GoogleGenAI } from '@google/genai';

const EditorPage: React.FC = () => {
  const { slideSpaceId, slideId } = useParams();
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>(mockSlides);
  const [currentSlide, setCurrentSlide] = useState(slides.find(s => s.id === Number(slideId)) || slides[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [content, setContent] = useState(currentSlide.content);
  const [collaborators] = useState([mockUser, { id: 'u2', name: 'Jane Doe', avatar: 'https://picsum.photos/seed/u2/40/40' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);

  useEffect(() => {
    const s = slides.find(s => s.id === Number(slideId));
    if (s) {
      setCurrentSlide(s);
      setContent(s.content);
    }
  }, [slideId, slides]);

  // --- Slide Page Calculation ---
  const slidePages = useMemo(() => {
    const isFrontmatter = (text: string): boolean => {
      const lines = text.trim().split('\n').filter(l => l.trim() !== '');
      if (lines.length === 0) return true;
      if (lines.some(l => l.trim().startsWith('#'))) return false;
      return lines.every(l => /^[a-z0-9_-]+:/i.test(l.trim()) || /^[\s-]*-\s/.test(l.trim()));
    };

    // Split by the separator, handling optional leading/trailing whitespace
    const rawSegments = content.split(/\n---\n/).map(s => s.trim());
    
    const pages: { index: number, title: string }[] = [];
    let globalConfigFound = false;
    let pageCount = 0;

    for (let i = 0; i < rawSegments.length; i++) {
      const segment = rawSegments[i];
      if (segment === '' || segment === '---') continue;

      if (isFrontmatter(segment)) {
        if (!globalConfigFound && (i === 0 || (i === 1 && rawSegments[0] === ''))) {
          globalConfigFound = true;
          // Skip global frontmatter as a page
          continue;
        }
        // Slide-level frontmatter: we don't start a page here, 
        // we wait for the content block. If no content follows, it will be a "Config Only" page.
        if (i === rawSegments.length - 1) {
          pageCount++;
          pages.push({ index: pageCount, title: "Configuration" });
        }
      } else {
        pageCount++;
        const lines = segment.split('\n');
        let title = "";
        
        // Find first heading
        for (const line of lines) {
          const t = line.trim();
          if (t.startsWith('#')) {
            title = t.replace(/^#+\s+/, '');
            break;
          }
        }
        
        // Fallback to first non-frontmatter line if no heading
        if (!title) {
          for (const line of lines) {
            const t = line.trim();
            if (t && !isFrontmatter(t)) {
              title = t;
              break;
            }
          }
        }

        pages.push({
          index: pageCount,
          title: (title || `Slide ${pageCount}`).slice(0, 20) + (title.length > 20 ? '...' : '')
        });
      }
    }
    
    return pages.length > 0 ? pages : [{ index: 1, title: "Empty Slide" }];
  }, [content]);

  const handleSave = () => {
    setIsSaving(true);
    const updated = slides.map(s => s.id === currentSlide.id ? { ...s, content } : s);
    setSlides(updated);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleShortcut = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      setSidebarOpen(prev => !prev);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      setAiChatOpen(prev => !prev);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [content, currentSlide.id]);

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [handleShortcut]);

  const handleAiChat = async () => {
    if (!chatInput.trim()) return;
    const newChat = [...chatHistory, { role: 'user' as const, text: chatInput }];
    setChatHistory(newChat);
    setChatInput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an AI Slide Assistant. Content: ${content}\n\nUser: ${chatInput}`,
      });
      setChatHistory([...newChat, { role: 'ai' as const, text: response.text || '...' }]);
    } catch (e) {
      setChatHistory([...newChat, { role: 'ai' as const, text: "Error connecting to Gemini." }]);
    }
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSlides([...slides, newSlide]);
    navigate(`/slide/${slideSpaceId}/${newId}`);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.includes('image')) {
        setContent(prev => prev + `\n<img src="https://picsum.photos/seed/${Math.random()}/800/600" width="100%" />`);
      } else if (item.type.includes('video')) {
         setContent(prev => prev + `\n<video src="https://example.com/mock-video.mp4" controls />`);
      }
    }
  };

  // --- RENDERS ---

  const sidebarContent = (
    <>
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0c0c0e]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 ml-2">{activeTab}</span>
        <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white">
          <SidebarIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar">
        {activeTab === 'explorer' && (
          <FileTree 
            data={slides} 
            onSelect={(id) => navigate(`/slide/${slideSpaceId}/${id}`)} 
            onUpdate={setSlides}
            onAddChild={handleAddSlide}
            onAddRoot={() => handleAddSlide(null)}
          />
        )}
        {activeTab === 'git' && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] font-bold text-white/20 uppercase">Source Control</div>
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                <History className="w-4 h-4 text-white/20 group-hover:text-white/40" />
                <div>
                  <div className="text-xs font-medium text-white/70">Refactor layout v{i}</div>
                  <div className="text-[10px] text-white/30">Modified 1h ago</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'comments' && (
          <div className="p-8 flex flex-col items-center justify-center text-white/10 h-full text-center">
            <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
            <span className="text-xs font-medium">Discussion is empty</span>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'ai' ? 'bg-white/5 border border-white/10 text-white/80' : 'bg-white/10 ml-6 text-white'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2 bg-white/5 rounded-xl p-2 border border-white/10 focus-within:ring-1 ring-white/20">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                  placeholder="Chat with AI..." 
                  className="bg-transparent text-xs w-full focus:outline-none px-2" 
                />
                <button onClick={handleAiChat} className="p-1.5 bg-white text-black rounded-lg hover:bg-white/90">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const editorCenter = (
    <>
      <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#09090b]">
        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-t-lg border-t border-x border-white/10 -mb-[1px]">
          <Files className="w-3 h-3 text-white/30" />
          <span className="text-xs font-medium text-white/90">{currentSlide.title}.md</span>
        </div>
      </div>
      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Mock Line Numbers */}
          <div className="w-12 bg-[#09090b] text-white/10 font-mono text-[10px] pt-6 flex flex-col items-center select-none border-r border-white/5">
            {Array.from({ length: 40 }).map((_, i) => (
              <div key={i} className="h-6 flex items-center">{i + 1}</div>
            ))}
          </div>
          <textarea
            className="flex-1 bg-transparent p-6 font-mono text-sm resize-none focus:outline-none text-white/80 leading-6 custom-scrollbar"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="--- theme: ... --- # Slide Content"
            spellCheck={false}
          />
        </div>
        
        {aiChatOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-full max-w-lg z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-[#1c1c1f] border border-white/20 rounded-2xl shadow-2xl p-4 flex gap-3 ring-8 ring-black/40">
              <Sparkles className="w-5 h-5 text-white/30 mt-1" />
              <input 
                autoFocus
                className="bg-transparent flex-1 text-sm focus:outline-none"
                placeholder="Suggest edits..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
              />
              <button onClick={() => setAiChatOpen(false)} className="text-[10px] text-white/20 uppercase font-bold px-2 hover:text-white transition-colors">Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const previewRight = (
    <>
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg">
          <button className="px-3 py-1 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white">Dev</button>
          <button className="px-3 py-1 rounded-md hover:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/30 transition-colors">Build</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/20 font-mono tracking-tighter">localhost:3030</span>
          <button className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-8 bg-[#18181b] overflow-hidden flex items-center justify-center">
        <div className="aspect-[16/9] w-full bg-white text-black shadow-2xl rounded-sm flex flex-col p-12 transition-transform hover:scale-[1.01] duration-500 relative">
          <div className="text-4xl font-black tracking-tighter leading-[1.1]">
            {content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || 'Untitled'}
          </div>
          <div className="mt-8 text-xl text-black/60 font-medium">
             Slidev Intelligence Runtime
          </div>
          <div className="mt-auto flex justify-between items-end border-t border-black/10 pt-4">
             <span className="text-[10px] font-black opacity-20">SLIDEV 0.51.0</span>
             <Zap className="w-4 h-4 text-black/20" />
          </div>
        </div>
      </div>

      <div className="h-44 border-t border-white/5 bg-[#09090b] flex flex-col">
        <div className="p-2.5 px-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em]">Outline</span>
            <span className="text-[10px] text-white/10 bg-white/5 px-1.5 py-0.5 rounded">{slidePages.length} slides</span>
          </div>
          <button onClick={() => handleAddSlide(null)} className="p-1 hover:bg-white/5 rounded text-white/20 hover:text-white">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {slidePages.map(page => (
            <button 
              key={page.index}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg group transition-all text-left"
            >
              <span className="text-[10px] font-mono text-white/20 group-hover:text-white/50 w-4 text-center">{page.index}</span>
              <span className="text-xs text-white/40 group-hover:text-white/80 truncate font-medium">{page.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-white overflow-hidden select-none font-sans">
      {/* Activity Bar */}
      <div className="w-12 border-r border-white/5 flex flex-col items-center py-4 gap-4 bg-[#0c0c0e] z-30">
        <Link to="/dashboard" className="p-2.5 text-white/30 hover:text-white transition-all mb-4">
          <Home className="w-5 h-5" />
        </Link>
        <button 
          onClick={() => { setActiveTab('explorer'); setSidebarOpen(true); }}
          className={`p-2.5 transition-all relative rounded-xl ${activeTab === 'explorer' && sidebarOpen ? 'text-white bg-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <Files className="w-5 h-5" />
          {activeTab === 'explorer' && sidebarOpen && <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-[0_0_8px_white]" />}
        </button>
        <button 
          onClick={() => { setActiveTab('git'); setSidebarOpen(true); }}
          className={`p-2.5 transition-all relative rounded-xl ${activeTab === 'git' && sidebarOpen ? 'text-white bg-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <GitBranch className="w-5 h-5" />
          {activeTab === 'git' && sidebarOpen && <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-[0_0_8px_white]" />}
        </button>
        <button 
          onClick={() => { setActiveTab('comments'); setSidebarOpen(true); }}
          className={`p-2.5 transition-all relative rounded-xl ${activeTab === 'comments' && sidebarOpen ? 'text-white bg-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <MessageSquare className="w-5 h-5" />
          {activeTab === 'comments' && sidebarOpen && <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-[0_0_8px_white]" />}
        </button>
        <button 
          onClick={() => { setActiveTab('ai'); setSidebarOpen(true); }}
          className={`p-2.5 transition-all relative rounded-xl ${activeTab === 'ai' && sidebarOpen ? 'text-white bg-white/10' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <Sparkles className="w-5 h-5" />
          {activeTab === 'ai' && sidebarOpen && <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r-full shadow-[0_0_8px_white]" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Main Header / Status Bar */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-[#09090b] z-20">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white/30 uppercase tracking-[0.2em] font-bold text-[10px]">Project</span>
              <span className="text-white/90 font-bold truncate max-w-[200px]">{currentSlide.title}</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex -space-x-2">
              {collaborators.map(c => (
                <img key={c.id} src={c.avatar} className="w-6 h-6 rounded-full border-2 border-[#09090b] shadow-sm" title={c.name} />
              ))}
              <div className="w-6 h-6 rounded-full bg-white/5 border-2 border-[#09090b] flex items-center justify-center text-[8px] font-bold text-white/30 hover:text-white transition-colors cursor-pointer">
                +2
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              {isSaving ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Save className="w-3.5 h-3.5 text-white/40" />}
              Save
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60">
              <Terminal className="w-3.5 h-3.5" />
              Build
            </button>
            <button 
              onClick={() => setPreviewOpen(!previewOpen)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${previewOpen ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/10 text-white/40 hover:bg-white/5'}`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <Link to={`/slide/presentation/${slideId}`} className="p-2 hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors ml-2">
              <Play className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <ResizableLayout 
          left={sidebarContent}
          center={editorCenter}
          right={previewRight}
          leftOpen={sidebarOpen}
          rightOpen={previewOpen}
        />
      </div>
    </div>
  );
};

export default EditorPage;
