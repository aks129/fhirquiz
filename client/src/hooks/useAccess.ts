import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useSessionStore } from "@/stores/sessionStore";

interface AccessResult {
  canAccess: boolean;
  reason: string;
  purchase?: any;
  trialEndsAt?: string;
}

export function useAccess(courseSlug: string) {
  const { user, isLoading: authLoading } = useAuth();
  const { isDemoMode } = useSessionStore();

  const { data: accessData, isLoading, error } = useQuery<AccessResult>({
    queryKey: ['/api/billing/access', courseSlug],
    queryFn: async () => {
      // Demo mode always has access
      if (isDemoMode) {
        return {
          canAccess: true,
          reason: 'purchased',
          purchase: {
            id: 'demo_purchase',
            status: 'active',
            product_sku: 'fhir-bootcamp-basic'
          }
        };
      }

      const response = await fetch(`/api/billing/access/${courseSlug}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to check access: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!courseSlug && (!!user || isDemoMode) && !authLoading,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // If not authenticated and not in demo mode, no access
  if (!user && !isDemoMode) {
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
    purchase: accessData?.purchase,
    trialEndsAt: accessData?.trialEndsAt
  };
}

export function useUserPurchases() {
  const { user } = useAuth();
  const { isDemoMode } = useSessionStore();

  return useQuery({
    queryKey: ['/api/billing/purchases'],
    queryFn: async () => {
      // Demo mode returns mock purchases
      if (isDemoMode) {
        return [{
          id: 'demo_purchase',
          product_sku: 'fhir-bootcamp-basic',
          status: 'active',
          created_at: new Date().toISOString()
        }];
      }

      const response = await fetch('/api/billing/purchases', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch purchases: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!user || isDemoMode,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}