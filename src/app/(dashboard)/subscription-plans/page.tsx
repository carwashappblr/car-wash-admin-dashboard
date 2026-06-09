'use client';

import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { CreditCard, Plus } from 'lucide-react';
import { CreateSubscriptionPlanModal } from '@/components/subscriptions/CreateSubscriptionPlanModal';
import { SubscriptionPlansTable } from '@/components/subscriptions/SubscriptionPlansTable';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community } from '@/types';

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while fetching subscription plans.';
}

export default function SubscriptionPlansPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  const { data, isLoading, error, refetch, isFetching } = useSubscriptionPlans(
    selectedCommunityId || undefined
  );

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const availableCommunities = (Array.isArray(communities) ? communities : []).filter(
    (c) => c.isActive
  );

  const plans = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const errorMessage = error ? getErrorMessage(error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm font-medium text-gray-500">
            Manage admin-created subscription plans, pricing, duration, and wash limits.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="group flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
          Add Subscription Plan
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
              <CreditCard className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">Plan Catalog</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Filter by Community:</span>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Communities</option>
                  {availableCommunities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Plans</p>
              <p className="text-xl font-bold text-gray-900">{plans.length}</p>
            </div>
            <div className="h-10 w-px bg-gray-100" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog Status</p>
              <p className="text-sm font-semibold text-gray-700">
                {isLoading || isFetching ? 'Syncing...' : 'Up to date'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPlansTable
        plans={plans}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={() => refetch()}
      />

      <CreateSubscriptionPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
