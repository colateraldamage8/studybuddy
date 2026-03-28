'use client';

import { motion } from 'framer-motion';
import { Subject, SubjectOption } from '@/types';

// ──────────────────────────────────────────────
//  Subject data
// ──────────────────────────────────────────────

const SUBJECT_OPTIONS: SubjectOption[] = [
  {
    subject: Subject.Maths,
    emoji: '📐',
    description: 'Numbers, shapes, algebra & more',
    bgColour: 'bg-blue-50',
    hoverBgColour: 'hover:bg-blue-100',
    borderColour: 'border-blue-200',
    textColour: 'text-blue-700',
  },
  {
    subject: Subject.English,
    emoji: '📖',
    description: 'Reading, writing, grammar & poetry',
    bgColour: 'bg-amber-50',
    hoverBgColour: 'hover:bg-amber-100',
    borderColour: 'border-amber-200',
    textColour: 'text-amber-700',
  },
  {
    subject: Subject.Spanish,
    emoji: '🇪🇸',
    description: 'Vocabulary, numbers & phrases',
    bgColour: 'bg-red-50',
    hoverBgColour: 'hover:bg-red-100',
    borderColour: 'border-red-200',
    textColour: 'text-red-700',
  },
  {
    subject: Subject.Science,
    emoji: '🔬',
    description: 'Biology, chemistry & physics',
    bgColour: 'bg-green-50',
    hoverBgColour: 'hover:bg-green-100',
    borderColour: 'border-green-200',
    textColour: 'text-green-700',
  },
  {
    subject: Subject.History,
    emoji: '🏛️',
    description: 'Events, people & the past',
    bgColour: 'bg-orange-50',
    hoverBgColour: 'hover:bg-orange-100',
    borderColour: 'border-orange-200',
    textColour: 'text-orange-700',
  },
  {
    subject: Subject.Geography,
    emoji: '🌍',
    description: 'Countries, maps & the environment',
    bgColour: 'bg-teal-50',
    hoverBgColour: 'hover:bg-teal-100',
    borderColour: 'border-teal-200',
    textColour: 'text-teal-700',
  },
  {
    subject: Subject.Coding,
    emoji: '💻',
    description: 'Programming, algorithms & computing',
    bgColour: 'bg-purple-50',
    hoverBgColour: 'hover:bg-purple-100',
    borderColour: 'border-purple-200',
    textColour: 'text-purple-700',
  },
  {
    subject: Subject.General,
    emoji: '🧠',
    description: 'Not sure? Start here!',
    bgColour: 'bg-rose-50',
    hoverBgColour: 'hover:bg-rose-100',
    borderColour: 'border-rose-200',
    textColour: 'text-rose-700',
  },
];

// ──────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────

interface SubjectPickerProps {
  onSelect: (subject: Subject) => void;
  /** If provided, shows which subject is currently active */
  activeSubject?: Subject;
}

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

export default function SubjectPicker({ onSelect, activeSubject }: SubjectPickerProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUBJECT_OPTIONS.map((option, index) => {
          const isActive = activeSubject === option.subject;

          return (
            <motion.button
              key={option.subject}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(option.subject)}
              className={`
                subject-card
                relative flex flex-col items-center justify-center
                p-5 rounded-2xl border-2
                ${option.bgColour} ${option.hoverBgColour} ${option.borderColour}
                ${isActive ? 'ring-2 ring-offset-2 ring-blue-400 shadow-lg' : ''}
                cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2
                transition-all duration-150
                text-center
                min-h-[120px]
              `}
              aria-pressed={isActive}
              aria-label={`${option.subject}: ${option.description}`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-2 right-2 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 font-bold">
                  ✓
                </span>
              )}

              {/* Emoji icon */}
              <span
                className="text-4xl mb-2 select-none"
                role="img"
                aria-hidden="true"
              >
                {option.emoji}
              </span>

              {/* Subject name */}
              <span className={`text-base font-extrabold ${option.textColour} mb-1`}>
                {option.subject}
              </span>

              {/* Description */}
              <span className="text-xs text-gray-500 font-medium leading-tight">
                {option.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-400 mt-5">
        You can switch subjects at any time during your chat! 🔄
      </p>
    </div>
  );
}

export { SUBJECT_OPTIONS };
