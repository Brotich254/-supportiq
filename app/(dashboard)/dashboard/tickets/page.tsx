'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { timeAgo, truncate } from '@/lib/utils';

const STATUSES = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'text-gray-400', MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400', URGENT: 'text-red-400',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-900/40 text-red-400',
  IN_PROGRESS: 'bg-yellow-900/40 text-yellow-400',
  RESOLVED: 'bg-green-900/40 text-green-400',
  CLOSED: 'bg-gray-800 text-gray-500',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (priority !== 'ALL') params.set('priority', priority);
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [status, priority]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                status === s ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {s === 'ALL' ? 'All Status' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                priority === p ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {p === 'ALL' ? 'All Priority' : p}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No tickets found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-950 text-gray-500 text-xs uppercase">
              <tr>
                {['#', 'Subject', 'Visitor', 'Priority', 'Status', 'Assigned', 'Time', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tickets.map((t, i) => (
                <tr key={t.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 text-gray-600 text-xs">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[200px]">{t.subject}</p>
                    {t.conversation.messages[0] && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">
                        {truncate(t.conversation.messages[0].content, 50)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {t.conversation.visitorName ?? t.conversation.visitorEmail ?? 'Anonymous'}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${PRIORITY_COLORS[t.priority]}`}>
                    {t.priority}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {t.assignee?.name ?? <span className="text-gray-600">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/tickets/${t.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
