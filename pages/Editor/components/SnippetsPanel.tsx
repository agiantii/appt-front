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
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Workspace Snippets</span>
        <Link to="/settings/snippets" className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline">Manage</Link>
      </div>
      {snippets.map(s => (
        <button
          key={s.id}
          onClick={() => onInsertSnippet(s.content)}
          className="w-full bg-accent border border-border hover:border-border p-3 rounded-xl text-left group transition-all"
        >
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-foreground group-hover:text-foreground">{s.name}</span>
          </div>
          <div className="bg-accent p-2 rounded-lg text-[8px] font-mono text-muted-foreground truncate group-hover:text-muted-foreground">
            {s.content.slice(0, 80)}...
          </div>
        </button>
      ))}
    </div>
  );
};
