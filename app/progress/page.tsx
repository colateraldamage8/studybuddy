'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ProgressRow {
  subject: string;
  questions_count: number;
}

interface QuizRow {
  subject: string;
  score: number;
  total: number;
  attempted_at: string;
}

const SUBJECT_EMOJI: Record<string, string> = {
  Maths: '📐', English: '📖', Spanish: '🇪🇸', Science: '🔬',
  History: '🏛️', Geography: '🌍', Coding: '💻', General: '🧠',
};

const FILTER_SUBJECTS = ['All', 'Maths', 'English', 'Spanish', 'Science', 'History', 'Geography', 'Coding', 'General'];

function motivationalLabel(avg: number): string {
  if (avg >= 90) return 'Outstanding! 🏆';
  if (avg >= 70) return 'Great job — keep going! 🌟';
  if (avg >= 50) return "You're improving! 🚀";
  return 'Aim for 70%+ 🎯';
}

export default function ProgressPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('All');
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthed(false); setLoading(false); return; }

      const { data: prof } = await supabase.from('profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!prof?.id) { setLoading(false); return; }
      setProfileId(prof.id);

      const [{ data: prog }, { data: quiz }] = await Promise.all([
        supabase.from('progress').select('subject, questions_count').eq('profile_id', prof.id).order('questions_count', { ascending: false }),
        supabase.from('quiz_attempts').select('subject, score, total, attempted_at').eq('profile_id', prof.id).order('attempted_at', { ascending: false }).limit(50),
      ]);
      setProgress(prog ?? []);
      setQuizzes(quiz ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalQuestions = progress.reduce((sum, p) => sum + p.questions_count, 0);
  const avgScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / quizzes.length)
    : null;

  const filteredQuizzes = filterSubject === 'All' ? quizzes : quizzes.filter((q) => q.subject === filterSubject);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FF' }}>
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">📈</div>
          <p className="text-gray-500 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!authed || !profileId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F8F9FF' }}>
        <div className="bg-white rounded-3xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="text-5xl mb-4">{!authed ? '🔒' : '⏳'}</div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">
            {!authed ? 'Sign in to see your progress' : 'No progress yet!'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {!authed ? 'Create a free account to track your quiz scores and questions.' : 'Start chatting with StudyBuddy to build your progress.'}
          </p>
          <button onClick={() => router.push('/')} className="bg-blue-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors">
            ← Back to StudyBuddy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FF' }}>
      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-white/80 hover:text-white text-sm font-bold transition-colors">
            ← Back
          </button>
          <h1 className="text-white font-extrabold text-xl flex-1">My Progress 📈</h1>
          <button onClick={() => router.push('/parent')} className="text-white/70 hover:text-white text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl transition-colors">
            👨‍👩‍👧 Parent View
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-xl font-extrabold text-blue-600">{totalQuestions}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Questions Asked</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-xl font-extrabold text-blue-600">{quizzes.length}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Quizzes Taken</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-xl font-extrabold text-blue-600">{avgScore !== null ? `${avgScore}%` : '—'}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">Avg Score</div>
            {avgScore !== null && <div className="text-xs text-blue-400 font-bold mt-1">{motivationalLabel(avgScore)}</div>}
          </div>
        </div>

        {/* Questions by subject */}
        {progress.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
            <h2 className="font-extrabold text-gray-700 mb-4">Questions by Subject</h2>
            <div className="space-y-3">
              {progress.map((p) => {
                const max = progress[0].questions_count;
                const pct = max > 0 ? (p.questions_count / max) * 100 : 0;
                return (
                  <div key={p.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700">{SUBJECT_EMOJI[p.subject] ?? '📚'} {p.subject}</span>
                      <span className="text-sm font-bold text-blue-500">{p.questions_count} q</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent quizzes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-extrabold text-gray-700">Recent Quizzes</h2>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-300"
            >
              {FILTER_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s === 'All' ? 'All subjects' : `${SUBJECT_EMOJI[s] ?? ''} ${s}`}</option>
              ))}
            </select>
          </div>
          {filteredQuizzes.length === 0 ? (
            <p className="text-gray-400 text-sm">{quizzes.length === 0 ? 'No quizzes yet — try one! 🧠' : `No ${filterSubject} quizzes yet.`}</p>
          ) : (
            <div className="space-y-2">
              {filteredQuizzes.map((q, i) => {
                const pct = Math.round((q.score / q.total) * 100);
                const colour = pct >= 80 ? 'text-green-600 bg-green-50' : pct >= 60 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50';
                return (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                    <div>
                      <span className="font-bold text-gray-700 text-sm">{SUBJECT_EMOJI[q.subject] ?? '📚'} {q.subject}</span>
                      <span className="text-xs text-gray-400 ml-2">{new Date(q.attempted_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    <span className={`text-sm font-extrabold px-3 py-1 rounded-lg ${colour}`}>
                      {q.score}/{q.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
