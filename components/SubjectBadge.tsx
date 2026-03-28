'use client';

import { motion } from 'framer-motion';
import { Subject } from '@/types';
import clsx from 'clsx';

// ──────────────────────────────────────────────
//  Subject emoji map
// ──────────────────────────────────────────────

const SUBJECT_EMOJIS: Record<Subject, string> = {
  [Subject.Maths]: '📐',
  [Subject.English]: '📖',
  [Subject.Spanish]: '🇪🇸',
  [Subject.Science]: '🔬',
  [Subject.History]: '🏛️',
  [Subject.Geography]: '🌍',
  [Subject.Coding]: '💻',
  [Subject.General]: '🧠',
};

// ──────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────

interface SubjectBadgeProps {
  subject: Subject;
  isActive: boolean;
  onClick: () => void;
  /** Optional: show full label (subject name). Defaults to emoji only on mobile */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

export default function SubjectBadge({
  subject,
  isActive,
  onClick,
  showLabel = false,
  size = 'sm',
}: SubjectBadgeProps) {
  const emoji = SUBJECT_EMOJIS[subject];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      title={subject}
      aria-label={`Switch to ${subject}`}
      aria-pressed={isActive}
      className={clsx(
        // Base styles
        'inline-flex items-center gap-1 rounded-full font-semibold border transition-all duration-150 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-blue-500',

        // Size
        size === 'sm'
          ? 'px-2 py-1 text-xs'
          : 'px-3 py-1.5 text-sm',

        // Active vs inactive
        isActive
          ? 'bg-white text-blue-700 border-white shadow-md'
          : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/25 hover:text-white hover:border-white/40'
      )}
    >
      <span
        className={clsx(size === 'sm' ? 'text-sm' : 'text-base')}
        role="img"
        aria-hidden="true"
      >
        {emoji}
      </span>

      {/* Label — hidden on very small screens unless showLabel is forced */}
      <span
        className={clsx(
          showLabel ? 'inline' : 'hidden sm:inline',
          'leading-none'
        )}
      >
        {subject}
      </span>
    </motion.button>
  );
}
