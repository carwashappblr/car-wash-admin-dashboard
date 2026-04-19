import { apiClient } from '@/api/client';
import { CreateSubscriptionPlanPayload, SubscriptionPlan } from '@/types';

export async function getSubscriptionPlans() {
  const response = await apiClient.get<SubscriptionPlan[]>('/subscription-plans', {
    headers: {
      Accept: 'application/json',
    },
  });

  return response.data;
}

export async function createSubscriptionPlan(payload: CreateSubscriptionPlanPayload) {
  const response = await apiClient.post<SubscriptionPlan>('/subscription-plans', payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}
