export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

type Options = Omit<RequestInit, 'body'> & { token?: string; body?: unknown };

/** Fetch ke API dengan penanganan error JSON yang konsisten. */
export async function api<T>(path: string, { token, body, headers, ...rest }: Options = {}): Promise<T> {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL belum diatur.');
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && (data as { error?: string }).error) || `Permintaan gagal (${res.status}).`);
  return data as T;
}

export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('token'));
export const getOrgId = () => (typeof window === 'undefined' ? null : localStorage.getItem('orgId'));

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('orgId');
}
