/**
 * MangoSense API Client
 * Centralized HTTP client configured for the MEAN backend.
 * This is the ONLY module allowed to know the backend base URL.
 * Unwraps the { success, data, message, error } envelope from CONTRACT.md §1
 * and reports per-endpoint reachability to apiStatus.js.
 */
import { reportApiSuccess, reportApiError } from './apiStatus';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const buildUrl = (endpoint) =>
  `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

const authHeader = () => {
  const token = localStorage.getItem('mangosense_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildJsonHeaders = () => ({ 'Content-Type': 'application/json', ...authHeader() });

/** Extract a human-readable message from an error envelope, else a generic one. */
const toHttpError = async (response, endpoint) => {
  let message = `Request to ${endpoint} failed (HTTP ${response.status})`;
  try {
    const json = await response.json();
    const envelopeMessage = json && (json.message || json.error);
    if (typeof envelopeMessage === 'string' && envelopeMessage.trim()) {
      message = envelopeMessage;
    }
  } catch {
    /* body was not JSON — keep the generic message */
  }
  const error = new Error(message);
  error.status = response.status;
  error.offline = false;
  return error;
};

const toNetworkError = (endpoint, cause) => {
  const error = new Error(
    'Cannot reach the MangoSense server. It may be offline — you can continue in demo mode.'
  );
  error.offline = true;
  error.cause = cause;
  return error;
};

const unwrap = (json) => (json && json.data !== undefined ? json.data : json);

const request = async (endpoint, { method = 'GET', body, formData } = {}) => {
  const url = buildUrl(endpoint);
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: formData ? authHeader() : buildJsonHeaders(),
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined)
    });
  } catch (cause) {
    const error = toNetworkError(endpoint, cause);
    reportApiError(endpoint, { offline: true });
    console.warn(`[apiClient] ${method} ${endpoint} notice: ${cause?.message || 'network error'}. Serving local data.`);
    throw error;
  }

  if (!response.ok) {
    const error = await toHttpError(response, endpoint);
    reportApiError(endpoint, { offline: false });
    console.warn(`[apiClient] ${method} ${endpoint} notice: ${error.message}.`);
    throw error;
  }

  try {
    const json = await response.json();
    reportApiSuccess(endpoint);
    return unwrap(json);
  } catch (cause) {
    const error = toNetworkError(endpoint, cause);
    reportApiError(endpoint, { offline: true });
    console.warn(`[apiClient] ${method} ${endpoint} notice: invalid JSON response.`);
    throw error;
  }
};

export const apiClient = {
  baseUrl: API_BASE_URL,

  getHeaders: buildJsonHeaders,

  get: (endpoint) => request(endpoint, { method: 'GET' }),

  post: (endpoint, data) => request(endpoint, { method: 'POST', body: data }),

  postFormData: (endpoint, formData) => request(endpoint, { method: 'POST', formData })
};
