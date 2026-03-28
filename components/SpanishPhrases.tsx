'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Props {
  profileId: string | null;
  onClose: () => void;
}

const PHRASES = [
  { spanish: 'hola',          english: 'hello',          emoji: '👋' },
  { spanish: 'gracias',       english: 'thank you',       emoji: '🙏' },
  { spanish: 'por favor',     english: 'please',          emoji: '😊' },
  { spanish: 'buenos días',   english: 'good morning',    emoji: '🌅' },
  { spanish: 'buenas noches', english: 'good night',      emoji: '🌙' },
  { spanish: 'adiós',         english: 'goodbye',         emoji: '👋' },
  { spanish: '¿cómo estás?',  english: 'how are you?',    emoji: '❓' },
  { spanish: 'sí',            english: 'yes',             emoji: '✅' },
  { spanish: 'no',            english: 'no',              emoji: '❌' },
  { spanish: 'me llamo...',   english: 'my name is...',   emoji: '🏷️' },
];

const TOTAL = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildRound() {
  const picked = shuffle(PHRASES).slice(0, TOTAL);
  return picked.map((item) => {
    const others = PHRASES.filter((p) => p.english !== item.english);
    const distractors = shuffle(others).slice(0, 3).map((p) => p.english);
    const options = shuffle([item.english, ...distractors]);
    return { ...item, options };
  });
}

export default function SpanishPhrases({ profileId, onClose }: Props) {
  const [questions] = useState(buildRound);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);

  const q = questions[index];

  async function handleNext() {
    const nextIndex = index + 1;
    if (nextIndex >= TOTAL) {
      setFinished(true);
      if (!saved && profileId) {
        setSaved(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('spanish_results').insert({
            user_id: user.id, child_id: profileId, mode: 'phrases', score, total: TOTAL,
          });
        }
      }
    } else {
      setSelected(null);
      setIndex(nextIndex);
    }
  }

  if (finished) {
    const pct = score / TOTAL;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
            <p className="text-white font-extrabold text-xl">🇪🇸 Phrases</p>
          </div>
          <div className="px-6 py-8">
            <div className="text-5xl mb-3">{pct === 1 ? '🏆' : pct >= 0.6 ? '🌟' : '💪'}</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-2">You scored {score}/{TOTAL}</h2>
            <p className="text-gray-500 font-bold mb-6">{pct === 1 ? '¡Perfecto! 🎉' : pct >= 0.6 ? '¡Muy bien! 🌟' : '¡Sigue practicando! 💪'}</p>
            <div className="flex gap-2">
              <button onClick={() => { setIndex(0); setScore(0); setSelected(null); setFinished(false); setSaved(false); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-extrabold py-3 rounded-xl">Try Again 🔄</button>
              <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl">Done</button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div key={index} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">🇪🇸 Phrases</p>
            <p className="text-white font-bold">Question {index + 1} of {TOTAL}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>
        <div className="h-2 bg-red-100">
          <motion.div className="h-2 bg-green-400" animate={{ width: `${(index / TOTAL) * 100}%` }} />
        </div>
        <div className="px-6 py-8">
          <p className="text-center text-gray-400 text-sm mb-3">What does this phrase mean in English?</p>
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">{q.emoji}</div>
            <motion.p key={index} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-gray-800">{q.spanish}</motion.p>
          </div>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const correct = opt === q.english;
              const bg = !selected ? 'bg-gray-50 hover:bg-red-50 border-gray-200 hover:border-red-300'
                : correct ? 'bg-green-50 border-green-400 text-green-700'
                : isSelected ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-gray-50 border-gray-200 opacity-50';
              return (
                <button key={opt} disabled={!!selected} onClick={() => { setSelected(opt); if (opt === q.english) setScore(s => s + 1); }}
                  className={`border-2 rounded-xl py-3 px-4 font-bold text-sm transition-colors text-left ${bg}`}>
                  {opt}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-center mb-4 ${selected === q.english ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-extrabold text-sm ${selected === q.english ? 'text-green-700' : 'text-red-700'}`}>
                  {selected === q.english ? '✅ ¡Correcto!' : `❌ It means "${q.english}"`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {selected && (
            <button onClick={handleNext} className="w-full bg-red-500 hover:bg-red-600 text-white font-extrabold py-3.5 rounded-xl">
              {index + 1 >= TOTAL ? 'See Results 🏆' : 'Next →'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
