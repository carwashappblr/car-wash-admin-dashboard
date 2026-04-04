'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wrench, Briefcase, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Machines', href: '/machines', icon: Wrench },
  { name: 'Tasks', href: '/tasks', icon: Briefcase },
  { name: 'Subscriptions', href: '/subscription-plans', icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex-shrink-0 flex flex-col items-start px-4 py-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 sticky top-0 h-screen">
      <div className="mb-10 px-4 w-full">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          CleanCart
        </h1>
        <p className="text-xs text-gray-500 font-medium tracking-wide mt-1 uppercase">Control Panel</p>
      </div>
      
      <nav className="flex-1 w-full space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500 transition-colors")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto px-4 py-4 w-full bg-blue-50/50 rounded-xl border border-blue-100/50">
        <p className="text-xs text-blue-800 font-semibold mb-1">Need help?</p>
        <p className="text-[10px] text-blue-600/80">Check the documentation or contact support.</p>
      </div>
    </aside>
  );
}
