'use client';

import { useQuery } from '@tanstack/react-query';
import { getInstantWashPricings } from '@/api/instant-wash-pricing';

export const instantWashPricingsQueryKey = ['instant-wash-pricings'] as const;

export function useInstantWashPricings(communityId?: string) {
  return useQuery({
    queryKey: communityId ? [...instantWashPricingsQueryKey, communityId] : instantWashPricingsQueryKey,
    queryFn: () => getInstantWashPricings(communityId),
  });
}
