'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/utils';

const ROLE_STYLES: Record<string, string> = {
  VISITOR: 'bg-gray-800 text-gray-100 self-start',
  AI: 'bg-indigo-900/50 border border-indigo-700 text-indigo-100 self-start',
  AGENT: 'bg-blue-900/50 border border-blue-700 text-blue-100 self-end',
  SYSTEM: 'bg-yellow-900/30 text-yellow-300 text-xs self-center',
};

const ROLE_LABELS: Record<string, string> = {
  VISITOR: '👤 Visitor', AI: '🤖 AI', AGENT: '👨‍💼 Agent', SYSTEM: '⚙️ System',
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/tickets/${id}`).then((r) => r.json()).then(setTicket);
  }, [id]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      const msg = await res.json();
      setTicket((t: any) => ({
        ...t,
        conversation: { ...t.conversation, messages: [...t.conversation.messages, msg] },
      }));
      setReply('');
      toast.success('Reply sent');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const updateTicket = async (patch: Record<string, string>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const updated = await res.json();
      setTicket((t: any) => ({ ...t, ...updated }));
      toast.success('Ticket updated');
    } catch { toast.error('Update failed'); }
    finally { setUpdating(false); }
  };

  if (!ticket) return <div className="p-8 text-gray-500">Loading...</div>;

  const visitor = ticket.conversation.visitorName ?? ticket.conversation.visitorEmail ?? 'Anonymous';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat thread */}
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-900">
          <h1 className="font-bold text-lg truncate">{ticket.subject}</h1>
          <p className="text-xs text-gray-400 mt-0.5">From: {visitor} · {timeAgo(ticket.createdAt)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {ticket.conversation.messages.map((msg: any) => (
            <div key={msg.id} className={`max-w-lg rounded-2xl px-4 py-3 text-sm ${ROLE_STYLES[msg.role]}`}>
              <p className="text-xs opacity-60 mb-1">{ROLE_LABELS[msg.role]} · {timeAgo(msg.createdAt)}</p>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.isAI && msg.confidence && (
                <p className="text-xs opacity-40 mt-1">Confidence: {Math.round(msg.confidence * 100)}%</p>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={sendReply} className="p-4 border-t border-gray-800 bg-gray-900 flex gap-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={2}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={sending || !reply.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold disabled:opacity-50 transition self-end">
            {sending ? '...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Ticket meta panel */}
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-5 overflow-y-auto shrink-0">
        <h3 className="font-semibold mb-4 text-sm">Ticket Details</h3>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <select value={ticket.status} onChange={(e) => updateTicket({ status: e.target.value })}
              disabled={updating}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none">
              {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <select value={ticket.priority} onChange={(e) => updateTicket({ priority: e.target.value })}
              disabled={updating}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Visitor</p>
            <p className="text-gray-300 text-xs">{visitor}</p>
            {ticket.conversation.visitorEmail && (
              <p className="text-gray-500 text-xs">{ticket.conversation.visitorEmail}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Conversation ID</p>
            <p className="text-gray-600 text-xs font-mono truncate">{ticket.conversationId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-gray-400 text-xs">{new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
