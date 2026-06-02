'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community, Task, TaskStatus } from '@/types';
import { CalendarClock, CheckCircle2, Loader2, Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const TASK_TABS = [
  { key: TaskStatus.UNSCHEDULED, label: 'Unscheduled' },
  { key: TaskStatus.PENDING, label: 'Pending' },
  { key: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { key: TaskStatus.COMPLETED, label: 'Complete' },
] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case TaskStatus.UNSCHEDULED:
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case TaskStatus.PENDING:
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case TaskStatus.IN_PROGRESS:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case TaskStatus.COMPLETED:
      return 'bg-green-100 text-green-700 border-green-200';
    case TaskStatus.CANCELLED:
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<TaskStatus>(TaskStatus.UNSCHEDULED);
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState('');

  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const availableCommunities = Array.isArray(communities)
    ? communities.filter((community) => community.isActive)
    : [];
  const selectedCommunity = availableCommunities.find((community) => community.id === selectedCommunityId);
  const availableTowers = selectedCommunity?.towers.filter((tower) => tower.isActive) ?? [];

  const { data: tasks, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tower-tasks', selectedTowerId, activeTab],
    queryFn: () =>
      apiClient
        .get<Task[]>(`/tasks/tower/${selectedTowerId}/pending`, {
          params: { status: activeTab },
        })
        .then((res) => res.data),
    enabled: Boolean(selectedTowerId),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      apiClient.patch(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Task Updated', { description: 'The wash status has been changed successfully.' });
      refetch();
    },
    onError: () => {
      toast.error('Update Failed', { description: 'Could not update task status.' });
    },
  });

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setSelectedTowerId('');
    setActiveTab(TaskStatus.UNSCHEDULED);
  };

  const handleTowerChange = (towerId: string) => {
    setSelectedTowerId(towerId);
    setActiveTab(TaskStatus.UNSCHEDULED);
  };

  const renderAction = (task: Task) => {
    if (activeTab === TaskStatus.UNSCHEDULED) {
      return (
        <button
          type="button"
          className="text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
        >
          <CalendarClock className="w-3.5 h-3.5" />
          Assign Date / Machine
        </button>
      );
    }

    if (activeTab === TaskStatus.PENDING) {
      return (
        <button
          type="button"
          onClick={() => mutation.mutate({ id: task.id, status: TaskStatus.IN_PROGRESS })}
          disabled={mutation.isPending}
          className="text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
        >
          <Play className="w-3.5 h-3.5" />
          Start Washing
        </button>
      );
    }

    if (activeTab === TaskStatus.IN_PROGRESS) {
      return (
        <button
          type="button"
          onClick={() => mutation.mutate({ id: task.id, status: TaskStatus.COMPLETED })}
          disabled={mutation.isPending}
          className="text-white bg-green-500 hover:bg-green-600 disabled:opacity-70 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-green-500/20"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Mark Complete
        </button>
      );
    }

    return <span className="text-xs font-semibold text-gray-400">Completed</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Overview</h1>
          <p className="text-sm text-gray-500 font-medium">Monitor tower-specific car wash activity and history</p>
        </div>

        <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          {TASK_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              disabled={!selectedTowerId}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                activeTab === tab.key ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-900'
              } ${!selectedTowerId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Community</label>
            <select
              value={selectedCommunityId}
              onChange={(e) => handleCommunityChange(e.target.value)}
              disabled={communitiesLoading || availableCommunities.length === 0}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
            >
              <option value="">
                {communitiesLoading ? 'Loading communities...' : 'Select community'}
              </option>
              {availableCommunities.map((community) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tower</label>
            <select
              value={selectedTowerId}
              onChange={(e) => handleTowerChange(e.target.value)}
              disabled={!selectedCommunityId || availableTowers.length === 0}
              className="w-full bg-gray-50/50 border border-gray-200 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900 disabled:text-gray-400"
            >
              <option value="">
                {!selectedCommunityId ? 'Select community first' : 'Select tower'}
              </option>
              {availableTowers.map((tower) => (
                <option key={tower.id} value={tower.id}>
                  {tower.name}
                </option>
              ))}
            </select>
          </div>
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
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!selectedTowerId ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-700">Select a tower to load tasks.</p>
                      <p className="text-sm text-gray-500">Choose a community first, then pick one of its towers.</p>
                    </div>
                  </td>
                </tr>
              ) : isLoading || isFetching ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : !tasks?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-700">No tasks in this tab.</p>
                      <p className="text-sm text-gray-500">This tower has no {activeTab.replace('_', ' ').toLowerCase()} tasks right now.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
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
                    <td className="px-6 py-4 text-right">{renderAction(task)}</td>
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
