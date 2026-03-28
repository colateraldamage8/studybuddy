'use client';

import { motion } from 'framer-motion';
import { AgeRange } from '@/types';

// ──────────────────────────────────────────────
//  Age range data
// ──────────────────────────────────────────────

const AGE_RANGES: AgeRange[] = [
  {
    label: '6–7',
    minAge: 6,
    maxAge: 7,
    representativeAge: 6,
    yearGroup: 'Y1-2',
    keyStage: 'KS1',
    emoji: '🐣',
    bgColour: 'bg-emerald-50',
    borderColour: 'border-emerald-200',
    accentColour: 'text-emerald-600',
  },
  {
    label: '8–9',
    minAge: 8,
    maxAge: 9,
    representativeAge: 8,
    yearGroup: 'Y3-4',
    keyStage: 'KS2',
    emoji: '🚀',
    bgColour: 'bg-sky-50',
    borderColour: 'border-sky-200',
    accentColour: 'text-sky-600',
  },
  {
    label: '10–11',
    minAge: 10,
    maxAge: 11,
    representativeAge: 10,
    yearGroup: 'Y5-6',
    keyStage: 'KS2',
    emoji: '🧠',
    bgColour: 'bg-violet-50',
    borderColour: 'border-violet-200',
    accentColour: 'text-violet-600',
  },
  {
    label: '12–13',
    minAge: 12,
    maxAge: 13,
    representativeAge: 12,
    yearGroup: 'Y7-8',
    keyStage: 'KS3',
    emoji: '⚡',
    bgColour: 'bg-orange-50',
    borderColour: 'border-orange-200',
    accentColour: 'text-orange-500',
  },
  {
    label: '14–16',
    minAge: 14,
    maxAge: 16,
    representativeAge: 15,
    yearGroup: 'Y9-11',
    keyStage: 'KS4 / GCSE',
    emoji: '🎓',
    bgColour: 'bg-rose-50',
    borderColour: 'border-rose-200',
    accentColour: 'text-rose-500',
  },
];

// ──────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────

interface AgeSelectorProps {
  onSelect: (ageRange: AgeRange) => void;
}

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

export default function AgeSelector({ onSelect }: AgeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
        How old are you?
      </h2>
      <p className="text-center text-gray-500 font-medium mb-8">
        Pick your age group so I can explain things in just the right way! 😊
      </p>

      <div className="grid grid-cols-2 gap-4">
        {AGE_RANGES.map((range, index) => (
          <motion.button
            key={range.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(74,144,217,0.2)' }}
            whileTap={{ y: -1, scale: 0.98 }}
            onClick={() => onSelect(range)}
            className={`${index === AGE_RANGES.length - 1 ? 'col-span-2 max-w-xs mx-auto w-full' : ''}
              age-card
              relative flex flex-col items-center justify-center
              p-6 rounded-2xl border-2
              ${range.bgColour} ${range.borderColour}
              cursor-pointer
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
              transition-all duration-150
              text-center
            `}
          >
            {/* Emoji */}
            <span className="text-5xl mb-3 select-none" role="img" aria-hidden="true">
              {range.emoji}
            </span>

            {/* Age label */}
            <span className="text-3xl font-extrabold text-gray-800 mb-1">
              {range.label}
            </span>

            {/* Year group */}
            <span className={`text-base font-bold ${range.accentColour} mb-1`}>
              {range.yearGroup}
            </span>

            {/* Key stage */}
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {range.keyStage}
            </span>

            {/* Hover arrow indicator */}
            <motion.span
              className={`absolute bottom-3 right-4 text-lg ${range.accentColour} opacity-0`}
              whileHover={{ opacity: 1 }}
            >
              →
            </motion.span>
          </motion.button>
        ))}
      </div>

      {/* Under-6 note */}
      <p className="text-center text-xs text-gray-400 mt-6">
        StudyBuddy is designed for children aged 6–16.
        <br />
        Always use with a parent or carer if you&apos;re younger. 💙
      </p>
    </div>
  );
}

export { AGE_RANGES };
