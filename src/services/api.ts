const TOKEN_KEY = 'eduai_auth_token';
const CSRF_KEY = 'eduai_csrf_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAuth(token: string, csrfToken: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CSRF_KEY, csrfToken);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CSRF_KEY);
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const csrf = localStorage.getItem(CSRF_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = await response.json();
    } catch {
      // ignore
    }
    throw new Error(errData.message || `Tizim xatoligi (${response.status})`);
  }

  return response.json() as Promise<T>;
}
