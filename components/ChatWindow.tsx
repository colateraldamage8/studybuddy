'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '@/types';
import clsx from 'clsx';

// ──────────────────────────────────────────────
//  Typing indicator
// ──────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      {/* Bot avatar */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
        <span className="text-lg" role="img" aria-label="StudyBuddy">
          🤖
        </span>
      </div>

      {/* Bubble */}
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-xs"
        style={{ backgroundColor: '#EBF4FF' }}
      >
        <div className="flex gap-1 items-center h-5">
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400 inline-block" />
          <span className="typing-dot w-2 h-2 rounded-full bg-blue-400 inline-block" />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
//  Simple markdown renderer
//  Handles: **bold**, `code`, ```code blocks```,
//  bullet lists (- item), numbered lists, newlines
// ──────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  // Split into lines first
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBuffer: string[] = [];
  let inCodeBlock = false;
  let codeBlockKey = 0;

  const renderInline = (line: string, keyPrefix: string): React.ReactNode => {
    // Process bold and inline code within a line
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-b-${i}`} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={`${keyPrefix}-c-${i}`}
            className="bg-blue-100 text-blue-700 rounded px-1 py-0.5 text-sm font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={`${keyPrefix}-t-${i}`}>{part}</span>;
    });
  };

  lines.forEach((line, lineIndex) => {
    // Code block fence
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        elements.push(
          <pre
            key={`code-${codeBlockKey++}`}
            className="bg-gray-900 text-green-300 rounded-xl p-3 text-sm font-mono overflow-x-auto my-2 leading-relaxed"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Bullet list item
    if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
      const content = line.trim().slice(2);
      elements.push(
        <div key={lineIndex} className="flex gap-2 my-0.5">
          <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">•</span>
          <span className="flex-1">{renderInline(content, `li-${lineIndex}`)}</span>
        </div>
      );
      return;
    }

    // Numbered list item
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2 my-0.5">
          <span className="text-blue-500 font-bold flex-shrink-0 min-w-[1.2rem]">
            {numberedMatch[1]}.
          </span>
          <span className="flex-1">{renderInline(numberedMatch[2], `num-${lineIndex}`)}</span>
        </div>
      );
      return;
    }

    // Empty line → small gap
    if (line.trim() === '') {
      elements.push(<div key={lineIndex} className="h-1" />);
      return;
    }

    // Regular paragraph line
    elements.push(
      <p key={lineIndex} className="my-0.5 leading-relaxed">
        {renderInline(line, `p-${lineIndex}`)}
      </p>
    );
  });

  return <>{elements}</>;
}

// ──────────────────────────────────────────────
//  Single message bubble
// ──────────────────────────────────────────────

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isBot = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={clsx(
        'flex items-end gap-3 mb-4',
        isBot ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      {isBot ? (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm self-end">
          <span className="text-lg" role="img" aria-label="StudyBuddy">
            🤖
          </span>
        </div>
      ) : (
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm self-end">
          <span className="text-lg" role="img" aria-label="You">
            🧑
          </span>
        </div>
      )}

      {/* Bubble */}
      <div
        className={clsx(
          'relative max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm text-sm font-medium leading-relaxed',
          isBot
            ? 'rounded-bl-sm text-gray-800'
            : 'rounded-br-sm text-gray-800'
        )}
        style={{
          backgroundColor: isBot ? '#EBF4FF' : '#DCF8C6',
        }}
      >
        {/* Message content */}
        <div className="prose-chat">
          {isBot ? (
            renderMarkdown(message.content)
          ) : (
            <p className="my-0 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          )}
        </div>

        {/* Streaming cursor */}
        {isStreaming && isBot && (
          <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
        )}

        {/* Timestamp */}
        <div
          className={clsx(
            'text-xs mt-1 opacity-50',
            isBot ? 'text-left' : 'text-right'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────
//  Empty state
// ──────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">
          Ready when you are!
        </h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Type your homework question below and StudyBuddy will guide you through it step by step.
        </p>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
//  ChatWindow Component
// ──────────────────────────────────────────────

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatWindow({ messages, isLoading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading]);

  // Find the last assistant message — it may be streaming
  const lastAssistantIndex = messages.reduce(
    (lastIdx, msg, idx) => (msg.role === 'assistant' ? idx : lastIdx),
    -1
  );
  const isLastMessageStreaming =
    isLoading &&
    lastAssistantIndex === messages.length - 1 &&
    messages[lastAssistantIndex]?.content?.length > 0;

  return (
    <div
      ref={containerRef}
      className="
        chat-scrollbar
        flex-1
        overflow-y-auto
        bg-white
        rounded-2xl
        shadow-inner
        border border-gray-100
        p-4
        min-h-[400px]
        max-h-[calc(100vh-280px)]
      "
    >
      {messages.length === 0 && !isLoading ? (
        <EmptyState />
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={isLoading && index === lastAssistantIndex && isLastMessageStreaming}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Typing indicator: show when loading and last message is still empty */}
      {isLoading &&
        (messages.length === 0 ||
          messages[messages.length - 1]?.role === 'user' ||
          (messages[messages.length - 1]?.role === 'assistant' &&
            messages[messages.length - 1]?.content === '')) && (
          <AnimatePresence>
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TypingIndicator />
            </motion.div>
          </AnimatePresence>
        )}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
