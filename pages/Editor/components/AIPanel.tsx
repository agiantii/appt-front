import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, FileText, Loader2, Download, Palette, MessageSquarePlus, StopCircle, Upload, X, Copy, Check } from 'lucide-react';
import { streamGenerateOutline, streamChat, ReferenceFile } from '../../../api/ai';

type PanelTab = 'chat' | 'outline';

interface AIPanelProps {
  onInsertContent?: (content: string) => void;
  fullContent?: string;
}

// 全局状态缓存，用于在路由不变时保留内容
const globalCache = {
  chatHistory: [] as { role: 'user' | 'ai'; text: string }[],
  outlineTopic: '',
  outlineSlideCount: 5,
  outlineTheme: 'default',
  outlineRequirements: '',
  outlineResult: '',
  outlineReferenceFiles: [] as ReferenceFile[],
};

export const AIPanel: React.FC<AIPanelProps> = ({
  onInsertContent, fullContent,
}) => {
  const [tab, setTab] = useState<PanelTab>('chat');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab 切换 */}
      <div className="flex border-b border-border px-2 pt-2">
        {([['chat', 'Chat'], ['outline', 'Outline']] as [PanelTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-t-lg transition-colors ${
              tab === t ? 'bg-accent text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <ChatView fullContent={fullContent} />
      ) : (
        <OutlineView onInsertContent={onInsertContent} fullContent={fullContent} />
      )}
    </div>
  );
};

// ---- Chat 子视图 ----
const ChatView: React.FC<{
  fullContent?: string;
}> = ({ fullContent }) => {
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>(globalCache.chatHistory);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 同步到全局缓存
  useEffect(() => {
    globalCache.chatHistory = chatHistory;
  }, [chatHistory]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendChat = useCallback(async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || loading) return;
    console.log('[AIPanel] Chat started');

    // 添加用户消息
    const newHistory = [...chatHistory, { role: 'user' as const, text: trimmed }];
    setChatHistory(newHistory);
    setChatInput('');
    setLoading(true);

    // 添加 AI 占位消息
    setChatHistory(prev => [...prev, { role: 'ai', text: '' }]);

    const ctrl = await streamChat(
      trimmed,
      newHistory,
      (chunk) => {
        setChatHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.text += chunk;
          }
          return updated;
        });
      },
      () => {
        setLoading(false);
        abortRef.current = null;
      },
      (err) => {
        setLoading(false);
        abortRef.current = null;
        setChatHistory(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === 'ai') {
            lastMsg.text += `\n\n[Error: ${err}]`;
          }
          return updated;
        });
      },
    );
    abortRef.current = ctrl;
  }, [chatInput, chatHistory, loading]);

  const handleStopChat = useCallback(() => {
    console.log('[AIPanel] Stopping chat..., abortRef:', abortRef.current);
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
      console.log('[AIPanel] Chat stopped');
      setChatHistory(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg && lastMsg.role === 'ai' && !lastMsg.text.trim()) {
          lastMsg.text = '[Stopped by user]';
        }
        return updated;
      });
    } else {
      console.log('[AIPanel] No abortRef, cannot stop');
    }
  }, []);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyMessage = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
            <Sparkles className="w-12 h-12 text-muted-foreground/20" />
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-relaxed">Ask AI to design slides, generate content, or fix layouts.</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`group relative p-4 rounded-2xl text-xs leading-relaxed transition-all ${msg.role === 'ai' ? 'bg-accent border border-border text-foreground backdrop-blur-sm' : 'bg-accent/50 ml-6 text-foreground border border-border shadow-lg shadow-border/50'}`}>
            {msg.text || (loading && i === chatHistory.length - 1 && msg.role === 'ai' ? (
              <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse align-middle" />
            ) : msg.text)}
            {msg.text && !loading && (
              <button
                onClick={() => handleCopyMessage(msg.text, i)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-accent hover:bg-accent/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                title="复制"
              >
                {copiedIndex === i ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 bg-accent rounded-2xl p-2 border border-border focus-within:ring-2 ring-border transition-all">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
            placeholder="Ask Slidev Assistant..."
            disabled={loading}
            className="bg-transparent text-xs w-full focus:outline-none px-3 disabled:opacity-50"
          />
          {loading ? (
            <button
              onClick={handleStopChat}
              className="p-2 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-transform active:scale-95"
              title="Stop generation"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};

// ---- Outline 子视图 ----
// Slidev 内置主题列表
const SLIDEV_THEMES = [
  { value: 'default', label: 'Default' },
  { value: 'seriph', label: 'Seriph' },
  { value: 'apple-basic', label: 'Apple Basic' },
  { value: 'bricks', label: 'Bricks' },
  { value: 'shibainu', label: 'Shiba Inu' },
  { value: 'none', label: 'None' },
];

const OutlineView: React.FC<{
  onInsertContent?: (content: string) => void;
  fullContent?: string;
}> = ({ onInsertContent, fullContent }) => {
  const [topic, setTopic] = useState(globalCache.outlineTopic);
  const [slideCount, setSlideCount] = useState(globalCache.outlineSlideCount);
  const [theme, setTheme] = useState(globalCache.outlineTheme);
  const [requirements, setRequirements] = useState(globalCache.outlineRequirements);
  const [result, setResult] = useState(globalCache.outlineResult);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(!!globalCache.outlineResult);
  const [error, setError] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>(globalCache.outlineReferenceFiles);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 同步到全局缓存
  useEffect(() => {
    globalCache.outlineTopic = topic;
    globalCache.outlineSlideCount = slideCount;
    globalCache.outlineTheme = theme;
    globalCache.outlineRequirements = requirements;
    globalCache.outlineResult = result;
    globalCache.outlineReferenceFiles = referenceFiles;
  }, [topic, slideCount, theme, requirements, result, referenceFiles]);

  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [result]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || loading) return;
    console.log('[AIPanel] Outline generation started');
    setLoading(true);
    setResult('');
    setDone(false);
    setError('');

    const ctrl = await streamGenerateOutline(
      { topic: topic.trim(), slideCount, fullContent, theme, requirements: requirements.trim() || undefined, referenceFiles: referenceFiles.length > 0 ? referenceFiles : undefined },
      (chunk) => setResult(prev => prev + chunk),
      () => {
        setLoading(false);
        setDone(true);
        abortRef.current = null;
      },
      (err) => {
        setLoading(false);
        setError(err);
        abortRef.current = null;
      },
    );
    abortRef.current = ctrl;
  }, [topic, slideCount, fullContent, theme, requirements, loading, referenceFiles]);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newFiles: ReferenceFile[] = [];
    for (const file of Array.from(files) as File[]) {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        continue;
      }
      try {
        const content = await file.text();
        newFiles.push({ name: file.name, content });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (newFiles.length > 0) {
      setReferenceFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeReferenceFile = useCallback((index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (const item of Array.from(items) as DataTransferItem[]) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      const dataTransfer = new DataTransfer();
      files.forEach(f => dataTransfer.items.add(f));
      await processFiles(dataTransfer.files);
    }
  }, [processFiles]);

  const handleStopGenerate = useCallback(() => {
    console.log('[AIPanel] Stopping outline generation...');
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setLoading(false);
      console.log('[AIPanel] Outline generation stopped');
      if (!result.trim()) {
        setError('Generation stopped by user');
      }
    }
  }, [result]);

  const [outlineCopied, setOutlineCopied] = useState(false);

  const handleCopyOutline = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setOutlineCopied(true);
      setTimeout(() => setOutlineCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [result]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 输入区 */}
      <div className="px-2 py-2 space-y-1.5 border-b border-border">
        {/* 主题输入 */}
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
          placeholder="输入演示主题..."
          className="w-full bg-accent border border-border rounded-md px-2.5 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/25"
          disabled={loading}
        />

        {/* 主题选择和页数 - 紧凑布局 */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={loading}
            className="flex-1 min-w-0 bg-accent border border-border rounded-md px-1.5 py-1 text-[10px] text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-50 cursor-pointer"
          >
            {SLIDEV_THEMES.map(t => (
              <option key={t.value} value={t.value} className="bg-card">{t.label}</option>
            ))}
          </select>
          <input
            type="number"
            min={2}
            max={20}
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-10 bg-accent border border-border rounded-md px-1 py-1 text-[10px] text-foreground focus:outline-none focus:border-primary/50 text-center"
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleStopGenerate}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-destructive text-white rounded-md hover:bg-destructive/90 transition-colors"
              title="Stop generation"
            >
              <StopCircle className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-primary text-white rounded-md hover:bg-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Generate"
            >
              <FileText className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 额外要求 */}
        <div className="flex items-start gap-1.5">
          <MessageSquarePlus className="w-3 h-3 text-muted-foreground mt-1.5 flex-shrink-0" />
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="额外要求（可选）..."
            rows={2}
            className="flex-1 min-w-0 bg-accent border border-border rounded-md px-2 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/25 resize-none"
            disabled={loading}
          />
        </div>

        {/* 参考文件上传 */}
        <div
          className="mt-1"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            disabled={loading}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-border rounded-md px-3 py-4 text-center cursor-pointer hover:border-primary/50 hover:bg-accent transition-all"
          >
            <Upload className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-[10px] text-muted-foreground">
              点击上传、拖拽或粘贴 .md / .txt 文件
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              支持多文件，作为 AI 生成参考
            </p>
          </div>
          {referenceFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {referenceFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px] bg-accent rounded px-2 py-1">
                  <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-muted-foreground truncate flex-1" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeReferenceFile(index)}
                    disabled={loading}
                    className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 结果区 */}
      <div ref={resultRef} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {!result && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
            <FileText className="w-10 h-10 text-white/5" />
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">输入主题，一键生成 Slidev 大纲</p>
          </div>
        )}
        {error && <p className="text-xs text-destructive p-2">{error}</p>}
        {result && (
          <div className="relative group">
            <button
              onClick={handleCopyOutline}
              className="absolute top-0 right-0 p-1.5 rounded-md bg-accent/50 hover:bg-white/20 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all z-10"
              title="复制全部"
            >
              {outlineCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed pr-8">
              {result}
              {loading && <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />}
            </pre>
          </div>
        )}
      </div>

      {/* Insert 按钮 */}
      {done && result && onInsertContent && (
        <div className="p-3 border-t border-border">
          <button
            onClick={() => onInsertContent(result)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Insert All
          </button>
        </div>
      )}
    </div>
  );
};
