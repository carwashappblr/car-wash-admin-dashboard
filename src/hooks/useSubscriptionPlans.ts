'use client';

import { useQuery } from '@tanstack/react-query';
import { getSubscriptionPlans } from '@/api/subscription-plans';

export const subscriptionPlansQueryKey = ['subscription-plans'] as const;

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionPlansQueryKey,
    queryFn: getSubscriptionPlans,
  });
}
