'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import clsx from 'clsx';

// ──────────────────────────────────────────────
//  Props
// ──────────────────────────────────────────────

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

// ──────────────────────────────────────────────
//  Quick prompt suggestions (shown when empty)
// ──────────────────────────────────────────────

const QUICK_PROMPTS: string[] = [
  "I don't understand fractions 🤔",
  "Help me with my English essay 📝",
  "Explain photosynthesis 🌿",
  "What caused World War One? 🏛️",
];

// ──────────────────────────────────────────────
//  Component
// ──────────────────────────────────────────────

export default function MessageInput({
  onSend,
  isLoading,
  disabled = false,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = disabled || isLoading;
  const canSend = value.trim().length > 0 && !isDisabled;

  // ── Auto-resize textarea ──────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);

      // Reset height then set to scrollHeight to auto-grow
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
      }
    },
    []
  );

  // ── Send message ──────────────────────────────
  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;

    onSend(trimmed);
    setValue('');
    setShowSuggestions(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSend]);

  // ── Enter to send (Shift+Enter for newline) ───
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ── Quick prompt click ────────────────────────
  const handleQuickPrompt = useCallback(
    (prompt: string) => {
      if (isDisabled) return;
      setValue(prompt);
      setShowSuggestions(false);
      textareaRef.current?.focus();
    },
    [isDisabled]
  );

  // ── Focus / blur handlers ─────────────────────
  const handleFocus = useCallback(() => {
    if (!value.trim()) setShowSuggestions(true);
  }, [value]);

  const handleBlur = useCallback(() => {
    // Delay hiding so clicks on suggestions register
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  return (
    <div className="relative">
      {/* ── Quick prompt suggestions ─────────────── */}
      <AnimatePresence>
        {showSuggestions && !value.trim() && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-10"
          >
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2 px-1">
              Try asking...
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onMouseDown={() => handleQuickPrompt(prompt)}
                  className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-3 py-1.5 rounded-full border border-blue-200 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input container ───────────────────────── */}
      <div
        className={clsx(
          'flex items-end gap-3 bg-white rounded-2xl border-2 px-4 py-3 shadow-sm transition-colors duration-150',
          isDisabled
            ? 'border-gray-200 opacity-75'
            : 'border-gray-200 focus-within:border-blue-400 focus-within:shadow-md'
        )}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isDisabled}
          placeholder={
            isLoading
              ? 'StudyBuddy is thinking...'
              : 'Ask me anything about your homework...'
          }
          rows={1}
          aria-label="Message input"
          className={clsx(
            'flex-1 resize-none bg-transparent text-gray-800 font-medium text-sm leading-relaxed',
            'placeholder:text-gray-400 placeholder:font-normal',
            'focus:outline-none',
            'min-h-[24px] max-h-[160px] overflow-y-auto',
            isDisabled && 'cursor-not-allowed'
          )}
          style={{ scrollbarWidth: 'none' }}
        />

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          whileTap={canSend ? { scale: 0.92 } : {}}
          aria-label="Send message"
          className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150',
            canSend
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 cursor-pointer'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <Send size={18} strokeWidth={2.5} />
          )}
        </motion.button>
      </div>

      {/* ── Helper text ───────────────────────────── */}
      <div className="flex justify-between items-center mt-1 px-1">
        <p className="text-xs text-gray-400">
          Press{' '}
          <kbd className="bg-gray-100 text-gray-500 rounded px-1 py-0.5 text-xs font-mono">
            Enter
          </kbd>{' '}
          to send ·{' '}
          <kbd className="bg-gray-100 text-gray-500 rounded px-1 py-0.5 text-xs font-mono">
            Shift + Enter
          </kbd>{' '}
          for new line
        </p>

        {/* Character count when typing */}
        <AnimatePresence>
          {value.length > 200 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={clsx(
                'text-xs font-medium',
                value.length > 900 ? 'text-red-500' : 'text-gray-400'
              )}
            >
              {value.length}/1000
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
