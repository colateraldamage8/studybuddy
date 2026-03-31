'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
        setChecking(false);
      }
    });

    // Also check if there's already an active session (user may have already been authenticated)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F9FF' }}>
        <p className="text-gray-500 font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#F8F9FF' }}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5">
          <h1 className="text-white font-extrabold text-xl">Reset your password</h1>
          <p className="text-white/80 text-sm mt-0.5">Enter your new password below</p>
        </div>

        <div className="px-6 py-6">
          {!sessionReady ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                This reset link is invalid or has expired. Please request a new one.
              </div>
              <a
                href="/"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors text-base text-center"
              >
                Back to StudyBuddy
              </a>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                Your password has been updated successfully!
              </div>
              <a
                href="/"
                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors text-base text-center"
              >
                Back to StudyBuddy
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-medium focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-800 font-medium focus:outline-none focus:border-blue-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl transition-colors text-base"
              >
                {loading ? '...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
