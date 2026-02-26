import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, FileText, Loader2, Download, Palette, MessageSquarePlus, StopCircle, Upload, X } from 'lucide-react';
import { streamGenerateOutline, streamChat, ReferenceFile } from '../../../api/ai';

type PanelTab = 'chat' | 'outline';

interface AIPanelProps {
  onInsertContent?: (content: string) => void;
  fullContent?: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  onInsertContent, fullContent,
}) => {
  const [tab, setTab] = useState<PanelTab>('chat');

  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      {/* Tab 切换 */}
      <div className="flex border-b border-white/5 px-2 pt-2">
        {([['chat', 'Chat'], ['outline', 'Outline']] as [PanelTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-t-lg transition-colors ${
              tab === t ? 'bg-white/5 text-white/80 border-b-2 border-indigo-500' : 'text-white/30 hover:text-white/50'
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
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
            <Sparkles className="w-12 h-12 text-white/5" />
            <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest leading-relaxed">Ask AI to design slides, generate content, or fix layouts.</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${msg.role === 'ai' ? 'bg-white/5 border border-white/5 text-white/70 backdrop-blur-sm' : 'bg-white/10 ml-6 text-white border border-white/10 shadow-lg shadow-white/5'}`}>
            {msg.text || (loading && i === chatHistory.length - 1 && msg.role === 'ai' ? (
              <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse align-middle" />
            ) : msg.text)}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:ring-2 ring-white/10 transition-all">
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
              className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-400 transition-transform active:scale-95"
              title="Stop generation"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95 disabled:opacity-50"
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
  const [topic, setTopic] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [theme, setTheme] = useState('default');
  const [requirements, setRequirements] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 输入区 */}
      <div className="px-2 py-2 space-y-1.5 border-b border-white/5">
        {/* 主题输入 */}
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
          placeholder="输入演示主题..."
          className="w-full bg-white/5 border border-white/10 rounded-md px-2.5 py-1.5 text-[11px] text-white/90 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/25"
          disabled={loading}
        />

        {/* 主题选择和页数 - 紧凑布局 */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3 h-3 text-white/30 flex-shrink-0" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={loading}
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-[10px] text-white/80 focus:outline-none focus:border-indigo-500/50 disabled:opacity-50 cursor-pointer"
          >
            {SLIDEV_THEMES.map(t => (
              <option key={t.value} value={t.value} className="bg-[#1a1a1f]">{t.label}</option>
            ))}
          </select>
          <input
            type="number"
            min={2}
            max={20}
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-10 bg-white/5 border border-white/10 rounded-md px-1 py-1 text-[10px] text-white/80 focus:outline-none focus:border-indigo-500/50 text-center"
            disabled={loading}
          />
          {loading ? (
            <button
              onClick={handleStopGenerate}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-red-500 text-white rounded-md hover:bg-red-400 transition-colors"
              title="Stop generation"
            >
              <StopCircle className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!topic.trim()}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Generate"
            >
              <FileText className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 额外要求 */}
        <div className="flex items-start gap-1.5">
          <MessageSquarePlus className="w-3 h-3 text-white/30 mt-1.5 flex-shrink-0" />
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="额外要求（可选）..."
            rows={2}
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-[10px] text-white/90 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/25 resize-none"
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
            className="border border-dashed border-white/20 rounded-md px-3 py-4 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all"
          >
            <Upload className="w-4 h-4 text-white/40 mx-auto mb-1.5" />
            <p className="text-[10px] text-white/50">
              点击上传、拖拽或粘贴 .md / .txt 文件
            </p>
            <p className="text-[9px] text-white/30 mt-0.5">
              支持多文件，作为 AI 生成参考
            </p>
          </div>
          {referenceFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {referenceFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1.5 text-[10px] bg-white/5 rounded px-2 py-1">
                  <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                  <span className="text-white/60 truncate flex-1" title={file.name}>
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeReferenceFile(index)}
                    disabled={loading}
                    className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
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
            <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest">输入主题，一键生成 Slidev 大纲</p>
          </div>
        )}
        {error && <p className="text-xs text-red-400 p-2">{error}</p>}
        {result && (
          <pre className="text-xs text-white/80 whitespace-pre-wrap break-words font-mono leading-relaxed">
            {result}
            {loading && <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />}
          </pre>
        )}
      </div>

      {/* Insert 按钮 */}
      {done && result && onInsertContent && (
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => onInsertContent(result)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Insert All
          </button>
        </div>
      )}
    </div>
  );
};
