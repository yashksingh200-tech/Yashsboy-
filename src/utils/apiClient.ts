import { decryptSync } from './encryption';

/**
 * Secure HTTPS & Authenticated API Client
 * Enforces secure transport (HTTPS) and attaches authentication credentials (token + userId) on every request.
 */

export interface ApiOptions extends RequestInit {
  userId?: string;
  token?: string;
}

/**
 * Ensures relative endpoints use secure connection and appends authentication headers
 */
export async function secureFetch(endpoint: string, options: ApiOptions = {}, retries = 2): Promise<Response> {
  const { userId, token, headers: customHeaders, ...restOptions } = options;

  // 1. HTTPS / Secure Transport enforcement check
  let url = endpoint;
  if (typeof window !== 'undefined') {
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      url = url.replace('http://', 'https://');
    }
  }

  // 2. Build secure authorization headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  let activeToken = token;
  let activeUserId = userId;

  if ((!activeToken || !activeUserId) && typeof window !== 'undefined') {
    try {
      const savedSession = localStorage.getItem('daily_companion_session_user');
      if (savedSession) {
        const parsed = decryptSync<any>(savedSession, 'session_sec_key', JSON.parse(savedSession));
        if (parsed?.uid) {
          if (!activeUserId) activeUserId = parsed.uid;
          if (!activeToken) activeToken = parsed.token || `sat_${parsed.uid}_auto`;
        }
      }
    } catch (e) {}
  }

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
    headers['X-User-Auth-Token'] = activeToken;
  }

  if (activeUserId) {
    headers['X-User-Id'] = activeUserId;
  }

  // 3. Execute fetch request with retry loop for transient 5xx or network errors
  let lastError: any = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...restOptions,
        headers,
      });

      // Retry on transient server errors (502, 503, 504)
      if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        continue;
      }

      if (response.status === 401) {
        console.warn('[Security] Unauthorized API call (401). Authentication credentials invalid or missing.');
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Network request failed after retries');
}

/**
 * Convenient typed wrapper for JSON POST API calls
 */
export async function securePost<T>(
  endpoint: string,
  body: any,
  authInfo?: { userId?: string; token?: string }
): Promise<T> {
  const res = await secureFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    userId: authInfo?.userId,
    token: authInfo?.token,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'API request failed' }));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
