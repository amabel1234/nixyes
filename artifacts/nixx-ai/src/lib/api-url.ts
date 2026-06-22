const configured = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL: string = configured ? configured.replace(/\/+$/, "") : "";

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
