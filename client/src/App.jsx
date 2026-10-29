
import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { connectSocket } from "./services/socket";
import { clearAuthToken, getAuthToken } from "./services/authSession";

import QuizScreen from "./pages/QuizScreen";
import ResultScreen from "./pages/ResultScreen";
import Dashboard from "./pages/Dashboard";
import WaitingRoom from "./components/WaitingRoom";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminPage from "./pages/adminPage/AdminPage.jsx";
import LogoutButton from "./components/LogoutButton";
import FriendNotifications from "./components/FriendNotifications";

import {
  createRoom,
  getCurrentUser,
  getRoomStatus,
  joinRoom,
  submitScore,
} from "./services/api";

const getSharedResult = () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("result") !== "1") return null;

  const score = Number(params.get("score"));
  const total = Number(params.get("total"));

  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
    return null;
  }

  return {
    score,
    total,
    player: params.get("player") || "Champion",
  };
};

function GameContainer() {
  const [playerId, setPlayerId] = useState(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return undefined;

    let active = true;

    getCurrentUser()
      .then((response) => {
        if (!active) return;

        const authenticatedPlayerId = response?.data?._id;

        if (!authenticatedPlayerId) {
          throw new Error("Authenticated user info was not returned.");
        }

        setPlayerId(authenticatedPlayerId);
      })
      .catch(() => {
        if (!active) return;

        clearAuthToken();
        window.location.href = "/login";
      });

    return () => {
      active = false;
    };
  }, []);

  if (!playerId) {
    return <div className="dashboard-loading">Loading your account...</div>;
  }

  return <GameSession key={playerId} playerId={playerId} />;
}

function GameSession({ playerId }) {
  const [stage, setStage] = useState("quiz");
  const [matchData, setMatchData] = useState(null);
  const [waitingMatch, setWaitingMatch] = useState(null);
  const [completedMatch, setCompletedMatch] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharedResult] = useState(getSharedResult);

  useEffect(() => {
    const roomToPoll =
      waitingMatch?.roomCode ||
      (stage === "waiting" ? matchData?.roomCode : null);

    if (!roomToPoll || !playerId) return undefined;

    const checkRoom = async () => {
      try {
        const response = await getRoomStatus(roomToPoll);
        const latestMatch = response.data;

        if (waitingMatch && latestMatch.status === "In-Progress") {
          setWaitingMatch(null);
          setMatchData(latestMatch);
          setStage("quiz");
        } else if (
          stage === "waiting" &&
          latestMatch.status === "Completed"
        ) {
          setCompletedMatch(latestMatch);
          setStage("result");
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    };

    checkRoom();
    const interval = setInterval(checkRoom, 2000);

    return () => clearInterval(interval);
  }, [matchData, stage, waitingMatch, playerId]);

  const startMatch = (response) => {
    const match = response.data;

    if (!match?.questions?.length) {
      throw new Error("This match has no questions yet");
    }

    if (match.status === "Pending") {
      setWaitingMatch(match);
      return;
    }

    setMatchData(match);
    setWaitingMatch(null);
  };

  const handleJoinRoom = async (roomCode) => {
    if (!playerId) {
      throw new Error("You must be logged in before joining a room.");
    }

    setLoading(true);
    setError("");

    try {
      startMatch(await joinRoom({ roomCode: roomCode.trim() }));
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoom = async (roomCode) => {
    setLoading(true);
    setError("");

    try {
      startMatch(await getRoomStatus(roomCode));
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  };

  if (waitingMatch && !matchData) {
    return (
      <WaitingRoom
        roomCode={waitingMatch.roomCode}
        message="Waiting for an opponent"
      />
    );
  }

  if (!matchData && !sharedResult) {
    return (
      <Dashboard
        onJoinRoom={handleJoinRoom}
        onOpenRoom={handleOpenRoom}
        joinRoomLoading={loading}
        joinRoomError={error}
        onCreateRoom={async ({ categoryName, roomType }) => {
          setLoading(true);
          setError("");

          try {
            startMatch(await createRoom({ categoryName, roomType }));
          } catch (requestError) {
            setError(requestError.message);
            throw requestError;
          } finally {
            setLoading(false);
          }
        }}
        createRoomLoading={loading}
        createRoomError={error}
      />
    );
  }

  if (!matchData && sharedResult) {
    return (
      <div className="duel-app quiz-page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">?</span>
            Skill<span>Duels</span>
          </div>

          <div className="topbar-actions">
            <div className="live-pill">
              <span />
              Shared result
            </div>
            <LogoutButton className="logout-button" />
          </div>
        </header>

        <ResultScreen
          finalScore={sharedResult.score}
          totalPossible={sharedResult.total}
          playerName={sharedResult.player}
          onRestart={() => {
            window.location.href = window.location.origin;
          }}
        />
      </div>
    );
  }

  const handleFinish = async (score) => {
    setFinalScore(score);

    try {
      const response = await submitScore({
        matchId: matchData._id,
        score,
      });

      if (response.data.status === "Completed") {
        setCompletedMatch(response.data);
        setStage("result");
      } else {
        setStage("waiting");
      }
    } catch (requestError) {
      setError(requestError.message);
      setStage("waiting");
    }
  };

  const currentPlayer = matchData.players?.find(
    (player) => String(player._id || player) === String(playerId)
  );

  const opponent = matchData.players?.find(
    (player) => String(player._id || player) !== String(playerId)
  );

  return (
    <div className="duel-app quiz-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">?</span>
          Skill<span>Duels</span>
        </div>

        <div className="topbar-actions">
          <div className="live-pill">
            <span />
            Live match
          </div>
          <LogoutButton className="logout-button" />
        </div>
      </header>

      {stage === "quiz" ? (
        <QuizScreen
          questions={matchData.questions}
          onFinish={handleFinish}
        />
      ) : stage === "waiting" ? (
        <ResultScreen
          finalScore={finalScore}
          totalPossible={matchData.questions.length * 10}
          playerName={currentPlayer?.username || "Champion"}
          resultPending
          onRestart={() => window.location.reload()}
        />
      ) : (
        <ResultScreen
          finalScore={finalScore}
          totalPossible={matchData.questions.length * 10}
          playerName={currentPlayer?.username || "Champion"}
          resultWinner={
            completedMatch
              ? completedMatch.winner
                ? String(completedMatch.winner) === String(playerId)
                : null
              : undefined
          }
          opponentUsername={opponent?.username}
          onRestart={() => window.location.reload()}
        />
      )}
    </div>
  );
}

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  useEffect(() => {
    const syncSocketAuthentication = (event) => {
      if (!event || event.key === "skillDuelsToken") {
        connectSocket(localStorage.getItem("skillDuelsToken"));
      }
    };

    syncSocketAuthentication();
    window.addEventListener("storage", syncSocketAuthentication);

    return () => {
      window.removeEventListener("storage", syncSocketAuthentication);
    };
  }, []);

  return (
    <>
      <FriendNotifications />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <GameContainer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <GameContainer />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
