const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const getApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return API_BASE_URL;
  }

  return configuredBaseUrl.replace(/\/$/, '');
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
