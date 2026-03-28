'use client';

import { useState } from 'react';

export type HWStatus = 'not_started' | 'completed' | 'late' | 'failed';

interface HomeworkStatusProps {
  status: HWStatus;
  lateStrikes: number;
  fails: number;
  gamingBlockUntil: string | null;
  early?: boolean;
}

const STATUS_CONFIG: Record<HWStatus, { label: string; emoji: string; colour: string; bg: string; border: string }> = {
  not_started: { label: 'Not started',    emoji: '📚', colour: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200'   },
  completed:   { label: 'Completed',      emoji: '✅', colour: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200'  },
  late:        { label: 'Late',           emoji: '⚠️', colour: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-200' },
  failed:      { label: 'Not completed',  emoji: '❌', colour: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200'    },
};

function formatBlockDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

export default function HomeworkStatus({ status, lateStrikes, fails, gamingBlockUntil, early }: HomeworkStatusProps) {
  const [showBlockReason, setShowBlockReason] = useState(false);
  const cfg = STATUS_CONFIG[status];
  const today = new Date().toISOString().slice(0, 10);
  const isBlocked = gamingBlockUntil && gamingBlockUntil >= today;

  // Determine why gaming was blocked
  const blockReason = fails >= 2
    ? 'Blocked because 2 homework days were missed.'
    : lateStrikes >= 3
      ? 'Blocked because homework was submitted late 3 times.'
      : 'Gaming has been blocked due to incomplete homework.';

  return (
    <div className={`rounded-xl border-2 ${cfg.bg} ${cfg.border} px-4 py-3`}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
        <span className={`font-extrabold text-sm ${cfg.colour}`}>{cfg.emoji} {cfg.label}</span>
        <div className="flex gap-1 items-center flex-wrap">
          {early && status === 'completed' && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
              🌅 Early Bird!
            </span>
          )}
          {isBlocked && (
            <button
              onClick={() => setShowBlockReason((v) => !v)}
              className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full hover:bg-red-200 transition-colors"
            >
              🎮 Gaming blocked until {formatBlockDate(gamingBlockUntil!)} {showBlockReason ? '▴' : '▾'}
            </button>
          )}
        </div>
      </div>

      {/* Expandable block reason */}
      {isBlocked && showBlockReason && (
        <div className="mb-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600 font-medium">
          {blockReason}
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
        {/* Late strikes with tooltip */}
        <span className="relative group cursor-default select-none">
          ⚠️ Late strikes:{' '}
          <strong className={lateStrikes >= 3 ? 'text-orange-600' : 'text-gray-700'}>{lateStrikes}</strong>
          {' '}/ 3{' '}
          <span className="text-gray-300 text-xs">ⓘ</span>
          <span className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-56 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 font-normal z-20 leading-relaxed shadow-xl pointer-events-none">
            Homework finished after 5pm. 3 late strikes = no gaming this weekend!
          </span>
        </span>

        {/* Fails with tooltip */}
        <span className="relative group cursor-default select-none">
          ❌ Fails:{' '}
          <strong className={fails >= 2 ? 'text-red-600' : 'text-gray-700'}>{fails}</strong>
          {' '}/ 2{' '}
          <span className="text-gray-300 text-xs">ⓘ</span>
          <span className="absolute hidden group-hover:block bottom-full left-0 mb-2 w-56 bg-gray-800 text-white text-xs rounded-xl px-3 py-2 font-normal z-20 leading-relaxed shadow-xl pointer-events-none">
            Missed homework days. 2 fails = no gaming for 1 week.
          </span>
        </span>
      </div>
    </div>
  );
}
