/**
 * MangoSense API reachability tracker.
 * Fed exclusively by apiClient.js so views can tell live backend data apart
 * from offline/mock fallback without ever touching a backend URL.
 *
 * status per endpoint path (query stripped): 'ok' | 'error' | 'offline'
 *  - 'ok'      -> last request for this endpoint succeeded (data is live)
 *  - 'error'   -> backend answered with an HTTP error (e.g. 401/500)
 *  - 'offline' -> no response at all (network / backend down)
 */

const statuses = {};
const listeners = new Set();

const normalize = (endpoint = '') => String(endpoint).split('?')[0];

const set = (key, value) => {
  if (statuses[key] === value) return;
  statuses[key] = value;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener errors must never break a request */
    }
  });
};

export const reportApiSuccess = (endpoint) => {
  set(normalize(endpoint), 'ok');
};

export const reportApiError = (endpoint, { offline = false } = {}) => {
  set(normalize(endpoint), offline ? 'offline' : 'error');
};

/** True only after a successful response was received for this endpoint. */
export const isEndpointLive = (endpoint) => statuses[normalize(endpoint)] === 'ok';

export const getApiStatus = () => ({ ...statuses });

/**
 * Snapshot used for the global "backend offline" notice:
 * observed -> at least one request completed (ok or failed)
 * anyLive  -> at least one endpoint succeeded
 * anyOffline -> at least one endpoint never reached the server
 */
export const getConnectivity = () => {
  const values = Object.values(statuses);
  return {
    observed: values.length > 0,
    anyLive: values.includes('ok'),
    anyOffline: values.includes('offline'),
    anyError: values.includes('error')
  };
};

export const subscribeApiStatus = (fn) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
