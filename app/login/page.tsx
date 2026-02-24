'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { getUserByEmail } from '@/lib/firestore';
import { verifyPassword } from '@/lib/password';
import { updateLastLogin } from '@/lib/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Get user from Firestore
      const user = await getUserByEmail(email);

      if (!user) {
        setError('אימייל או סיסמה שגויים');
        setIsLoading(false);
        return;
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        setError('אימייל או סיסמה שגויים');
        setIsLoading(false);
        return;
      }

      // Update last login
      await updateLastLogin(user.id);

      // Set auth cookie with user ID from Firestore
      document.cookie = `__session=${user.id}; path=/; max-age=86400; secure; samesite=strict`;
      document.cookie = `__userEmail=${user.email}; path=/; max-age=86400; secure; samesite=strict`;

      // Redirect to dashboard
      router.push('/internal-dashboard');
    } catch (err) {
      setError('שגיאה בהתחברות');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">מערכת הצעות</h1>
          <p className="text-gray-600 mt-2">התחבר כעובד</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              אימייל
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              סיסמה
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                מתחבר...
              </>
            ) : (
              <>
                <LogIn size={20} />
                התחבר
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 text-sm text-center text-blue-800">
          <p>פנה למנהל כדי להקבל אישורים לכניסה</p>
        </div>
      </div>
    </main>
  );
}

