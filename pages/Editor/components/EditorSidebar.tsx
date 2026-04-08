
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
  slideId?: string;
  currentUser?: { id: number; username: string; avatarUrl: string | null } | null;
  onVersionRollback?: (content: string) => void;
  onInsertContent?: (content: string) => void;
  fullContent?: string;
}

const EditorSidebar: React.FC<EditorSidebarProps> = ({
  activeTab, setActiveTab, sidebarOpen, setSidebarOpen,
  slides, slideSpaceId, onUpdateSlides, onAddSlide,
  snippets, onInsertSnippet,
  slideId, currentUser, onVersionRollback, onInsertContent, fullContent
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
        <div className="w-[260px] flex-shrink-0 border-r border-border bg-background flex flex-col min-w-0 animate-in slide-in-from-left-2 duration-200">
          <div className="p-3 border-b border-border flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
               <Zap className="w-3.5 h-3.5 text-muted-foreground" />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{activeTab}</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors">
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
                currentContent={fullContent}
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
                onInsertContent={onInsertContent}
                fullContent={fullContent}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EditorSidebar;

