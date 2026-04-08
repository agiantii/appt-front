
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
  Zap,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { slideApi } from '../../api/slide';
import { InputModal } from '../../components/Common/Modal';
import { snippetApi } from '../../api/snippet';
import { userApi } from '../../api/user';
import { versionApi } from '../../api/version';
import { uploadApi } from '../../api/upload';
import { spaceApi } from '../../api/space';
import { SidebarTab, Slide, SlideSpace, Snippet, User, ConnectionInfo } from '../../types';
import { PERMISSIONS, SlideRole } from '../../constant/permissions';
import ResizableLayout from '../../components/Editor/ResizablePanels';
import { streamInlineEdit, suggestAltText } from '../../api/ai';
import { useTheme } from '../../contexts/ThemeContext';

// Custom Hooks & Components
import { useSlideParser } from './useSlideParser';
import EditorHeader from './components/EditorHeader';
import EditorSidebar from './components/EditorSidebar';
import EditorPreview from './components/EditorPreview';
import { CollaboratorModal } from '../../components/Editor/CollaboratorModal';
import { QuickActionWidget } from './components/QuickActionWidget';

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

// 暗色模式主题
const slidevDarkTheme = EditorView.theme({
  "&": {
    color: "hsl(var(--foreground))",
    backgroundColor: "transparent",
    fontSize: "14px",
    height: "100%"
  },
  "& .cm-scroller": {
    overflow: "auto",
    outline: "none"
  },
  ".cm-content": {
    caretColor: "hsl(var(--foreground))",
    paddingTop: "24px",
    paddingBottom: "24px",
    minHeight: "100%"
  },
  "&.cm-focused .cm-cursor": { borderLeftColor: "hsl(var(--foreground))" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(99, 102, 241, 0.35) !important" },
  ".cm-gutters": {
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--muted-foreground))",
    borderRight: "1px solid hsl(var(--border))",
    paddingLeft: "10px",
    paddingRight: "10px"
  },
  ".cm-activeLine": { backgroundColor: "hsl(var(--accent))" },
  ".cm-activeLineGutter": { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" },
  ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: "hsl(var(--muted-foreground))" }
});

// 亮色模式主题
const slidevLightTheme = EditorView.theme({
  "&": {
    color: "hsl(var(--foreground))",
    backgroundColor: "transparent",
    fontSize: "14px",
    height: "100%"
  },
  "& .cm-scroller": {
    overflow: "auto",
    outline: "none"
  },
  ".cm-content": {
    caretColor: "hsl(var(--foreground))",
    paddingTop: "24px",
    paddingBottom: "24px",
    minHeight: "100%"
  },
  "&.cm-focused .cm-cursor": { borderLeftColor: "hsl(var(--foreground))" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "rgba(99, 102, 241, 0.35) !important" },
  ".cm-gutters": {
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--muted-foreground))",
    borderRight: "1px solid hsl(var(--border))",
    paddingLeft: "10px",
    paddingRight: "10px"
  },
  ".cm-activeLine": { backgroundColor: "hsl(var(--accent))" },
  ".cm-activeLineGutter": { backgroundColor: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" },
  ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: "hsl(var(--muted-foreground))" }
});

// 暗色模式语法高亮
const slidevDarkHighlightStyle = HighlightStyle.define([
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

// 亮色模式语法高亮
const slidevLightHighlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.4em", fontWeight: "bold", color: "#18181b" },
  { tag: t.heading2, fontSize: "1.2em", fontWeight: "bold", color: "#27272a" },
  { tag: t.heading3, fontSize: "1.1em", fontWeight: "bold", color: "#3f3f46" },
  { tag: t.keyword, color: "#2563eb" },
  { tag: t.operator, color: "#52525b" },
  { tag: t.string, color: "#16a34a" },
  { tag: t.comment, color: "#a1a1aa", fontStyle: "italic" },
  { tag: t.meta, color: "#9333ea" },
  { tag: t.url, color: "#2563eb", textDecoration: "underline" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, color: "#2563eb" },
  { tag: t.list, color: "#ca8a04" },
]);

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
            toast.type === 'success' ? 'bg-success/90 text-success-foreground' : 'bg-destructive/90 text-destructive-foreground'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const EditorPage: React.FC = () => {
  const { theme } = useTheme();
  const { slideSpaceId, slideId } = useParams();
  const navigate = useNavigate();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const outlineScrollRef = useRef<HTMLDivElement>(null);
  
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState<Slide | null>(null);
  const [currentSpace, setCurrentSpace] = useState<SlideSpace | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');
  const [previewOpen, setPreviewOpen] = useState(true);
  const [content, setContent] = useState<string | null>('');
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [previewMode, setPreviewMode] = useState<'dev' | 'build'>('build');
  const [outlineHeight, setOutlineHeight] = useState(240);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
  const [permissionDeniedModalOpen, setPermissionDeniedModalOpen] = useState(false);
  const [permissionCountdown, setPermissionCountdown] = useState(2);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isTitleEditing, setIsTitleEditing] = useState(false);

  // Ctrl+I AI 助手状态
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [quickActionPos, setQuickActionPos] = useState({ top: 0, left: 0 });
  const [quickActionSelection, setQuickActionSelection] = useState<{ from: number; to: number; text: string }>({ from: 0, to: 0, text: '' });

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (slideSpaceId) {
      slideApi.findAllBySpace(Number(slideSpaceId)).then(res => {
        if (res.statusCode === 0) setSlides(res.data);
      });
      spaceApi.findOne(Number(slideSpaceId)).then(res => {
        if (res.statusCode === 0) setCurrentSpace(res.data);
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
      // Get current user's role for this slide and check permissions
      slideApi.getMyRole(Number(slideId)).then(res => {
        if (res.statusCode === 0) {
          const role = res.data.role as SlideRole;
          setUserRole(role);
          
          // Check if user has read permission
          const canRead = PERMISSIONS[role]?.includes('read');
          if (!canRead) {
            setPermissionDeniedModalOpen(true);
            // Countdown and redirect
            let count = 2;
            const timer = setInterval(() => {
              count -= 1;
              setPermissionCountdown(count);
              if (count <= 0) {
                clearInterval(timer);
                navigate('/');
              }
            }, 1000);
          }
        }
      })
      .catch(err => {
         // 未登录，直接重定向
        if(err.status === 403)
          addToast('未登录，无法访问', 'error');
          setPermissionDeniedModalOpen(true);
            // Countdown and redirect
            let count = 2;
            const timer = setInterval(() => {
              count -= 1;
              setPermissionCountdown(count);
              if (count <= 0) {
                clearInterval(timer);
                navigate('/');
              }
            }, 1000);
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
      // Ctrl+Alt+B: toggle preview
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setPreviewOpen(prev => !prev);
      }
      // Ctrl+B: toggle sidebar
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Ctrl+Shift+S: save and create version
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSaveAndVersionRef.current?.();
      }
      // Ctrl+S: save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveRef.current?.();
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
  const [onlineUsers, setOnlineUsers] = useState<{name: string; color: string}[]>([]);
  
  useEffect(() => {
    initialContentRef.current = currentSlide?.content || '';
  }, [currentSlide?.id]);
  
  // Fetch WebSocket connection info and initialize WebSocket (only when there are collaborators)
  useEffect(() => {
    if (!slideId) return;
    
    // Reset authentication state when slide changes
    setIsAuthenticated(false);

    const initWebSocket = async () => {
      try {
        // Check if there are collaborators (excluding current user)
        const collaboratorsRes = await slideApi.getCollaborators(Number(slideId));
        const hasCollaborators = collaboratorsRes.statusCode === 0 && 
          collaboratorsRes.data && 
          collaboratorsRes.data.length > 0;

        // If no collaborators, use local editing mode (no WebSocket)
        if (!hasCollaborators) {
          console.log('[Editor] No collaborators, using local editing mode');
          return;
        }

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
            addToast('WebSocket authentication failed, please login again', 'error');
          },
          onAwarenessChange: ({ states }) => {
            const users = states
              .filter((state: any) => state.user)
              .map((state: any) => state.user);
            setOnlineUsers(users);
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
        addToast('Collaborative editing connection failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
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
        apply: s.content
      })),
      filter: true
    };
  }, [snippets]);

  // Handle paste image + 智能 alt 建议
  const handlePasteImage = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        try {
          const res = await uploadApi.uploadImage(file);
          if (res.statusCode === 0 && res.data?.url) {
            const imageUrl = res.data.url;
            const tempAlt = 'Uploaded image';
            const imageMarkdown = `<img src="${imageUrl}" alt="${tempAlt}">`;
            
            let insertPos = 0;
            if (editorViewRef.current) {
              const { state, dispatch } = editorViewRef.current;
              const range = state.selection.main;
              insertPos = range.from;
              dispatch({
                changes: { from: range.from, to: range.to, insert: imageMarkdown },
                selection: { anchor: range.from + imageMarkdown.length }
              });
              editorViewRef.current.focus();
            }
            addToast('图片上传成功', 'success');

            // 异步调用 AI 生成 alt 文本
            const surroundingText = editorViewRef.current?.state.doc.toString() || '';
            try {
              const alt = await suggestAltText({ imageUrl, surroundingText });
              if (alt && alt !== tempAlt && editorViewRef.current) {
                const doc = editorViewRef.current.state.doc.toString();
                const oldTag = `<img src="${imageUrl}" alt="${tempAlt}">`;
                const newTag = `<img src="${imageUrl}" alt="${alt}">`;
                const idx = doc.indexOf(oldTag);
                if (idx !== -1) {
                  editorViewRef.current.dispatch({
                    changes: { from: idx, to: idx + oldTag.length, insert: newTag }
                  });
                  addToast('AI 已生成图片描述', 'success');
                }
              }
            } catch {
              // alt 生成失败不影响主流程
            }
          } else {
            addToast(res.message || '图片上传失败', 'error');
          }
        } catch (err) {
          console.error('Upload image failed:', err);
          addToast('图片上传失败', 'error');
        }
        break;
      }
    }
  }, []);

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
      indentWithTab,
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
    ]),
    // Ctrl+I: AI 助手 (支持 / 命令 + 自由输入)
    Prec.highest(keymap.of([{
      key: 'Mod-i',
      run: (view: EditorView) => {
        const { state } = view;
        const sel = state.selection.main;
        let from = sel.from;
        let to = sel.to;
        let text = state.sliceDoc(from, to);
        if (from === to) {
          const line = state.doc.lineAt(from);
          from = line.from;
          to = line.to;
          text = line.text;
        }
        const coords = view.coordsAtPos(from);
        if (coords) {
          setQuickActionSelection({ from, to, text });
          setQuickActionPos({ top: coords.top - 10, left: coords.left });
          setQuickActionOpen(true);
        }
        return true;
      },
    }])),
  ], []);

  // Initialize editor - supports both collaborative mode (with WebSocket) and local mode (without WebSocket)
  useEffect(() => {
    if (!editorContainerRef.current) return;
    
    // Determine mode: collaborative if WebSocket is initialized and authenticated
    const isCollaborativeMode = yTextRef.current && providerRef.current && isAuthenticated;
    
    // Get initial content: from Yjs (collaborative) or currentSlide (local)
    const initialDoc = isCollaborativeMode 
      // ? ""
      ? (yTextRef.current!.toString() || "")
      : (currentSlide?.content || "");

    // Check if user has edit permission
    const canEdit = userRole ? PERMISSIONS[userRole]?.includes('edit') : false;

    // 根据主题选择对应的编辑器主题
    const editorTheme = theme === 'dark' ? slidevDarkTheme : slidevLightTheme;
    const editorHighlightStyle = theme === 'dark' ? slidevDarkHighlightStyle : slidevLightHighlightStyle;

    const extensions: any[] = [
      EditorView.editable.of(canEdit),
      ...manualBasicSetup,
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      html(),
      css(),
      javascript(),
      Prec.high(EditorState.languageData.of(() => [{
        autocomplete: snippetCompletionSource
      }])),
      editorTheme,
      syntaxHighlighting(editorHighlightStyle),
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
    ];

    // Add collaborative extension only in collaborative mode
    if (isCollaborativeMode) {
      extensions.push(yCollab(yTextRef.current!, providerRef.current!.awareness));
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: initialDoc,
        extensions,
      }),
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    // Add paste event listener for image upload
    const container = editorContainerRef.current;
    container.addEventListener('paste', handlePasteImage);

    return () => {
      container.removeEventListener('paste', handlePasteImage);
      view.destroy();
    };
  }, [slideId, manualBasicSetup, snippetCompletionSource, isAuthenticated, userRole, currentSlide?.content, handlePasteImage, theme]);

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

  // Ctrl+I Accept: 替换选中文本
  const handleQuickActionAccept = useCallback((result: string) => {
    if (editorViewRef.current) {
      const { from, to } = quickActionSelection;
      editorViewRef.current.dispatch({
        changes: { from, to, insert: result },
      });
      editorViewRef.current.focus();
    }
    setQuickActionOpen(false);
  }, [quickActionSelection]);

  const handleQuickActionReject = useCallback(() => {
    setQuickActionOpen(false);
    editorViewRef.current?.focus();
  }, []);

  // 侧边栏大纲插入: 追加内容到编辑器末尾
  const handleInsertContent = useCallback((text: string) => {
    if (editorViewRef.current) {
      const doc = editorViewRef.current.state.doc;
      const end = doc.length;
      const separator = end > 0 ? '\n\n---\n\n' : '';
      editorViewRef.current.dispatch({
        changes: { from: end, insert: separator + text },
        selection: { anchor: end + separator.length + text.length },
      });
      editorViewRef.current.focus();
    }
  }, []);

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
        addToast('Document created successfully', 'success');
        navigate(`/slide/${slideSpaceId}/${res.data.id}`);
      } else {
        addToast(res.message || 'Failed to create document', 'error');
      }
    } catch (err) {
      addToast('Failed to create document', 'error');
    }
  };

  const editorCenter = (
    <div className="flex-1 flex flex-col min-w-0 bg-card overflow-hidden">
      <div className="h-10 border-b border-border flex items-center px-4 bg-background overflow-x-auto whitespace-nowrap hide-scrollbar flex-shrink-0">
        <div 
          className="flex items-center gap-2 bg-accent px-4 py-2 rounded-t-xl border-t border-x border-border -mb-[1px] cursor-pointer hover:bg-card transition-colors"
          onClick={() => setIsTitleEditing(true)}
        >
          <Files className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{currentSlide?.title}</span>
        </div>
      </div>
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Container must be 100% height to allow CodeMirror virtual scrolling */}
        <div ref={editorContainerRef} className="absolute inset-0" />
      </div>
      <div className="h-10 border-t border-border flex items-center justify-between px-4 bg-background text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-shrink-0">
        <div className="flex items-center gap-6">
           {/* <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><ImageIcon className="w-3.5 h-3.5" /> Media</div>
           <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><Layout className="w-3.5 h-3.5" /> Layouts</div>
           <div className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"><SettingsIcon className="w-3.5 h-3.5" /> Config</div> */}
        </div>
        <div>Ln {content?.split('\n').length || 0}, Col {content?.length || 0}</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Permission Denied Modal */}
      {permissionDeniedModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-[400px] bg-card border border-destructive/30 rounded-2xl shadow-2xl p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">访问被拒绝</h3>
              <p className="text-sm text-muted-foreground mb-4">您没有权限访问此幻灯片</p>
              <div className="text-xs text-muted-foreground">
                {permissionCountdown} 秒后返回主页...
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden select-none font-sans">
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
          slideId={slideId}
          currentUser={currentUser}
          onInsertContent={handleInsertContent}
          fullContent={content || ''}
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
            currentSpace={currentSpace}
            collaborators={collaborators}
            onlineUsers={onlineUsers}
            isSaving={isSaving}
            onSave={handleSave}
            previewOpen={previewOpen}
            onTogglePreview={() => setPreviewOpen(!previewOpen)}
            slideId={slideId}
            slideSpaceId={slideSpaceId}
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* 标题编辑弹窗 */}
      <InputModal
        isOpen={isTitleEditing}
        onClose={() => setIsTitleEditing(false)}
        onConfirm={async (newTitle) => {
          if (!slideId || !newTitle.trim()) return;
          try {
            const res = await slideApi.update(Number(slideId), { title: newTitle.trim() });
            if (res.statusCode === 0) {
              setCurrentSlide(prev => prev ? { ...prev, title: newTitle.trim() } : null);
              setSlides(prev => prev.map(s => s.id === Number(slideId) ? { ...s, title: newTitle.trim() } : s));
              addToast('标题修改成功', 'success');
            } else {
              addToast(res.message || '修改失败', 'error');
            }
          } catch (err) {
            addToast('修改失败', 'error');
          }
          setIsTitleEditing(false);
        }}
        title="修改文档标题"
        placeholder="输入新标题..."
        defaultValue={currentSlide?.title || ''}
        confirmText="确认"
        cancelText="取消"
      />

      {/* Ctrl+I AI 助手浮动面板 */}
      {quickActionOpen && (
        <QuickActionWidget
          position={quickActionPos}
          selectedText={quickActionSelection.text}
          fullContent={content || ''}
          onAccept={handleQuickActionAccept}
          onReject={handleQuickActionReject}
        />
      )}
    </>
  );
};

export default EditorPage;
