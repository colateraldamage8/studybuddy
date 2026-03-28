'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type Difficulty = 'easy' | 'medium' | 'hard';
type TableChoice = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'mixed';

interface TimesTablesResultProps {
  score: number;
  total: number;
  selectedTable: TableChoice;
  difficulty: Difficulty;
  profileId: string | null;
  onClose: () => void;
  onPlayAgain: () => void;
  onChangeTable: () => void;
}

export default function TimesTablesResult({
  score, total, selectedTable, difficulty,
  profileId, onClose, onPlayAgain, onChangeTable,
}: TimesTablesResultProps) {
  const [bestScore, setBestScore] = useState<number | null>(null);
  const pct = score / total;

  const result =
    pct === 1    ? { emoji: '🏆', msg: 'PERFECT SCORE! You\'re a times tables superstar!', colour: 'text-yellow-500' } :
    pct >= 0.8   ? { emoji: '🌟', msg: 'Amazing! Nearly perfect!',                         colour: 'text-green-500'  } :
    pct >= 0.6   ? { emoji: '👏', msg: 'Great effort! Keep practising!',                   colour: 'text-blue-500'  } :
    pct >= 0.4   ? { emoji: '💪', msg: 'Good try! Practice makes perfect!',                colour: 'text-orange-500'} :
                   { emoji: '😊', msg: 'Keep going — every practice helps!',               colour: 'text-purple-500'};

  const tableLabel = selectedTable === 'mixed' ? 'Mixed' : `${selectedTable}× table`;
  const diffLabel  = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  // Fetch personal best for this table + difficulty
  useEffect(() => {
    if (!profileId) return;
    async function fetchBest() {
      const { data } = await supabase
        .from('times_table_results')
        .select('score')
        .eq('child_id', profileId)
        .eq('selected_table', selectedTable)
        .eq('difficulty', difficulty)
        .order('score', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setBestScore(data[0].score);
    }
    fetchBest();
  }, [profileId, selectedTable, difficulty]);

  const isNewBest = bestScore !== null && score >= bestScore;

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
          <p className="text-white font-extrabold text-xl">Times Tables 📐</p>
          <p className="text-white/80 text-sm">{tableLabel} · {diffLabel}</p>
        </div>

        <div className="px-6 py-8">
          <div className="text-6xl mb-3">{result.emoji}</div>

          {/* Perfect score celebration */}
          {pct === 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 mb-4"
            >
              <p className="text-yellow-700 font-extrabold text-sm">🎉 Incredible! Perfect score!</p>
            </motion.div>
          )}

          {/* New personal best */}
          {isNewBest && pct < 1 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 mb-4"
            >
              <p className="text-green-700 font-extrabold text-sm">🏅 New personal best!</p>
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
          <div className="flex justify-center gap-2 mb-3">
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

          {/* Best score from DB */}
          {bestScore !== null && (
            <p className="text-xs text-gray-400 mb-5">
              Your best for {tableLabel} ({diffLabel}): <span className="font-bold text-blue-500">{bestScore}/{total}</span>
            </p>
          )}

          {/* Try mistakes placeholder */}
          <p className="text-xs text-gray-300 mb-5 italic">
            "Try mistakes again" — coming soon!
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onPlayAgain}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-3 rounded-xl transition-colors"
            >
              Practice Again 🔄
            </button>
            <button
              onClick={onChangeTable}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              Change Table
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-gray-600 font-medium py-2 transition-colors text-sm"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
