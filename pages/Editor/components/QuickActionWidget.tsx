import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Check, X, Loader2, Type, Layout, Bug, RefreshCw, Image as ImageIcon, SendHorizonal, RotateCcw } from 'lucide-react';
import { streamInlineEdit, generateImage } from '../../../api/ai';

// 斜杠命令定义
const SLASH_COMMANDS = [
  { command: '/polish', label: '润色文案', description: '润色并改善文案质量', icon: Type, instruction: 'Polish and improve this text, make it more professional and engaging. Keep the same language.' },
  { command: '/layout', label: '更换布局', description: '推荐更好的 Slidev 布局', icon: Layout, instruction: 'Change the Slidev layout of this slide. Suggest a better layout from: center, two-cols, image-right, cover, section. Output the full slide with new layout frontmatter.' },
  { command: '/fix', label: '修复语法', description: '修复语法和格式错误', icon: Bug, instruction: 'Fix any markdown syntax errors, typos, and formatting issues in this text.' },
  { command: '/convert', label: '转换格式', description: '智能转换内容格式', icon: RefreshCw, instruction: 'Convert the format of this content intelligently (e.g., list to table, paragraph to bullet points, or vice versa). Choose the best conversion.' },
  { command: '/image', label: 'AI 生图', description: '根据描述生成图片并插入', icon: ImageIcon, instruction: '' },
] as const;

interface QuickActionWidgetProps {
  position: { top: number; left: number };
  selectedText: string;
  fullContent: string;
  onAccept: (result: string) => void;
  onReject: () => void;
}

export const QuickActionWidget: React.FC<QuickActionWidgetProps> = ({
  position, selectedText, fullContent, onAccept, onReject,
}) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自动聚焦
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Escape 关闭
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { abortRef.current?.abort(); onReject(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onReject]);

  // 结果区自动滚动
  useEffect(() => {
    if (resultRef.current) resultRef.current.scrollTop = resultRef.current.scrollHeight;
  }, [result]);

  // 过滤匹配的斜杠命令
  const filteredCommands = input.startsWith('/')
    ? SLASH_COMMANDS.filter(c => c.command.startsWith(input.split(' ')[0].toLowerCase()))
    : [];

  // 重置选中索引当过滤结果变化时
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands.length]);

  // 存储最后一次编辑指令用于重新生成
  const lastInstructionRef = useRef<string>('');

  // 执行文本编辑指令（流式）
  const executeTextEdit = useCallback(async (instruction: string) => {
    lastInstructionRef.current = instruction;
    setLoading(true);
    setResult('');
    setDone(false);
    setError('');
    setImageUrl('');
    const ctrl = await streamInlineEdit(
      { selectedText, instruction, fullContent },
      (chunk) => setResult(prev => prev + chunk),
      () => { setLoading(false); setDone(true); abortRef.current = null; },
      (err) => { setLoading(false); setError(err); abortRef.current = null; },
    );
    abortRef.current = ctrl;
  }, [selectedText, fullContent]);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    if (lastInstructionRef.current) {
      executeTextEdit(lastInstructionRef.current);
    }
  }, [executeTextEdit]);

  // 执行 AI 生图
  const executeImageGen = useCallback(async (prompt: string) => {
    setLoading(true);
    setResult('');
    setDone(false);
    setError('');
    setImageUrl('');
    try {
      const url = await generateImage({ prompt });
      setImageUrl(url);
      // 生成插入编辑器的 markdown
      setResult(`![${prompt}](${url})`);
      setDone(true);
    } catch (err: any) {
      setError(err.message || '图片生成失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 提交指令
  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // 匹配斜杠命令
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const matchedCmd = SLASH_COMMANDS.find(c => c.command === cmd);

    if (matchedCmd) {
      const extra = parts.slice(1).join(' ');
      if (cmd === '/image') {
        executeImageGen(extra || selectedText || 'a beautiful presentation illustration');
      } else {
        const instruction = extra ? `${matchedCmd.instruction}\n\nAdditional context: ${extra}` : matchedCmd.instruction;
        executeTextEdit(instruction);
      }
    } else {
      // 自由文本作为编辑指令
      executeTextEdit(trimmed);
    }
    setShowSuggestions(false);
  }, [input, loading, selectedText, executeTextEdit, executeImageGen]);

  // 点击建议项
  const handleSelectCommand = useCallback((command: string) => {
    if (command === '/image') {
      setInput('/image ');
      setShowSuggestions(false);
      inputRef.current?.focus();
    } else {
      // 非 image 命令直接执行
      const matched = SLASH_COMMANDS.find(c => c.command === command);
      if (matched) {
        setInput(command);
        setShowSuggestions(false);
        executeTextEdit(matched.instruction);
      }
    }
  }, [executeTextEdit]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setShowSuggestions(value.startsWith('/') && !loading && !done);
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 有建议时：上下键导航，Enter 执行选中命令
    if (showSuggestions && filteredCommands.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          return;
        case 'Enter':
          if (!e.shiftKey) {
            e.preventDefault();
            const selectedCommand = filteredCommands[selectedIndex];
            if (selectedCommand) {
              handleSelectCommand(selectedCommand.command);
            }
          }
          return;
      }
    }

    // 没有建议时：Enter 提交
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="fixed z-[200] w-[460px] bg-[#1a1a1f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">AI Assistant</span>
        <span className="text-[10px] text-white/20 ml-auto">Ctrl+I</span>
      </div>

      {/* Input */}
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center gap-2 bg-black/30 rounded-lg border border-white/10 focus-within:border-violet-500/50 transition-colors">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入指令或 / 查看命令..."
            disabled={loading || done}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white/90 placeholder:text-white/30 outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || done || !input.trim()}
            className="p-1.5 mr-1 text-white/40 hover:text-violet-400 disabled:opacity-30 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Slash command suggestions */}
      {showSuggestions && filteredCommands.length > 0 && (
        <div className="px-3 pb-1">
          <div className="bg-black/20 rounded-lg border border-white/5 overflow-hidden">
            {filteredCommands.map(({ command, label, description, icon: Icon }, index) => (
              <button
                key={command}
                onClick={() => handleSelectCommand(command)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors group ${
                  index === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${
                  index === selectedIndex ? 'text-violet-400' : 'text-white/30 group-hover:text-violet-400'
                }`} />
                <span className="text-xs font-mono text-violet-400/80">{command}</span>
                <span className="text-xs text-white/50">{label}</span>
                <span className="text-[10px] text-white/25 ml-auto">{description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result area */}
      {(result || loading || error) && (
        <div className="px-3 pb-2">
          <div
            ref={resultRef}
            className="bg-black/30 rounded-lg p-3 border border-white/5 max-h-[240px] overflow-y-auto custom-scrollbar"
          >
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : imageUrl ? (
              <div className="space-y-2">
                <img src={imageUrl} alt="AI Generated" className="w-full rounded-lg border border-white/10" />
                <p className="text-[10px] text-white/30 font-mono break-all">{result}</p>
              </div>
            ) : (
              <pre className="text-xs text-white/80 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {result}
                {loading && <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Accept / Reject / Regenerate */}
      {(done || error) && (
        <div className="flex justify-end gap-2 px-3 pb-3">
          <button
            onClick={() => { abortRef.current?.abort(); onReject(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" /> Reject
          </button>
          {done && result && (
            <>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" /> Regenerate
              </button>
              <button
                onClick={() => onAccept(result)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-violet-500 hover:bg-violet-400 rounded-lg transition-colors font-medium"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
