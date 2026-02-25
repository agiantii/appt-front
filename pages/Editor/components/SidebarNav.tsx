import React from 'react';
import { Link } from 'react-router-dom';
import { Files, Code, GitBranch, MessageSquare, Sparkles, Home, Sidebar as SidebarIcon } from 'lucide-react';
import { SidebarTab } from '../../../types';

interface SidebarNavProps {
  activeTab: SidebarTab;
  sidebarOpen: boolean;
  onTabClick: (tab: SidebarTab) => void;
}

const navButtons = [
  { tab: 'explorer' as SidebarTab, icon: Files },
  { tab: 'snippets' as SidebarTab, icon: Code },
  { tab: 'git' as SidebarTab, icon: GitBranch },
  { tab: 'comments' as SidebarTab, icon: MessageSquare },
  { tab: 'ai' as SidebarTab, icon: Sparkles, pulse: true },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  sidebarOpen,
  onTabClick,
}) => {
  return (
    <div className="w-14 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-[#0c0c0e] z-30">
      <Link to="/dashboard" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all active:scale-90 shadow-xl mb-4">
        <Home className="w-6 h-6" />
      </Link>
      {navButtons.map(({ tab, icon: Icon, pulse }) => (
        <button
          key={tab}
          onClick={() => onTabClick(tab)}
          className={`p-3 transition-all relative rounded-2xl group ${activeTab === tab && sidebarOpen ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
        >
          <Icon className={`w-6 h-6 ${pulse ? 'group-hover:animate-pulse' : ''}`} />
          {activeTab === tab && sidebarOpen && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_12px_white]" />}
        </button>
      ))}
    </div>
  );
};
