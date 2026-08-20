import { useState, useEffect, useCallback } from 'react';

export default function QuizScreen({ questions, onFinish }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIdx];

  const handleNext = useCallback((isCorrect = false) => {
    const nextScore = score + (isCorrect ? 10 : 0);
    setScore(nextScore);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setTimeLeft(30);
    } else {
      onFinish(nextScore);
    }
  }, [currentIdx, onFinish, questions.length, score]);

  useEffect(() => {
    if (timeLeft === 0) {
      const timeout = setTimeout(handleNext, 0);
      return () => clearTimeout(timeout);
    }

    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [handleNext, timeLeft]);

  const handleAnswer = (selected) => {
    handleNext(selected === currentQ.correctAnswer);
  };

  return (
    <div className="quiz-card">
      <div className="quiz-meta">
        <span>Question {currentIdx + 1} <em>/ {questions.length}</em></span>
        <span className={timeLeft <= 5 ? 'timer urgent' : 'timer'}>⏱ {timeLeft}s</span>
      </div>
      <div className="progress-track"><span style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>
      <p className="question-kicker">Choose the best answer</p>
      <h2>{currentQ.questionText}</h2>
      <div className="answer-grid">
        {currentQ.options.map((opt) => (
          <button 
            key={opt}
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}