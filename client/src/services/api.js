const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
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