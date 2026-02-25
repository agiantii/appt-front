
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sidebar as SidebarIcon } from 'lucide-react';
import { SidebarTab, Slide, Snippet } from '../../../types';
import FileTree from '../../../components/SpaceTree/FileTree';
import { SidebarNav } from './SidebarNav';
import { SnippetsPanel } from './SnippetsPanel';
import { VersionsPanel } from './VersionsPanel';
import { CommentsPanel } from './CommentsPanel';
import { AIPanel } from './AIPanel';

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
  slideId?: string;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
  onVersionRollback?: (content: string) => void;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
  slides, slideSpaceId, onUpdateSlides, onAddSlide,
  snippets, onInsertSnippet, chatHistory, chatInput, setChatInput, onSendChat,
  slideId, currentUser, onVersionRollback
}) => {
  const navigate = useNavigate();

  const handleTabClick = (tab: SidebarTab) => {
    setActiveTab(tab);
    setSidebarOpen(true);
  };

  return (
    <>
      <SidebarNav
        activeTab={activeTab}
        sidebarOpen={sidebarOpen}
        onTabClick={handleTabClick}
      />

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
                slideSpaceId={slideSpaceId}
                onSelect={(id) => navigate(`/slide/${slideSpaceId}/${id}`)}
                onUpdate={onUpdateSlides}
                onAddChild={onAddSlide}
                onAddRoot={() => onAddSlide(null)}
              />
            )}
            {activeTab === 'snippets' && (
              <SnippetsPanel
                snippets={snippets}
                onInsertSnippet={onInsertSnippet}
              />
            )}
            {activeTab === 'git' && (
              <VersionsPanel
                slideId={slideId}
                onVersionRollback={onVersionRollback}
              />
            )}
            {activeTab === 'comments' && (
              <CommentsPanel
                slideId={slideId}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'ai' && (
              <AIPanel
                chatHistory={chatHistory}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onSendChat={onSendChat}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EditorSidebar;

