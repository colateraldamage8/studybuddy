'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SpellingGame from './SpellingGame';

type Difficulty = 'easy' | 'medium' | 'hard';

interface SpellingModeProps {
  profileId: string | null;
  onClose: () => void;
}

const DIFFICULTIES = [
  {
    id: 'easy' as Difficulty,
    label: 'Easy',
    ages: 'Age 6–7',
    emoji: '🌱',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    accent: 'bg-emerald-500',
  },
  {
    id: 'medium' as Difficulty,
    label: 'Medium',
    ages: 'Age 8–9',
    emoji: '⭐',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    accent: 'bg-blue-500',
  },
  {
    id: 'hard' as Difficulty,
    label: 'Hard',
    ages: 'Age 10–11+',
    emoji: '🚀',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-700',
    accent: 'bg-purple-500',
  },
];

export default function SpellingMode({ profileId, onClose }: SpellingModeProps) {
  const [selected, setSelected] = useState<Difficulty | null>(null);
  const [started, setStarted] = useState(false);

  if (started && selected) {
    return (
      <SpellingGame
        difficulty={selected}
        profileId={profileId}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-xl">Spelling Practice ✏️</h2>
            <p className="text-white/80 text-sm mt-0.5">Choose your difficulty level</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>

        <div className="px-6 py-6">
          <div className="space-y-3 mb-6">
            {DIFFICULTIES.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(d.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-150 text-left
                  ${selected === d.id
                    ? `${d.bg} ${d.border} shadow-md`
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="text-3xl">{d.emoji}</span>
                <div className="flex-1">
                  <p className={`font-extrabold text-base ${selected === d.id ? d.text : 'text-gray-700'}`}>
                    {d.label}
                  </p>
                  <p className="text-gray-400 text-sm font-medium">{d.ages}</p>
                </div>
                {selected === d.id && (
                  <span className={`w-6 h-6 rounded-full ${d.accent} flex items-center justify-center text-white text-xs font-bold`}>
                    ✓
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => selected && setStarted(true)}
            disabled={!selected}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold py-3 rounded-xl transition-colors text-base"
          >
            {selected ? 'Start Spelling! ✏️' : 'Pick a difficulty first'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
