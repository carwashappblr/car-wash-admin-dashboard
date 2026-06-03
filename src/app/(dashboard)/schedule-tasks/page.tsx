'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community, UserSubscription, TaskStatus } from '@/types';
import { ScheduleWashModal } from '@/components/subscriptions/ScheduleWashModal';
import { Loader2, Search, Calendar, User, Car as CarIcon, RefreshCw, AlertCircle } from 'lucide-react';

export default function ScheduleTasksPage() {
  const [selectedCommunityId, setSelectedCommunityId] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch communities & towers for filters
  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const availableCommunities = Array.isArray(communities)
    ? communities.filter((c) => c.isActive)
    : [];
  const selectedCommunity = availableCommunities.find((c) => c.id === selectedCommunityId);
  const availableTowers = selectedCommunity?.towers.filter((t) => t.isActive) ?? [];

  // Fetch subscriptions
  const { 
    data: subscriptions, 
    isLoading: subscriptionsLoading, 
    isFetching, 
    refetch 
  } = useQuery({
    queryKey: ['subscriptions-for-scheduling'],
    queryFn: () => apiClient.get<UserSubscription[]>('/subscriptions').then((res) => res.data),
  });

  const handleCommunityChange = (communityId: string) => {
    setSelectedCommunityId(communityId);
    setSelectedTowerId('');
  };

  // Filter subscriptions based on search and selected community/tower
  const filteredSubscriptions = (Array.isArray(subscriptions) ? subscriptions : []).filter((sub) => {
    // Community filter
    if (selectedCommunityId) {
      if (sub.car?.tower?.communityId !== selectedCommunityId) return false;
    }
    // Tower filter
    if (selectedTowerId) {
      if (sub.car?.towerId !== selectedTowerId) return false;
    }
    // Search filter (customer name, email, phone, plate, car make/model)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const name = (sub.user?.name || '').toLowerCase();
      const phone = (sub.user?.phone || '').toLowerCase();
      const email = (sub.user?.email || '').toLowerCase();
      const plate = (sub.car?.plateNumber || '').toLowerCase();
      const make = (sub.car?.make || '').toLowerCase();
      const model = (sub.car?.model || '').toLowerCase();

      return (
        name.includes(query) ||
        phone.includes(query) ||
        email.includes(query) ||
        plate.includes(query) ||
        make.includes(query) ||
        model.includes(query)
      );
    }
    return true;
  });

  const openScheduleModal = (sub: UserSubscription) => {
    setSelectedSubscription(sub);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Tasks</h1>
          <p className="text-sm text-gray-500 font-medium">Create and manage wash tasks directly from active user subscriptions</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={subscriptionsLoading || isFetching}
          className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Search Customer / Plate</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          {/* Community filter */}
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

          {/* Tower filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tower</label>
            <select
              value={selectedTowerId}
              onChange={(e) => setSelectedTowerId(e.target.value)}
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

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {subscriptionsLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-6">
            <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700 text-lg">No active subscriptions found</p>
            <p className="text-sm text-gray-500 mt-1">Try relaxing filters or search terms, or verify active plans exist.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 text-xs uppercase font-semibold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Car Details</th>
                  <th className="px-6 py-4">Subscription Details</th>
                  <th className="px-6 py-4">Usage Summary</th>
                  <th className="px-6 py-4">Upcoming Schedule</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubscriptions.map((sub) => {
                  // Filter out pending or in-progress tasks
                  const upcomingTasks = sub.tasks?.filter(
                    (t) => t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS
                  ) || [];

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/30 transition-colors align-top">
                      {/* Customer Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-lg mt-0.5">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{sub.user?.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">{sub.user?.phone || 'No Phone'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[150px]">{sub.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Car Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg mt-0.5">
                            <CarIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">
                              {sub.car?.color} {sub.car?.make} {sub.car?.model}
                            </p>
                            <p className="text-xs font-mono font-bold text-gray-700 mt-0.5">
                              {sub.car?.plateNumber}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {sub.car?.tower?.community?.name} ({sub.car?.tower?.name || 'N/A'})
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Subscription Details */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-indigo-700 text-xs bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5 inline-block mb-1.5">
                            {sub.plan?.name}
                          </p>
                          <p className="text-xs text-gray-500 leading-normal">
                            Starts: <span className="font-medium text-gray-700">{formatDate(sub.startDate)}</span>
                          </p>
                          <p className="text-xs text-gray-500 leading-normal">
                            Ends: <span className="font-medium text-gray-700">{formatDate(sub.endDate)}</span>
                          </p>
                        </div>
                      </td>

                      {/* Usage Summary */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Allowed:</span>
                            <span className="font-semibold text-gray-900">{sub.plan?.washCount}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Used:</span>
                            <span className="font-semibold text-gray-900">{sub.washesUsed}</span>
                          </div>
                          <div className="border-t border-gray-100 pt-1 mt-1 flex justify-between items-center text-xs">
                            <span className="font-semibold text-gray-700">Remaining:</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              sub.remainingWashes > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {sub.remainingWashes}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Upcoming Schedule */}
                      <td className="px-6 py-4">
                        {upcomingTasks.length === 0 ? (
                          <span className="text-xs text-gray-400 italic font-medium">None scheduled</span>
                        ) : (
                          <div className="space-y-1.5">
                            {upcomingTasks.map((t) => (
                              <div key={t.id} className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-1.5 flex flex-col gap-0.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-[9px] font-extrabold uppercase px-1 rounded ${
                                    t.status === TaskStatus.IN_PROGRESS 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {t.status.replace('_', ' ')}
                                  </span>
                                  {t.slotId && (
                                    <span className="text-[9px] font-mono text-gray-500 bg-white border border-gray-100 px-1 rounded">
                                      Slot: {t.slotId}
                                    </span>
                                  )}
                                </div>
                                <span className="font-medium text-gray-700 mt-0.5">
                                  {t.scheduledDate ? formatDateTime(t.scheduledDate) : 'No Date'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openScheduleModal(sub)}
                          disabled={sub.remainingWashes <= upcomingTasks.length}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          {sub.remainingWashes <= upcomingTasks.length
                            ? sub.remainingWashes <= 0
                              ? 'No Washes Left'
                              : 'Tasks Pending'
                            : 'Schedule Wash'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ScheduleWashModal
        isOpen={isModalOpen}
        subscription={selectedSubscription}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubscription(null);
        }}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
