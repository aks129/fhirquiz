import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

interface AccessResult {
  canAccess: boolean;
  reason: string;
  purchase?: any;
}

export function useAccess(courseSlug: string) {
  const { user, isLoading: authLoading } = useAuth();

  const { data: accessData, isLoading, error } = useQuery<AccessResult>({
    queryKey: ['/api/billing/access', courseSlug],
    enabled: !!user && !authLoading,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If not authenticated, no access
  if (!user) {
    return {
      canAccess: false,
      reason: 'not_authenticated',
      isLoading: authLoading,
      error: null
    };
  }

  // While loading, assume no access
  if (isLoading || authLoading) {
    return {
      canAccess: false,
      reason: 'loading',
      isLoading: true,
      error: null
    };
  }

  // If error occurred, assume no access
  if (error) {
    return {
      canAccess: false,
      reason: 'error',
      isLoading: false,
      error
    };
  }

  return {
    canAccess: accessData?.canAccess || false,
    reason: accessData?.reason || 'unknown',
    isLoading: false,
    error: null,
    purchase: accessData?.purchase
  };
}

export function useUserPurchases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['/api/billing/purchases'],
    enabled: !!user,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}