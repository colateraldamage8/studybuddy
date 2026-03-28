'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import TimesTablesResult from './TimesTablesResult';

type Difficulty = 'easy' | 'medium' | 'hard';
type TableChoice = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'mixed';
type Feedback = 'idle' | 'correct' | 'wrong';

interface Question { a: number; b: number; answer: number }

interface TimesTablesGameProps {
  selectedTable: TableChoice;
  difficulty: Difficulty;
  profileId: string | null;
  onClose: () => void;
  onChangeTable: () => void;
}

const TOTAL = 5;

const MULTIPLIER_RANGE: Record<Difficulty, [number, number]> = {
  easy:   [1, 5],
  medium: [1, 10],
  hard:   [1, 12],
};

const ENCOURAGEMENTS = [
  'Great job! 🌟',
  'Well done! 🎉',
  'Brilliant! ⭐',
  'You got it! 🚀',
  'Correct! Keep going! 💪',
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestions(table: TableChoice, difficulty: Difficulty): Question[] {
  const [min, max] = MULTIPLIER_RANGE[difficulty];
  const questions: Question[] = [];
  const used = new Set<string>();

  while (questions.length < TOTAL) {
    const a = table === 'mixed' ? rand(2, 10) : parseInt(table);
    const b = rand(min, max);
    const key = `${a}x${b}`;
    if (!used.has(key)) {
      used.add(key);
      questions.push({ a, b, answer: a * b });
    }
  }
  return questions;
}

export default function TimesTablesGame({
  selectedTable,
  difficulty,
  profileId,
  onClose,
  onChangeTable,
}: TimesTablesGameProps) {
  const [questions] = useState<Question[]>(() => generateQuestions(selectedTable, difficulty));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [encouragement, setEncouragement] = useState('');
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = questions[index];

  useEffect(() => {
    if (feedback === 'idle') inputRef.current?.focus();
  }, [index, feedback]);

  // Save to Supabase on finish
  useEffect(() => {
    if (!finished || saved) return;
    setSaved(true);
    async function save() {
      if (!profileId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('times_table_results').insert({
        user_id: user.id,
        child_id: profileId,
        selected_table: selectedTable,
        difficulty,
        score,
        total: TOTAL,
      });
    }
    save();
  }, [finished]);

  function handleCheck() {
    const val = parseInt(input.trim());
    if (isNaN(val)) return;

    if (val === q.answer) {
      setScore((s) => s + 1);
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
  }

  function handleNext() {
    setInput('');
    setFeedback('idle');
    setEncouragement('');
    if (index + 1 >= TOTAL) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <TimesTablesResult
        score={score}
        total={TOTAL}
        selectedTable={selectedTable}
        difficulty={difficulty}
        profileId={profileId}
        onClose={onClose}
        onPlayAgain={() => window.location.reload()}
        onChangeTable={onChangeTable}
      />
    );
  }

  const progress = (index / TOTAL) * 100;

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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">
              {selectedTable === 'mixed' ? 'Mixed' : `${selectedTable}× table`} · {difficulty}
            </p>
            <p className="text-white font-bold">Question {index + 1} of {TOTAL}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold leading-none">✕</button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-blue-100">
          <motion.div
            className="h-2 bg-green-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="px-6 py-8">
          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm font-medium mb-3">What is the answer?</p>
            <motion.div
              key={`${q.a}x${q.b}`}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-black text-gray-800 tracking-tight"
            >
              {q.a} × {q.b} = <span className="text-blue-500">?</span>
            </motion.div>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
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
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center mb-4"
              >
                <p className="text-green-700 font-extrabold text-base">✅ {encouragement}</p>
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center mb-4"
              >
                <p className="text-red-600 font-bold">❌ Not quite!</p>
                <p className="text-red-500 text-sm mt-1">
                  Correct answer: <span className="font-extrabold text-red-700">{q.answer}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
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
