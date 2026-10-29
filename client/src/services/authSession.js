const AUTH_TOKEN_KEY = 'skillDuelsToken';

export const getAuthToken = () => globalThis.sessionStorage.getItem(AUTH_TOKEN_KEY);

export const setAuthToken = (token) => globalThis.sessionStorage.setItem(AUTH_TOKEN_KEY, token);

export const clearAuthToken = () => globalThis.sessionStorage.removeItem(AUTH_TOKEN_KEY);
