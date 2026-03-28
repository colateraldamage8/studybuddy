'use client';

import { motion } from 'framer-motion';

type Difficulty = 'easy' | 'medium' | 'hard';

interface SpellingResultProps {
  score: number;
  total: number;
  difficulty: Difficulty;
  onClose: () => void;
  onPlayAgain: () => void;
}

export default function SpellingResult({ score, total, difficulty, onClose, onPlayAgain }: SpellingResultProps) {
  const pct = score / total;

  const result = pct === 1
    ? { emoji: '🏆', msg: 'Perfect score! You\'re a spelling star!', colour: 'text-yellow-500' }
    : pct >= 0.8
    ? { emoji: '🌟', msg: 'Amazing! Nearly perfect!', colour: 'text-green-500' }
    : pct >= 0.6
    ? { emoji: '👏', msg: 'Great effort! Keep practising!', colour: 'text-blue-500' }
    : pct >= 0.4
    ? { emoji: '💪', msg: 'Good try! Practice makes perfect!', colour: 'text-orange-500' }
    : { emoji: '😊', msg: 'Keep going — you\'re learning!', colour: 'text-purple-500' };

  const difficultyLabel = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <p className="text-white font-extrabold text-xl">Spelling Practice ✏️</p>
          <p className="text-white/80 text-sm">{difficultyLabel} level complete!</p>
        </div>

        <div className="px-6 py-8">
          <div className="text-6xl mb-3">{result.emoji}</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Well done!</h2>
          <p className={`text-base font-bold mb-5 ${result.colour}`}>{result.msg}</p>

          {/* Score circle */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex flex-col items-center justify-center mx-auto mb-5 shadow-lg">
            <span className="text-4xl font-extrabold text-white">{score}</span>
            <span className="text-white text-sm font-semibold">out of {total}</span>
          </div>

          {/* Dot breakdown */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i < score ? 'bg-green-400' : 'bg-red-300'}`}
              >
                {i < score ? '✓' : '✗'}
              </span>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onPlayAgain}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Practice Again 🔄
            </button>
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
