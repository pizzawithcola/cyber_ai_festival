// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8848';
export const API_KEY = import.meta.env.VITE_API_KEY || '';

// Helper function to get headers with API Key
export const getApiHeaders = (additionalHeaders?: Record<string, string>) => {
  return {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
};

// Helper function for fetch with API Key
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  return fetch(url, {
    ...options,
    headers: {
      ...getApiHeaders(),
      ...options.headers,
    },
  });
};
