
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Zap,
  Image as ImageIcon,
  Video,
  FileBox,
  Share2,
  Trash2,
  Settings as SettingsIcon,
  ChevronDown,
  Layout,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { mockSlides, mockUser } from '../../data/mock';
import { SidebarTab, Slide, SlidePageInfo } from '../../types';
import FileTree from '../../components/SpaceTree/FileTree';
import ResizableLayout from '../../components/Editor/ResizablePanels';
import { GoogleGenAI } from '@google/genai';

const EditorPage: React.FC = () => {
  const { slideSpaceId, slideId } = useParams();
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const outlineScrollRef = useRef<HTMLDivElement>(null);
  
  const [slides, setSlides] = useState<Slide[]>(mockSlides);
  const [currentSlide, setCurrentSlide] = useState(slides.find(s => s.id === Number(slideId)) || slides[0]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [content, setContent] = useState(currentSlide.content);
  const [collaborators] = useState([mockUser, { id: 'u2', name: 'Jane Doe', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [previewMode, setPreviewMode] = useState<'dev' | 'build'>('dev');
  
  // Vertical Resizing State for Outline
  const [outlineHeight, setOutlineHeight] = useState(240);

  useEffect(() => {
    const s = slides.find(s => s.id === Number(slideId));
    if (s) {
      setCurrentSlide(s);
      setContent(s.content);
    }
  }, [slideId, slides]);

  // --- Slide Page Calculation ---
  const slidePages = useMemo((): SlidePageInfo[] => {
    const segments = content.split(/\n---(?:\n|$)/);
    const pages: SlidePageInfo[] = [];
    
    let currentLine = 1;
    segments.forEach((segment, idx) => {
      if (idx === 0 && segment.trim() && !segment.includes('#')) {
          // Likely global config
          currentLine += segment.split('\n').length + 1;
          return;
      }
      
      const lines = segment.split('\n');
      let title = "";
      for (const line of lines) {
        if (line.trim().startsWith('#')) {
          title = line.trim().replace(/^#+\s+/, '');
          break;
        }
      }
      
      const cleanContent = segment.trim().replace(/^---/, '').trim();
      const preview = cleanContent.slice(0, 15) || "Empty Slide";

      pages.push({
        index: pages.length + 1,
        title: title || `Slide ${pages.length + 1}`,
        preview: preview,
        lineStart: currentLine
      });
      
      currentLine += lines.length + 1;
    });
    
    return pages.length > 0 ? pages : [{ index: 1, title: "Untitled", preview: "...", lineStart: 1 }];
  }, [content]);

  const handleSave = () => {
    setIsSaving(true);
    const updated = slides.map(s => s.id === currentSlide.id ? { ...s, content, title: content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || s.title } : s);
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
        contents: `You are an expert Slidev designer. Help the user with their presentation.
        Context:
        ${content}
        
        User Question: ${chatInput}`,
      });
      setChatHistory([...newChat, { role: 'ai' as const, text: response.text || '...' }]);
    } catch (e) {
      setChatHistory([...newChat, { role: 'ai' as const, text: "Gemini is currently unavailable. Please check your network." }]);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let newContent = content;

    for (const item of items) {
      if (item.type.includes('image')) {
        const file = item.getAsFile();
        if (file) {
          const mockUrl = `https://picsum.photos/seed/${Math.random()}/1200/800`;
          newContent += `\n<img src="${mockUrl}" width="100%" />\n`;
        }
      } else if (item.type.includes('video')) {
         newContent += `\n<video src="https://example.com/mock-video.mp4" controls />\n`;
      } else if (item.kind === 'file') {
         newContent += `\n[File attachment: ${item.type}](https://example.com/download/asset)\n`;
      }
    }
    setContent(newContent);
  };

  const jumpToSlide = (line: number) => {
    if (textAreaRef.current) {
      const lines = content.split('\n');
      let charPos = 0;
      for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
        charPos += lines[i].length + 1;
      }
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(charPos, charPos);
      textAreaRef.current.scrollTo({
        top: (line - 1) * 24, 
        behavior: 'smooth'
      });
    }
  };

  const handleAddSlide = (parentId: number | null = null) => {
    const newId = Math.max(0, ...slides.map(s => s.id)) + 1;
    const newSlide: Slide = {
      id: newId,
      title: 'New Presentation',
      content: '---\ntheme: seriph\n---\n# New Content\nStart typing...',
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

  // --- Vertical Resizing Logic for Outline ---
  const startResizingOutline = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = outlineHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startY - moveEvent.clientY;
      setOutlineHeight(Math.max(100, Math.min(600, startHeight + delta)));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const scrollOutline = (direction: 'top' | 'bottom') => {
    if (outlineScrollRef.current) {
      outlineScrollRef.current.scrollTo({
        top: direction === 'top' ? 0 : outlineScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // --- RENDERS ---

  const sidebarContent = (
    <>
      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0c0c0e]">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-white/50" />
           <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{activeTab}</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-colors">
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
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Git Graph</div>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 group-hover:bg-white/40 transition-colors" />
                <History className="w-4 h-4 text-white/20 group-hover:text-white/60" />
                <div>
                  <div className="text-xs font-semibold text-white/80">commit: {Math.random().toString(36).substring(7)}</div>
                  <div className="text-[10px] text-white/30 font-medium">Refactor slide {i} layouts • 2h ago</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'comments' && (
          <div className="flex flex-col h-full items-center justify-center text-white/10 text-center px-6">
            <MessageSquare className="w-10 h-10 mb-4 opacity-5" />
            <span className="text-xs font-semibold tracking-wide uppercase opacity-30">No Discussion Yet</span>
            <p className="text-[10px] mt-2 opacity-20">Collaborators can leave comments here.</p>
          </div>
        )}
        {activeTab === 'ai' && (
          <div className="flex flex-col h-full bg-[#09090b]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatHistory.length === 0 && (
                 <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                    <Sparkles className="w-12 h-12 text-white/5" />
                    <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest leading-relaxed">Ask AI to design slides, generate content, or fix layouts.</p>
                 </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${msg.role === 'ai' ? 'bg-white/5 border border-white/5 text-white/70 backdrop-blur-sm' : 'bg-white/10 ml-6 text-white border border-white/10 shadow-lg shadow-white/5'}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:ring-2 ring-white/10 transition-all">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
                  placeholder="Ask Slidev Assistant..." 
                  className="bg-transparent text-xs w-full focus:outline-none px-3" 
                />
                <button onClick={handleAiChat} className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95">
                  <ArrowRight className="w-4 h-4" />
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
      <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#09090b] overflow-x-auto whitespace-nowrap hide-scrollbar">
        <div className="flex items-center gap-2 bg-[#18181b] px-4 py-2 rounded-t-xl border-t border-x border-white/10 -mb-[1px] relative">
          <Files className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs font-semibold text-white/90">{currentSlide.title}.md</span>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 ml-2" />
        </div>
      </div>
      <div className="flex-1 relative flex flex-col overflow-hidden bg-[#0c0c0e]">
        <div className="flex flex-1 overflow-hidden">
          <div className="w-12 bg-[#09090b] text-white/10 font-mono text-[10px] pt-6 flex flex-col items-center select-none border-r border-white/5">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="h-6 flex items-center">{i + 1}</div>
            ))}
          </div>
          <textarea
            ref={textAreaRef}
            className="flex-1 bg-transparent p-6 font-mono text-sm resize-none focus:outline-none text-white/80 leading-6 custom-scrollbar selection:bg-white/20"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="--- theme: default --- # Welcome to Slidev"
            spellCheck={false}
          />
        </div>
        
        {aiChatOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-10 w-full max-w-xl z-50 animate-in fade-in slide-in-from-top-6 duration-300">
            <div className="bg-[#1c1c1f]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-5 flex gap-4 ring-12 ring-black/40 shadow-black/80">
              <Sparkles className="w-5 h-5 text-white/40 mt-1" />
              <input 
                autoFocus
                className="bg-transparent flex-1 text-sm focus:outline-none placeholder:text-white/20"
                placeholder="Ask AI to edit this slide..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiChat()}
              />
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mr-2">Ctrl+I</span>
                 <button onClick={() => setAiChatOpen(false)} className="text-[10px] text-white/40 uppercase font-black px-2 hover:text-white transition-colors">ESC</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="h-10 border-t border-white/5 flex items-center justify-between px-4 bg-[#09090b] text-[10px] font-bold text-white/30 uppercase tracking-widest">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5" />
              OCR Tool
           </div>
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <Layout className="w-3.5 h-3.5" />
              Table Designer
           </div>
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <SettingsIcon className="w-3.5 h-3.5" />
              Configs
           </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-white/60">Ln {content.split('\n').length}, Col {content.length}</span>
        </div>
      </div>
    </>
  );

  const previewRight = (
    <>
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 bg-[#09090b]">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setPreviewMode('dev')}
            className={`px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${previewMode === 'dev' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/30 hover:text-white/60'}`}
          >
            Dev
          </button>
          <button 
            onClick={() => setPreviewMode('build')}
            className={`px-4 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${previewMode === 'build' ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/30 hover:text-white/60'}`}
          >
            Build
          </button>
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
            {content.split('\n').find(l => l.startsWith('# '))?.replace('# ', '') || 'New Presentation'}
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

      {/* Vertical Resizer Handle */}
      <div 
        onMouseDown={startResizingOutline}
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
            <button 
              onClick={() => scrollOutline('top')}
              title="To Top"
              className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollOutline('bottom')}
              title="To Bottom"
              className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-all"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={outlineScrollRef} className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {slidePages.map(page => (
            <button 
              key={page.index}
              onClick={() => jumpToSlide(page.lineStart)}
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
    </>
  );

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-white overflow-hidden select-none font-sans">
      <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-[#0c0c0e] z-30">
        <Link to="/dashboard" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-xl mb-4">
          <Home className="w-6 h-6" />
        </Link>
        <button 
          onClick={() => { setActiveTab('explorer'); setSidebarOpen(true); }}
          className={`p-3 transition-all relative rounded-2xl ${activeTab === 'explorer' && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <Files className="w-6 h-6" />
          {activeTab === 'explorer' && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
        </button>
        <button 
          onClick={() => { setActiveTab('git'); setSidebarOpen(true); }}
          className={`p-3 transition-all relative rounded-2xl ${activeTab === 'git' && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <GitBranch className="w-6 h-6" />
          {activeTab === 'git' && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
        </button>
        <button 
          onClick={() => { setActiveTab('comments'); setSidebarOpen(true); }}
          className={`p-3 transition-all relative rounded-2xl ${activeTab === 'comments' && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <MessageSquare className="w-6 h-6" />
          {activeTab === 'comments' && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
        </button>
        <div className="h-px w-6 bg-white/5 my-2" />
        <button 
          onClick={() => { setActiveTab('ai'); setSidebarOpen(true); }}
          className={`p-3 transition-all relative rounded-2xl group ${activeTab === 'ai' && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
          {activeTab === 'ai' && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
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
              onClick={handleSave}
              className={`flex items-center gap-2.5 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              {isSaving ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <div className="w-px h-6 bg-white/5 mx-2" />
            <button 
              onClick={() => setPreviewOpen(!previewOpen)}
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
