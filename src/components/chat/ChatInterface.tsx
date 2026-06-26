import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getAssistantResponse } from '../../services/aiService';
import type { Message } from '../../types';

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('# ')) return <h3 key={i} className="text-sm font-semibold mt-3 mb-1 first:mt-0" style={{ color: 'var(--c-text-1)' }}>{line.slice(2)}</h3>;
      if (line.startsWith('## ')) return <h4 key={i} className="text-xs font-semibold mt-2 mb-1" style={{ color: 'var(--c-text-2)' }}>{line.slice(3)}</h4>;
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const text = line.slice(2);
        const parts = text.split('**');
        return <li key={i} className="text-xs leading-relaxed ml-3 list-none flex gap-1.5"><span style={{ color: 'var(--c-text-5)' }} className="flex-shrink-0">—</span><span style={{ color: 'var(--c-text-2)' }}>{parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} className="font-semibold">{p}</strong>)}</span></li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-semibold mt-1.5" style={{ color: 'var(--c-text-1)' }}>{line.slice(2, -2)}</p>;
      if (!line.trim()) return i > 0 ? <div key={i} className="h-1.5" /> : null;
      const parts = line.split('**');
      return <p key={i} className="text-xs leading-relaxed" style={{ color: 'var(--c-text-2)' }}>{parts.map((p, j) => j % 2 === 0 ? <span key={j}>{p}</span> : <strong key={j} className="font-semibold">{p}</strong>)}</p>;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-lg rounded-2xl rounded-tr-sm px-4 py-2.5" style={{ background: 'var(--c-text-1)', color: 'var(--c-bg)' }}>
          <p className="text-xs leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl">
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'var(--c-bg-3)', border: '1px solid var(--c-border)' }}>
            <MessageSquare size={11} style={{ color: 'var(--c-text-3)' }} />
          </div>
          <div className="rounded-2xl rounded-tl-sm px-4 py-3 space-y-0.5 shadow-xs" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            {formatContent(message.content)}
          </div>
        </div>
        <p className="text-2xs mt-1 ml-8" style={{ color: 'var(--c-text-5)' }}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'var(--c-bg-3)', border: '1px solid var(--c-border)' }}>
          <MessageSquare size={11} style={{ color: 'var(--c-text-3)' }} />
        </div>
        <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--c-text-4)', animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--c-text-4)', animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--c-text-4)', animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const FINANCE_STARTERS = [
  'What does the health score mean for this business?',
  'Explain the returns rate and what we should do about it.',
  'What are the biggest risks in this dataset?',
  'How should we interpret the customer concentration?',
  'What does the revenue growth rate tell us?',
  'Explain the geographic concentration risk.',
];

const ASSISTANT_STARTERS = [
  'What is EBITDA and how is it calculated?',
  'Explain the difference between gross margin and net margin.',
  'What are the key indicators of a healthy cash flow?',
  'How does the Altman Z-score work?',
  'What financial metrics matter most for a SaaS business?',
  'Explain the relationship between working capital and liquidity.',
];

export function ChatInterface() {
  const { state, activeWorkspace, activeMessages, activeAnalysis, sendMessage, loadMessages } = useApp();
  const [input, setInput] = useState('');
  const [responding, setResponding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mode = state.mode;
  const isAnalysisMode = mode === 'analysis';
  const hasAnalysis = !!activeAnalysis;
  const messages = activeMessages;

  useEffect(() => {
    if (activeWorkspace?.id) loadMessages(activeWorkspace.id);
  }, [activeWorkspace?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, responding]);

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const handleSubmit = useCallback(async () => {
    const content = input.trim();
    if (!content || responding || !activeWorkspace) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setResponding(true);

    await sendMessage(activeWorkspace.id, content, 'user');

    try {
      const historyForAI = messages.slice(-20).map(m => ({ role: m.role, content: m.content }));
      historyForAI.push({ role: 'user', content });

      const response = await getAssistantResponse(historyForAI, mode, activeAnalysis || undefined);
      await sendMessage(activeWorkspace.id, response, 'assistant');
    } catch {
      await sendMessage(activeWorkspace.id, 'I encountered an error processing your request. Please try again.', 'assistant');
    } finally {
      setResponding(false);
    }
  }, [input, responding, activeWorkspace, mode, messages, activeAnalysis, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const starters = isAnalysisMode ? FINANCE_STARTERS : ASSISTANT_STARTERS;

  const isLimitReached = messages.length >= 50;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {messages.length === 0 && !responding && (
          <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--c-bg-3)' }}>
              <MessageSquare size={18} style={{ color: 'var(--c-text-4)' }} />
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--c-text-1)' }}>
              {isAnalysisMode
                ? hasAnalysis ? 'Analysis Ready — Ask Anything' : 'Upload data to start analysis chat'
                : 'Financial Assistant'}
            </h3>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--c-text-4)' }}>
              {isAnalysisMode && hasAnalysis
                ? 'Ask questions about the analysis. All responses are grounded in the computed metrics.'
                : isAnalysisMode
                  ? 'Upload a file in Company Analysis mode to enable data-grounded Q&A.'
                  : 'Ask me anything about finance, accounting, investment, or business analysis. I only respond to financial topics.'}
            </p>
            {(!isAnalysisMode || hasAnalysis) && (
              <div className="grid grid-cols-1 gap-1.5 w-full">
                {starters.slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                    className="text-left px-3 py-2 text-xs rounded-md transition-colors"
                    style={{
                      background: 'var(--c-bg-2)',
                      border: '1px solid var(--c-border)',
                      color: 'var(--c-text-3)'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map(m => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {responding && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4" style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-bg)' }}>
        {isLimitReached && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Lock size={12} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs" style={{ color: '#f59e0b' }}>This chat has reached its 50-message limit. Create a new workspace to continue.</p>
          </div>
        )}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 p-2 rounded-xl transition-all duration-150" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); adjustTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder={
                isLimitReached ? 'Message limit reached — create a new workspace'
                  : isAnalysisMode && !hasAnalysis ? 'Upload a file to enable analysis chat...'
                    : isAnalysisMode ? 'Ask about the analysis...'
                      : 'Ask a financial question...'
              }
              disabled={responding || isLimitReached || (isAnalysisMode && !hasAnalysis)}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none py-1.5 px-2 leading-relaxed disabled:cursor-not-allowed"
              style={{ minHeight: '36px', maxHeight: '120px', color: 'var(--c-text-1)' }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || responding || isLimitReached}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--c-text-1)', color: 'var(--c-bg)' }}
            >
              {responding ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <p className="text-2xs text-center mt-2" style={{ color: 'var(--c-text-5)' }}>
            {isAnalysisMode
              ? 'Responses grounded in computed metrics. Configure API key in Settings for full AI analysis.'
              : 'Financial topics only. Configure API key in Settings for real-time AI responses.'}
          </p>
        </div>
      </div>
    </div>
  );
}
