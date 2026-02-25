import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { streamInlineEdit } from '../../../api/ai';

interface InlineEditWidgetProps {
  // 浮动面板位置
  position: { top: number; left: number };
  // 选中的文本
  selectedText: string;
  // 整个文档内容
  fullContent: string;
  // Accept: 将AI结果替换到编辑器
  onAccept: (result: string) => void;
  // Reject: 关闭面板
  onReject: () => void;
}

export const InlineEditWidget: React.FC<InlineEditWidgetProps> = ({
  position,
  selectedText,
  fullContent,
  onAccept,
  onReject,
}) => {
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Esc 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        abortRef.current?.abort();
        onReject();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onReject]);

  // 自动滚动到底部
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [result]);

  const handleSend = useCallback(async () => {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setResult('');
    setDone(false);
    setError('');

    const ctrl = await streamInlineEdit(
      { selectedText, instruction: instruction.trim(), fullContent },
      (chunk) => setResult(prev => prev + chunk),
      () => { setLoading(false); setDone(true); },
      (err) => { setLoading(false); setError(err); },
    );
    abortRef.current = ctrl;
  }, [instruction, selectedText, fullContent, loading]);

  return (
    <div
      className="fixed z-[200] w-[420px] bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">AI Edit</span>
        <span className="text-[10px] text-white/20 ml-auto">Ctrl+K</span>
      </div>

      {/* Input */}
      <div className="px-3 py-2">
        <div className="flex gap-2 bg-white/5 rounded-lg p-1.5 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
          <input
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
              e.stopPropagation();
            }}
            placeholder="Describe how to edit..."
            className="bg-transparent text-xs text-white/90 w-full focus:outline-none px-2 placeholder:text-white/20"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !instruction.trim()}
            className="px-2.5 py-1 bg-indigo-500 text-white rounded-md text-xs font-medium hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Go'}
          </button>
        </div>
      </div>

      {/* Result area */}
      {(result || loading || error) && (
        <div className="px-3 pb-2">
          <div
            ref={resultRef}
            className="bg-black/30 rounded-lg p-3 border border-white/5 max-h-[200px] overflow-y-auto custom-scrollbar"
          >
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <pre className="text-xs text-white/80 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {result}
                {loading && <span className="inline-block w-1.5 h-3.5 bg-indigo-400 animate-pulse ml-0.5 align-middle" />}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {(done || error) && (
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            onClick={() => { abortRef.current?.abort(); onReject(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          {done && result && (
            <button
              onClick={() => onAccept(result)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-indigo-500 hover:bg-indigo-400 rounded-lg transition-colors font-medium"
            >
              <Check className="w-3 h-3" /> Accept
            </button>
          )}
        </div>
      )}
    </div>
  );
};
