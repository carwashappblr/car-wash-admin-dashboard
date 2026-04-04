'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Task, TaskStatus } from '@/types';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TasksPage() {
  const [filter, setFilter] = useState<string>('ALL');

  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.get<Task[]>('/tasks').then(res => res.data)
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: TaskStatus }) => 
      apiClient.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Task Updated', { description: 'The wash status has been changed successfully.' });
      refetch();
    },
    onError: () => {
      toast.error('Update Failed', { description: 'Could not update task status.' });
    }
  });

  const filteredTasks = tasks?.filter(task => {
    if (filter === 'ALL') return true;
    return task.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Overview</h1>
          <p className="text-sm text-gray-500 font-medium">Monitor active car washes and history</p>
        </div>
        
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                filter === f ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Task Ref</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4 text-right">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : filteredTasks?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No tasks found.
                  </td>
                </tr>
              ) : (
                filteredTasks?.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{task.id.split('-')[0]}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{task.user?.name || 'Customer'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {task.machine?.name || <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                        <button 
                          onClick={() => mutation.mutate({ id: task.id, status: TaskStatus.COMPLETED })}
                          className="text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-green-500/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Done
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
