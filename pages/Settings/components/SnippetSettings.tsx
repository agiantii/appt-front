import React, { useState, useEffect, useRef } from 'react';
import { Code, Plus, Trash2, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { snippetApi } from '../../../api/snippet';
import { Snippet } from '../../../types';
import SnippetEditor, { SnippetEditorRef } from './SnippetEditor';

// Toast 通知组件
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      setTimeout(() => onRemove(toast.id), 2000);
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-right duration-200 ${
            toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const SnippetSettings: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [activeSnippetId, setActiveSnippetId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [tempName, setTempName] = useState<string>('');
  const editorRef = useRef<SnippetEditorRef | null>(null);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    snippetApi.findAll().then(res => {
      if (res.statusCode === 0) setSnippets(res.data);
    });
  }, []);

  const activeSnippet = snippets.find(s => s.id === activeSnippetId);

  useEffect(() => {
    if (activeSnippet) {
      setTempName(activeSnippet.name);
    }
  }, [activeSnippet]);

  // 生成不重复的随机名称
  const generateUniqueName = () => {
    const adjectives = ['Quick', 'Smart', 'Cool', 'Fast', 'Neat', 'Easy', 'Tiny', 'Bold', 'Wild', 'Pure'];
    const nouns = ['Snippet', 'Code', 'Block', 'Template', 'Component', 'Module', 'Widget', 'Element'];
    
    let name = '';
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(Math.random() * 999) + 1;
      name = `${adj} ${noun} ${num}`;
      attempts++;
    } while (snippets.some(s => s.name === name) && attempts < maxAttempts);
    
    // 如果还是重复,添加时间戳
    if (snippets.some(s => s.name === name)) {
      name = `Snippet ${Date.now()}`;
    }
    
    return name;
  };

  const handleAddSnippet = async () => {
    try {
      const uniqueName = generateUniqueName();
      const res = await snippetApi.create({
        name: uniqueName,
        content: '# New Snippet\nContent here...',
      });
      if (res.statusCode === 0) {
        setSnippets([res.data, ...snippets]);
        setActiveSnippetId(res.data.id);
        addToast('Snippet created successfully', 'success');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create snippet';
      addToast(errorMsg, 'error');
    }
  };

  const handleDeleteSnippet = async (id: number) => {
    try {
      const res = await snippetApi.remove(id);
      if (res.statusCode === 0) {
        setSnippets(snippets.filter(s => s.id !== id));
        if (activeSnippetId === id) setActiveSnippetId(null);
        addToast('Snippet deleted', 'success');
      }
    } catch (err) {
      addToast('Failed to delete snippet', 'error');
    }
  };

  const handleSaveSnippet = async () => {
    if (!activeSnippet || !editorRef.current) return;
    
    try {
      const content = editorRef.current.getContent();
      const res = await snippetApi.update(activeSnippet.id, { 
        name: tempName,
        content 
      });
      if (res.statusCode === 0) {
        setSnippets(snippets.map(s => s.id === activeSnippet.id ? res.data : s));
        addToast('Snippet saved successfully', 'success');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to save snippet';
      addToast(errorMsg, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Edit Snippet</h2>
                <button 
                  onClick={handleSaveSnippet}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg font-bold text-xs hover:bg-white/90 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Snippet Name</label>
                <input 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Code Content</label>
                <SnippetEditor 
                  ref={editorRef}
                  snippet={activeSnippet} 
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
