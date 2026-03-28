'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject, Message, StudentProfile, OnboardingStep } from '@/types';
import AgeSelector from './AgeSelector';
import SubjectPicker from './SubjectPicker';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import SubjectBadge from './SubjectBadge';
import Quiz from './Quiz';
import AuthModal from './AuthModal';
import SpellingMode from './SpellingMode';
import TimesTablesMode from './TimesTablesMode';
import SpanishMode from './SpanishMode';
import DailyPractice from './DailyPractice';
import DailyPracticeGame from './DailyPracticeGame';
import DailyPracticeResult from './DailyPracticeResult';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/supabase';
import { AgeRange } from '@/types';

// ──────────────────────────────────────────────
//  Subject emoji map (used in header + welcome)
// ──────────────────────────────────────────────

const SUBJECT_EMOJIS: Record<Subject, string> = {
  [Subject.Maths]:     '📐',
  [Subject.English]:   '📖',
  [Subject.Spanish]:   '🇪🇸',
  [Subject.Science]:   '🔬',
  [Subject.History]:   '🏛️',
  [Subject.Geography]: '🌍',
  [Subject.Coding]:    '💻',
  [Subject.General]:   '🧠',
};

// ──────────────────────────────────────────────
//  Helper: generate a simple unique ID
// ──────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ──────────────────────────────────────────────
//  Welcome message per subject
// ──────────────────────────────────────────────

function getWelcomeMessage(profile: StudentProfile): string {
  const emoji = SUBJECT_EMOJIS[profile.subject] ?? '📚';

  return `Hi there! I'm StudyBuddy, your homework helper! ${emoji}

I'm here to help you with **${profile.subject}** today. I won't just give you the answers — instead, I'll guide you through problems step by step so you really understand them. That's how your brain gets stronger!

What are you working on? Tell me your question and we'll tackle it together! 🌟`;
}

// ──────────────────────────────────────────────
//  Main ChatApp Component
// ──────────────────────────────────────────────

export default function ChatApp() {
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);
  const [step, setStep] = useState<OnboardingStep>('age');
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [selectedAge, setSelectedAge] = useState<AgeRange | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSpelling, setShowSpelling] = useState(false);
  const [showTimesTables, setShowTimesTables] = useState(false);
  const [showSpanish, setShowSpanish] = useState(false);
  const [showDailyGame, setShowDailyGame] = useState(false);
  const [dailyResult, setDailyResult] = useState<{ score: number; total: number } | null>(null);
  const [showSubjectSwitcher, setShowSubjectSwitcher] = useState(false);
  const handleShowProgress = useCallback(() => router.push('/progress'), [router]);
  const [user, setUser] = useState<User | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── Auth listener ─────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Restore age + subject from localStorage on mount ──
  useEffect(() => {
    const savedAge = localStorage.getItem('ageGroup');
    const savedSubject = localStorage.getItem('subject');

    if (savedAge && savedSubject) {
      const ageRange: AgeRange = JSON.parse(savedAge);
      const subject = savedSubject as Subject;
      setSelectedAge(ageRange);
      const restoredProfile: StudentProfile = {
        age: ageRange.representativeAge,
        yearGroup: ageRange.yearGroup,
        subject,
      };
      setProfile(restoredProfile);
      setMessages([{
        id: generateId(),
        role: 'assistant',
        content: getWelcomeMessage(restoredProfile),
        timestamp: new Date().toISOString(),
      }]);
      setStep('home');
    } else if (savedAge) {
      const ageRange: AgeRange = JSON.parse(savedAge);
      setSelectedAge(ageRange);
      setStep('subject');
    }

    setInitialized(true);
  }, []);

  // ── Ensure DB profile exists when user + student profile set ──
  useEffect(() => {
    if (!user || !profile) return;
    async function ensureProfile() {
      // Use maybeSingle() so it returns null (not an error) when no row exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing?.id) {
        setProfileId(existing.id);
        return;
      }

      // No profile yet — create one
      console.log('[StudyBuddy] Creating profile for user:', user!.id);
      const { data: created, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user!.id,
          age: profile!.age,
          year_group: profile!.yearGroup,
          display_name: user!.email,
        })
        .select('id')
        .single();

      if (created?.id) {
        console.log('[StudyBuddy] Profile created:', created.id);
        setProfileId(created.id);
      } else if (error) {
        console.error('[StudyBuddy] Profile create error:', error.message, error.code);
      }
    }
    ensureProfile();
  }, [user, profile]);

  // ── Create a new session when profileId + subject are ready ──
  useEffect(() => {
    if (!profileId || !profile) return;
    async function createSession() {
      const { data } = await supabase
        .from('sessions')
        .insert({ profile_id: profileId, subject: profile!.subject })
        .select('id')
        .single();
      if (data) setSessionId(data.id);
    }
    createSession();
  }, [profileId, profile?.subject]);

  async function saveMessage(role: 'user' | 'assistant', content: string) {
    if (!sessionId) return;
    await supabase.from('messages').insert({ session_id: sessionId, role, content });
  }

  async function saveQuizResult(score: number, total: number) {
    if (!profileId || !profile) return;
    await supabase.from('quiz_attempts').insert({ profile_id: profileId, subject: profile.subject, score, total });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    localStorage.removeItem('ageGroup');
    localStorage.removeItem('subject');
    setUser(null);
    setProfileId(null);
    setSessionId(null);
    setStep('age');
    setProfile(null);
    setSelectedAge(null);
    setMessages([]);
    setError(null);
  }

  // ── Step 1: Age selected ──────────────────────
  const handleAgeSelect = useCallback((ageRange: AgeRange) => {
    localStorage.setItem('ageGroup', JSON.stringify(ageRange));
    setSelectedAge(ageRange);
    setStep('subject');
  }, []);

  // ── Step 2: Subject selected → enter chat ─────
  const handleSubjectSelect = useCallback(
    (subject: Subject) => {
      if (!selectedAge) return;
      localStorage.setItem('subject', subject);

      const newProfile: StudentProfile = {
        age: selectedAge.representativeAge,
        yearGroup: selectedAge.yearGroup,
        subject,
      };

      setProfile(newProfile);

      // Add the initial welcome message from StudyBuddy
      const welcomeMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: getWelcomeMessage(newProfile),
        timestamp: new Date().toISOString(),
      };

      setMessages([welcomeMsg]);
      setStep('home');
    },
    [selectedAge]
  );

  // ── Switch subject mid-conversation ───────────
  const handleSubjectChange = useCallback(
    (newSubject: Subject) => {
      if (!profile || newSubject === profile.subject) return;
      localStorage.setItem('subject', newSubject);
      setShowSubjectSwitcher(false);
      const updatedProfile: StudentProfile = { ...profile, subject: newSubject };
      setProfile(updatedProfile);

      const switchMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Great — let's switch to **${newSubject}**! ${newSubject === Subject.Maths ? '📐' : newSubject === Subject.English ? '📖' : newSubject === Subject.Science ? '🔬' : newSubject === Subject.History ? '🏛️' : newSubject === Subject.Geography ? '🌍' : newSubject === Subject.Coding ? '💻' : '🧠'}\n\nWhat are you working on in ${newSubject}?`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, switchMsg]);
    },
    [profile]
  );

  // ── Reset to start ────────────────────────────
  const handleReset = useCallback(() => {
    localStorage.removeItem('ageGroup');
    localStorage.removeItem('subject');
    setStep('age');
    setProfile(null);
    setSelectedAge(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  // ── Send a message ────────────────────────────
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!profile || !content.trim() || isLoading) return;

      setError(null);

      // Append the user message immediately
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);

      // Placeholder for the assistant response (streaming)
      const assistantId = generateId();
      const assistantPlaceholder: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantPlaceholder]);

      // Save user message to DB
      saveMessage('user', content.trim());

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            age: profile.age,
            yearGroup: profile.yearGroup,
            subject: profile.subject,
          }),
        });

        if (!response.ok) {
          let errorMsg = 'Something went wrong. Please try again.';
          try {
            const errorData = await response.json();
            errorMsg = errorData.error ?? errorMsg;
          } catch {
            // ignore JSON parse error
          }
          throw new Error(errorMsg);
        }

        if (!response.body) {
          throw new Error('No response body received.');
        }

        // ── Stream the response ────────────────
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update the assistant message with accumulated text
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }

        // Final update (flush any remaining decoder state)
        const remaining = decoder.decode();
        if (remaining) {
          accumulated += remaining;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            )
          );
        }

        // Save assistant message to DB
        if (accumulated) saveMessage('assistant', accumulated);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Something went wrong. Please try again.';

        setError(errorMessage);

        // Replace the placeholder with an error message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Oops! Something went wrong on my end. Please try asking again! 😊",
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [profile, messages, isLoading]
  );

  // ──────────────────────────────────────────────
  //  Guard: don't render until localStorage is read
  // ──────────────────────────────────────────────

  if (!initialized) return null;

  // ──────────────────────────────────────────────
  //  Render: Onboarding — Age selection
  // ──────────────────────────────────────────────

  if (step === 'age') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo / Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500">
              StudyBuddy!
            </span>
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Your friendly AI homework helper 📚
          </p>
        </motion.div>

        {/* Age Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <AgeSelector onSelect={handleAgeSelect} />
        </motion.div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  //  Render: Onboarding — Subject selection
  // ──────────────────────────────────────────────

  if (step === 'subject') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-3">📚</div>
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
            What are you studying?
          </h2>
          <p className="text-gray-500 font-medium">
            Pick a subject and let&apos;s get started!
          </p>

          {/* Back button */}
          <button
            onClick={() => setStep('age')}
            className="mt-4 text-sm text-blue-500 hover:text-blue-700 font-semibold transition-colors"
          >
            ← Change age group
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="w-full max-w-2xl"
        >
          <SubjectPicker onSelect={handleSubjectSelect} />
        </motion.div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  //  Render: Home dashboard
  // ──────────────────────────────────────────────

  if (step === 'home' && profile) {
    return (
      <>
        {showDailyGame && (
          <DailyPracticeGame
            profileId={profileId}
            onFinish={(score, total) => {
              setShowDailyGame(false);
              setDailyResult({ score, total });
            }}
            onClose={() => setShowDailyGame(false)}
          />
        )}
        {dailyResult && (
          <DailyPracticeResult
            score={dailyResult.score}
            total={dailyResult.total}
            onClose={() => setDailyResult(null)}
          />
        )}
        <DailyPractice
          profile={profile}
          user={user}
          profileId={profileId}
          onContinueLearning={() => setStep('complete')}
          onChangeSubject={() => setStep('subject')}
          onShowProgress={handleShowProgress}
          onShowDailyGame={() => setShowDailyGame(true)}
          onSignIn={() => setShowAuth(true)}
          onSignOut={handleSignOut}
        />
        {showAuth && (
          <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
        )}
      </>
    );
  }

  // ──────────────────────────────────────────────
  //  Render: Chat interface
  // ──────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F9FF' }}>
      {/* ── Modals ── */}
      {showQuiz && profile && (
        <Quiz profile={profile} onClose={() => setShowQuiz(false)} onComplete={saveQuizResult} />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />
      )}
      {showSpelling && (
        <SpellingMode profileId={profileId} onClose={() => setShowSpelling(false)} />
      )}
      {showTimesTables && (
        <TimesTablesMode profileId={profileId} onClose={() => setShowTimesTables(false)} />
      )}
      {showSpanish && (
        <SpanishMode profileId={profileId} onClose={() => setShowSpanish(false)} />
      )}


      {/* ── Header ── */}
      <header className="header-gradient shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            title="Start over"
          >
            <span className="text-2xl">🤖</span>
            <span className="text-white font-extrabold text-xl tracking-tight">
              StudyBuddy
            </span>
          </button>

          {/* Action buttons */}
          {profile && (
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button onClick={() => setStep('home')} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap">
                🏠 Home
              </button>
              {/* Subject switcher button — shows active subject */}
              <button
                onClick={() => setShowSubjectSwitcher((v) => !v)}
                className={`font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap text-white ${showSubjectSwitcher ? 'bg-white/40' : 'bg-white/20 hover:bg-white/30'}`}
              >
                {SUBJECT_EMOJIS[profile.subject]} {profile.subject}
              </button>
              <button onClick={() => setShowQuiz(true)} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap">
                🧠 Quiz
              </button>
              {user ? (
                <>
                  <button onClick={handleShowProgress} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap">
                    📈 Progress
                  </button>
                  <button onClick={handleSignOut} className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap">
                    Sign Out
                  </button>
                </>
              ) : (
                <button onClick={() => setShowAuth(true)} className="bg-white text-blue-600 font-bold px-3 py-1.5 rounded-xl text-sm transition-colors whitespace-nowrap shadow-sm hover:bg-blue-50">
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── Subject switcher panel ── */}
      <AnimatePresence>
        {profile && showSubjectSwitcher && (
          <motion.div
            key="subject-switcher"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white border-b border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="max-w-3xl mx-auto px-4 py-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Switch Subject</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(Subject).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSubjectChange(s)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      profile.subject === s
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {SUBJECT_EMOJIS[s]} {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── English sub-topics bar ── */}
      {profile?.subject === Subject.English && (
        <div className="relative bg-white border-b border-gray-100 shadow-sm overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap mr-1">{profile.subject}:</span>
              {[
                { label: 'Reading', emoji: '📖' },
                { label: 'Grammar', emoji: '✏️' },
                { label: 'Writing', emoji: '📝' },
                { label: 'Comprehension', emoji: '🔍' },
              ].map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleSendMessage(`I need help with ${topic.label.toLowerCase()} in English.`)}
                  className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  {topic.emoji} {topic.label}
                </button>
              ))}
              <button
                onClick={() => setShowSpelling(true)}
                className="whitespace-nowrap bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
              >
                ✏️ Spelling Practice
              </button>
              <div className="w-16 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      )}

      {/* ── Maths sub-topics bar ── */}
      {profile?.subject === Subject.Maths && (
        <div className="relative bg-white border-b border-gray-100 shadow-sm overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap mr-1">{profile.subject}:</span>
              {[
                { label: 'Addition',      emoji: '➕' },
                { label: 'Subtraction',   emoji: '➖' },
                { label: 'Fractions',     emoji: '½' },
                { label: 'Word Problems', emoji: '📝' },
                { label: 'Shapes',        emoji: '🔷' },
              ].map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleSendMessage(`I need help with ${topic.label.toLowerCase()} in Maths.`)}
                  className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                >
                  {topic.emoji} {topic.label}
                </button>
              ))}
              <button
                onClick={() => setShowTimesTables(true)}
                className="whitespace-nowrap bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
              >
                📐 Times Tables
              </button>
              <div className="w-16 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      )}

      {/* ── Spanish sub-topics bar ── */}
      {profile?.subject === Subject.Spanish && (
        <div className="relative bg-white border-b border-gray-100 shadow-sm overflow-hidden">
          <div className="max-w-3xl mx-auto px-4 py-2">
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap mr-1">{profile.subject}:</span>
              {[
                { label: 'Vocabulary', emoji: '📝' },
                { label: 'Numbers',    emoji: '🔢' },
                { label: 'Phrases',    emoji: '💬' },
                { label: 'Colours',    emoji: '🎨' },
                { label: 'Animals',    emoji: '🐾' },
              ].map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleSendMessage(`Teach me Spanish ${topic.label.toLowerCase()}.`)}
                  className="whitespace-nowrap bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm px-3 py-1.5 rounded-xl border border-red-200 transition-colors"
                >
                  {topic.emoji} {topic.label}
                </button>
              ))}
              <button
                onClick={() => setShowSpanish(true)}
                className="whitespace-nowrap bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
              >
                🇪🇸 Practice
              </button>
              <div className="w-16 flex-shrink-0" aria-hidden="true" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10 bg-gradient-to-l from-white to-transparent" />
        </div>
      )}

      {/* ── Chat area ── */}
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4 pb-8">
        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between"
            >
              <span>⚠️ {error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-400 hover:text-red-600 font-bold"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1">
          <ChatWindow messages={messages} isLoading={isLoading} />
        </div>

        {/* Input */}
        <div className="mt-3">
          <MessageInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            disabled={!profile}
          />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-2 pb-6">
          StudyBuddy guides you — it won&apos;t do your homework for you! 🌟
        </p>
      </main>
    </div>
  );
}
