export default function WaitingRoom({ roomCode, message }) {
  return (
    <main className="waiting-room">
      <section className="duel-panel waiting-room-card">
        <div className="panel-icon">⏳</div>
        <p className="eyebrow">Room {roomCode}</p>
        <h1>{message}</h1>
        <p>The match will start automatically when both players are ready.</p>
        <div className="waiting-dots" aria-hidden="true"><i /><i /><i /></div>
      </section>
    </main>
  );
}