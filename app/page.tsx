'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // בדוק אם יש token (עובד מחובר)
    const hasToken = document.cookie.includes('__session');
    
    if (hasToken) {
      // עובד מחובר - כנס לדשבורד
      router.push('/internal-dashboard');
    } else {
      // לקוח/משהו אחר - כנס לlogin
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">טוען...</p>
      </div>
    </div>
  );
}
