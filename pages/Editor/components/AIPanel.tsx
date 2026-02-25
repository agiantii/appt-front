import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, FileText, Loader2, Download, Palette, MessageSquarePlus } from 'lucide-react';
import { streamGenerateOutline, streamChat } from '../../../api/ai';

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
      () => setLoading(false),
      (err) => {
        setLoading(false);
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
          <button
            onClick={handleSendChat}
            disabled={loading || !chatInput.trim()}
            className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          </button>
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
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [result]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setResult('');
    setDone(false);
    setError('');

    const ctrl = await streamGenerateOutline(
      { topic: topic.trim(), slideCount, fullContent, theme, requirements: requirements.trim() || undefined },
      (chunk) => setResult(prev => prev + chunk),
      () => { setLoading(false); setDone(true); },
      (err) => { setLoading(false); setError(err); },
    );
    abortRef.current = ctrl;
  }, [topic, slideCount, fullContent, theme, requirements, loading]);

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
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-indigo-500 text-white rounded-md hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Generate"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          </button>
        </div>

        {/* 额外要求 */}
        <div className="flex items-start gap-1.5">
          <MessageSquarePlus className="w-3 h-3 text-white/30 mt-1 flex-shrink-0" />
          <input
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            placeholder="额外要求（可选）..."
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white/90 focus:outline-none focus:border-indigo-500/50 placeholder:text-white/25"
            disabled={loading}
          />
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
