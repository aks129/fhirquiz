import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  user_metadata?: any;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'student' | 'instructor' | 'admin';
  fhir_points: number;
  created_at: string;
  avatar_url: string | null;
}

interface AuthResponse {
  user: User;
  profile: Profile;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    retry: false
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    isLoading,
    isAuthenticated: !!data?.user,
    error
  };
}