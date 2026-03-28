const FALLBACK_API_BASE_URL = 'http://localhost:3001';

export const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return FALLBACK_API_BASE_URL;
  }

  return configuredBaseUrl.replace(/\/$/, '');
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
