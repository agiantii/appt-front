import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorView, lineNumbers, highlightActiveLine, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { Snippet } from '../../../types';

interface SnippetEditorProps {
  snippet: Snippet;
}

export interface SnippetEditorRef {
  getContent: () => string;
}

const SnippetEditor = forwardRef<SnippetEditorRef, SnippetEditorProps>(({ snippet }, ref) => {
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
    <div ref={containerRef} className="border border-white/10 rounded-xl overflow-hidden min-h-[300px]" />
  );
});

export default SnippetEditor;
