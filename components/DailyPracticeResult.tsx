'use client';

import { motion } from 'framer-motion';

interface DailyPracticeResultProps {
  score: number;
  total: number;
  onClose: () => void;
}

export default function DailyPracticeResult({ score, total, onClose }: DailyPracticeResultProps) {
  const pct = score / total;

  const result =
    pct === 1    ? { emoji: '🏆', msg: 'PERFECT! You nailed every question!',   colour: 'text-yellow-500' } :
    pct >= 0.8   ? { emoji: '🌟', msg: 'Amazing work! Nearly perfect!',         colour: 'text-green-500'  } :
    pct >= 0.6   ? { emoji: '👏', msg: 'Great effort! Keep it up!',             colour: 'text-blue-500'   } :
    pct >= 0.4   ? { emoji: '💪', msg: 'Good try! Every practice helps!',       colour: 'text-orange-500' } :
                   { emoji: '😊', msg: 'Keep going — you\'ll get better!',      colour: 'text-purple-500' };

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
          <p className="text-white font-extrabold text-xl">⭐ Daily Practice</p>
          <p className="text-white/80 text-sm">Today's challenge complete!</p>
        </div>

        <div className="px-6 py-8">
          <div className="text-6xl mb-3">{result.emoji}</div>

          {pct === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 mb-4"
            >
              <p className="text-yellow-700 font-extrabold text-sm">🎉 Perfect score today!</p>
            </motion.div>
          )}

          <h2 className="text-2xl font-extrabold text-gray-800 mb-1">
            You scored {score} / {total}
          </h2>
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold
                  ${i < score ? 'bg-green-400' : 'bg-red-300'}`}
              >
                {i < score ? '✓' : '✗'}
              </span>
            ))}
          </div>

          {/* Come back tomorrow note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6">
            <p className="text-blue-600 text-sm font-semibold">
              📅 Come back tomorrow for your next daily practice!
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-3 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
