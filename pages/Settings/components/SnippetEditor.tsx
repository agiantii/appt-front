import React, { useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { Snippet } from '../../../types';

interface SnippetEditorProps {
  snippet: Snippet;
  onSave: (code: string) => void;
}

const SnippetEditor: React.FC<SnippetEditorProps> = ({ snippet, onSave }) => {
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

export default SnippetEditor;
