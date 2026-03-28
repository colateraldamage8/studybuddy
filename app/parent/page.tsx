'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface HWRecord {
  date: string;
  completed: boolean;
  late: boolean;
  failed: boolean;
  early: boolean;
}

interface RulesRecord {
  late_strikes: number;
  fails: number;
  gaming_block_until: string | null;
}

interface QuizRow {
  subject: string;
  score: number;
  total: number;
  attempted_at: string;
}

interface PracticeRow {
  date: string;
  score: number;
  total: number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatBlockDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const HW_STATUS: Record<string, { label: string; bg: string; text: string; emoji: string }> = {
  completed: { label: 'Done',   bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  late:      { label: 'Late',   bg: 'bg-orange-100', text: 'text-orange-700', emoji: '⚠️' },
  failed:    { label: 'Missed', bg: 'bg-red-100',    text: 'text-red-700',    emoji: '❌' },
  pending:   { label: 'Pending', bg: 'bg-gray-100',  text: 'text-gray-500',   emoji: '⏳' },
};

export default function ParentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [hwRecords, setHwRecords] = useState<HWRecord[]>([]);
  const [rules, setRules] = useState<RulesRecord | null>(null);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [practice, setPractice] = useState<PracticeRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthed(false); setLoading(false); return; }
      setEmail(user.email ?? '');

      const { data: prof } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!prof?.id) { setLoading(false); return; }
      setChildId(prof.id);

      // Last 7 days of dates
      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().slice(0, 10);
      });

      const [
        { data: hw },
        { data: rulesData },
        { data: quizData },
        { data: practiceData },
      ] = await Promise.all([
        supabase.from('homework_status').select('date, completed, late, failed, early').eq('child_id', prof.id).in('date', dates),
        supabase.from('child_rules').select('late_strikes, fails, gaming_block_until').eq('child_id', prof.id).maybeSingle(),
        supabase.from('quiz_attempts').select('subject, score, total, attempted_at').eq('profile_id', prof.id).order('attempted_at', { ascending: false }).limit(5),
        supabase.from('daily_practice_results').select('date, score, total').eq('child_id', prof.id).in('date', dates),
      ]);

      setHwRecords(hw ?? []);
      setRules(rulesData ?? null);
      setQuizzes(quizData ?? []);
      setPractice(practiceData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FF' }}>
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-3">👨‍👩‍👧</div>
          <p className="text-gray-500 font-medium">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!authed || !childId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8F9FF' }}>
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">Sign in to see the parent view</h2>
          <p className="text-gray-400 text-sm mb-6">Log in to view your child&apos;s homework and progress summary.</p>
          <button onClick={() => router.push('/')} className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors">
            ← Back to StudyBuddy
          </button>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayHw = hwRecords.find((r) => r.date === today);
  const todayPractice = practice.find((r) => r.date === today);
  const isBlocked = rules?.gaming_block_until && rules.gaming_block_until >= today;

  const avgQuiz = quizzes.length > 0
    ? Math.round(quizzes.reduce((s, q) => s + (q.score / q.total) * 100, 0) / quizzes.length)
    : null;

  // Build 7-day grid
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const hw = hwRecords.find((r) => r.date === dateStr);
    const prac = practice.find((r) => r.date === dateStr);
    const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' });
    let hwStatus: string = hw ? (hw.completed ? 'completed' : hw.late ? 'late' : hw.failed ? 'failed' : 'pending') : 'pending';
    return { dateStr, dayLabel, hwStatus, practiceScore: prac ? `${prac.score}/${prac.total}` : null };
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FF' }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white/80 hover:text-white text-sm font-bold transition-colors">
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-white font-extrabold text-xl">Parent Overview 👨‍👩‍👧</h1>
            <p className="text-white/70 text-xs mt-0.5">{email}</p>
          </div>
          <button onClick={() => router.push('/progress')} className="text-white/70 hover:text-white text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
            📈 Full Progress
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Today's snapshot */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <h2 className="font-extrabold text-gray-700 mb-3">Today</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 ${todayHw ? HW_STATUS[todayHw.completed ? 'completed' : todayHw.late ? 'late' : todayHw.failed ? 'failed' : 'pending'].bg : 'bg-gray-50'}`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Homework</p>
              {todayHw ? (
                <p className={`font-extrabold text-sm ${HW_STATUS[todayHw.completed ? 'completed' : todayHw.late ? 'late' : todayHw.failed ? 'failed' : 'pending'].text}`}>
                  {HW_STATUS[todayHw.completed ? 'completed' : todayHw.late ? 'late' : todayHw.failed ? 'failed' : 'pending'].emoji}{' '}
                  {HW_STATUS[todayHw.completed ? 'completed' : todayHw.late ? 'late' : todayHw.failed ? 'failed' : 'pending'].label}
                  {todayHw.early && ' 🌅'}
                </p>
              ) : (
                <p className="font-extrabold text-sm text-gray-400">⏳ Not yet</p>
              )}
            </div>
            <div className={`rounded-xl p-3 ${todayPractice ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Daily Practice</p>
              {todayPractice ? (
                <p className="font-extrabold text-sm text-green-700">✅ {todayPractice.score}/{todayPractice.total}</p>
              ) : (
                <p className="font-extrabold text-sm text-gray-400">⏳ Not done</p>
              )}
            </div>
          </div>
        </div>

        {/* 7-day activity grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <h2 className="font-extrabold text-gray-700 mb-3">This Week</h2>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(({ dateStr, dayLabel, hwStatus, practiceScore }) => (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400 font-medium">{dayLabel}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${hwStatus === 'completed' ? 'bg-green-100' : hwStatus === 'late' ? 'bg-orange-100' : hwStatus === 'failed' ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {hwStatus === 'completed' ? '✅' : hwStatus === 'late' ? '⚠️' : hwStatus === 'failed' ? '❌' : '·'}
                </div>
                {practiceScore ? (
                  <span className="text-xs font-bold text-blue-500">{practiceScore}</span>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-400 flex-wrap">
            <span>✅ Done</span><span>⚠️ Late</span><span>❌ Missed</span><span className="text-blue-400">score = practice</span>
          </div>
        </div>

        {/* Strikes & blocks */}
        {rules && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <h2 className="font-extrabold text-gray-700 mb-3">Homework Rules</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className={`rounded-xl p-3 ${rules.late_strikes >= 3 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Late Strikes</p>
                <p className={`text-xl font-extrabold ${rules.late_strikes >= 3 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {rules.late_strikes} / 3
                </p>
                <p className="text-xs text-gray-400 mt-0.5">3 = no gaming this weekend</p>
              </div>
              <div className={`rounded-xl p-3 ${rules.fails >= 2 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-0.5">Fails</p>
                <p className={`text-xl font-extrabold ${rules.fails >= 2 ? 'text-red-600' : 'text-gray-700'}`}>
                  {rules.fails} / 2
                </p>
                <p className="text-xs text-gray-400 mt-0.5">2 = 7-day gaming block</p>
              </div>
            </div>
            {isBlocked && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-600 font-bold">
                🎮 Gaming blocked until {formatBlockDate(rules.gaming_block_until!)}
              </div>
            )}
          </div>
        )}

        {/* Recent quiz scores */}
        {quizzes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-gray-700">Recent Quizzes</h2>
              {avgQuiz !== null && (
                <span className="text-sm font-bold text-blue-500">{avgQuiz}% avg</span>
              )}
            </div>
            <div className="space-y-2">
              {quizzes.map((q, i) => {
                const pct = Math.round((q.score / q.total) * 100);
                const colour = pct >= 80 ? 'text-green-600 bg-green-50' : pct >= 60 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50';
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                    <div>
                      <span className="font-bold text-gray-700 text-sm">{q.subject}</span>
                      <span className="text-xs text-gray-400 ml-2">{formatDate(q.attempted_at)}</span>
                    </div>
                    <span className={`text-sm font-extrabold px-2 py-0.5 rounded-lg ${colour}`}>
                      {q.score}/{q.total}
                    </span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => router.push('/progress')} className="mt-3 w-full text-center text-xs text-blue-500 font-bold hover:text-blue-700 transition-colors">
              See full progress →
            </button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          This summary is for parents and guardians. 💙
        </p>
      </div>
    </div>
  );
}
