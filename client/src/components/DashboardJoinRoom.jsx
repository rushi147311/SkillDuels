import { useState } from 'react';

export default function DashboardJoinRoom({ onJoinRoom, loading, error }) {
  const [roomCode, setRoomCode] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onJoinRoom(roomCode);
  };

  return (
    <section className="dashboard-panel join-room-panel">
      <div className="dashboard-section-heading"><div><span className="dashboard-eyebrow">Have an invite?</span><h2>Join a room</h2></div><span className="room-icon">↗</span></div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="dashboard-room-code">Room code</label>
        <input id="dashboard-room-code" value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase())} placeholder="Enter room code" required />
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" disabled={loading || !roomCode.trim()}>{loading ? 'Joining...' : 'Join Room'} <span>→</span></button>
      </form>
    </section>
  );
}