import { apiClient } from '@/api/client';
import { CreateInstantWashPricingPayload, InstantWashPricing } from '@/types';

export async function getInstantWashPricings(communityId?: string) {
  const response = await apiClient.get<InstantWashPricing[]>('/instant-wash-pricing', {
    params: communityId ? { communityId } : {},
    headers: {
      Accept: 'application/json',
    },
  });

  return response.data;
}

export async function createInstantWashPricing(payload: CreateInstantWashPricingPayload) {
  const response = await apiClient.post<InstantWashPricing>('/instant-wash-pricing', payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

export async function updateInstantWashPricing(
  id: string,
  payload: Partial<CreateInstantWashPricingPayload>
) {
  const response = await apiClient.patch<InstantWashPricing>(`/instant-wash-pricing/${id}`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

export async function deleteInstantWashPricing(id: string) {
  const response = await apiClient.delete<{ message: string }>(`/instant-wash-pricing/${id}`);
  return response.data;
}
