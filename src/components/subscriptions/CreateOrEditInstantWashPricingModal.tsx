'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createInstantWashPricing, updateInstantWashPricing } from '@/api/instant-wash-pricing';
import { instantWashPricingsQueryKey } from '@/hooks/useInstantWashPricings';
import { InstantWashPricing, Community, CreateInstantWashPricingPayload } from '@/types';
import { apiClient } from '@/api/client';

interface CreateOrEditInstantWashPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingToEdit?: InstantWashPricing | null;
}

export function CreateOrEditInstantWashPricingModal({
  isOpen,
  onClose,
  pricingToEdit,
}: CreateOrEditInstantWashPricingModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!pricingToEdit;

  const [communityId, setCommunityId] = useState('');
  const [carType, setCarType] = useState<'HATCHBACK' | 'SEDAN' | 'SUV'>('HATCHBACK');
  const [washType, setWashType] = useState<'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM'>('EXTERIOR');
  const [price, setPrice] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: communities } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const availableCommunities = (Array.isArray(communities) ? communities : []).filter(
    (c) => c.isActive
  );

  useEffect(() => {
    if (pricingToEdit) {
      setCommunityId(pricingToEdit.communityId);
      setCarType(pricingToEdit.carType);
      setWashType(pricingToEdit.washType);
      setPrice(String(pricingToEdit.price));
      setIsActive(pricingToEdit.isActive);
    } else {
      setCommunityId(availableCommunities[0]?.id || '');
      setCarType('HATCHBACK');
      setWashType('EXTERIOR');
      setPrice('');
      setIsActive(true);
    }
    setValidationErrors({});
  }, [pricingToEdit, isOpen, communities]);

  const mutation = useMutation({
    mutationFn: (payload: CreateInstantWashPricingPayload) => {
      if (isEdit && pricingToEdit) {
        return updateInstantWashPricing(pricingToEdit.id, payload);
      }
      return createInstantWashPricing(payload);
    },
    onSuccess: async () => {
      toast.success(isEdit ? 'Pricing updated' : 'Pricing created', {
        description: isEdit
          ? 'The instant wash pricing has been updated.'
          : 'New instant wash pricing has been added.',
      });
      await queryClient.invalidateQueries({ queryKey: instantWashPricingsQueryKey });
      handleClose();
    },
    onError: (error: any) => {
      toast.error('Unable to save pricing', {
        description: error.response?.data?.message || error.message || 'Something went wrong',
      });
    },
  });

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!communityId) {
      errors.communityId = 'Community is required';
    }
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      errors.price = 'Please enter a valid price (minimum 0)';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    mutation.mutate({
      communityId,
      carType,
      washType,
      price: Number(price),
      isActive,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">
                {isEdit ? 'Edit Instant Wash Price' : 'Add Instant Wash Price'}
              </h2>
              <p className="text-xs font-medium text-gray-500">
                {isEdit
                  ? 'Update flat rate pricing for one-off washes.'
                  : 'Define a new flat rate pricing for one-off washes.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Community */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Community
            </label>
            <select
              disabled={isEdit}
              value={communityId}
              onChange={(e) => setCommunityId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Community</option>
              {availableCommunities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
            {validationErrors.communityId && (
              <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.communityId}</p>
            )}
          </div>

          {/* Car Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Car Type
            </label>
            <select
              disabled={isEdit}
              value={carType}
              onChange={(e) => setCarType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="HATCHBACK">HATCHBACK</option>
              <option value="SEDAN">SEDAN</option>
              <option value="SUV">SUV</option>
            </select>
          </div>

          {/* Wash Type */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Wash Type
            </label>
            <select
              disabled={isEdit}
              value={washType}
              onChange={(e) => setWashType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              <option value="EXTERIOR">EXTERIOR</option>
              <option value="EXTERIOR_INTERIOR">EXTERIOR & INTERIOR</option>
              <option value="PREMIUM">PREMIUM</option>
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Flat Price (INR)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 299"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {validationErrors.price && (
              <p className="mt-1 text-xs font-medium text-red-600">{validationErrors.price}</p>
            )}
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
              Active & Available
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Price' : 'Add Price'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
