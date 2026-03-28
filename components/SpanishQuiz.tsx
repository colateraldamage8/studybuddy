'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Props {
  profileId: string | null;
  onClose: () => void;
}

const ALL_QUESTIONS = [
  // Vocabulary
  { q: 'What does "rojo" mean?',    correct: 'red',          options: ['red', 'blue', 'green', 'yellow'] },
  { q: 'What does "casa" mean?',    correct: 'house',        options: ['house', 'dog', 'book', 'sun'] },
  { q: 'What does "perro" mean?',   correct: 'dog',          options: ['dog', 'cat', 'moon', 'water'] },
  { q: 'What does "agua" mean?',    correct: 'water',        options: ['water', 'fire', 'earth', 'air'] },
  { q: 'What does "sol" mean?',     correct: 'sun',          options: ['sun', 'moon', 'star', 'cloud'] },
  { q: 'What does "luna" mean?',    correct: 'moon',         options: ['moon', 'sun', 'star', 'sky'] },
  { q: 'What does "libro" mean?',   correct: 'book',         options: ['book', 'pen', 'bag', 'desk'] },
  { q: 'What does "azul" mean?',    correct: 'blue',         options: ['blue', 'red', 'green', 'pink'] },
  // Numbers
  { q: 'How do you say "3" in Spanish?',  correct: 'tres',   options: ['tres', 'dos', 'cuatro', 'uno'] },
  { q: 'How do you say "7" in Spanish?',  correct: 'siete',  options: ['siete', 'ocho', 'seis', 'nueve'] },
  { q: 'How do you say "10" in Spanish?', correct: 'diez',   options: ['diez', 'dos', 'seis', 'cinco'] },
  { q: 'How do you say "5" in Spanish?',  correct: 'cinco',  options: ['cinco', 'tres', 'ocho', 'dos'] },
  { q: 'How do you say "1" in Spanish?',  correct: 'uno',    options: ['uno', 'dos', 'tres', 'cuatro'] },
  // Phrases
  { q: 'What does "hola" mean?',         correct: 'hello',        options: ['hello', 'goodbye', 'please', 'thank you'] },
  { q: 'What does "gracias" mean?',      correct: 'thank you',    options: ['thank you', 'please', 'hello', 'goodbye'] },
  { q: 'What does "por favor" mean?',    correct: 'please',       options: ['please', 'thank you', 'hello', 'good night'] },
  { q: 'What does "adiós" mean?',        correct: 'goodbye',      options: ['goodbye', 'hello', 'please', 'good morning'] },
  { q: 'What does "buenos días" mean?',  correct: 'good morning', options: ['good morning', 'good night', 'goodbye', 'hello'] },
];

const TOTAL = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SpanishQuiz({ profileId, onClose }: Props) {
  const [questions] = useState(() => shuffle(ALL_QUESTIONS).slice(0, TOTAL).map(q => ({ ...q, options: shuffle(q.options) })));
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
            user_id: user.id, child_id: profileId, mode: 'quiz', score, total: TOTAL,
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
    const result =
      pct === 1   ? { emoji: '🏆', msg: '¡Perfecto! Perfect score!',    colour: 'text-yellow-500' } :
      pct >= 0.8  ? { emoji: '🌟', msg: '¡Muy bien! Amazing work!',      colour: 'text-green-500'  } :
      pct >= 0.6  ? { emoji: '👏', msg: '¡Bien! Good effort!',           colour: 'text-blue-500'   } :
                    { emoji: '💪', msg: '¡Sigue practicando! Keep going!',colour: 'text-orange-500' };
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-3xl shadow-2xl max-w-sm w-full text-center overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
            <p className="text-white font-extrabold text-xl">🇪🇸 Spanish Quiz</p>
          </div>
          <div className="px-6 py-8">
            <div className="text-5xl mb-3">{result.emoji}</div>
            <h2 className="text-2xl font-extrabold text-gray-800 mb-1">You scored {score}/{TOTAL}</h2>
            <p className={`font-bold mb-5 ${result.colour}`}>{result.msg}</p>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex flex-col items-center justify-center mx-auto mb-5 shadow-lg">
              <span className="text-3xl font-extrabold text-white">{score}</span>
              <span className="text-white text-xs font-semibold">/ {TOTAL}</span>
            </div>
            <div className="flex justify-center gap-2 mb-6">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <span key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i < score ? 'bg-green-400' : 'bg-red-300'}`}>
                  {i < score ? '✓' : '✗'}
                </span>
              ))}
            </div>
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
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">🇪🇸 Spanish Quiz</p>
            <p className="text-white font-bold">Question {index + 1} of {TOTAL}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>
        <div className="h-2 bg-red-100">
          <motion.div className="h-2 bg-green-400" animate={{ width: `${(index / TOTAL) * 100}%` }} />
        </div>
        <div className="px-6 py-8">
          <motion.p key={index} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="text-xl font-extrabold text-gray-800 text-center mb-8">{q.q}</motion.p>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {q.options.map((opt) => {
              const isSelected = selected === opt;
              const correct = opt === q.correct;
              const bg = !selected ? 'bg-gray-50 hover:bg-red-50 border-gray-200 hover:border-red-300'
                : correct ? 'bg-green-50 border-green-400 text-green-700'
                : isSelected ? 'bg-red-50 border-red-400 text-red-700'
                : 'bg-gray-50 border-gray-200 opacity-50';
              return (
                <button key={opt} disabled={!!selected} onClick={() => { setSelected(opt); if (opt === q.correct) setScore(s => s + 1); }}
                  className={`border-2 rounded-xl py-3 px-4 font-bold text-sm transition-colors text-left ${bg}`}>
                  {opt}
                </button>
              );
            })}
          </div>
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 text-center mb-4 ${selected === q.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-extrabold text-sm ${selected === q.correct ? 'text-green-700' : 'text-red-700'}`}>
                  {selected === q.correct ? '✅ ¡Correcto!' : `❌ The answer is "${q.correct}"`}
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
