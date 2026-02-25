'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateUserPassword, getAllUsers } from '@/lib/firestore';
import { User } from '@/lib/types';
import { BackButton } from '@/components/BackButton';

export default function ChangePasswordPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const users = await getAllUsers();
      const foundUser = users.find((u) => u.id === userId);
      if (!foundUser) {
        setError('משתמש לא נמצא');
        return;
      }
      setUser(foundUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setError('שגיאה בטעינת משתמש');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (!user) {
        setError('משתמש לא נמצא');
        return;
      }

      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError('אנא מלא את כל השדות');
        setIsSubmitting(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('הסיסמאות אינן תואמות');
        setIsSubmitting(false);
        return;
      }

      if (newPassword.length < 6) {
        setError('הסיסמה חייבת להיות לפחות 6 תווים');
        setIsSubmitting(false);
        return;
      }

      // Update password via API (validates current password server-side)
      await updateUserPassword(userId, newPassword, currentPassword);

      setSuccess('סיסמה שונתה בהצלחה!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/internal-dashboard/users');
      }, 2000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setError(error.message || 'שגיאה בשינוי הסיסמה');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
          <p className="text-gray-600 mb-4">{error || 'משתמש לא נמצא'}</p>
          <button
            onClick={() => router.push('/internal-dashboard/users')}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            חזור לניהול משתמשים
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton href="/internal-dashboard/users" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">שינוי סיסמה</h1>
          <p className="text-gray-600">שנה את סיסמת {user.name}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה נוכחית <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סיסמה חדשה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">לפחות 6 תווים</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אישור סיסמה חדשה <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'משנה סיסמה...' : 'שנה סיסמה'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
