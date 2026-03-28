'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SpanishVocabulary from './SpanishVocabulary';
import SpanishNumbers from './SpanishNumbers';
import SpanishPhrases from './SpanishPhrases';
import SpanishQuiz from './SpanishQuiz';

type Mode = 'vocabulary' | 'numbers' | 'phrases' | 'quiz';

interface Props {
  profileId: string | null;
  onClose: () => void;
}

const MODES = [
  { id: 'vocabulary' as Mode, emoji: '📝', label: 'Vocabulary',  sub: 'Learn Spanish words & meanings' },
  { id: 'numbers'    as Mode, emoji: '🔢', label: 'Numbers',     sub: 'Uno, dos, tres… count in Spanish!' },
  { id: 'phrases'    as Mode, emoji: '💬', label: 'Phrases',     sub: 'Hola, gracias & everyday phrases' },
  { id: 'quiz'       as Mode, emoji: '⭐', label: 'Quiz',        sub: 'Test your Spanish knowledge' },
];

export default function SpanishMode({ profileId, onClose }: Props) {
  const [mode, setMode] = useState<Mode | null>(null);

  if (mode === 'vocabulary') return <SpanishVocabulary profileId={profileId} onClose={() => setMode(null)} />;
  if (mode === 'numbers')    return <SpanishNumbers    profileId={profileId} onClose={() => setMode(null)} />;
  if (mode === 'phrases')    return <SpanishPhrases    profileId={profileId} onClose={() => setMode(null)} />;
  if (mode === 'quiz')       return <SpanishQuiz       profileId={profileId} onClose={() => setMode(null)} />;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-white font-extrabold text-xl">🇪🇸 Spanish</h2>
            <p className="text-white/80 text-sm">Choose a mode to start learning</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>
        <div className="p-5 space-y-3">
          {MODES.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setMode(m.id)}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-red-300 hover:shadow-md transition-all text-left"
            >
              <span className="text-3xl shrink-0">{m.emoji}</span>
              <div className="flex-1">
                <p className="font-extrabold text-gray-800 text-base">{m.label}</p>
                <p className="text-sm text-gray-400">{m.sub}</p>
              </div>
              <span className="text-xl text-gray-300">›</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
