'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudentProfile } from '@/types';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizProps {
  profile: StudentProfile;
  onClose: () => void;
  onComplete?: (score: number, total: number) => void;
}

type QuizState = 'loading' | 'active' | 'result' | 'error';

export default function Quiz({ profile, onClose, onComplete }: QuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [showExplanation, setShowExplanation] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, []);

  async function fetchQuiz() {
    setQuizState('loading');
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: profile.age, yearGroup: profile.yearGroup, subject: profile.subject }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions) throw new Error(data.error || 'Failed to load quiz');
      setQuestions(data.questions);
      setQuizState('active');
    } catch {
      setQuizState('error');
    }
  }

  // Only confirm exit when at least 1 question has been answered
  function handleClose() {
    if (quizState === 'active' && answers.length > 0) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  function handleAnswer(index: number) {
    if (selected !== null) return;
    setSelected(index);
    setShowExplanation(true);
  }

  function handleNext() {
    if (selected === null) return;
    const correct = selected === questions[current].correctIndex;
    const newAnswers = [...answers, correct];
    setAnswers(newAnswers);
    setSelected(null);
    setShowExplanation(false);

    if (current + 1 >= questions.length) {
      onComplete?.(newAnswers.filter(Boolean).length, questions.length);
      setQuizState('result');
    } else {
      setCurrent(current + 1);
    }
  }

  const score = answers.filter(Boolean).length;

  function getResultMessage(score: number, total: number) {
    const pct = score / total;
    if (pct === 1) return { msg: "Perfect score! You're a star! 🌟", colour: 'text-yellow-500' };
    if (pct >= 0.8) return { msg: 'Amazing work! Nearly perfect! 🎉', colour: 'text-green-500' };
    if (pct >= 0.6) return { msg: 'Great effort! Keep it up! 👏', colour: 'text-blue-500' };
    if (pct >= 0.4) return { msg: 'Good try! Practice makes perfect! 💪', colour: 'text-orange-500' };
    return { msg: "Keep practising — you'll get there! 😊", colour: 'text-purple-500' };
  }

  // ── Loading ──────────────────────────────────────
  if (quizState === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm w-full">
          <div className="text-5xl mb-4 animate-bounce">🧠</div>
          <p className="text-xl font-bold text-gray-700">Getting your quiz ready...</p>
          <p className="text-gray-400 mt-2 text-sm">Making {profile.subject} questions just for you!</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────
  if (quizState === 'error') {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm w-full">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-xl font-bold text-gray-700 mb-2">Oops! Something went wrong.</p>
          <p className="text-gray-400 text-sm mb-6">Couldn't load the quiz. Please try again!</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchQuiz} className="bg-blue-500 text-white font-bold px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors">Try Again</button>
            <button onClick={onClose} className="bg-gray-100 text-gray-600 font-bold px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result ───────────────────────────────────────
  if (quizState === 'result') {
    const { msg, colour } = getResultMessage(score, questions.length);
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
        >
          <div className="text-6xl mb-4">{score === questions.length ? '🏆' : score >= 3 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Quiz Complete!</h2>
          <p className={`text-lg font-bold mb-4 ${colour}`}>{msg}</p>
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex flex-col items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl font-extrabold text-white">{score}</span>
            <span className="text-white text-sm font-semibold">out of {questions.length}</span>
          </div>
          <div className="flex justify-center gap-2 mb-6">
            {answers.map((correct, i) => (
              <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${correct ? 'bg-green-400' : 'bg-red-400'}`}>
                {correct ? '✓' : '✗'}
              </span>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setCurrent(0); setAnswers([]); setSelected(null); fetchQuiz(); }} className="bg-blue-500 text-white font-bold px-5 py-2 rounded-xl hover:bg-blue-600 transition-colors text-sm">
              Play Again 🔄
            </button>
            <button onClick={onClose} className="bg-gray-100 text-gray-600 font-bold px-5 py-2 rounded-xl hover:bg-gray-200 transition-colors text-sm">
              Back to Chat
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Active quiz ──────────────────────────────────
  const q = questions[current];
  const progress = (current / questions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        key={current}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* ── Exit confirmation overlay ── */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-white/97 rounded-3xl flex flex-col items-center justify-center p-8 z-10">
            <div className="text-4xl mb-4">🤔</div>
            <h3 className="text-lg font-extrabold text-gray-800 mb-2 text-center">Exit Quiz?</h3>
            <p className="text-gray-500 text-sm text-center mb-6">
              Are you sure? Your progress will be lost.
            </p>
            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Yes, exit
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">{profile.subject} Quiz</p>
            <p className="text-white font-bold">Question {current + 1} of {questions.length}</p>
          </div>
          <button onClick={handleClose} className="text-white/70 hover:text-white text-2xl font-bold transition-colors" aria-label="Close quiz">✕</button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-blue-100">
          <motion.div className="h-2 bg-green-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>

        {/* Question */}
        <div className="px-6 pt-6 pb-4">
          <p className="text-lg font-bold text-gray-800 leading-snug mb-5">{q.question}</p>

          {/* Options — color + icon reinforcement for accessibility */}
          <div className="space-y-3">
            {q.options.map((option, i) => {
              const isAnswered = selected !== null;
              const isCorrect = i === q.correctIndex;
              const isWrong = i === selected && !isCorrect;

              let style = 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300';
              if (isAnswered) {
                if (isCorrect) style = 'bg-green-50 border-green-400 text-green-800';
                else if (isWrong) style = 'bg-red-50 border-red-400 text-red-700';
                else style = 'bg-gray-50 border-gray-200 text-gray-400';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-150 ${style} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="flex-1">{option}</span>
                  {isAnswered && isCorrect && (
                    <span className="ml-3 flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold" aria-label="Correct answer">✓</span>
                  )}
                  {isAnswered && isWrong && (
                    <span className="ml-3 flex-shrink-0 w-6 h-6 rounded-full bg-red-400 text-white flex items-center justify-center text-xs font-bold" aria-label="Incorrect answer">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800 font-medium"
              >
                💡 {q.explanation}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next button */}
        <div className="px-6 pb-6">
          {selected !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors text-base"
            >
              {current + 1 === questions.length ? 'See Results 🏆' : 'Next Question →'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
