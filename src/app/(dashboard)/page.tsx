'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Users, Wrench, Briefcase, Activity } from 'lucide-react';

// Reusable Stat Card Component
function StatCard({ title, value, icon: Icon, color, loading }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:scale-150 group-hover:opacity-20 ${color}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
          {loading ? (
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
          ) : (
            <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">{value}</h3>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('bg-', 'bg-opacity-10 text-')}`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(res => res.data)
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => apiClient.get('/workers').then(res => res.data)
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.get('/tasks').then(res => res.data)
  });

  const activeWorkers = (Array.isArray(workers) ? workers : [])?.filter((w: any) => w.isActive)?.length || 0;
  const pendingTasks = (Array.isArray(tasks) ? tasks : [])?.filter((t: any) => t.status === 'PENDING')?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Here's what's happening with the platform today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Users" 
          value={users?.length || 0} 
          icon={Users} 
          color="bg-purple-600" 
          loading={usersLoading} 
        />
        <StatCard 
          title="Workers" 
          value={workers?.length || 0} 
          icon={Wrench} 
          color="bg-blue-600" 
          loading={workersLoading} 
        />
        <StatCard 
          title="Active Tasks" 
          value={tasks?.length || 0} 
          icon={Activity} 
          color="bg-indigo-600" 
          loading={tasksLoading} 
        />
        <StatCard 
          title="Pending Queue" 
          value={pendingTasks} 
          icon={Briefcase} 
          color="bg-orange-500" 
          loading={tasksLoading} 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mt-10">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 mb-4">Recent Activity Logs</h2>
          <div className="space-y-4">
             {/* Mock logs for visual demonstration since no specific log endpoint is available */}
             {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-600 group-hover:scale-150 transition-all"></div>
                  <div className="flex-1 text-sm font-medium text-gray-600">
                    User #{(Math.random() * 1000).toFixed(0)} registered a new account
                  </div>
                  <div className="text-xs text-gray-400 font-semibold">{i * 2} min ago</div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
