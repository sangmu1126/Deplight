const API_BASE = import.meta.env.DEV ? '/api' : '/dashboard/api';
const DASHBOARD_API_KEY_STORAGE = 'deplight-dashboard-api-key';

export const getDashboardApiKey = (): string =>
  sessionStorage.getItem(DASHBOARD_API_KEY_STORAGE) || '';

export const setDashboardApiKey = (value: string): void => {
  const normalized = value.trim();
  if (normalized) {
    sessionStorage.setItem(DASHBOARD_API_KEY_STORAGE, normalized);
  } else {
    sessionStorage.removeItem(DASHBOARD_API_KEY_STORAGE);
  }
};

export const apiFetch = (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(init.headers);
  const apiKey = getDashboardApiKey();

  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  return fetch(`${API_BASE}${path}`, { ...init, headers });
};
