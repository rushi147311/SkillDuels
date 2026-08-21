import { useEffect, useState } from "react";
import "./App.css";

import QuizScreen from "./pages/QuizScreen";
import ResultScreen from "./pages/ResultScreen";
import Dashboard from "./pages/Dashboard";
import WaitingRoom from "./components/WaitingRoom";
import Leaderboard from "./pages/Leaderboard";

import {
  createRoom,
  getRoomStatus,
  joinRoom,
  submitScore,
} from "./services/api";

const getPlayerId = () => {
  const savedId = window.localStorage.getItem("skillDuelsPlayerId");

  if (savedId) return savedId;

  const playerId = crypto.randomUUID().replaceAll("-", "").slice(0, 24);

  window.localStorage.setItem("skillDuelsPlayerId", playerId);

  return playerId;
};

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
  const [stage, setStage] = useState("quiz");
  const [matchData, setMatchData] = useState(null);
  const [waitingMatch, setWaitingMatch] = useState(null);
  const [completedMatch, setCompletedMatch] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharedResult] = useState(getSharedResult);

  const playerId = getPlayerId();

  useEffect(() => {
    const roomToPoll =
      waitingMatch?.roomCode ||
      (stage === "waiting" ? matchData?.roomCode : null);

    if (!roomToPoll) return undefined;

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
  }, [matchData, stage, waitingMatch]);

  const startMatch = (response) => {
    const match = response.data;

    if (!match?.questions?.length) {
      throw new Error("This match has no questions yet");
    }

    if (match.status === "Pending") {
      setWaitingMatch(match);
    } else {
      setMatchData(match);
      setWaitingMatch(null);
    }
  };

  const handleJoinRoom = async (roomCode) => {
    setLoading(true);
    setError("");

    try {
      startMatch(
        await joinRoom({
          playerId,
          roomCode: roomCode.trim(),
        })
      );
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
        playerId={playerId}
        onJoinRoom={handleJoinRoom}
        joinRoomLoading={loading}
        joinRoomError={error}
        onCreateRoom={async ({ categoryName, roomType }) => {
          setLoading(true);
          setError("");

          try {
            startMatch(
              await createRoom({
                playerId,
                categoryName,
                roomType,
              })
            );
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
            <span className="brand-mark">⚡</span>
            Skill<span>Duels</span>
          </div>

          <div className="live-pill">
            <span />
            Shared result
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
        playerId,
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
    }
  };

  return (
    <div className="duel-app quiz-page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">⚡</span>
          Skill<span>Duels</span>
        </div>

        <div className="live-pill">
          <span />
          Live match
        </div>
      </header>

      {stage === "quiz" ? (
        <QuizScreen
          questions={matchData.questions}
          onFinish={handleFinish}
        />
      ) : stage === "waiting" ? (
        <WaitingRoom
          roomCode={matchData.roomCode}
          message="Waiting for the other score"
        />
      ) : (
        <ResultScreen
          finalScore={finalScore}
          totalPossible={matchData.questions.length * 10}
          playerName={
            matchData.players?.find(
              (player) => player._id === playerId
            )?.username || "Champion"
          }
          resultWinner={
            completedMatch
              ? completedMatch.winner
                ? String(completedMatch.winner) === String(playerId)
                : null
              : undefined
          }
          onRestart={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function App() {
  const currentPath = window.location.pathname;

  if (currentPath === "/leaderboard") {
    return <Leaderboard />;
  }

  return <GameContainer />;
}

export default App;