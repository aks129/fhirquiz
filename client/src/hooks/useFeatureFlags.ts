import { useQuery } from "@tanstack/react-query";

export interface FeatureFlags {
  enableDemo: boolean;
  enableBYOD: boolean;
  enableDeepDive: boolean;
  enableCertificates: boolean;
}

const defaultFlags: FeatureFlags = {
  enableDemo: true,
  enableBYOD: true, 
  enableDeepDive: false,
  enableCertificates: false,
};

export function useFeatureFlags() {
  const { data: flags = defaultFlags, isLoading } = useQuery<FeatureFlags>({
    queryKey: ['/config/features'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    flags,
    isLoading,
    // Individual flag helpers
    isDemoEnabled: flags.enableDemo,
    isBYODEnabled: flags.enableBYOD,
    isDeepDiveEnabled: flags.enableDeepDive,
    areCertificatesEnabled: flags.enableCertificates,
  };
}

// Service functions for non-hook usage
export const FeatureFlagService = {
  async getFlags(): Promise<FeatureFlags> {
    try {
      const response = await fetch('/config/features');
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to load feature flags, using defaults:', error);
      return defaultFlags;
    }
  },

  async isEnabled(flagKey: keyof FeatureFlags): Promise<boolean> {
    const flags = await this.getFlags();
    return flags[flagKey];
  },
};