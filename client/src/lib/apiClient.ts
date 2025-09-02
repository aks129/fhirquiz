import { useSessionStore } from "@/stores/sessionStore";

// Enhance API client to send demo mode header when in demo mode
export function createApiRequest() {
  const { isDemoMode } = useSessionStore.getState();

  return async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add demo mode header if in demo mode
    if (isDemoMode) {
      headers['x-demo-mode'] = 'true';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response;
  };
}

export const apiRequest = createApiRequest();