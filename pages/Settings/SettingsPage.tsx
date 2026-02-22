
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User as UserIcon, Code, Bell, Shield, ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { userApi } from '../../api/user';
import { snippetApi } from '../../api/snippet';
import { User, Snippet } from '../../types';

// CodeMirror for snippet editing
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const SnippetEditor: React.FC<{ snippet: Snippet; onSave: (code: string) => void }> = ({ snippet, onSave }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Snippet editor defaults to markdown as it covers most Slidev/Vue use cases
    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      bracketMatching(),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      EditorView.theme({
        "&": { backgroundColor: "#09090b", color: "#e4e4e7" },
        ".cm-gutters": { backgroundColor: "#0c0c0e", color: "#3f3f46", border: "none" }
      }, { dark: true })
    ];

    const state = EditorState.create({
      doc: snippet.content,
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
      <div ref={containerRef} className="border border-white/10 rounded-xl overflow-hidden min-h-[300px]" />
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
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    userApi.getCurrentUser().then(res => {
      if (res.statusCode === 0) setUser(res.data);
    });
    snippetApi.findAll().then(res => {
      if (res.statusCode === 0) setSnippets(res.data);
    });
  }, []);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId);

  const sidebarLinks = [
    { label: 'Profile', path: 'info', icon: UserIcon },
    { label: 'Snippets', path: 'snippets', icon: Code },
    { label: 'Notifications', path: 'notifications', icon: Bell },
    { label: 'Security', path: 'security', icon: Shield },
  ];

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
              {user && (
                <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                   <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-24 h-24 rounded-2xl object-cover" />
                   <div>
                      <h3 className="text-xl font-bold">{user.username}</h3>
                      <p className="text-white/40 text-sm">{user.email}</p>
                   </div>
                </div>
              )}
            </div>
          } />
          <Route path="snippets" element={
            <div className="space-y-8 animate-in fade-in duration-500">
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
                          onChange={async (e) => {
                            const newName = e.target.value;
                            try {
                              const res = await snippetApi.update(activeSnippet.id, { name: newName });
                              if (res.statusCode === 0) {
                                setSnippets(snippets.map(s => s.id === activeSnippet.id ? res.data : s));
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Code Content</label>
                        <SnippetEditor 
                          snippet={activeSnippet} 
                          onSave={async (content) => {
                            try {
                              const res = await snippetApi.update(activeSnippet.id, { content });
                              if (res.statusCode === 0) {
                                setSnippets(snippets.map(s => s.id === activeSnippet.id ? res.data : s));
                              }
                            } catch (err) {
                              console.error(err);
                            }
                          }} 
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
