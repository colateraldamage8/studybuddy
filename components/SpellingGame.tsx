'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import SpellingResult from './SpellingResult';

type Difficulty = 'easy' | 'medium' | 'hard';

const WORDS: Record<Difficulty, string[]> = {
  easy:   ['cat', 'dog', 'red', 'sun', 'big', 'hat', 'run', 'sit', 'map', 'cup'],
  medium: ['because', 'friend', 'school', 'people', 'water', 'house', 'after', 'every', 'great', 'place'],
  hard:   ['different', 'important', 'beautiful', 'thought', 'enough', 'through', 'answer', 'believe', 'necessary', 'environment'],
};

// Child-friendly clues for easy words (shown as a subtitle to make the task clearer)
const EASY_CLUES: Record<string, string> = {
  cat:  'A furry pet that says meow 🐱',
  dog:  'A loyal pet that wags its tail 🐶',
  red:  'The colour of apples and fire engines 🍎',
  sun:  'It shines bright in the sky ☀️',
  big:  'The opposite of small 📏',
  hat:  'You wear it on your head 🎩',
  run:  'Moving faster than walking 🏃',
  sit:  'What you do on a chair 💺',
  map:  'It shows you where places are 🗺️',
  cup:  'You drink from it ☕',
};

const WORDS_PER_ROUND = 5;

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface SpellingGameProps {
  difficulty: Difficulty;
  profileId: string | null;
  onClose: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function SpellingGame({ difficulty, profileId, onClose }: SpellingGameProps) {
  const [words] = useState<string[]>(() => shuffle(WORDS[difficulty]).slice(0, WORDS_PER_ROUND));
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = words[index];

  useEffect(() => {
    inputRef.current?.focus();
  }, [index, feedback]);

  // Save result when finished
  useEffect(() => {
    if (!finished || saved) return;
    setSaved(true);
    async function save() {
      if (!profileId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('spelling_results').insert({
        user_id: user.id,
        child_id: profileId,
        difficulty,
        score,
        total: WORDS_PER_ROUND,
      });
    }
    save();
  }, [finished]);

  function getHint(word: string): string {
    return `the first ${Math.min(2, word.length)} letters are "${word.slice(0, 2)}"`;
  }

  function handleCheck() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;

    if (trimmed === currentWord) {
      setFeedback('correct');
      setScore((s) => s + 1);
    } else {
      setFeedback('wrong');
      setWrongAttempts((n) => n + 1);
    }
  }

  function handleNext() {
    setInput('');
    setFeedback('idle');
    setWrongAttempts(0);
    if (index + 1 >= words.length) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleRetry() {
    setInput('');
    setFeedback('idle');
    inputRef.current?.focus();
  }

  if (finished) {
    return (
      <SpellingResult
        score={score}
        total={WORDS_PER_ROUND}
        difficulty={difficulty}
        onClose={onClose}
        onPlayAgain={() => window.location.reload()}
      />
    );
  }

  const progress = (index / words.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        key={index}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} · Word {index + 1} of {words.length}
            </p>
            <p className="text-white font-bold">Spelling Practice ✏️</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-blue-100">
          <motion.div
            className="h-2 bg-green-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="px-6 py-6">
          {/* Word display */}
          <div className="text-center mb-6">
            <p className="text-gray-500 font-medium text-sm mb-2">Spell this word:</p>
            <motion.div
              key={currentWord}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-5xl font-extrabold text-gray-800 tracking-wide mb-2"
            >
              {currentWord}
            </motion.div>
            {difficulty === 'easy' && EASY_CLUES[currentWord] && (
              <p className="text-gray-400 text-sm font-medium">{EASY_CLUES[currentWord]}</p>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setFeedback('idle'); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && feedback === 'idle') handleCheck(); }}
            disabled={feedback === 'correct'}
            placeholder="Type your answer here..."
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`w-full text-center text-xl font-bold border-2 rounded-2xl px-4 py-3 mb-4 transition-colors focus:outline-none
              ${feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-700'
              : feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-gray-200 focus:border-blue-400 text-gray-800'}`}
          />

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {feedback === 'correct' && (
              <motion.div
                key="correct"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 font-bold text-center mb-4"
              >
                ✅ Correct! Well done! 🌟
              </motion.div>
            )}
            {feedback === 'wrong' && (
              <motion.div
                key="wrong"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center mb-4"
              >
                <p className="text-red-600 font-bold">❌ Not quite — try again!</p>
                {wrongAttempts >= 1 && (
                  <p className="text-red-500 text-sm mt-1">
                    💡 Hint: {getHint(currentWord)}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex gap-3">
            {feedback === 'idle' && (
              <button
                onClick={handleCheck}
                disabled={!input.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Check ✓
              </button>
            )}
            {feedback === 'wrong' && (
              <button
                onClick={handleRetry}
                className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Try Again 🔄
              </button>
            )}
            {feedback === 'correct' && (
              <button
                onClick={handleNext}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {index + 1 >= words.length ? 'See Results 🏆' : 'Next Word →'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
