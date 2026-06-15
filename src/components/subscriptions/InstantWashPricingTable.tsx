'use client';

import { AlertCircle, CreditCard, Loader2, Edit2, Trash2 } from 'lucide-react';
import { InstantWashPricing, Community } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { deleteInstantWashPricing } from '@/api/instant-wash-pricing';
import { instantWashPricingsQueryKey } from '@/hooks/useInstantWashPricings';
import { toast } from 'sonner';

interface InstantWashPricingTableProps {
  pricings: InstantWashPricing[];
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onEdit: (pricing: InstantWashPricing) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function InstantWashPricingTable({
  pricings,
  isLoading,
  errorMessage,
  onRetry,
  onEdit,
}: InstantWashPricingTableProps) {
  const queryClient = useQueryClient();

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInstantWashPricing,
    onSuccess: async () => {
      toast.success('Instant wash pricing deleted');
      await queryClient.invalidateQueries({ queryKey: instantWashPricingsQueryKey });
    },
    onError: (error: unknown) => {
      toast.error('Unable to delete pricing', {
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this pricing?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm font-medium text-gray-500">Loading instant wash pricing...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-50 p-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">Unable to load instant wash pricing</h3>
            <p className="mt-1 text-sm font-medium text-gray-600">{errorMessage}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Try Again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (pricings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-900">No instant wash pricing set</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-500">
          Define flat pricing for one-off/instant washes per community, car type, and wash type.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm text-gray-600">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Community</th>
              <th className="px-6 py-4">Car Type</th>
              <th className="px-6 py-4">Wash Type</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pricings.map((pricing) => {
              const community = Array.isArray(communities)
                ? communities.find((c) => c.id === pricing.communityId)
                : null;
              return (
                <tr key={pricing.id} className="transition-colors hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">
                      {community ? `${community.name} (${community.city})` : pricing.communityId}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                      {pricing.carType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 font-semibold">
                      {pricing.washType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {currencyFormatter.format(pricing.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        pricing.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {pricing.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(pricing)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        title="Edit Price"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(pricing.id)}
                        disabled={deleteMutation.isPending}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Delete Pricing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
