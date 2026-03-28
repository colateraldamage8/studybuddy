'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import TimesTablesGame from './TimesTablesGame';

type Difficulty = 'easy' | 'medium' | 'hard';
type TableChoice = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'mixed';

interface TimesTablesModeProps {
  profileId: string | null;
  onClose: () => void;
}

const TABLE_OPTIONS: { value: TableChoice; label: string }[] = [
  { value: '2',     label: '2 ×' },
  { value: '3',     label: '3 ×' },
  { value: '4',     label: '4 ×' },
  { value: '5',     label: '5 ×' },
  { value: '6',     label: '6 ×' },
  { value: '7',     label: '7 ×' },
  { value: '8',     label: '8 ×' },
  { value: '9',     label: '9 ×' },
  { value: '10',    label: '10 ×' },
  { value: 'mixed', label: '🔀 Mixed' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; desc: string; emoji: string; bg: string; border: string; text: string }[] = [
  { value: 'easy',   label: 'Easy',   desc: 'Multipliers 1–5',  emoji: '🌱', bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700' },
  { value: 'medium', label: 'Medium', desc: 'Multipliers 1–10', emoji: '⭐', bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-700'    },
  { value: 'hard',   label: 'Hard',   desc: 'Multipliers 1–12', emoji: '🚀', bg: 'bg-purple-50',  border: 'border-purple-300',  text: 'text-purple-700'  },
];

export default function TimesTablesMode({ profileId, onClose }: TimesTablesModeProps) {
  const [selectedTable, setSelectedTable] = useState<TableChoice | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [started, setStarted] = useState(false);

  if (started && selectedTable && difficulty) {
    return (
      <TimesTablesGame
        selectedTable={selectedTable}
        difficulty={difficulty}
        profileId={profileId}
        onClose={onClose}
        onChangeTable={() => setStarted(false)}
      />
    );
  }

  const canStart = selectedTable !== null && difficulty !== null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-extrabold text-xl">Times Tables Practice 📐</h2>
            <p className="text-white/80 text-sm mt-0.5">Pick a table and difficulty to start</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold leading-none">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Table picker */}
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Choose a times table</p>
            <div className="grid grid-cols-5 gap-2">
              {TABLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedTable(opt.value)}
                  className={`py-3 rounded-2xl font-extrabold text-sm transition-all duration-150 border-2
                    ${selectedTable === opt.value
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md scale-105'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    } ${opt.value === 'mixed' ? 'col-span-5 text-base py-3.5' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty picker */}
          <div>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">Choose difficulty</p>
            <div className="space-y-2">
              {DIFFICULTY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`w-full flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all duration-150 text-left
                    ${difficulty === d.value
                      ? `${d.bg} ${d.border} shadow-sm`
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <span className="text-2xl">{d.emoji}</span>
                  <div className="flex-1">
                    <p className={`font-extrabold text-sm ${difficulty === d.value ? d.text : 'text-gray-700'}`}>{d.label}</p>
                    <p className="text-gray-400 text-xs">{d.desc}</p>
                  </div>
                  {difficulty === d.value && (
                    <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <div className="px-6 pb-6 flex-shrink-0">
          <button
            onClick={() => canStart && setStarted(true)}
            disabled={!canStart}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold py-3.5 rounded-xl transition-colors text-base"
          >
            {canStart ? 'Start Practice! 📐' : 'Pick a table and difficulty first'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
