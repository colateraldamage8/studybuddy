'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type QuestionType = 'spelling' | 'maths' | 'general';

interface Question {
  type: QuestionType;
  prompt: string;       // What to display to the student
  answer: string;       // Expected answer (case-insensitive compare)
  hint?: string;        // Optional hint shown on wrong answer
}

interface DailyPracticeGameProps {
  profileId: string | null;
  onFinish: (score: number, total: number) => void;
  onClose: () => void;
}

// ── Question banks ───────────────────────────────
const SPELLING_WORDS: Question[] = [
  { type: 'spelling', prompt: 'Spell the word for a place where you go to learn.', answer: 'school', hint: 'It starts with "sch"' },
  { type: 'spelling', prompt: 'Spell the word that means "for the reason that".', answer: 'because', hint: 'It starts with "bec"' },
  { type: 'spelling', prompt: 'Spell the word for someone you like to play with.', answer: 'friend', hint: 'It starts with "fri"' },
  { type: 'spelling', prompt: 'Spell the word for the place where you live.', answer: 'house', hint: 'It starts with "h"' },
  { type: 'spelling', prompt: 'Spell the word for the clear liquid we drink.', answer: 'water', hint: 'It starts with "wa"' },
];

const MATHS_QUESTIONS: Question[] = [
  { type: 'maths', prompt: '2 + 3 = ?', answer: '5' },
  { type: 'maths', prompt: '4 + 5 = ?', answer: '9' },
  { type: 'maths', prompt: '6 + 2 = ?', answer: '8' },
  { type: 'maths', prompt: '3 × 4 = ?', answer: '12' },
  { type: 'maths', prompt: '5 × 2 = ?', answer: '10' },
];

const GENERAL_QUESTIONS: Question[] = [
  { type: 'general', prompt: 'What planet do we live on?', answer: 'earth' },
  { type: 'general', prompt: 'How many days are in a week?', answer: '7' },
  { type: 'general', prompt: 'What colour is the sky on a sunny day?', answer: 'blue' },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function buildQuestions(): Question[] {
  const [s1, s2] = pickRandom(SPELLING_WORDS, 2);
  const [m1, m2] = pickRandom(MATHS_QUESTIONS, 2);
  const [g1]     = pickRandom(GENERAL_QUESTIONS, 1);
  // Order: spelling → maths → spelling → maths → general
  return [s1, m1, s2, m2, g1];
}

const TYPE_CONFIG: Record<QuestionType, { label: string; emoji: string; colour: string }> = {
  spelling: { label: 'Spelling',      emoji: '✏️', colour: 'from-purple-500 to-purple-600' },
  maths:    { label: 'Maths',         emoji: '📐', colour: 'from-blue-500 to-blue-600'   },
  general:  { label: 'General Knowledge', emoji: '🧠', colour: 'from-green-500 to-green-600' },
};

const TOTAL = 5;

export default function DailyPracticeGame({ profileId, onFinish, onClose }: DailyPracticeGameProps) {
  const [questions] = useState<Question[]>(buildQuestions);
  const [index, setIndex]       = useState(0);
  const [input, setInput]       = useState('');
  const [score, setScore]       = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [saved, setSaved]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q        = questions[index];
  const config   = TYPE_CONFIG[q.type];
  const progress = (index / TOTAL) * 100;

  useEffect(() => {
    if (feedback === 'idle') inputRef.current?.focus();
  }, [index, feedback]);

  function handleCheck() {
    if (!input.trim()) return;
    const isCorrect = input.trim().toLowerCase() === q.answer.toLowerCase();
    if (isCorrect) setScore((s) => s + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }

  async function handleNext() {
    const nextIndex = index + 1;
    const finalScore = score + (feedback === 'correct' ? 0 : 0); // score already updated

    if (nextIndex >= TOTAL) {
      // Save to Supabase
      if (!saved && profileId) {
        setSaved(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from('daily_practice_results').upsert({
            user_id:  user.id,
            child_id: profileId,
            score,
            total:    TOTAL,
            date:     today,
          }, { onConflict: 'child_id,date' });
        }
      }
      onFinish(score, TOTAL);
    } else {
      setInput('');
      setFeedback('idle');
      setIndex(nextIndex);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.colour} px-6 py-4 flex items-center justify-between`}>
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">
              {config.emoji} {config.label}
            </p>
            <p className="text-white font-bold">Question {index + 1} of {TOTAL}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold leading-none">✕</button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100">
          <motion.div
            className="h-2 bg-green-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="px-6 py-8">
          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm font-medium mb-3">
              {q.type === 'spelling' ? '🔊 Type the correct spelling:' : 'Type your answer:'}
            </p>
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-extrabold text-gray-800"
            >
              {q.prompt}
            </motion.div>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type={q.type === 'maths' ? 'number' : 'text'}
            inputMode={q.type === 'maths' ? 'numeric' : 'text'}
            value={input}
            onChange={(e) => { setInput(e.target.value); setFeedback('idle'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && feedback === 'idle') handleCheck(); }}
            disabled={feedback !== 'idle'}
            placeholder="Type your answer..."
            className={`w-full text-center text-2xl font-extrabold border-2 rounded-2xl px-4 py-4 mb-4 transition-colors focus:outline-none
              ${feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-700'
              : feedback === 'wrong'   ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-200 focus:border-blue-400 text-gray-800'}`}
          />

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div
                key="correct"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center mb-4"
              >
                <p className="text-green-700 font-extrabold text-base">✅ Correct! Well done! 🌟</p>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center mb-4"
              >
                <p className="text-red-600 font-bold">❌ Not quite!</p>
                <p className="text-red-500 text-sm mt-1">
                  Correct answer: <span className="font-extrabold text-red-700">{q.answer}</span>
                </p>
                {q.hint && feedback === 'wrong' && (
                  <p className="text-red-400 text-xs mt-1">💡 Hint: {q.hint}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Button */}
          {feedback === 'idle' ? (
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold py-3.5 rounded-xl transition-colors text-base"
            >
              Check ✓
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-extrabold py-3.5 rounded-xl transition-colors text-base"
            >
              {index + 1 >= TOTAL ? 'See Results 🏆' : 'Next Question →'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
