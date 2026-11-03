
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

import { clearAuthToken, getAuthToken } from './authSession';

async function request(path, options = {}) {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== '/auth/login' &&
      path !== '/auth/register' &&
      path !== '/auth/verify-email' &&
      path !== '/auth/resend-verification'
    ) {
      clearAuthToken();
      window.location.href = '/login';
    }

    const error = new Error(
      payload.message || payload.error || 'The server request failed'
    );
    error.code = payload.code;
    throw error;
  }

  return payload;
}

// Quiz and room APIs
export const createRoom = (body) =>
  request('/quiz/create-room', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const joinRoom = (body) =>
  request('/quiz/join-room', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getRoomStatus = (roomCode) =>
  request(`/quiz/room/${encodeURIComponent(roomCode)}`);

export const submitScore = (body) =>
  request('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const getCategories = () => request('/quiz/categories');

export const getQuestionsByCategory = (categoryName) =>
  request(
    `/quiz/questions/${encodeURIComponent(categoryName.trim())}`
  );

// Dashboard and leaderboard APIs
export const getDashboard = (playerId) =>
  request(
    playerId
      ? `/dashboard/${encodeURIComponent(playerId)}`
      : '/dashboard/me'
  );

export const getLeaderboard = () => request('/leaderboard');

export const getPublicLeaderboard = () =>
  request('/dashboard/leaderboard/public');

// Authentication APIs
export const getCurrentUser = () => request('/auth/me');

export const login = (body) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const logout = () =>
  request('/auth/logout', {
    method: 'POST',
  });

export const register = (body) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const verifyEmail = (body) =>
  request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const resendVerification = (body) =>
  request('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const requestPasswordReset = (body) =>
  request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const resetPassword = (body) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// Friends APIs
export const getFriends = () => request('/friends');

export const getFriendStatus = (username) =>
  request(`/friends/status/${encodeURIComponent(username)}`);

export const sendFriendRequest = (username) =>
  request('/friends/requests', {
    method: 'POST',
    body: JSON.stringify({ username }),
  });

export const respondToFriendRequest = (requestId, status) =>
  request(`/friends/requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const removeFriend = (friendId) =>
  request(`/friends/${encodeURIComponent(friendId)}`, {
    method: 'DELETE',
  });

export const getFriendProfile = (friendId) =>
  request(`/friends/${encodeURIComponent(friendId)}/profile`);

export const createFriendChallenge = (friendId, categoryName) =>
  request(
    `/friends/${encodeURIComponent(friendId)}/challenges`,
    {
      method: 'POST',
      body: JSON.stringify({ categoryName }),
    }
  );

export const getFriendMessages = (friendId) =>
  request(`/friends/${encodeURIComponent(friendId)}/messages`);

export const sendFriendMessage = (friendId, text) =>
  request(
    `/friends/${encodeURIComponent(friendId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    }
  );
