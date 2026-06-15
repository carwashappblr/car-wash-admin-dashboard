'use client';

import { useMemo, useState } from 'react';
import { AxiosError } from 'axios';
import { CreditCard, Plus, Zap } from 'lucide-react';
import { CreateSubscriptionPlanModal } from '@/components/subscriptions/CreateSubscriptionPlanModal';
import { SubscriptionPlansTable } from '@/components/subscriptions/SubscriptionPlansTable';
import { CreateOrEditInstantWashPricingModal } from '@/components/subscriptions/CreateOrEditInstantWashPricingModal';
import { InstantWashPricingTable } from '@/components/subscriptions/InstantWashPricingTable';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useInstantWashPricings } from '@/hooks/useInstantWashPricings';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { Community, InstantWashPricing } from '@/types';

function getErrorMessage(error: unknown, type: 'subscription' | 'instant') {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `Something went wrong while fetching ${
    type === 'subscription' ? 'subscription plans' : 'instant wash flat rates'
  }.`;
}

export default function SubscriptionPlansPage() {
  const [activeTab, setActiveTab] = useState<'subscription' | 'instant'>('subscription');
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isInstantPricingOpen, setIsInstantPricingOpen] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [editingPricing, setEditingPricing] = useState<InstantWashPricing | null>(null);

  // Subscriptions Query
  const {
    data: plansData,
    isLoading: isPlansLoading,
    error: plansError,
    refetch: refetchPlans,
    isFetching: isPlansFetching,
  } = useSubscriptionPlans(selectedCommunityId || undefined);

  // Instant Wash Pricing Query
  const {
    data: pricingData,
    isLoading: isPricingLoading,
    error: pricingError,
    refetch: refetchPricing,
    isFetching: isPricingFetching,
  } = useInstantWashPricings(selectedCommunityId || undefined);

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const availableCommunities = (Array.isArray(communities) ? communities : []).filter(
    (c) => c.isActive
  );

  const plans = useMemo(() => (Array.isArray(plansData) ? plansData : []), [plansData]);
  const pricings = useMemo(() => (Array.isArray(pricingData) ? pricingData : []), [pricingData]);

  const isLoading = activeTab === 'subscription' ? isPlansLoading : isPricingLoading;
  const isFetching = activeTab === 'subscription' ? isPlansFetching : isPricingFetching;
  const error = activeTab === 'subscription' ? plansError : pricingError;
  const refetch = activeTab === 'subscription' ? refetchPlans : refetchPricing;
  const totalCount = activeTab === 'subscription' ? plans.length : pricings.length;

  const errorMessage = error ? getErrorMessage(error, activeTab) : null;

  const handleEditPricing = (pricing: InstantWashPricing) => {
    setEditingPricing(pricing);
    setIsInstantPricingOpen(true);
  };

  const handleAddPricing = () => {
    setEditingPricing(null);
    setIsInstantPricingOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans & Pricing</h1>
          <p className="text-sm font-medium text-gray-500">
            Manage subscription plans and instant wash flat rates for different communities.
          </p>
        </div>

        {activeTab === 'subscription' ? (
          <button
            type="button"
            onClick={() => setIsCreatePlanOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Add Subscription Plan
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAddPricing}
            className="group flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Add Flat Price
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === 'subscription'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Monthly Subscription Plans
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('instant')}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-semibold transition-all ${
            activeTab === 'instant'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="h-4 w-4" />
          Instant Wash Flat Rates
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-gradient-to-r from-blue-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white p-3 text-blue-600 shadow-sm">
              {activeTab === 'subscription' ? (
                <CreditCard className="h-6 w-6" />
              ) : (
                <Zap className="h-6 w-6" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === 'subscription' ? 'Plan Catalog' : 'Instant Wash Catalogue'}
              </h2>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {activeTab === 'subscription' ? 'Total Plans' : 'Total Price Configurations'}
              </p>
              <p className="text-xl font-bold text-gray-900">{totalCount}</p>
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

      {activeTab === 'subscription' ? (
        <SubscriptionPlansTable
          plans={plans}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onRetry={() => refetch()}
        />
      ) : (
        <InstantWashPricingTable
          pricings={pricings}
          isLoading={isLoading}
          errorMessage={errorMessage}
          onRetry={() => refetch()}
          onEdit={handleEditPricing}
        />
      )}

      {/* Modals */}
      <CreateSubscriptionPlanModal
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
      />

      <CreateOrEditInstantWashPricingModal
        isOpen={isInstantPricingOpen}
        pricingToEdit={editingPricing}
        onClose={() => {
          setIsInstantPricingOpen(false);
          setEditingPricing(null);
        }}
      />
    </div>
  );
}
