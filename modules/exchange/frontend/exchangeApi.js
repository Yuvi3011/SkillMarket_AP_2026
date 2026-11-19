/**
 * SkillMarket · Module 3 — Skill Exchange API client
 * --------------------------------------------------
 * Thin fetch wrapper around the Exchange API. Every call attaches the acting
 * student's id (the backend also accepts a Bearer JWT; see
 * backend/src/middleware/auth.js).
 */

const DEFAULT_BASE = '/api/exchanges';

function resolveBaseURL() {
  try {
    // Vite / CRA style environment variable.
    if (import.meta.env && import.meta.env.VITE_EXCHANGE_API_URL) {
      return import.meta.env.VITE_EXCHANGE_API_URL.replace(/\/$/, '');
    }
  } catch {
    /* not running under a bundler that defines import.meta.env */
  }
  if (typeof window !== 'undefined') {
    const fromWindow = window.EXCHANGE_API_URL;
    const fromStorage = window.localStorage.getItem('sm_exchange_api');
    return (fromWindow || fromStorage || DEFAULT_BASE).replace(/\/$/, '');
  }
  return DEFAULT_BASE;
}

const USER_KEY = 'sm_exchange_user';

export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, userId } = {}) {
  const headers = { 'content-type': 'application/json' };
  const user = userId ?? getCurrentUser();
  if (user && user.userId) headers['x-user-id'] = String(user.userId);

  let response;
  try {
    response = await fetch(`${resolveBaseURL()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (networkError) {
    throw new ApiError(0, 'NETWORK_ERROR',
      'Cannot reach the exchange service. Is the backend running?', {
        cause: String(networkError),
      });
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const err = payload && payload.error ? payload.error : {};
    throw new ApiError(
      response.status,
      err.code || 'HTTP_ERROR',
      err.message || `Request failed with status ${response.status}`,
      err.details
    );
  }
  return payload;
}

const qs = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const suffix = search.toString();
  return suffix ? `?${suffix}` : '';
};

export const exchangeApi = {
  // Reference data
  getSkills: () => request('/skills'),
  getUsers: () => request('/users'),
  getProfile: () => request('/profile'),

  // Listings
  getListings: (filters) => request(`/listings${qs(filters)}`),
  getListing: (id) => request(`/listings/${id}`),
  createListing: (data) => request('/listings', { method: 'POST', body: data }),
  updateListing: (id, data) => request(`/listings/${id}`, { method: 'PATCH', body: data }),
  closeListing: (id) => request(`/listings/${id}`, { method: 'DELETE' }),
  getMyListings: () => request('/my-listings'),

  // Smart matching
  getMatching: (options = {}) => request(`/matching${qs(options)}`),

  // Requests
  getRequests: (box = 'ALL') => request(`/requests${qs({ box })}`),
  getRequestSummary: () => request('/requests/summary'),
  sendRequest: (data) => request('/requests', { method: 'POST', body: data }),
  acceptRequest: (id) => request(`/requests/${id}/accept`, { method: 'POST' }),
  rejectRequest: (id) => request(`/requests/${id}/reject`, { method: 'POST' }),
  cancelRequest: (id) => request(`/requests/${id}/cancel`, { method: 'POST' }),

  // Exchanges
  getExchanges: (status) => request(`/exchanges${qs({ status })}`),
  getExchange: (id) => request(`/exchanges/${id}`),
  updateExchangeStatus: (id, status) =>
    request(`/exchanges/${id}`, { method: 'PATCH', body: { status } }),
};

export default exchangeApi;
