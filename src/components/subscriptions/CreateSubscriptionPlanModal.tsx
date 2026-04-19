'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { createSubscriptionPlan } from '@/api/subscription-plans';
import { subscriptionPlansQueryKey } from '@/hooks/useSubscriptionPlans';
import { CreateSubscriptionPlanPayload } from '@/types';
import {
  emptySubscriptionPlanFormValues,
  SubscriptionPlanForm,
  SubscriptionPlanFormErrors,
  SubscriptionPlanFormValues,
} from '@/components/subscriptions/SubscriptionPlanForm';

interface CreateSubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ErrorResponse {
  message?: string;
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while saving the subscription plan.';
}

export function CreateSubscriptionPlanModal({ isOpen, onClose }: CreateSubscriptionPlanModalProps) {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<SubscriptionPlanFormValues>(emptySubscriptionPlanFormValues);
  const [errors, setErrors] = useState<SubscriptionPlanFormErrors>({});

  const mutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: async () => {
      toast.success('Subscription plan created', {
        description: 'The plan is now available in the admin catalog.',
      });
      await queryClient.invalidateQueries({ queryKey: subscriptionPlansQueryKey });
      handleClose();
    },
    onError: (error: ErrorResponse | unknown) => {
      toast.error('Unable to create subscription plan', {
        description: getReadableErrorMessage(error),
      });
    },
  });

  const handleClose = () => {
    setFormValues(emptySubscriptionPlanFormValues);
    setErrors({});
    onClose();
  };

  const handleFieldChange = (field: keyof SubscriptionPlanFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (payload: CreateSubscriptionPlanPayload) => {
    setErrors({});
    mutation.mutate(payload);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2 text-blue-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Add Subscription Plan</h2>
              <p className="text-xs font-medium text-gray-500">Create a reusable plan for customers to subscribe to later.</p>
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

        <div className="overflow-y-auto p-6">
          <SubscriptionPlanForm
            formValues={formValues}
            errors={errors}
            isSubmitting={mutation.isPending}
            submitLabel="Create Plan"
            onChange={handleFieldChange}
            onValidationError={setErrors}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        </div>
      </div>
    </div>
  );
}
