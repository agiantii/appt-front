import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { Snippet } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';

interface SnippetEditorProps {
  snippet: Snippet;
}

export interface SnippetEditorRef {
  getContent: () => string;
}

const SnippetEditor = forwardRef<SnippetEditorRef, SnippetEditorProps>(({ snippet }, ref) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useImperativeHandle(ref, () => ({
    getContent: () => viewRef.current?.state.doc.toString() || ''
  }));

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
        "&": { 
          backgroundColor: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#e4e4e7" : "#18181b"
        },
        ".cm-gutters": { 
          backgroundColor: isDark ? "#0c0c0e" : "#f9fafb",
          color: isDark ? "#3f3f46" : "#6b7280",
          border: "none"
        }
      }, { dark: isDark })
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
    <div ref={containerRef} className={`border rounded-xl overflow-hidden min-h-[300px] ${
      isDark ? 'border-white/10' : 'border-gray-200'
    }`} />
  );
});

export default SnippetEditor;
