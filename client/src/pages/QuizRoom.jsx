import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../services/socket';
import QuizScreen from './QuizScreen'; // Ganeshchi original file

export default function QuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opponentScore, setOpponentScore] = useState(0);

  useEffect(() => {
    // 1. Server kadhun room che questions anavne
    socket.emit('get_questions', { roomCode: roomId });

    socket.on('room_questions', (data) => {
      setQuestions(data.questions);
      setLoading(false);
    });

    // 2. Opponent cha live score update receive karne
    socket.on('opponent_score_update', (data) => {
      setOpponentScore(data.score);
    });

    // Fallback: Jar socket kadhun questions ale nahitar testing sathi mock questions
    const timer = setTimeout(() => {
      if (questions.length === 0) {
        setQuestions([
          {
            questionText: "What does HTML stand for?",
            options: ["Hyper Text Markup Language", "High Tech Multi Language", "Hyper Transfer Machine Language", "None of these"],
            correctAnswer: "Hyper Text Markup Language"
          },
          {
            questionText: "Which property is used to change text color in CSS?",
            options: ["font-color", "color", "text-color", "background-color"],
            correctAnswer: "color"
          }
        ]);
        setLoading(false);
      }
    }, 2000);

    return () => {
      socket.off('room_questions');
      socket.off('opponent_score_update');
      clearTimeout(timer);
    };
  }, [roomId]);

  // Quiz samplyavar call honari function
  const handleQuizFinish = (finalScore) => {
    // Score server la pathavne
    socket.emit('submit_score', { roomCode: roomId, score: finalScore });
    navigate(`/result`, { state: { score: finalScore, opponentScore } });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'sans-serif', color: '#64748b' }}>
        <h2>Loading Live Quiz... ⚡</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Opponent Live Score Header */}
      <div style={{ maxWidth: '600px', margin: '0 auto 20px auto', display: 'flex', justifyContent: 'space-between', background: '#ffffff', padding: '12px 20px', borderRadius: '12px', boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', fontWeight: 'bold', color: '#0f172a' }}>
        <span>Room: {roomId}</span>
        <span style={{ color: '#2563eb' }}>Opponent Score: {opponentScore}</span>
      </div>

      {/* Ganeshcha original QuizScreen component */}
      <QuizScreen 
        questions={questions} 
        onFinish={handleQuizFinish} 
      />
    </div>
  );
}