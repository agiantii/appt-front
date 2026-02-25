import React from 'react';
import { Link } from 'react-router-dom';
import { Snippet } from '../../../types';

interface SnippetsPanelProps {
  snippets: Snippet[];
  onInsertSnippet: (code: string) => void;
}

export const SnippetsPanel: React.FC<SnippetsPanelProps> = ({
  snippets,
  onInsertSnippet,
}) => {
  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Workspace Snippets</span>
        <Link to="/settings/snippets" className="text-[10px] text-white/20 hover:text-white transition-colors underline">Manage</Link>
      </div>
      {snippets.map(s => (
        <button
          key={s.id}
          onClick={() => onInsertSnippet(s.content)}
          className="w-full bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl text-left group transition-all"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-white/80 group-hover:text-white">{s.name}</span>
          </div>
          <div className="bg-black/20 p-2 rounded-lg text-[8px] font-mono text-white/30 truncate group-hover:text-white/50">
            {s.content.slice(0, 80)}...
          </div>
        </button>
      ))}
    </div>
  );
};
