import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';
export const socket = io(SOCKET_URL, { autoConnect: false });

export const connectSocket = (token) => {
  socket.auth = token ? { token } : {};
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};