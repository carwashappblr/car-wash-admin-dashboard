'use client';

import { clsx } from 'clsx';
import { CreateSubscriptionPlanPayload, SubscriptionPlan } from '@/types';

export interface SubscriptionPlanFormValues {
  name: string;
  description: string;
  price: string;
  durationDays: string;
  washCount: string;
}

export interface SubscriptionPlanFormErrors {
  name?: string;
  price?: string;
  durationDays?: string;
  washCount?: string;
}

interface SubscriptionPlanFormProps {
  formValues: SubscriptionPlanFormValues;
  errors: SubscriptionPlanFormErrors;
  isSubmitting: boolean;
  mode?: 'create' | 'edit';
  submitLabel: string;
  onChange: (field: keyof SubscriptionPlanFormValues, value: string) => void;
  onValidationError: (errors: SubscriptionPlanFormErrors) => void;
  onSubmit: (payload: CreateSubscriptionPlanPayload) => void;
  onCancel: () => void;
}

export const emptySubscriptionPlanFormValues: SubscriptionPlanFormValues = {
  name: '',
  description: '',
  price: '',
  durationDays: '',
  washCount: '',
};

function parsePositiveNumber(value: string) {
  if (!value.trim()) {
    return { error: 'This field is required.' };
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return { error: 'Enter a positive number.' };
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

export function getSubscriptionPlanFormValues(plan?: Partial<SubscriptionPlan> | null): SubscriptionPlanFormValues {
  if (!plan) {
    return emptySubscriptionPlanFormValues;
  }

  return {
    name: plan.name ?? '',
    description: plan.description ?? '',
    price: typeof plan.price === 'number' ? String(plan.price) : '',
    durationDays: typeof plan.durationDays === 'number' ? String(plan.durationDays) : '',
    washCount: typeof plan.washCount === 'number' ? String(plan.washCount) : '',
  };
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
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: SubscriptionPlanFormErrors = {};
    const trimmedName = formValues.name.trim();
    const trimmedDescription = formValues.description.trim();

    if (!trimmedName) {
      nextErrors.name = 'Plan name is required.';
    }

    const parsedPrice = parsePositiveNumber(formValues.price);
    if (parsedPrice.error) {
      nextErrors.price = parsedPrice.error;
    }

    const parsedDurationDays = parsePositiveInteger(formValues.durationDays);
    if (parsedDurationDays.error) {
      nextErrors.durationDays = parsedDurationDays.error;
    }

    const parsedWashCount = parsePositiveInteger(formValues.washCount);
    if (parsedWashCount.error) {
      nextErrors.washCount = parsedWashCount.error;
    }

    if (Object.keys(nextErrors).length > 0) {
      onValidationError(nextErrors);
      return;
    }

    onSubmit({
      name: trimmedName,
      description: trimmedDescription || undefined,
      price: parsedPrice.value!,
      durationDays: parsedDurationDays.value!,
      washCount: parsedWashCount.value!,
    });
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
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Plan Name</label>
        <input
          type="text"
          required
          value={formValues.name}
          onChange={(event) => onChange('name', event.target.value)}
          className={getInputStateClassName(errors.name)}
          placeholder="Basic Plan"
        />
        {errors.name ? <p className="text-xs font-medium text-red-600">{errors.name}</p> : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Description</label>
        <textarea
          rows={3}
          value={formValues.description}
          onChange={(event) => onChange('description', event.target.value)}
          className={getInputStateClassName()}
          placeholder="5 washes per month"
        />
        <p className="text-xs font-medium text-gray-500">Optional. Keep it short and clear for admins.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={formValues.price}
            onChange={(event) => onChange('price', event.target.value)}
            className={getInputStateClassName(errors.price)}
            placeholder="499"
          />
          {errors.price ? <p className="text-xs font-medium text-red-600">{errors.price}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Duration Days</label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={formValues.durationDays}
            onChange={(event) => onChange('durationDays', event.target.value)}
            className={getInputStateClassName(errors.durationDays)}
            placeholder="30"
          />
          {errors.durationDays ? <p className="text-xs font-medium text-red-600">{errors.durationDays}</p> : null}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">Wash Count</label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={formValues.washCount}
            onChange={(event) => onChange('washCount', event.target.value)}
            className={getInputStateClassName(errors.washCount)}
            placeholder="5"
          />
          {errors.washCount ? <p className="text-xs font-medium text-red-600">{errors.washCount}</p> : null}
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          {mode === 'create' ? 'Admin Creation Flow' : 'Plan Details'}
        </p>
        <p className="mt-1 text-sm font-medium text-blue-900">
          This screen manages plan metadata only. Payment gateway setup is intentionally excluded from this admin flow.
        </p>
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
