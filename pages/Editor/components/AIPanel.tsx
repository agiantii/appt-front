import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AIPanelProps {
  chatHistory: { role: 'user' | 'ai'; text: string }[];
  chatInput: string;
  setChatInput: (input: string) => void;
  onSendChat: () => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  chatHistory,
  chatInput,
  setChatInput,
  onSendChat,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-4">
            <Sparkles className="w-12 h-12 text-white/5" />
            <p className="text-[10px] uppercase font-bold text-white/20 tracking-widest leading-relaxed">Ask AI to design slides, generate content, or fix layouts.</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${msg.role === 'ai' ? 'bg-white/5 border border-white/5 text-white/70 backdrop-blur-sm' : 'bg-white/10 ml-6 text-white border border-white/10 shadow-lg shadow-white/5'}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-white/5">
        <div className="flex gap-2 bg-white/5 rounded-2xl p-2 border border-white/10 focus-within:ring-2 ring-white/10 transition-all">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendChat()}
            placeholder="Ask Slidev Assistant..."
            className="bg-transparent text-xs w-full focus:outline-none px-3"
          />
          <button onClick={onSendChat} className="p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-transform active:scale-95">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
