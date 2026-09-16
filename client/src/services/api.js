const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('skillDuelsToken');
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
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register') {
      localStorage.removeItem('skillDuelsToken');
      localStorage.removeItem('skillDuelsPlayerId');
      window.location.href = '/login';
    }
    throw new Error(payload.message || payload.error || 'The server request failed');
  }

  return payload;
}

export const createRoom = (body) => request('/quiz/create-room', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const joinRoom = (body) => request('/quiz/join-room', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const getRoomStatus = (roomCode) => request(`/quiz/room/${encodeURIComponent(roomCode)}`);

export const submitScore = (body) => request('/quiz/submit', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const getDashboard = (playerId) => request(`/dashboard/${encodeURIComponent(playerId)}`);

export const getQuestionsByCategory = (categoryName) => request(
  `/quiz/questions/${encodeURIComponent(categoryName.trim())}`,
);

export const login = (body) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const register = (body) => request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(body),
});