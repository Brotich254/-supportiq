import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { timeAgo, truncate } from '@/lib/utils';

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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;

  const membership = await db.orgMember.findFirst({ where: { userId } });
  if (!membership) return <div className="p-8 text-gray-500">No organization found.</div>;

  const orgId = membership.orgId;

  const [totalTickets, openTickets, botHandled, totalConvs, knowledgeDocs, recentTickets, org] =
    await Promise.all([
      db.ticket.count({ where: { orgId } }),
      db.ticket.count({ where: { orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      db.conversation.count({ where: { orgId, status: { in: ['BOT', 'RESOLVED', 'CLOSED'] } } }),
      db.conversation.count({ where: { orgId } }),
      db.knowledgeDoc.count({ where: { orgId } }),
      db.ticket.findMany({
        where: { orgId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        include: {
          conversation: {
            select: {
              visitorName: true, visitorEmail: true,
              messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
          assignee: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      db.organization.findUnique({ where: { id: orgId } }),
    ]);

  const botRate = totalConvs > 0 ? Math.round((botHandled / totalConvs) * 100) : 0;

  const stats = [
    { label: 'Open Tickets', value: openTickets, icon: '🎫', color: 'text-red-400' },
    { label: 'Total Tickets', value: totalTickets, icon: '📋', color: 'text-blue-400' },
    { label: 'Bot Resolution Rate', value: `${botRate}%`, icon: '🤖', color: 'text-indigo-400' },
    { label: 'Knowledge Docs', value: knowledgeDocs, icon: '🧠', color: 'text-green-400' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
        </div>
        <Link href="/dashboard/settings"
          className="text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-700 transition">
          ⚙️ Widget Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent tickets */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="font-semibold">Open Tickets</h2>
          <Link href="/dashboard/tickets" className="text-xs text-indigo-400 hover:underline">View all</Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">🎉</div>
            <p>No open tickets. Your AI is handling everything!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-950 text-gray-500 text-xs uppercase">
              <tr>
                {['Subject', 'Visitor', 'Priority', 'Status', 'Created', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {recentTickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-5 py-3 font-medium">{truncate(t.subject, 40)}</td>
                  <td className="px-5 py-3 text-gray-400">
                    {t.conversation.visitorName ?? t.conversation.visitorEmail ?? 'Anonymous'}
                  </td>
                  <td className={`px-5 py-3 font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[t.status]}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{timeAgo(t.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Link href={`/dashboard/tickets/${t.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs">
                      Open →
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
