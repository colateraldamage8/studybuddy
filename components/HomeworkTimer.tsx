'use client';

import { useState, useEffect, useRef } from 'react';

interface HomeworkTimerProps {
  onDeadlineReached: () => void; // fires at 17:00
  onLockReached: () => void;     // fires at 18:00
  completed: boolean;
  failed: boolean;
}

export default function HomeworkTimer({ onDeadlineReached, onLockReached, completed, failed }: HomeworkTimerProps) {
  const [now, setNow] = useState(new Date());
  const deadlineFired = useRef(false);
  const lockFired = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const start = new Date(now);
  start.setHours(9, 0, 0, 0);

  const deadline = new Date(now);
  deadline.setHours(17, 0, 0, 0);

  const lock = new Date(now);
  lock.setHours(20, 0, 0, 0);

  const isBeforeStart = now < start;
  const isPastDeadline = now >= deadline;
  const isPastLock = now >= lock;

  useEffect(() => {
    if (isPastDeadline && !deadlineFired.current && !completed) {
      deadlineFired.current = true;
      onDeadlineReached();
    }
  }, [isPastDeadline, completed]);

  useEffect(() => {
    if (isPastLock && !lockFired.current && !completed) {
      lockFired.current = true;
      onLockReached();
    }
  }, [isPastLock, completed]);

  function formatCountdown(target: Date) {
    const diff = Math.max(0, target.getTime() - now.getTime());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  }

  if (completed) return null;

  if (failed || isPastLock) {
    return <span className="text-red-500 text-xs font-bold">🔒 Homework locked</span>;
  }

  if (isPastDeadline) {
    return <span className="text-orange-500 text-xs font-bold">⚠️ LATE — {formatCountdown(lock)} left</span>;
  }

  if (isBeforeStart) {
    return <span className="text-gray-400 text-xs font-medium">Available from 9am</span>;
  }

  return <span className="text-green-600 text-xs font-medium">⏰ {formatCountdown(deadline)} until 5pm</span>;
}
