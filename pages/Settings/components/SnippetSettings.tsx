import React, { useState, useEffect } from 'react';
import { Code, Plus, Trash2 } from 'lucide-react';
import { snippetApi } from '../../../api/snippet';
import { Snippet } from '../../../types';
import SnippetEditor from './SnippetEditor';

const SnippetSettings: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    snippetApi.findAll().then(res => {
      if (res.statusCode === 0) setSnippets(res.data);
    });
  }, []);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId);

  const handleAddSnippet = async () => {
    try {
      const res = await snippetApi.create({
        name: 'New Snippet',
        content: '# New Snippet\nContent here...',
      });
      if (res.statusCode === 0) {
        setSnippets([res.data, ...snippets]);
        setActiveSnippetId(res.data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    try {
      const res = await snippetApi.remove(id);
      if (res.statusCode === 0) {
        setSnippets(snippets.filter(s => s.id !== id));
        if (activeSnippetId === id) setActiveSnippetId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateName = async (id: number, newName: string) => {
    try {
      const res = await snippetApi.update(id, { name: newName });
      if (res.statusCode === 0) {
        setSnippets(snippets.map(s => s.id === id ? res.data : s));
        showMessage('success', 'Snippet name updated');
      }
    } catch (err) {
      showMessage('error', 'Failed to update name');
    }
  };

  const handleUpdateContent = async (id: number, content: string) => {
    try {
      const res = await snippetApi.update(id, { content });
      if (res.statusCode === 0) {
        setSnippets(snippets.map(s => s.id === id ? res.data : s));
        showMessage('success', 'Snippet content updated');
      }
    } catch (err) {
      showMessage('error', 'Failed to update content');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {message && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Workspace Snippets</h1>
          <p className="text-white/40">Reusable Slidev templates and Vue components.</p>
        </div>
        <button 
          onClick={handleAddSnippet}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" /> Add Snippet
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8 items-start">
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {snippets.map(s => (
            <button 
              key={s.id}
              onClick={() => setActiveSnippetId(s.id)}
              className={`w-full group p-4 rounded-2xl border transition-all text-left ${activeSnippetId === s.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold truncate">{s.name}</span>
                <Trash2 
                  onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(s.id); }}
                  className={`w-3.5 h-3.5 transition-colors ${activeSnippetId === s.id ? 'text-black/40 hover:text-red-600' : 'text-white/20 hover:text-red-400'}`} 
                />
              </div>
            </button>
          ))}
        </div>

        <div className="col-span-2 space-y-6">
          {activeSnippet ? (
            <div className="p-8 bg-[#0c0c0e] border border-white/10 rounded-3xl space-y-6 animate-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Snippet Name</label>
                <input 
                  value={activeSnippet.name}
                  onChange={(e) => handleUpdateName(activeSnippet.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Code Content</label>
                <SnippetEditor 
                  snippet={activeSnippet} 
                  onSave={(content) => handleUpdateContent(activeSnippet.id, content)} 
                />
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl text-white/20">
              <Code className="w-12 h-12 mb-4 opacity-5" />
              <p className="text-sm font-medium">Select a snippet to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SnippetSettings;
