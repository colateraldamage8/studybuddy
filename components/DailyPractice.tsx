'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { StudentProfile, Subject } from '@/types';
import type { User } from '@/lib/supabase';
import HomeworkSystem from './HomeworkSystem';

interface DailyPracticeProps {
  profile: StudentProfile;
  user: User | null;
  profileId: string | null;
  onContinueLearning: () => void;
  onChangeSubject: () => void;
  onShowProgress: () => void;
  onShowDailyGame: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

const SUBJECT_EMOJI: Record<Subject, string> = {
  [Subject.Maths]:     '📐',
  [Subject.English]:   '📖',
  [Subject.Spanish]:   '🇪🇸',
  [Subject.Science]:   '🔬',
  [Subject.History]:   '🏛️',
  [Subject.Geography]: '🌍',
  [Subject.Coding]:    '💻',
  [Subject.General]:   '🧠',
};

const GREETINGS = ['Great to see you!', 'Ready to learn?', 'You\'re doing brilliantly!', 'Let\'s learn something new!'];

export default function DailyPractice({
  profile, user, profileId,
  onContinueLearning, onChangeSubject, onShowProgress, onShowDailyGame, onSignIn, onSignOut,
}: DailyPracticeProps) {
  const [doneToday, setDoneToday] = useState<boolean | null>(null); // null = loading
  const [todayScore, setTodayScore] = useState<{ score: number; total: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const greeting = GREETINGS[new Date().getDay() % GREETINGS.length];

  useEffect(() => {
    if (!profileId) { setDoneToday(false); return; }
    async function checkToday() {
      const today = new Date().toISOString().slice(0, 10);

      // Check today's result
      const { data } = await supabase
        .from('daily_practice_results')
        .select('score, total')
        .eq('child_id', profileId)
        .eq('date', today)
        .maybeSingle();
      if (data) { setDoneToday(true); setTodayScore({ score: data.score, total: data.total }); }
      else setDoneToday(false);

      // Compute streak from last 30 days
      const { data: recent } = await supabase
        .from('daily_practice_results')
        .select('date')
        .eq('child_id', profileId)
        .order('date', { ascending: false })
        .limit(30);

      if (recent && recent.length > 0) {
        const dateSet = new Set(recent.map((r: { date: string }) => r.date));
        let count = 0;
        const cursor = new Date();
        // If today not done yet, start counting from yesterday
        if (!dateSet.has(today)) cursor.setDate(cursor.getDate() - 1);
        while (true) {
          const d = cursor.toISOString().slice(0, 10);
          if (dateSet.has(d)) { count++; cursor.setDate(cursor.getDate() - 1); }
          else break;
        }
        setStreak(count);
      }
    }
    checkToday();
  }, [profileId]);

  const actions = [
    {
      id: 'daily',
      emoji: '⭐',
      label: doneToday ? 'Daily Practice ✅' : 'Daily Practice ⭐',
      sub: doneToday
        ? todayScore ? `${todayScore.score}/${todayScore.total} today — come back tomorrow!` : 'Completed today!'
        : '15-minute session · Spelling, Maths & General',
      onClick: doneToday ? undefined : onShowDailyGame,
      disabled: doneToday === null || doneToday,
      style: doneToday
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg hover:shadow-blue-200',
      labelStyle: doneToday ? 'text-green-700' : 'text-white',
      subStyle: doneToday ? 'text-green-500' : 'text-white/80',
      emojiStyle: '',
    },
    {
      id: 'learn',
      emoji: SUBJECT_EMOJI[profile.subject],
      label: `Continue ${profile.subject}`,
      sub: 'Chat with StudyBuddy about your homework',
      onClick: onContinueLearning,
      disabled: false,
      style: 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md',
      labelStyle: 'text-gray-800',
      subStyle: 'text-gray-400',
      emojiStyle: '',
    },
    {
      id: 'subjects',
      emoji: '📚',
      label: 'Change Subject',
      sub: 'Switch to a different topic',
      onClick: onChangeSubject,
      disabled: false,
      style: 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md',
      labelStyle: 'text-gray-800',
      subStyle: 'text-gray-400',
      emojiStyle: '',
    },
    {
      id: 'progress',
      emoji: '📈',
      label: 'My Progress',
      sub: user ? 'View your questions and quiz scores' : 'Sign in to track your progress',
      onClick: user ? onShowProgress : onSignIn,
      disabled: false,
      style: 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md',
      labelStyle: 'text-gray-800',
      subStyle: 'text-gray-400',
      emojiStyle: '',
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#F8F9FF' }}>

      {/* Top-right sign out button */}
      {user && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm hover:border-red-200 hover:text-red-500 transition-colors"
          >
            <span className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm">
              {user.email?.[0]?.toUpperCase() ?? '?'}
            </span>
            <span className="text-xs font-bold text-gray-500 hover:text-red-500">Sign Out</span>
          </button>
        </div>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 w-full max-w-md"
      >
        <div className="text-5xl mb-3">🤖</div>
        <h1 className="text-3xl font-extrabold text-gray-800 mb-1">
          Hello! {greeting}
        </h1>
        <p className="text-gray-400 font-medium text-sm">
          {profile.yearGroup} · {profile.subject}
        </p>

        {/* Streak badge */}
        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-1.5 mt-3 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 text-sm font-bold text-orange-600"
          >
            🔥 {streak} day{streak === 1 ? '' : 's'} in a row!
          </motion.div>
        )}

      </motion.div>

      {/* Action cards */}
      <div className="w-full max-w-md space-y-3">
        {actions.map((a, i) => (
          <motion.button
            key={a.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            onClick={a.disabled ? undefined : a.onClick}
            disabled={a.disabled}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-left
              ${a.disabled ? 'cursor-default opacity-90' : 'cursor-pointer'}
              ${a.style}`}
          >
            <span className="text-3xl shrink-0">{a.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className={`font-extrabold text-base leading-snug ${a.labelStyle}`}>{a.label}</p>
              <p className={`text-sm mt-0.5 leading-snug ${a.subStyle}`}>{a.sub}</p>
            </div>
            {!a.disabled && (
              <span className={`text-xl opacity-50 shrink-0 ${a.labelStyle}`}>›</span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Homework System */}
      <HomeworkSystem
        profileId={profileId}
        userId={user?.id}
        userEmail={user?.email}
        practiceCompletedToday={doneToday === true}
      />

      {/* Sign in nudge */}
      {!user && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-xs text-gray-400 text-center"
        >
          <button onClick={onSignIn} className="text-blue-500 font-bold hover:text-blue-700">Sign in</button>
          {' '}to save your progress and track daily practice.
        </motion.p>
      )}
    </div>
  );
}
