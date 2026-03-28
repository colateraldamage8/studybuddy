'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import HomeworkTimer from './HomeworkTimer';
import HomeworkStatus, { HWStatus } from './HomeworkStatus';

// Module-level sets — survive re-renders and prop changes within a page session
// Key format: "childId_YYYY-MM-DD"
const _strikeApplied = new Set<string>();
const _emailApplied  = new Set<string>();

interface HomeworkSystemProps {
  profileId: string | null;
  userId: string | null | undefined;
  userEmail: string | null | undefined;
  practiceCompletedToday: boolean;
}

interface HWRecord {
  completed: boolean;
  completed_time: string | null;
  early: boolean;
  late: boolean;
  failed: boolean;
}

interface RulesRecord {
  late_strikes: number;
  fails: number;
  gaming_block_until: string | null;
}

function getNextMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString().slice(0, 10);
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function HomeworkSystem({ profileId, userId, userEmail, practiceCompletedToday }: HomeworkSystemProps) {
  const [hwRecord, setHwRecord]   = useState<HWRecord | null>(null);
  const [rules, setRules]         = useState<RulesRecord>({ late_strikes: 0, fails: 0, gaming_block_until: null });
  const [loading, setLoading]     = useState(true);
  const completionHandled         = useRef(false);
  const deadlineHandled           = useRef(false);
  const lockHandled               = useRef(false);

  const today = new Date().toISOString().slice(0, 10);

  const nowHour = new Date().getHours();
  const isPastLockNow = nowHour >= 20;

  // If it's past lock time and record is only late (not yet failed), treat as failed visually
  const status: HWStatus =
    hwRecord?.completed ? 'completed' :
    hwRecord?.failed    ? 'failed'    :
    (hwRecord?.late && isPastLockNow) ? 'failed' :
    hwRecord?.late      ? 'late'      :
    'not_started';

  // ── Fetch today's record + rules ──────────────
  useEffect(() => {
    if (!profileId || !userId) { setLoading(false); return; }
    setLoading(true);

    async function fetchData() {
      const [hwRes, rulesRes] = await Promise.all([
        supabase.from('homework_status').select('*').eq('child_id', profileId).eq('date', today).maybeSingle(),
        supabase.from('child_rules').select('*').eq('child_id', profileId).maybeSingle(),
      ]);
      const hw = hwRes.data as HWRecord | null;
      if (hw) setHwRecord(hw);
      if (rulesRes.data) setRules(rulesRes.data as RulesRecord);

      // Pre-mark refs so the timer doesn't re-trigger things already handled
      if (hw?.failed || hw?.completed) {
        deadlineHandled.current = true;
        lockHandled.current = true;
      } else if (hw?.late) {
        deadlineHandled.current = true;
      }

      // Handle opening app after deadlines (only if not already handled)
      const now = new Date();
      const isPastLock     = now.getHours() >= 20;
      const isPastDeadline = now.getHours() >= 17;

      if (!hw?.completed && !hw?.failed) {
        if (isPastLock && !lockHandled.current) {
          lockHandled.current = true;
          await doMarkFailedWithUser(profileId!, userId);
        } else if (isPastDeadline && !deadlineHandled.current) {
          deadlineHandled.current = true;
          await doMarkLateWithUser(profileId!, userId, true);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [profileId, userId]);

  // ── Mark complete when daily practice done ────
  useEffect(() => {
    if (!practiceCompletedToday || completionHandled.current || hwRecord?.completed) return;

    const now = new Date();
    const isPastLock = now.getHours() >= 20;
    if (isPastLock) return; // Too late — homework locked

    completionHandled.current = true;
    markComplete();
  }, [practiceCompletedToday, hwRecord?.completed]);

  // ── Actions ───────────────────────────────────

  async function markComplete() {
    if (!profileId || !userId) return;
    const now = new Date();
    const hour = now.getHours();
    const isEarly = hour < 16;
    const isLate  = hour >= 17;
    deadlineHandled.current = true;
    lockHandled.current = true;

    const { data } = await supabase
      .from('homework_status')
      .upsert({ user_id: userId, child_id: profileId, date: today, completed: true, completed_time: now.toISOString(), early: isEarly, late: isLate, failed: false }, { onConflict: 'child_id,date' })
      .select().single();

    if (data) setHwRecord(data as HWRecord);
    if (isLate) await updateStrikes(3, 0);
  }

  async function doMarkLateWithUser(pid: string, uid: string | null | undefined, sendEmail: boolean) {
    if (!pid || !uid) return;

    const { data } = await supabase
      .from('homework_status')
      .upsert({ user_id: uid, child_id: pid, date: today, completed: false, completed_time: null, late: true, failed: false }, { onConflict: 'child_id,date' })
      .select().single();
    if (data) setHwRecord(data as HWRecord);

    const emailKey = `${pid}_${today}`;
    const alreadySent = _emailApplied.has(emailKey) ||
      (typeof window !== 'undefined' && localStorage.getItem(`hw_email_${emailKey}`) === '1');

    if (!alreadySent && sendEmail && userEmail) {
      _emailApplied.add(emailKey);
      if (typeof window !== 'undefined') localStorage.setItem(`hw_email_${emailKey}`, '1');
      fetch('/api/notify-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentEmail: userEmail }),
      }).catch(() => {});
    }
  }

  async function doMarkFailedWithUser(pid: string, uid: string | null | undefined) {
    if (!pid || !uid) return;

    // Three-layer guard: module Set (survives re-renders) + localStorage (survives remounts) + DB check
    const strikeKey = `${pid}_${today}`;
    if (_strikeApplied.has(strikeKey)) return;

    const lsKey = `hw_fail_${strikeKey}`;
    if (typeof window !== 'undefined' && localStorage.getItem(lsKey) === '1') return;

    const { data: existing } = await supabase
      .from('homework_status').select('failed').eq('child_id', pid).eq('date', today).maybeSingle();
    if (existing?.failed === true) return;

    // Mark all guards immediately before any async work
    _strikeApplied.add(strikeKey);
    if (typeof window !== 'undefined') localStorage.setItem(lsKey, '1');

    const { data } = await supabase
      .from('homework_status')
      .upsert({ user_id: uid, child_id: pid, date: today, completed: false, completed_time: null, late: false, failed: true }, { onConflict: 'child_id,date' })
      .select().single();
    if (data) setHwRecord(data as HWRecord);

    await updateStrikes(0, 1);
  }

  async function handleDeadlineReached() {
    if (deadlineHandled.current) return;
    deadlineHandled.current = true;
    await doMarkLateWithUser(profileId!, userId, true);
  }

  async function handleLockReached() {
    if (lockHandled.current) return;
    lockHandled.current = true;
    await doMarkFailedWithUser(profileId!, userId);
  }

  async function updateStrikes(lateAdd: number, failAdd: number) {
    if (!profileId || !userId) return;

    // Re-fetch current rules to avoid stale state
    const { data: current } = await supabase.from('child_rules').select('*').eq('child_id', profileId).maybeSingle();
    const base = (current as RulesRecord | null) ?? { late_strikes: 0, fails: 0, gaming_block_until: null };

    const newLate  = base.late_strikes + lateAdd;
    const newFails = base.fails + failAdd;

    let blockUntil = base.gaming_block_until;
    if (newFails >= 2) {
      blockUntil = addDays(7);
    } else if (newLate >= 3) {
      blockUntil = getNextMonday();
    }

    const { data } = await supabase
      .from('child_rules')
      .upsert({ child_id: profileId, user_id: userId, late_strikes: newLate, fails: newFails, gaming_block_until: blockUntil, updated_at: new Date().toISOString() }, { onConflict: 'child_id' })
      .select().single();

    if (data) setRules(data as RulesRecord);
  }

  // ── Render ────────────────────────────────────
  if (!profileId || loading) return null;

  // Collapsed state before homework is available (before 9am)
  if (nowHour < 9 && !hwRecord?.completed && !hwRecord?.failed) {
    const next9am = new Date();
    next9am.setHours(9, 0, 0, 0);
    if (next9am <= new Date()) next9am.setDate(next9am.getDate() + 1);
    const diffMs = next9am.getTime() - new Date().getTime();
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return (
      <div className="w-full max-w-md mt-4">
        <div className="bg-white rounded-2xl border-2 border-gray-100 px-5 py-3 shadow-sm text-center">
          <p className="text-gray-400 text-sm font-semibold">⏰ Homework unlocks in {timeStr}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mt-4">
      <div className="bg-white rounded-2xl border-2 border-gray-100 px-5 py-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-extrabold text-gray-700 text-sm uppercase tracking-wide">📋 Daily Homework</p>
          {!loading && (
            <HomeworkTimer
              completed={status === 'completed'}
              failed={status === 'failed'}
              onDeadlineReached={handleDeadlineReached}
              onLockReached={handleLockReached}
            />
          )}
        </div>

        {/* Late warning — only show when still completable (before 8pm lock) */}
        {status === 'late' && !isPastLockNow && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-3">
            <p className="text-orange-700 font-bold text-xs">
              ⚠️ You are late! Completing now will count as 3 late strikes.
            </p>
          </div>
        )}

        {/* Status */}
        <HomeworkStatus
          status={status}
          lateStrikes={rules.late_strikes}
          fails={rules.fails}
          gamingBlockUntil={rules.gaming_block_until}
          early={hwRecord?.early}
        />

        {/* Hint */}
        {status === 'not_started' && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Complete the Daily Practice ⭐ above to finish today's homework
          </p>
        )}
        {(status === 'failed' || (hwRecord?.late && isPastLockNow)) && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Homework time has passed for today. Try again tomorrow!
          </p>
        )}
      </div>
    </div>
  );
}
