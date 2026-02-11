
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Sidebar as SidebarIcon, Files, GitBranch, MessageSquare, Sparkles, Code, Home, History, ArrowRight } from 'lucide-react';
import { SidebarTab, Slide, Snippet } from '../../../types';
import FileTree from '../../../components/SpaceTree/FileTree';

interface EditorSidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  slides: Slide[];
  slideSpaceId: string | undefined;
  onUpdateSlides: (slides: Slide[]) => void;
  onAddSlide: (parentId: number | null) => void;
  snippets: Snippet[];
  onInsertSnippet: (code: string) => void;
  chatHistory: { role: 'user' | 'ai', text: string }[];
  chatInput: string;
  setChatInput: (input: string) => void;
  onSendChat: () => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
  slides, slideSpaceId, onUpdateSlides, onAddSlide,
  snippets, onInsertSnippet, chatHistory, chatInput, setChatInput, onSendChat
}) => {
  const navigate = useNavigate();

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    setSidebarOpen(true);
  };

  const navButtons = [
    { tab: 'explorer' as SidebarTab, icon: Files },
    { tab: 'snippets' as SidebarTab, icon: Code },
    { tab: 'git' as SidebarTab, icon: GitBranch },
    { tab: 'comments' as SidebarTab, icon: MessageSquare },
    { tab: 'ai' as SidebarTab, icon: Sparkles, pulse: true },
  ];

  return (
    <>
      <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-[#0c0c0e] z-30">
        <Link to="/dashboard" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-xl mb-4">
          <Home className="w-6 h-6" />
        </Link>
        {navButtons.map(({ tab, icon: Icon, pulse }) => (
          <button 
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`p-3 transition-all relative rounded-2xl group ${activeTab === tab && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <Icon className={`w-6 h-6 ${pulse ? 'group-hover:animate-pulse' : ''}`} />
            {activeTab === tab && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
          </button>
        ))}
      </div>

      {sidebarOpen && (
        <div className="w-[260px] flex-shrink-0 border-r border-white/5 bg-[#09090b] flex flex-col min-w-0 animate-in slide-in-from-left-2 duration-200">
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
                onUpdate={onUpdateSlides}
                onAddChild={onAddSlide}
                onAddRoot={() => onAddSlide(null)}
              />
            )}
            {activeTab === 'snippets' && (
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Workspace Snippets</span>
                  <Link to="/settings/snippets" className="text-[10px] text-white/20 hover:text-white transition-colors underline">Manage</Link>
                </div>
                {snippets.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => onInsertSnippet(s.code)}
                    className="w-full bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl text-left group transition-all"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-white/80 group-hover:text-white">{s.name}</span>
                    </div>
                    <div className="bg-black/20 p-2 rounded-lg text-[8px] font-mono text-white/30 truncate group-hover:text-white/50">
                      {s.code.slice(0, 80)}...
                    </div>
                  </button>
                ))}
              </div>
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
                      onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
                      placeholder="Ask Slidev Assistant..." 
                      className="bg-transparent text-xs w-full focus:outline-none px-3" 
                    />
                    <button onClick={onSendChat} className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EditorSidebar;
