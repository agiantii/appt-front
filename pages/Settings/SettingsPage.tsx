
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User as UserIcon, Code, Bell, Shield, ArrowLeft, Plus, Trash2, Save, ChevronRight } from 'lucide-react';
import { mockUser, mockSnippets } from '../../data/mock';
import { Snippet } from '../../types';

// CodeMirror for snippet editing
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const SnippetEditor: React.FC<{ snippet: Snippet; onSave: (code: string) => void }> = ({ snippet, onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      EditorView.theme({
        "&": { backgroundColor: "#09090b", color: "#e4e4e7" },
        ".cm-gutters": { backgroundColor: "#0c0c0e", color: "#3f3f46", border: "none" }
      }, { dark: true })
    ];

    if (snippet.language === 'markdown') extensions.push(markdown());
    else if (snippet.language === 'css') extensions.push(css());
    else if (snippet.language === 'javascript') extensions.push(javascript());

    const state = EditorState.create({
      doc: snippet.code,
      extensions
    });

    const view = new EditorView({
      state,
      parent: containerRef.current
    });

    viewRef.current = view;
    return () => view.destroy();
  }, [snippet.id]);

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="border border-white/10 rounded-xl overflow-hidden min-h-[200px]" />
      <button 
        onClick={() => onSave(viewRef.current?.state.doc.toString() || "")}
        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-white/90 transition-all"
      >
        <Save className="w-3.5 h-3.5" /> Update Content
      </button>
    </div>
  );
};

const SettingsPage: React.FC = () => {
  const location = useLocation();
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('user-snippets');
    return saved ? JSON.parse(saved) : mockSnippets;
  });
  const [activeSnippetId, setActiveSnippetId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('user-snippets', JSON.stringify(snippets));
  }, [snippets]);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId);

  const sidebarLinks = [
    { label: 'Profile', path: 'info', icon: UserIcon },
    { label: 'Snippets', path: 'snippets', icon: Code },
    { label: 'Notifications', path: 'notifications', icon: Bell },
    { label: 'Security', path: 'security', icon: Shield },
  ];

  const handleAddSnippet = () => {
    const newSnippet: Snippet = {
      id: Date.now().toString(),
      name: 'New Snippet',
      code: '# New Snippet\nContent here...',
      language: 'markdown'
    };
    setSnippets([newSnippet, ...snippets]);
    setActiveSnippetId(newSnippet.id);
  };

  const handleDeleteSnippet = (id: string) => {
    setSnippets(snippets.filter(s => s.id !== id));
    if (activeSnippetId === id) setActiveSnippetId(null);
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      <aside className="w-64 border-r border-white/5 bg-[#0c0c0e] flex flex-col p-6">
        <Link to="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6 px-3">User Settings</h2>
        <nav className="space-y-1">
          {sidebarLinks.map(link => {
            const isActive = location.pathname.includes(`/settings/${link.path}`);
            return (
              <Link 
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/30'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto max-w-5xl">
        <Routes>
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={
            <div className="space-y-8 animate-in fade-in duration-500">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Info</h1>
                <p className="text-white/40">Manage your account details and public appearance.</p>
              </div>
              <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                 <img src={mockUser.avatar} className="w-24 h-24 rounded-2xl object-cover" />
                 <div>
                    <h3 className="text-xl font-bold">{mockUser.name}</h3>
                    <p className="text-white/40 text-sm">{mockUser.email}</p>
                 </div>
              </div>
            </div>
          } />
          <Route path="snippets" element={
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Code Snippets</h1>
                  <p className="text-white/40">Reusable components and scripts for your Slidev presentations.</p>
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
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold truncate">{s.name}</span>
                        <Trash2 
                          onClick={(e) => { e.stopPropagation(); handleDeleteSnippet(s.id); }}
                          className={`w-3.5 h-3.5 transition-colors ${activeSnippetId === s.id ? 'text-black/40 hover:text-red-600' : 'text-white/20 hover:text-red-400'}`} 
                        />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeSnippetId === s.id ? 'text-black/40' : 'text-white/20'}`}>{s.language}</span>
                    </button>
                  ))}
                </div>

                <div className="col-span-2 space-y-6">
                  {activeSnippet ? (
                    <div className="p-8 bg-[#0c0c0e] border border-white/10 rounded-3xl space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Snippet Name</label>
                          <input 
                            value={activeSnippet.name}
                            onChange={(e) => setSnippets(snippets.map(s => s.id === activeSnippet.id ? { ...s, name: e.target.value } : s))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Language</label>
                          <select 
                            value={activeSnippet.language}
                            onChange={(e) => setSnippets(snippets.map(s => s.id === activeSnippet.id ? { ...s, language: e.target.value } : s))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
                          >
                            <option value="markdown">Markdown</option>
                            <option value="css">CSS</option>
                            <option value="javascript">JavaScript</option>
                            <option value="html">HTML</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Content</label>
                        <SnippetEditor 
                          snippet={activeSnippet} 
                          onSave={(code) => setSnippets(snippets.map(s => s.id === activeSnippet.id ? { ...s, code } : s))} 
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
          } />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage;
