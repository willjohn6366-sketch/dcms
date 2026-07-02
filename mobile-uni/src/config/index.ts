const apiHost = typeof window === 'undefined' ? '127.0.0.1' : window.location.hostname;

export const API_BASE_URL = `http://${apiHost}:6100/api`;
