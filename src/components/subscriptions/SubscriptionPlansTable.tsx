'use client';

import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '@/types';

interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[];
  isLoading: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function SubscriptionPlansTable({
  plans,
  isLoading,
  errorMessage,
  onRetry,
}: SubscriptionPlansTableProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-3 text-sm font-medium text-gray-500">Loading subscription plans...</p>
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
            <h3 className="text-lg font-bold text-gray-900">Unable to load subscription plans</h3>
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

  if (plans.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-900">No subscription plans yet</h3>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-500">
          Create your first plan to define pricing, wash limits, and duration for customer subscriptions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm text-gray-600">
          <thead className="bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-6 py-4">Plan Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Wash Count</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {plans.map((plan) => (
              <tr key={plan.id} className="transition-colors hover:bg-blue-50/30">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="mt-1 text-xs font-medium text-gray-400">{plan.id}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {plan.description?.trim() ? plan.description : 'No description'}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {currencyFormatter.format(plan.price)}
                </td>
                <td className="px-6 py-4 text-gray-700">{plan.durationDays} days</td>
                <td className="px-6 py-4 text-gray-700">{plan.washCount} washes</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      plan.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{dateFormatter.format(new Date(plan.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
