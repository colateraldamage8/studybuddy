'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

type QuestionType = 'spelling' | 'maths' | 'general';

interface Question {
  type: QuestionType;
  prompt: string;
  answer: string;
  hint?: string;
  _id?: string; // internal id for retry tracking
}

interface DailyPracticeGameProps {
  profileId: string | null;
  onFinish: (score: number, total: number) => void;
  onClose: () => void;
}

// ── Question banks (expanded) ───────────────────────────────
const SPELLING_WORDS: Question[] = [
  { type: 'spelling', prompt: 'Spell the word for a place where you go to learn.', answer: 'school', hint: 'It starts with "sch"' },
  { type: 'spelling', prompt: 'Spell the word that means "for the reason that".', answer: 'because', hint: 'It starts with "bec"' },
  { type: 'spelling', prompt: 'Spell the word for someone you like to play with.', answer: 'friend', hint: 'It starts with "fri"' },
  { type: 'spelling', prompt: 'Spell the word for the place where you live.', answer: 'house', hint: 'It starts with "h"' },
  { type: 'spelling', prompt: 'Spell the word for the clear liquid we drink.', answer: 'water', hint: 'It starts with "wa"' },
  { type: 'spelling', prompt: 'Spell the word for the opposite of "dark".', answer: 'light', hint: 'It starts with "li"' },
  { type: 'spelling', prompt: 'Spell the word for the day after today.', answer: 'tomorrow', hint: 'It starts with "tom"' },
  { type: 'spelling', prompt: 'Spell the word for a very large animal with a trunk.', answer: 'elephant', hint: 'It starts with "ele"' },
  { type: 'spelling', prompt: 'Spell the word that means "lovely" or "attractive".', answer: 'beautiful', hint: 'It starts with "beau"' },
  { type: 'spelling', prompt: 'Spell the word for when something is not the same.', answer: 'different', hint: 'It starts with "diff"' },
  { type: 'spelling', prompt: 'Spell the word for a group of students learning together.', answer: 'class', hint: 'It starts with "cl"' },
  { type: 'spelling', prompt: 'Spell the word for the meal you eat in the morning.', answer: 'breakfast', hint: 'It starts with "break"' },
  { type: 'spelling', prompt: 'Spell the word that means "to move very fast".', answer: 'quickly', hint: 'It starts with "qu"' },
  { type: 'spelling', prompt: 'Spell the word for the opposite of "happy".', answer: 'sad', hint: 'It has 3 letters' },
  { type: 'spelling', prompt: 'Spell the word for a person who teaches you.', answer: 'teacher', hint: 'It starts with "tea"' },
  { type: 'spelling', prompt: 'Spell the word for the season when leaves fall.', answer: 'autumn', hint: 'It starts with "au"' },
  { type: 'spelling', prompt: 'Spell the word for something you read with pages.', answer: 'book', hint: 'It starts with "b"' },
  { type: 'spelling', prompt: 'Spell the word that means "all people".', answer: 'everyone', hint: 'It starts with "every"' },
  { type: 'spelling', prompt: 'Spell the word for the number after seven.', answer: 'eight', hint: 'It starts with "ei"' },
  { type: 'spelling', prompt: 'Spell the word for a small furry pet that purrs.', answer: 'kitten', hint: 'It starts with "ki"' },
];

const MATHS_QUESTIONS: Question[] = [
  { type: 'maths', prompt: '2 + 3 = ?', answer: '5' },
  { type: 'maths', prompt: '4 + 5 = ?', answer: '9' },
  { type: 'maths', prompt: '6 + 2 = ?', answer: '8' },
  { type: 'maths', prompt: '3 × 4 = ?', answer: '12' },
  { type: 'maths', prompt: '5 × 2 = ?', answer: '10' },
  { type: 'maths', prompt: '9 - 4 = ?', answer: '5' },
  { type: 'maths', prompt: '7 + 6 = ?', answer: '13' },
  { type: 'maths', prompt: '8 × 3 = ?', answer: '24' },
  { type: 'maths', prompt: '15 - 7 = ?', answer: '8' },
  { type: 'maths', prompt: '6 × 6 = ?', answer: '36' },
  { type: 'maths', prompt: '11 + 9 = ?', answer: '20' },
  { type: 'maths', prompt: '4 × 7 = ?', answer: '28' },
  { type: 'maths', prompt: '20 - 8 = ?', answer: '12' },
  { type: 'maths', prompt: '9 × 5 = ?', answer: '45' },
  { type: 'maths', prompt: '14 + 6 = ?', answer: '20' },
  { type: 'maths', prompt: '7 × 8 = ?', answer: '56' },
  { type: 'maths', prompt: '30 - 15 = ?', answer: '15' },
  { type: 'maths', prompt: '12 + 8 = ?', answer: '20' },
  { type: 'maths', prompt: '3 × 9 = ?', answer: '27' },
  { type: 'maths', prompt: '25 - 13 = ?', answer: '12' },
];

const GENERAL_QUESTIONS: Question[] = [
  { type: 'general', prompt: 'What planet do we live on?', answer: 'earth' },
  { type: 'general', prompt: 'How many days are in a week?', answer: '7' },
  { type: 'general', prompt: 'What colour is the sky on a sunny day?', answer: 'blue' },
  { type: 'general', prompt: 'How many legs does a spider have?', answer: '8' },
  { type: 'general', prompt: 'What is the capital of England?', answer: 'london' },
  { type: 'general', prompt: 'How many months are in a year?', answer: '12' },
  { type: 'general', prompt: 'What gas do plants breathe in?', answer: 'carbon dioxide', hint: 'Two words — we breathe it out' },
  { type: 'general', prompt: 'What is the largest ocean on Earth?', answer: 'pacific', hint: 'It starts with "P"' },
  { type: 'general', prompt: 'How many continents are there?', answer: '7' },
  { type: 'general', prompt: 'What do bees make?', answer: 'honey' },
  { type: 'general', prompt: 'What is the boiling point of water in °C?', answer: '100' },
  { type: 'general', prompt: 'Which animal is known as the King of the Jungle?', answer: 'lion' },
  { type: 'general', prompt: 'How many sides does a hexagon have?', answer: '6' },
  { type: 'general', prompt: 'What colour do you get when you mix red and blue?', answer: 'purple' },
  { type: 'general', prompt: 'How many bones does an adult human have?', answer: '206', hint: 'It is more than 200' },
  { type: 'general', prompt: 'What is the closest star to Earth?', answer: 'sun', hint: 'You can see it every day' },
  { type: 'general', prompt: 'What is the hardest natural substance?', answer: 'diamond' },
  { type: 'general', prompt: 'Which country is shaped like a boot?', answer: 'italy' },
  { type: 'general', prompt: 'How many hours are in a day?', answer: '24' },
  { type: 'general', prompt: 'What is the opposite of "north"?', answer: 'south' },
];

const BANKS: Record<QuestionType, Question[]> = {
  spelling: SPELLING_WORDS,
  maths: MATHS_QUESTIONS,
  general: GENERAL_QUESTIONS,
};

const CATEGORY_ORDER: QuestionType[] = ['maths', 'spelling', 'general'];
const MIN_SESSION_MINUTES = 15;

const TYPE_CONFIG: Record<QuestionType, { label: string; emoji: string; colour: string }> = {
  spelling: { label: 'Spelling',          emoji: '✏️', colour: 'from-purple-500 to-purple-600' },
  maths:    { label: 'Maths',             emoji: '📐', colour: 'from-blue-500 to-blue-600'   },
  general:  { label: 'General Knowledge', emoji: '🧠', colour: 'from-green-500 to-green-600' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function DailyPracticeGame({ profileId, onFinish, onClose }: DailyPracticeGameProps) {
  // ── Session state ──
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0); // seconds

  // ── Question state ──
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [input, setInput]       = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [isRetry, setIsRetry]   = useState(false);

  // ── Tracking ──
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [correctCount, setCorrectCount]   = useState(0);
  const [saved, setSaved]                 = useState(false);

  // Refs for mutable state that persists across renders
  const retryQueueRef  = useRef<Question[]>([]);
  const usedPromptsRef = useRef<Set<string>>(new Set());
  const catIndexRef    = useRef(0);
  const questionKeyRef = useRef(0); // for animation keys
  const inputRef       = useRef<HTMLInputElement>(null);

  // ── Timer ──
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;
  const timeUp = elapsed >= MIN_SESSION_MINUTES * 60;

  // ── Pick next question ──
  const pickNextQuestion = useCallback(() => {
    // Every 3rd question, try retry queue first (if it has items)
    if (retryQueueRef.current.length > 0 && totalAnswered > 0 && totalAnswered % 3 === 0) {
      const q = retryQueueRef.current.shift()!;
      setCurrentQuestion(q);
      setIsRetry(true);
      questionKeyRef.current++;
      return;
    }

    // Pick from next category in rotation
    for (let attempts = 0; attempts < 3; attempts++) {
      const cat = CATEGORY_ORDER[catIndexRef.current % CATEGORY_ORDER.length];
      catIndexRef.current++;
      const bank = BANKS[cat];
      const available = bank.filter(q => !usedPromptsRef.current.has(q.prompt));

      if (available.length > 0) {
        const q = shuffle(available)[0];
        usedPromptsRef.current.add(q.prompt);
        setCurrentQuestion({ ...q, _id: `${cat}-${questionKeyRef.current}` });
        setIsRetry(false);
        questionKeyRef.current++;
        return;
      }
    }

    // All banks exhausted — reset used prompts and try again
    usedPromptsRef.current.clear();
    const cat = CATEGORY_ORDER[catIndexRef.current % CATEGORY_ORDER.length];
    catIndexRef.current++;
    const q = shuffle(BANKS[cat])[0];
    usedPromptsRef.current.add(q.prompt);
    setCurrentQuestion({ ...q, _id: `${cat}-${questionKeyRef.current}` });
    setIsRetry(false);
    questionKeyRef.current++;
  }, [totalAnswered]);

  // ── Load first question ──
  useEffect(() => {
    pickNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Focus input ──
  useEffect(() => {
    if (feedback === 'idle') inputRef.current?.focus();
  }, [currentQuestion, feedback]);

  // ── Can session end? ──
  const canFinish = timeUp && retryQueueRef.current.length === 0;

  // ── Handlers ──
  function handleCheck() {
    if (!input.trim() || !currentQuestion) return;
    const isCorrect = input.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
    if (isCorrect) {
      setCorrectCount(c => c + 1);
    } else {
      // Add to retry queue (only if not already a retry that failed again)
      const alreadyQueued = retryQueueRef.current.some(q => q.prompt === currentQuestion.prompt);
      if (!alreadyQueued) {
        retryQueueRef.current.push(currentQuestion);
      }
    }
    setTotalAnswered(t => t + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
  }

  async function handleNext() {
    // If wrong answer was a retry and they got it right — it was already removed from retry queue by shift()
    // If wrong answer was a retry and they got it wrong again — re-add
    if (isRetry && feedback === 'wrong' && currentQuestion) {
      retryQueueRef.current.push(currentQuestion);
    }

    // Check if session can end
    const nowTimeUp = (Date.now() - startTime) >= MIN_SESSION_MINUTES * 60 * 1000;
    const retryEmpty = retryQueueRef.current.length === 0;
    const finalCorrect = correctCount; // already updated
    const finalTotal = totalAnswered;  // already updated

    if (nowTimeUp && retryEmpty) {
      // Save and finish
      if (!saved && profileId) {
        setSaved(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const today = new Date().toISOString().slice(0, 10);
          await supabase.from('daily_practice_results').upsert({
            user_id:  user.id,
            child_id: profileId,
            score:    finalCorrect,
            total:    finalTotal,
            date:     today,
          }, { onConflict: 'child_id,date' });
        }
      }
      onFinish(finalCorrect, finalTotal);
    } else {
      setInput('');
      setFeedback('idle');
      pickNextQuestion();
    }
  }

  if (!currentQuestion) return null;

  const config = TYPE_CONFIG[currentQuestion.type];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        key={questionKeyRef.current}
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
            <p className="text-white font-bold">Session in progress</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-white/90 text-sm font-bold bg-white/20 rounded-lg px-2.5 py-1">
              {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold leading-none">✕</button>
          </div>
        </div>

        {/* Progress info bar */}
        <div className="h-auto bg-gray-50 px-6 py-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-500">
            {correctCount}/{totalAnswered} correct
          </span>
          {retryQueueRef.current.length > 0 && (
            <span className="text-orange-500">
              {retryQueueRef.current.length} to revisit
            </span>
          )}
          {timeUp && retryQueueRef.current.length === 0 && (
            <span className="text-green-600">Almost done!</span>
          )}
          {!timeUp && (
            <span className="text-gray-400">
              {MIN_SESSION_MINUTES - elapsedMin} min left
            </span>
          )}
        </div>

        <div className="px-6 py-8">
          {/* Retry badge */}
          {isRetry && feedback === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center mb-4"
            >
              <p className="text-orange-600 text-sm font-bold">Let's try this one again!</p>
            </motion.div>
          )}

          {/* Question */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm font-medium mb-3">
              {currentQuestion.type === 'spelling' ? '🔊 Type the correct spelling:' : 'Type your answer:'}
            </p>
            <motion.div
              key={questionKeyRef.current}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-extrabold text-gray-800"
            >
              {currentQuestion.prompt}
            </motion.div>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type={currentQuestion.type === 'maths' ? 'number' : 'text'}
            inputMode={currentQuestion.type === 'maths' ? 'numeric' : 'text'}
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
                  Correct answer: <span className="font-extrabold text-red-700">{currentQuestion.answer}</span>
                </p>
                {currentQuestion.hint && (
                  <p className="text-red-400 text-xs mt-1">💡 Hint: {currentQuestion.hint}</p>
                )}
                <p className="text-orange-500 text-xs mt-2 font-semibold">We'll revisit this later 👀</p>
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
              {canFinish ? 'See Results 🏆' : 'Next Question →'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
