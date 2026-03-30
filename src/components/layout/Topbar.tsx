'use client';

import { useAuth } from '@/store/AuthContext';
import { LogOut, Bell, Search, UserCircle } from 'lucide-react';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative group max-w-md w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search users, tasks, workers..." 
            className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-full pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-700 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-gray-200"></div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{user?.name || 'Administrator'}</span>
            <span className="text-[10px] font-medium text-blue-600 tracking-wider bg-blue-50 px-1.5 py-0.5 rounded uppercase">
              {user?.role || 'ADMIN'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <UserCircle className="w-6 h-6" />
          </div>
        </div>

        <button 
          onClick={logout}
          className="ml-2 text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all group"
          title="Sign out"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </header>
  );
}
