'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ProgressRow {
  subject: string;
  questions_count: number;
  last_active: string | null;
}

interface QuizRow {
  subject: string;
  score: number;
  total: number;
  attempted_at: string;
}

interface ProgressPanelProps {
  profileId: string;
  onClose: () => void;
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

export default function ProgressPanel({ profileId, onClose }: ProgressPanelProps) {
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    async function load() {
      const [{ data: prog }, { data: quiz }] = await Promise.all([
        supabase.from('progress').select('subject, questions_count, last_active').eq('profile_id', profileId).order('questions_count', { ascending: false }),
        supabase.from('quiz_attempts').select('subject, score, total, attempted_at').eq('profile_id', profileId).order('attempted_at', { ascending: false }).limit(50),
      ]);
      setProgress(prog ?? []);
      setQuizzes(quiz ?? []);
      setLoading(false);
    }
    load();
  }, [profileId]);

  const totalQuestions = progress.reduce((sum, p) => sum + p.questions_count, 0);
  const totalQuizzes = quizzes.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + (q.score / q.total) * 100, 0) / totalQuizzes)
    : null;

  const filteredQuizzes = filterSubject === 'All'
    ? quizzes
    : quizzes.filter((q) => q.subject === filterSubject);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-extrabold text-xl">My Progress 📈</h2>
            <p className="text-white/80 text-sm">Keep up the great work!</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-gray-400 font-medium">Loading your progress...</div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">💬</div>
                  <div className="text-xl font-extrabold text-blue-600">{totalQuestions}</div>
                  <div className="text-xs text-gray-500 font-medium leading-tight mt-0.5">Questions Asked</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">🧠</div>
                  <div className="text-xl font-extrabold text-blue-600">{totalQuizzes}</div>
                  <div className="text-xs text-gray-500 font-medium leading-tight mt-0.5">Quizzes Taken</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xl font-extrabold text-blue-600">{avgScore !== null ? `${avgScore}%` : '—'}</div>
                  <div className="text-xs text-gray-500 font-medium leading-tight mt-0.5">Avg Quiz Score</div>
                  {avgScore !== null && (
                    <div className="text-xs text-blue-400 font-bold mt-1">{motivationalLabel(avgScore)}</div>
                  )}
                </div>
              </div>

              {/* Subject progress */}
              <div>
                <h3 className="font-extrabold text-gray-700 mb-3">Questions by Subject</h3>
                {progress.length === 0 ? (
                  <p className="text-gray-400 text-sm">No questions asked yet — start chatting! 😊</p>
                ) : (
                  <div className="space-y-2">
                    {progress.map((p) => {
                      const max = progress[0].questions_count;
                      const pct = max > 0 ? (p.questions_count / max) * 100 : 0;
                      return (
                        <div key={p.subject}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-gray-700">
                              {SUBJECT_EMOJI[p.subject] ?? '📚'} {p.subject}
                            </span>
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
                )}
              </div>

              {/* Recent quiz attempts */}
              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <h3 className="font-extrabold text-gray-700">Recent Quizzes</h3>
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
                  <p className="text-gray-400 text-sm">
                    {quizzes.length === 0 ? 'No quizzes taken yet — try one! 🧠' : `No ${filterSubject} quizzes yet.`}
                  </p>
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
