'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/tickets', label: 'Tickets', icon: '🎫' },
  { href: '/dashboard/knowledge', label: 'Knowledge Base', icon: '🧠' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-gray-800">
        <span className="text-lg font-bold text-indigo-400">⚡ SupportIQ</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition',
              pathname === item.href
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}>
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <p className="text-xs text-gray-400 truncate mb-2">{session?.user?.email}</p>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="text-xs text-gray-500 hover:text-red-400 transition w-full text-left">
          Sign out
        </button>
      </div>
    </aside>
  );
}
