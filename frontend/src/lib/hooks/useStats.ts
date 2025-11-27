import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import type { SystemStats } from '@/types';

export const useStats = () => {
  return useQuery<SystemStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.stats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};
