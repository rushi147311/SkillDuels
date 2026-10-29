import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clearAuthToken, getAuthToken, setAuthToken } from './authSession.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
};

test('authentication tokens are isolated between browser tabs', () => {
  const originalStorage = globalThis.sessionStorage;
  const firstTabStorage = createStorage();
  const secondTabStorage = createStorage();

  try {
    globalThis.sessionStorage = firstTabStorage;
    setAuthToken('token-account-one');
    assert.equal(getAuthToken(), 'token-account-one');

    globalThis.sessionStorage = secondTabStorage;
    assert.equal(getAuthToken(), null);
    setAuthToken('token-account-two');
    assert.equal(getAuthToken(), 'token-account-two');

    globalThis.sessionStorage = firstTabStorage;
    assert.equal(getAuthToken(), 'token-account-one');
    clearAuthToken();
    assert.equal(getAuthToken(), null);

    globalThis.sessionStorage = secondTabStorage;
    assert.equal(getAuthToken(), 'token-account-two');
  } finally {
    globalThis.sessionStorage = originalStorage;
  }
});
