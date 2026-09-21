import { useEffect, useState } from "react";
import socket from "./socket/socket.js";
import LiveGame from "./game/LiveGame.jsx";
import "./App.css";

function App() {
  const [joinRoomId, setJoinRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    socket.on("room-created", (data) => {
      setCurrentRoom(data.roomId);
      setPlayers(data.players || []);
      setStatus("Waiting for opponent...");
      setError("");
    });

    socket.on("room-joined", (data) => {
      setCurrentRoom(data.roomId);
      setPlayers(data.players || []);

      setStatus(
        data.status === "ready"
          ? "Room is ready!"
          : "Waiting for opponent..."
      );

      setError("");
    });

    socket.on("player-joined", (data) => {
      setPlayers(data.players || []);

      if (data.status === "ready") {
        setStatus("Room is ready!");
      }
    });

    socket.on("room-ready", (data) => {
      setPlayers(data.players || []);
      setStatus("Room is ready!");
    });

    socket.on("player-left", (data) => {
      setPlayers(data.players || []);
      setStatus("Waiting for opponent...");
      setGameStarted(false);
    });

    socket.on("game-started", () => {
      setGameStarted(true);
    });

    socket.on("room-error", (data) => {
      setError(data.message);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-joined");
      socket.off("player-joined");
      socket.off("room-ready");
      socket.off("player-left");
      socket.off("game-started");
      socket.off("room-error");
    };
  }, []);

  const handleCreateRoom = () => {
    setError("");

    const newRoomId = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    socket.emit("create-room", newRoomId);
  };

  const handleJoinRoom = () => {
    setError("");

    if (!joinRoomId.trim()) {
      setError("Please enter a Room ID");
      return;
    }

    socket.emit(
      "join-room",
      joinRoomId.trim().toUpperCase()
    );
  };

  const handleStartGame = () => {
    if (players.length !== 2) return;

    socket.emit("start-game", currentRoom);
  };

  // ---------------- LIVE GAME ----------------

  if (gameStarted) {
    return (
      <LiveGame
        roomId={currentRoom}
        players={players}
      />
    );
  }

  // ---------------- CREATE / JOIN ----------------

  if (!currentRoom) {
    return (
      <div className="page">
        <header className="top-header">
          <div className="brand">
            <span className="brand-icon">⚡</span>
            Skill<span>Duels</span>
          </div>

          <div className="header-badge">
            LIVE COMPETITION
          </div>
        </header>

        <main className="home-container">
          <div className="hero-section">
            <p className="eyebrow">REAL-TIME QUIZ BATTLE</p>

            <h1>
              Challenge.
              <br />
              <span>Compete. Win.</span>
            </h1>

            <p className="hero-text">
              Create a private room or join your opponent
              and prove your skills in a live match.
            </p>
          </div>

          <div className="room-card create-card">
            <div className="card-icon">🎮</div>

            <h2>Start a Duel</h2>

            <p className="card-description">
              Create a room and invite your opponent.
            </p>

            <button
              className="primary-button"
              onClick={handleCreateRoom}
            >
              Create Room
              <span>→</span>
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <input
              type="text"
              placeholder="Enter Room ID"
              value={joinRoomId}
              onChange={(e) =>
                setJoinRoomId(e.target.value.toUpperCase())
              }
            />

            <button
              className="secondary-button"
              onClick={handleJoinRoom}
            >
              Join Room
            </button>

            {error && (
              <div className="error-box">
                ⚠ {error}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ---------------- WAITING ROOM ----------------

  return (
    <div className="page">
      <header className="top-header">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          Skill<span>Duels</span>
        </div>

        <div className="header-badge">
          LIVE MATCH
        </div>
      </header>

      <main className="waiting-page">

        <div className="waiting-heading">
          <p className="eyebrow">MATCHMAKING</p>

          <h1>Waiting Room</h1>

          <p>
            Get ready. Your opponent is joining the duel.
          </p>
        </div>

        <div className="waiting-card">

          <div className="room-label">
            ROOM ID
          </div>

          <div className="room-id-large">
            {currentRoom}
          </div>

          <div className="status-pill">
            <span className="status-dot"></span>
            {status}
          </div>

          <div className="players-section">

            <div className="players-header">
              <h3>Players</h3>

              <span>
                {players.length}/2
              </span>
            </div>

            <div className="player-list">

              {players.map((player, index) => (
                <div
                  className="player-card"
                  key={player}
                >
                  <div className="player-avatar">
                    {index === 0 ? "👤" : "⚔️"}
                  </div>

                  <div className="player-info">
                    <strong>
                      Player {index + 1}
                    </strong>

                    <small>
                      {index === 0
                        ? "Room Creator"
                        : "Opponent"}
                    </small>
                  </div>

                  <div className="connected">
                    ● Connected
                  </div>
                </div>
              ))}

              {players.length < 2 && (
                <div className="empty-player">
                  <div className="loading-circle"></div>

                  <div>
                    <strong>
                      Waiting for opponent
                    </strong>

                    <small>
                      Share the Room ID with your opponent
                    </small>
                  </div>
                </div>
              )}

            </div>
          </div>

          {players.length === 2 ? (
            <button
              className="start-button"
              onClick={handleStartGame}
            >
              Start Game
              <span>⚡</span>
            </button>
          ) : (
            <button
              className="start-button disabled"
              disabled
            >
              Waiting for opponent...
            </button>
          )}

          {error && (
            <div className="error-box">
              ⚠ {error}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;