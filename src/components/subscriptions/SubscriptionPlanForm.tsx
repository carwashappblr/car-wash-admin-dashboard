'use client';

import { clsx } from 'clsx';
import { CreateSubscriptionPlanPayload, SubscriptionPlan, Community } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { useState, useEffect } from 'react';

export interface SubscriptionPlanFormValues {
  communityId: string;
  name: string;
  description: string;
  basePrice: string;
  durationDays: string;
  baseWashCount: string;
  extraWashPrice: string;
  // We can also let the admin customize multiplier/surcharge per tier in the form
  tiers: {
    carType: 'HATCHBACK' | 'SEDAN' | 'SUV';
    washType: 'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM';
    priceMultiplier: string;
    surcharge: string;
  }[];
}

export interface SubscriptionPlanFormErrors {
  communityId?: string;
  name?: string;
  basePrice?: string;
  durationDays?: string;
  baseWashCount?: string;
  extraWashPrice?: string;
  [key: string]: string | undefined; // For tier validation errors
}

interface SubscriptionPlanFormProps {
  formValues: SubscriptionPlanFormValues;
  errors: SubscriptionPlanFormErrors;
  isSubmitting: boolean;
  mode?: 'create' | 'edit';
  submitLabel: string;
  onChange: (field: keyof SubscriptionPlanFormValues, value: any) => void;
  onValidationError: (errors: SubscriptionPlanFormErrors) => void;
  onSubmit: (payload: CreateSubscriptionPlanPayload) => void;
  onCancel: () => void;
}

const defaultTiers = [
  { carType: 'HATCHBACK', washType: 'EXTERIOR', priceMultiplier: '1.0', surcharge: '0' },
  { carType: 'HATCHBACK', washType: 'EXTERIOR_INTERIOR', priceMultiplier: '1.0', surcharge: '300' },
  { carType: 'HATCHBACK', washType: 'PREMIUM', priceMultiplier: '1.0', surcharge: '600' },
  { carType: 'SEDAN', washType: 'EXTERIOR', priceMultiplier: '1.15', surcharge: '0' },
  { carType: 'SEDAN', washType: 'EXTERIOR_INTERIOR', priceMultiplier: '1.15', surcharge: '300' },
  { carType: 'SEDAN', washType: 'PREMIUM', priceMultiplier: '1.15', surcharge: '600' },
  { carType: 'SUV', washType: 'EXTERIOR', priceMultiplier: '1.35', surcharge: '0' },
  { carType: 'SUV', washType: 'EXTERIOR_INTERIOR', priceMultiplier: '1.35', surcharge: '300' },
  { carType: 'SUV', washType: 'PREMIUM', priceMultiplier: '1.35', surcharge: '600' },
] as const;

export const emptySubscriptionPlanFormValues: SubscriptionPlanFormValues = {
  communityId: '',
  name: '',
  description: '',
  basePrice: '',
  durationDays: '',
  baseWashCount: '',
  extraWashPrice: '200',
  tiers: [...defaultTiers].map(t => ({ ...t })),
};

function parsePositiveNumber(value: string) {
  if (!value.trim()) {
    return { error: 'This field is required.' };
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return { error: 'Enter a valid positive number.' };
  }

  return { value: parsedValue };
}

function parsePositiveInteger(value: string) {
  if (!value.trim()) {
    return { error: 'This field is required.' };
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return { error: 'Enter a positive whole number.' };
  }

  return { value: parsedValue };
}

export function SubscriptionPlanForm({
  formValues,
  errors,
  isSubmitting,
  mode = 'create',
  submitLabel,
  onChange,
  onValidationError,
  onSubmit,
  onCancel,
}: SubscriptionPlanFormProps) {
  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => apiClient.get<Community[]>('/communities').then((res) => res.data),
  });

  const availableCommunities = (Array.isArray(communities) ? communities : []).filter(
    (c) => c.isActive
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: SubscriptionPlanFormErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedDescription = formValues.description.trim();

    if (!formValues.communityId) {
      nextErrors.communityId = 'Community selection is required.';
    }

    if (!trimmedName) {
      nextErrors.name = 'Plan name is required.';
    }

    const parsedBasePrice = parsePositiveNumber(formValues.basePrice);
    if (parsedBasePrice.error) {
      nextErrors.basePrice = parsedBasePrice.error;
    }

    const parsedDurationDays = parsePositiveInteger(formValues.durationDays);
    if (parsedDurationDays.error) {
      nextErrors.durationDays = parsedDurationDays.error;
    }

    const parsedBaseWashCount = parsePositiveInteger(formValues.baseWashCount);
    if (parsedBaseWashCount.error) {
      nextErrors.baseWashCount = parsedBaseWashCount.error;
    }

    const parsedExtraWashPrice = parsePositiveNumber(formValues.extraWashPrice);
    if (parsedExtraWashPrice.error) {
      nextErrors.extraWashPrice = parsedExtraWashPrice.error;
    }

    // Validate Tiers
    const parsedTiers = formValues.tiers.map((t, idx) => {
      const mult = Number(t.priceMultiplier);
      const sur = Number(t.surcharge);
      if (isNaN(mult) || mult < 0) {
        nextErrors[`tier_${idx}_mult`] = 'Invalid multiplier';
      }
      if (isNaN(sur) || sur < 0) {
        nextErrors[`tier_${idx}_sur`] = 'Invalid surcharge';
      }
      return {
        carType: t.carType,
        washType: t.washType,
        priceMultiplier: mult,
        surcharge: sur,
      };
    });

    if (Object.keys(nextErrors).length > 0) {
      onValidationError(nextErrors);
      return;
    }

    onSubmit({
      communityId: formValues.communityId,
      name: trimmedName,
      description: trimmedDescription || undefined,
      basePrice: parsedBasePrice.value!,
      durationDays: parsedDurationDays.value!,
      baseWashCount: parsedBaseWashCount.value!,
      extraWashPrice: parsedExtraWashPrice.value!,
      pricingTiers: parsedTiers,
    });
  };

  const handleTierChange = (index: number, field: 'priceMultiplier' | 'surcharge', value: string) => {
    const updatedTiers = [...formValues.tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    onChange('tiers', updatedTiers);
  };

  const inputClassName =
    'w-full rounded-xl border bg-gray-50/60 px-4 py-3 text-sm font-medium text-gray-900 transition-all placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2';

  const getInputStateClassName = (hasError?: string) =>
    clsx(
      inputClassName,
      hasError
        ? 'border-red-300 focus:border-red-400 focus:ring-red-500/15'
        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/15'
    );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Target Community</label>
          <select
            required
            value={formValues.communityId}
            onChange={(event) => onChange('communityId', event.target.value)}
            className={getInputStateClassName(errors.communityId)}
            disabled={communitiesLoading}
          >
            <option value="">Select a community</option>
            {availableCommunities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.city})
              </option>
            ))}
          </select>
          {errors.communityId ? <p className="text-xs font-medium text-red-600">{errors.communityId}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Plan Name</label>
          <input
            type="text"
            required
            value={formValues.name}
            onChange={(event) => onChange('name', event.target.value)}
            className={getInputStateClassName(errors.name)}
            placeholder="e.g. Monthly Standard"
          />
          {errors.name ? <p className="text-xs font-medium text-red-600">{errors.name}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Description</label>
        <textarea
          rows={2}
          value={formValues.description}
          onChange={(event) => onChange('description', event.target.value)}
          className={getInputStateClassName()}
          placeholder="e.g. Includes interior vacuuming and premium wax coats"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Base Price (Hatchback/Ext)</label>
          <input
            type="number"
            min="0"
            required
            value={formValues.basePrice}
            onChange={(event) => onChange('basePrice', event.target.value)}
            className={getInputStateClassName(errors.basePrice)}
            placeholder="500"
          />
          {errors.basePrice ? <p className="text-xs font-medium text-red-600">{errors.basePrice}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Base Wash Count</label>
          <input
            type="number"
            min="1"
            required
            value={formValues.baseWashCount}
            onChange={(event) => onChange('baseWashCount', event.target.value)}
            className={getInputStateClassName(errors.baseWashCount)}
            placeholder="4"
          />
          {errors.baseWashCount ? <p className="text-xs font-medium text-red-600">{errors.baseWashCount}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Extra Wash Price</label>
          <input
            type="number"
            min="0"
            required
            value={formValues.extraWashPrice}
            onChange={(event) => onChange('extraWashPrice', event.target.value)}
            className={getInputStateClassName(errors.extraWashPrice)}
            placeholder="200"
          />
          {errors.extraWashPrice ? <p className="text-xs font-medium text-red-600">{errors.extraWashPrice}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Duration (Days)</label>
          <input
            type="number"
            min="1"
            required
            value={formValues.durationDays}
            onChange={(event) => onChange('durationDays', event.target.value)}
            className={getInputStateClassName(errors.durationDays)}
            placeholder="30"
          />
          {errors.durationDays ? <p className="text-xs font-medium text-red-600">{errors.durationDays}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600 block">Pricing Tiers Configuration</label>
        <p className="text-xs text-gray-500 mb-2">Adjust multipliers and surcharges to customize the price breakdown for Sedan/SUV and Interior/Premium washes.</p>
        
        <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs text-gray-600 divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2.5">Car Type</th>
                <th className="px-4 py-2.5">Wash Type</th>
                <th className="px-4 py-2.5">Multiplier</th>
                <th className="px-4 py-2.5">Surcharge (₹)</th>
                <th className="px-4 py-2.5 text-right">Preview Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {formValues.tiers.map((tier, idx) => {
                const base = Number(formValues.basePrice) || 0;
                const mult = Number(tier.priceMultiplier) || 1.0;
                const sur = Number(tier.surcharge) || 0;
                const previewValue = Math.round(base * mult + sur);

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{tier.carType}</td>
                    <td className="px-4 py-2 font-medium text-gray-900">{tier.washType.replace('_', ' ')}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={tier.priceMultiplier}
                        onChange={(e) => handleTierChange(idx, 'priceMultiplier', e.target.value)}
                        className="w-16 rounded border border-gray-200 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={tier.surcharge}
                        onChange={(e) => handleTierChange(idx, 'surcharge', e.target.value)}
                        className="w-20 rounded border border-gray-200 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-gray-800">
                      ₹{previewValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            'flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-colors hover:bg-blue-700',
            isSubmitting && 'cursor-not-allowed opacity-70'
          )}
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
