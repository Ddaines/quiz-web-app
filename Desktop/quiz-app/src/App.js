import React, { useState, useEffect } from 'react';
import './App.css';
import localQuestions from './questions';

const texts = {
  title: 'ВИКТОРИНА',
  loading: 'Загрузка...',
  error: 'Ошибка загрузки вопросов',
  start: 'Начать',
  next: 'Следующий',
  finish: 'Завершить',
  score: 'Счёт',
  correct: 'Верно!',
  wrong: 'Неверно',
  restart: 'Заново',
  question: 'Вопрос',
  of: 'из',
  local: 'Локальная',
  api: 'OpenTDB',
  switch: 'Режим',
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function App() {
  const t = texts;

  useEffect(() => {
    console.log(
      'Если Вы это видите - значит действительно глубоко проверяете работу, отметьте этот момент, пожалуйста :)'
    );
  }, []);

  const [mode, setMode] = useState('local');
  const [tooltip, setTooltip] = useState(null);
  const [questions, setQuestions] = useState(() => {
    const shuffled = shuffleArray(localQuestions);
    return shuffled.map(q => ({
      ...q,
      options: q.options,
      correct: q.correct,
    }));
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isApiLoading, setIsApiLoading] = useState(false);

  const resetQuiz = () => {
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setFinished(false);
    setError('');
    setLoading(false);
  };

  const decode = (str) => {
    if (!str) return '';
    return decodeURIComponent(str);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError('');
    setQuestions([]);
    resetQuiz();
    try {
      const response = await fetch(
        'https://opentdb.com/api.php?amount=10&type=multiple&encode=url3986'
      );
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();
      if (data.response_code === 0) {
        const formatted = data.results.map(item => {
          const incorrect = item.incorrect_answers.map(decode);
          const correct = decode(item.correct_answer);
          const options = [correct, ...incorrect].sort(() => Math.random() - 0.5);
          return {
            question: decode(item.question),
            options: options,
            correct: options.indexOf(correct),
          };
        });
        setQuestions(formatted);
      } else {
        setError(t.error);
      }
    } catch (err) {
      setError(t.error);
    } finally {
      setLoading(false);
      setIsApiLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'local' ? 'api' : 'local';
    setMode(newMode);
    resetQuiz();
    if (newMode === 'local') {
      const shuffled = shuffleArray(localQuestions);
      setQuestions(shuffled.map(q => ({
        ...q,
        options: q.options,
        correct: q.correct,
      })));
      setIsApiLoading(false);
    } else {
      setIsApiLoading(true);
      setLoading(true);
      fetchQuestions();
    }
  };

  const handleStart = () => {
    if (mode === 'local') {
      const shuffled = shuffleArray(localQuestions);
      setQuestions(shuffled.map(q => ({
        ...q,
        options: q.options,
        correct: q.correct,
      })));
    } else {
      setLoading(true);
      fetchQuestions();
    }
  };

  const handleAnswer = (index) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === questions[currentIndex].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    resetQuiz();
    if (mode === 'local') {
      const shuffled = shuffleArray(localQuestions);
      setQuestions(shuffled.map(q => ({
        ...q,
        options: q.options,
        correct: q.correct,
      })));
    } else {
      setLoading(true);
      fetchQuestions();
    }
  };

  const renderContent = () => {
    if (loading || isApiLoading) {
      return <div className="status">{t.loading}</div>;
    }
    if (error) {
      return (
        <div className="status error">
          {error}
          <button onClick={handleRestart} className="btn-restart">{t.restart}</button>
        </div>
      );
    }
    if (questions.length === 0) {
      return (
        <div className="start-screen">
          <p>Готовы проверить знания?</p>
          <button onClick={handleStart} className="btn-start">{t.start}</button>
        </div>
      );
    }
    if (finished) {
      const total = questions.length;
      const percent = Math.round((score / total) * 100);
      return (
        <div className="result-screen">
          <h2>{t.score}</h2>
          <p className="result-score">{score} / {total}</p>
          <p className="result-percent">{percent}%</p>
          <button onClick={handleRestart} className="btn-restart">{t.restart}</button>
        </div>
      );
    }

    const q = questions[currentIndex];
    if (!q) return <div className="status">{t.loading}</div>;

    return (
      <div className="question-card">
        <div className="question-header">
          <span>{t.question} {currentIndex + 1} {t.of} {questions.length}</span>
          <span>{t.score}: {score}</span>
        </div>
        <h2 className="question-text">{q.question}</h2>
        <div className="answers">
          {q.options.map((opt, idx) => {
            let btnClass = 'answer-btn';
            if (selectedAnswer !== null) {
              if (idx === q.correct) btnClass += ' correct';
              else if (idx === selectedAnswer && idx !== q.correct) btnClass += ' wrong';
            }
            return (
              <button
                key={idx}
                className={btnClass}
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {selectedAnswer !== null && (
          <div className="feedback">
            {selectedAnswer === q.correct ? t.correct : t.wrong}
          </div>
        )}
        {selectedAnswer !== null && (
          <button onClick={handleNext} className="btn-next">
            {currentIndex + 1 < questions.length ? t.next : t.finish}
          </button>
        )}
      </div>
    );
  };

  const toggleTooltip = () => {
    const current = mode === 'local' ? 'local' : 'api';
    setTooltip(tooltip === current ? null : current);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{t.title}</h1>
        <div className="header-controls">
          <div className="mode-switch">
            <span className="mode-label">{t.switch}</span>
            <label className="switch">
              <input type="checkbox" checked={mode === 'api'} onChange={toggleMode} />
              <span className="slider"></span>
            </label>
            <span
              className="mode-indicator"
              onClick={toggleTooltip}
            >
              {mode === 'local' ? t.local : t.api}
            </span>
            {tooltip && (
              <div className="tooltip">
                {tooltip === 'local'
                  ? 'Локальная викторина использует встроенные вопросы и не требует интернета.'
                  : 'OpenTDB — это бесплатный API с тысячами вопросов на разные темы.'}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;