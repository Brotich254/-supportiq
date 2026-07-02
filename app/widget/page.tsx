'use client';
import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  role: 'VISITOR' | 'AI' | 'AGENT' | 'SYSTEM';
  content: string;
  isAI?: boolean;
}

export default function WidgetPage() {
  const [apiKey, setApiKey] = useState('');
  const [config, setConfig] = useState<{ orgName: string; greeting: string; widgetColor: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [visitorId] = useState(() => {
    const stored = localStorage.getItem('siq_visitor_id');
    if (stored) return stored;
    const id = nanoid();
    localStorage.setItem('siq_visitor_id', id);
    return id;
  });
  const [visitorEmail, setVisitorEmail] = useState('');
  const [step, setStep] = useState<'email' | 'chat'>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get API key from URL params (passed by embed.js)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key') ?? '';
    setApiKey(key);

    if (key) {
      fetch('/api/widget/config', { headers: { 'x-api-key': key } })
        .then((r) => r.json())
        .then((data) => {
          setConfig(data);
          setMessages([{ id: '0', role: 'AI', content: data.greeting, isAI: true }]);
        });

      // Restore conversation if exists
      const savedId = localStorage.getItem(`siq_conv_${key}`);
      if (savedId) setConversationId(savedId);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey || loading) return;

    const userMsg: Message = { id: nanoid(), role: 'VISITOR', content: input };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          conversationId,
          visitorId,
          visitorEmail: visitorEmail || undefined,
          message: input,
        }),
      });
      const data = await res.json();

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(`siq_conv_${apiKey}`, data.conversationId);
      }

      setMessages((p) => [...p, {
        id: nanoid(),
        role: data.escalated ? 'SYSTEM' : 'AI',
        content: data.message,
        isAI: true,
      }]);
    } catch {
      setMessages((p) => [...p, {
        id: nanoid(), role: 'SYSTEM',
        content: 'Something went wrong. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!config) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-gray-400 text-sm">
        Loading...
      </div>
    );
  }

  const color = config.widgetColor ?? '#6366f1';

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <div className="px-4 py-3 text-white flex items-center gap-3" style={{ backgroundColor: color }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
          {config.orgName[0]}
        </div>
        <div>
          <p className="font-semibold text-sm">{config.orgName}</p>
          <div className="flex items-center gap-1 text-xs opacity-80">
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id}
            className={`flex ${msg.role === 'VISITOR' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'VISITOR'
                ? 'text-white rounded-br-sm'
                : msg.role === 'SYSTEM'
                ? 'bg-yellow-50 text-yellow-800 border border-yellow-200 text-xs rounded-xl'
                : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-bl-sm'
            }`}
              style={msg.role === 'VISITOR' ? { backgroundColor: color } : {}}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
          style={{ '--tw-ring-color': color } as any}
        />
        <button type="submit" disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition"
          style={{ backgroundColor: color }}>
          <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 py-1.5 bg-white border-t border-gray-50">
        Powered by <span className="font-medium text-gray-500">SupportIQ</span>
      </p>
    </div>
  );
}
