
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Files, 
  Sparkles, 
  Image as ImageIcon,
  Layout,
  Settings as SettingsIcon,
  Home,
  Sidebar as SidebarIcon,
  History,
  ArrowRight,
  Zap
} from 'lucide-react';
import { slideApi } from '../../api/slide';
import { snippetApi } from '../../api/snippet';
import { userApi } from '../../api/user';
import { versionApi } from '../../api/version';
import { SidebarTab, Slide, Snippet, User, ConnectionInfo } from '../../types';
import { PERMISSIONS, SlideRole } from '../../constant/permissions';
import ResizableLayout from '../../components/Editor/ResizablePanels';
import { GoogleGenAI } from '@google/genai';

// Custom Hooks & Components
import { useSlideParser } from './useSlideParser';
import EditorHeader from './components/EditorHeader';
import EditorSidebar from './components/EditorSidebar';
import EditorPreview from './components/EditorPreview';
import { CollaboratorModal } from '../../components/Editor/CollaboratorModal';

// Yjs and Hocuspocus
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { yCollab } from 'y-codemirror.next';

// CodeMirror Imports
import { 
  EditorView, 
  lineNumbers, 
  highlightActiveLineGutter, 
  highlightSpecialChars, 
  drawSelection, 
  dropCursor, 
  rectangularSelection, 
  crosshairCursor, 
  highlightActiveLine, 
  keymap 
} from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { languages } from '@codemirror/language-data';
import { tags as t } from '@lezer/highlight';
import { 
  HighlightStyle, 
  syntaxHighlighting, 
  foldGutter, 
  indentOnInput, 
  bracketMatching, 
  defaultHighlightStyle,
  foldKeymap
} from '@codemirror/language';
import { history, historyKeymap, defaultKeymap, indentWithTab } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, CompletionContext } from '@codemirror/autocomplete';

const slidevDarkTheme = EditorView.theme({
  "&": { 
    color: "#e4e4e7", 
    backgroundColor: "transparent", 
    fontSize: "14px",
    height: "100%" 
  },
  "& .cm-scroller": {
    overflow: "auto",
    outline: "none"
  },
  ".cm-content": { 
    caretColor: "#ffffff", 
    paddingTop: "24px", 
    paddingBottom: "24px",
    minHeight: "100%"
  },
  "&.cm-focused .cm-cursor": { borderLeftColor: "#ffffff" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(99, 102, 241, 0.35) !important" },
  ".cm-gutters": { 
    backgroundColor: "#09090b", 
    color: "#3f3f46", 
    borderRight: "1px solid rgba(255,255,255,0.05)", 
    paddingLeft: "10px", 
    paddingRight: "10px" 
  },
  ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.02)" },
  ".cm-activeLineGutter": { backgroundColor: "rgba(255,255,255,0.05)", color: "#a1a1aa" },
  ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: "#71717a" }
}, { dark: true });

const slidevHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.4em", fontWeight: "bold", color: "#fafafa" },
  { tag: t.heading2, fontSize: "1.2em", fontWeight: "bold", color: "#f4f4f5" },
  { tag: t.heading3, fontSize: "1.1em", fontWeight: "bold", color: "#e4e4e7" },
  { tag: t.keyword, color: "#93c5fd" },
  { tag: t.operator, color: "#d1d5db" },
  { tag: t.string, color: "#86efac" },
  { tag: t.comment, color: "#52525b", fontStyle: "italic" },
  { tag: t.meta, color: "#d8b4fe" },
  { tag: t.url, color: "#93c5fd", textDecoration: "underline" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, color: "#93c5fd" },
  { tag: t.list, color: "#fcd34d" },
]);

const EditorPage: React.FC = () => {
  const { slideSpaceId, slideId } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const outlineScrollRef = useRef<HTMLDivElement>(null);
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [content, setContent] = useState<string | null>('');
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [previewMode, setPreviewMode] = useState<'dev' | 'build'>('dev');
  const [outlineHeight, setOutlineHeight] = useState(240);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);

  useEffect(() => {
    if (slideSpaceId) {
      slideApi.findAllBySpace(Number(slideSpaceId)).then(res => {
        if (res.statusCode === 0) setSlides(res.data);
      });
    }
    if (slideId) {
      slideApi.findOne(Number(slideId)).then(res => {
        if (res.statusCode === 0) {
          setCurrentSlide(res.data);
          setContent(res.data.content);
        }
      });
      slideApi.getCollaborators(Number(slideId)).then(res => {
        if (res.statusCode === 0) setCollaborators(res.data);
      });
      // Get current user's role for this slide
      slideApi.getMyRole(Number(slideId)).then(res => {
        if (res.statusCode === 0) {
          setUserRole(res.data.role as SlideRole);
        }
      });
    }
    snippetApi.findAll().then(res => {
      if (res.statusCode === 0) setSnippets(res.data);
    });
    userApi.getCurrentUser().then(res => {
      if (res.statusCode === 0) setCurrentUser(res.data);
    });
  }, [slideSpaceId, slideId]);

  const slidePages = useSlideParser(content);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+B: toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl+S: save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveRef.current?.();
      }
      // Ctrl+Shift+S: save and create version
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveAndVersionRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refs for keyboard shortcuts
  const handleSaveRef = useRef<() => void>();
  const handleSaveAndVersionRef = useRef<() => void>();

  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const initialContentRef = useRef<string>('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<SlideRole | null>(null);
  
  useEffect(() => {
    initialContentRef.current = currentSlide?.content || '';
  }, [currentSlide?.id]);
  
  // Fetch WebSocket connection info and initialize WebSocket
  useEffect(() => {
    if (!slideId) return;
    
    // Reset authentication state when slide changes
    setIsAuthenticated(false);

    const initWebSocket = async () => {
      try {
        const res = await slideApi.getConnectionInfo(Number(slideId));
        if (res.statusCode !== 0 || !res.data?.token) {
          throw new Error(res.message || '获取连接信息失败');
        }

        const connInfo = res.data;
        setConnectionInfo(connInfo);

        if (providerRef.current) providerRef.current.destroy();
        if (ydocRef.current) ydocRef.current.destroy();

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;
        const yText = ydoc.getText('codemirror');
        yTextRef.current = yText;

        const provider = new HocuspocusProvider({
          url: connInfo.url,
          name: connInfo.docName,
          document: ydoc,
          token: connInfo.token,
          onConnect: () => {
            console.log('[WebSocket] Connected to:', connInfo.docName);
          },
          onDisconnect: () => {
            console.log('[WebSocket] Disconnected from:', connInfo.docName);
          },
          onAuthenticated(data) {
            console.log('[WebSocket] Authenticated:', data);
            setIsAuthenticated(true);
          },
          onAuthenticationFailed: () => {
            alert('WebSocket 认证失败，请重新登录');
          },
        });

        providerRef.current = provider;

        const generateUserColor = (username: string): string => {
          const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
            '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
          ];
          let hash = 0;
          for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
          }
          return colors[Math.abs(hash) % colors.length];
        };

        const userRes = await userApi.getCurrentUser();
        if (userRes.statusCode === 0) {
          provider.setAwarenessField('user', {
            name: userRes.data.username,
            color: generateUserColor(userRes.data.username)
          });
        }
      } catch (err) {
        console.error('[WebSocket] 初始化失败:', err);
        alert('协同编辑连接失败: ' + (err instanceof Error ? err.message : '未知错误'));
      }
    };

    initWebSocket();

    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, [slideId]);

  const insertSnippet = useCallback((code: string) => {
    if (editorViewRef.current) {
      const { state, dispatch } = editorViewRef.current;
      const range = state.selection.main;
      dispatch({
        changes: { from: range.from, to: range.to, insert: code },
        selection: { anchor: range.from + code.length }
      });
      editorViewRef.current.focus();
    }
  }, []);

  const snippetCompletionSource = useCallback((context: CompletionContext) => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;
    return { 
      from: word.from, 
      options: snippets.map(s => ({ 
        label: s.name, 
        type: "text", 
        detail: "Snippet", 
        apply: s.code 
      })),
      filter: true
    };
  }, [snippets]);

  const manualBasicSetup = useMemo(() => [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      indentWithTab, // Enable Tab indentation
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
    ]),
  ], []);

  useEffect(() => {
    if (!editorContainerRef.current) return;
    if (!yTextRef.current || !providerRef.current) return;
    if (!isAuthenticated) return;

    const yText = yTextRef.current;
    const provider = providerRef.current;

    // Get initial content from Yjs document or fallback to currentSlide content
    let initialDoc = yText.toString() || initialContentRef.current || "";

    // Check if user has edit permission
    const canEdit = userRole ? PERMISSIONS[userRole]?.includes('edit') : false;

    const view = new EditorView({
      state: EditorState.create({
        doc: initialDoc,
        extensions: [
          EditorView.editable.of(canEdit),
          ...manualBasicSetup,
          yCollab(yText, provider.awareness),
          markdown({ base: markdownLanguage, codeLanguages: languages }),
          html(),
          css(),
          javascript(),
          Prec.high(EditorState.languageData.of(() => [{
            autocomplete: snippetCompletionSource
          }])),
          slidevDarkTheme,
          syntaxHighlighting(slidevHighlightStyle),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && update.view) {
              try {
                const newDocString = update.view.state.doc.toString();
                if (newDocString !== undefined) {
                  setContent(newDocString);
                }
              } catch (err) {
                console.warn("Failed to get doc string in update listener", err);
              }
            }
          }),
        ],
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [slideId, manualBasicSetup, snippetCompletionSource, isAuthenticated, userRole]);

  const handleSave = useCallback(async () => {
    if (!slideId) return;
    setIsSaving(true);
    try {
      await slideApi.saveContent(Number(slideId), content);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [slideId, content]);

  // Ctrl+Shift+S: save and create version
  const handleSaveAndCreateVersion = useCallback(async () => {
    if (!slideId) return;
    setIsSaving(true);
    try {
      await slideApi.saveContent(Number(slideId), content);
      await versionApi.create(Number(slideId), { commitMsg: `保存于 ${new Date().toLocaleString()}` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [slideId, content]);

  // Update refs for keyboard shortcuts
  useEffect(() => {
    handleSaveRef.current = handleSave;
    handleSaveAndVersionRef.current = handleSaveAndCreateVersion;
  }, [handleSave, handleSaveAndCreateVersion]);

  const handleAiChat = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert Slidev designer. Help the user edit this presentation:\n\nContent:\n${content}\n\nUser Request: ${userText}`,
      });
      
      const aiText = response.text || "I'm sorry, I couldn't process that.";
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Assistant currently offline." }]);
    }
  };

  const jumpToSlide = useCallback((line: number) => {
    if (editorViewRef.current) {
      try {
        const lineData = editorViewRef.current.state.doc.line(Math.max(1, Math.min(line, editorViewRef.current.state.doc.lines)));
        editorViewRef.current.dispatch({
          selection: { anchor: lineData.from },
          scrollIntoView: true
        });
        editorViewRef.current.focus();
      } catch (e) {
        console.error("Jump to slide failed", e);
      }
    }
  }, []);

  const handleAddSlide = async (parentId: number | null) => {
    try {
      const res = await slideApi.create({
        title: 'New Slide',
        slideSpaceId: Number(slideSpaceId),
        parentId,
        content: '---\n# New Slide\nContent...',
        isPublic: false,
        allowComment: true
      });
      if (res.statusCode === 0) {
        setSlides([...slides, res.data]);
        navigate(`/slide/${slideSpaceId}/${res.data.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const editorCenter = (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] overflow-hidden">
      <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#09090b] overflow-x-auto whitespace-nowrap hide-scrollbar flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#18181b] px-4 py-2 rounded-t-xl border-t border-x border-white/10 -mb-[1px]">
          <Files className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs font-semibold text-white/90">{currentSlide?.title}.md</span>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Container must be 100% height to allow CodeMirror virtual scrolling */}
        <div ref={editorContainerRef} className="absolute inset-0" />
      </div>
      <div className="h-10 border-t border-white/5 flex items-center justify-between px-4 bg-[#09090b] text-[10px] font-bold text-white/30 uppercase tracking-widest flex-shrink-0">
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><ImageIcon className="w-3.5 h-3.5" /> Media</div>
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><Layout className="w-3.5 h-3.5" /> Layouts</div>
           <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"><SettingsIcon className="w-3.5 h-3.5" /> Config</div>
        </div>
        <div>Ln {content?.split('\n').length || 0}, Col {content?.length || 0}</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-white overflow-hidden select-none font-sans">
      <EditorSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        slides={slides}
        slideSpaceId={slideSpaceId}
        onUpdateSlides={setSlides}
        onAddSlide={handleAddSlide}
        snippets={snippets}
        onInsertSnippet={insertSnippet}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendChat={handleAiChat}
        slideId={slideId}
        currentUser={currentUser}
        onVersionRollback={(rolledBackContent) => {
          setContent(rolledBackContent);
          // Update editor content
          if (editorViewRef.current) {
            const view = editorViewRef.current;
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: rolledBackContent }
            });
          }
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <EditorHeader 
          currentSlide={currentSlide}
          collaborators={collaborators}
          isSaving={isSaving}
          onSave={handleSave}
          previewOpen={previewOpen}
          onTogglePreview={() => setPreviewOpen(!previewOpen)}
          slideId={slideId}
          onOpenCollaboratorModal={() => setCollaboratorModalOpen(true)}
        />
        <CollaboratorModal
          isOpen={collaboratorModalOpen}
          onClose={() => setCollaboratorModalOpen(false)}
          slideId={Number(slideId)}
          currentUser={currentUser}
        />
        <ResizableLayout 
          left={null}
          center={editorCenter}
          leftOpen={false}
          rightOpen={previewOpen}
          right={
            <EditorPreview 
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              content={content}
              outlineHeight={outlineHeight}
              onOutlineResize={(e) => {
                e.preventDefault();
                const startY = e.clientY;
                const startH = outlineHeight;
                const move = (me: MouseEvent) => setOutlineHeight(Math.max(100, Math.min(600, startH + (startY - me.clientY))));
                const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                window.addEventListener('mousemove', move);
                window.addEventListener('mouseup', up);
              }}
              slidePages={slidePages}
              onJumpToSlide={jumpToSlide}
              onScrollOutline={dir => outlineScrollRef.current?.scrollBy({ top: dir === 'top' ? -100 : 100, behavior: 'smooth' })}
              outlineScrollRef={outlineScrollRef}
              slideId={slideId}
            />
          }
        />
      </div>
    </div>
  );
};

export default EditorPage;
