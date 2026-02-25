'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, LogOut, Lock, Phone, ArrowLeft, Unlock, Shield } from 'lucide-react';
import { User } from '@/lib/types';
import { getAllUsers, deleteUser, createUser } from '@/lib/firestore';

interface LockedUser {
  identifier: string;
  attempts: number;
  resetTime: number;
  remainingSeconds: number;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean | null>(null); // null means undetermined
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null means undetermined
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'worker' as 'admin' | 'worker',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = async () => {
    try {
      // Call logout API to clear HttpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userRole');
      router.push('/login');
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('שגיאה בטעינת משתמשים');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLockedUsers = async () => {
    try {
      const response = await fetch('/api/auth/locked-users', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setLockedUsers(data.lockedUsers || []);
      }
    } catch (error) {
      console.error('Error loading locked users:', error);
    }
  };

  const handleUnlockUser = async (email: string) => {
    try {
      const response = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(`משתמש ${email} שוחרר בהצלחה`);
        loadLockedUsers(); // Refresh locked users list
      } else {
        setError('שגיאה בשחרור משתמש');
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      setError('שגיאה בשחרור משתמש');
    }
  };

  useEffect(() => {
    // בדוק אם זה מכשיר נייד - זה חייב להיות מוקדם ביותר
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone/.test(userAgent);

      console.log('User-Agent:', navigator.userAgent);
      console.log('Is Mobile:', isMobileDevice);

      if (isMobileDevice) {
        console.log('🚫 Mobile user detected - redirecting...');
        setIsMobile(true);
        // עוד כונן לעמוד הבית אם זה נייד
        router.replace('/internal-dashboard');
        return;
      }

      setIsMobile(false);

      // Check if user is admin
      const role = localStorage.getItem('userRole');
      console.log('User Role:', role);

      if (role !== 'admin') {
        console.log('🚫 Non-admin user detected - redirecting...');
        setIsAdmin(false);
        router.replace('/internal-dashboard');
        return;
      }

      setIsAdmin(true);
    }

    loadUsers();
    loadLockedUsers();

    // Refresh locked users every 30 seconds
    const interval = setInterval(loadLockedUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // אם טרם בדקנו - הצג טוען
  if (isMobile === null || isAdmin === null) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">בדיקה...</p>
        </div>
      </main>
    );
  }

  // תצוגה אם זה נייד או לא אדמין
  if (isMobile || !isAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 text-5xl">{isMobile ? '📱' : '🔒'}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {isMobile ? 'זה לא זמין על טלפון' : 'אין לך הרשאה'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isMobile
              ? 'ניהול משתמשים זמין רק מהמחשב'
              : 'ניהול משתמשים זמין רק למנהלים'}
          </p>
          <button
            onClick={() => router.replace('/internal-dashboard')}
            className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </main>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreating(true);

    try {
      if (!formData.email || !formData.name || !formData.password) {
        setError('אנא מלא את כל השדות');
        setIsCreating(false);
        return;
      }

      // Create user (password hashing happens server-side now)
      await createUser(formData.email, formData.password, formData.name, formData.role);

      setSuccess('משתמש נוצר בהצלחה');
      setFormData({ email: '', name: '', password: '', role: 'worker' });
      setShowCreateForm(false);

      // Reload users
      setTimeout(() => loadUsers(), 500);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'שגיאה ביצירת משתמש');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (confirm(`האם אתה בטוח שאתה רוצה למחוק את ${userName}?`)) {
      try {
        await deleteUser(userId);
        setSuccess('משתמש נמחק בהצלחה');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('שגיאה במחיקת משתמש');
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/internal-dashboard')}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <ArrowLeft size={20} />
              חזור
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ניהול משתמשים</h1>
              <p className="text-gray-600">יצור, ערוך ומחק משתמשים מהמערכת</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center gap-2 py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <Plus size={20} />
              משתמש חדש
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              <LogOut size={20} />
              התנתק
            </button>
          </div>
        </div>

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

        {/* Locked Users Section */}
        {lockedUsers.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-red-600" size={24} />
              <h2 className="text-xl font-bold text-red-900">
                משתמשים נעולים ({lockedUsers.length})
              </h2>
            </div>
            <p className="text-red-700 mb-4 text-sm">
              המשתמשים הבאים נעולים בגלל יותר מדי ניסיונות התחברות כושלים
            </p>
            <div className="space-y-3">
              {lockedUsers.map((locked) => {
                const minutes = Math.floor(locked.remainingSeconds / 60);
                const seconds = locked.remainingSeconds % 60;
                return (
                  <div
                    key={locked.identifier}
                    className="bg-white border border-red-200 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <Lock className="text-red-500" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">{locked.identifier}</p>
                        <p className="text-sm text-gray-600">
                          {locked.attempts} ניסיונות • נעול עוד {minutes}:{seconds.toString().padStart(2, '0')} דקות
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlockUser(locked.identifier)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Unlock size={16} />
                      שחרר
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">יצור משתמש חדש</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    שם <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="שם המשתמש"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    אימייל <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    סיסמה <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תפקיד
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'worker' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isCreating}
                  >
                    <option value="worker">עובד</option>
                    <option value="admin">אדמין</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isCreating ? 'יוצר...' : 'יצור משתמש'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="py-2 px-6 bg-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-400"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">אין משתמשים בעדיין</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                צור משתמש חדש
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">שם</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">אימייל</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">תפקיד</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">נוצר</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">התחברות אחרונה</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-right text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'אדמין' : 'עובד'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {user.createdAt.toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {user.lastLogin ? user.lastLogin.toLocaleDateString('he-IL') : 'לא התחבר עדיין'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => router.push(`/internal-dashboard/users/${user.id}/change-password`)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                          title="שנה סיסמה"
                        >
                          <Lock size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                          title="מחק משתמש"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
