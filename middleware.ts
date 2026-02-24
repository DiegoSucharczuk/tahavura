import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // אם המשתמש מנסה להיכנס ל-root ללא auth
  if (pathname === '/') {
    // בדוק אם יש Firebase token בקוקי (נוסיף בהמשך)
    const token = request.cookies.get('__session')?.value;
    
    // אם אין token, redirect ל-login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // אם יש token, redirect ל-internal-dashboard
    return NextResponse.redirect(new URL('/internal-dashboard', request.url));
  }

  // הגנה על /internal-dashboard, /quotes, /approve, /summary
  if (pathname.startsWith('/internal-dashboard') || pathname.startsWith('/quotes') || pathname.startsWith('/approve') || pathname.startsWith('/summary')) {
    const token = request.cookies.get('__session')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // /v/* הוא public (customer approval page) - לא צריך הגנה
  // /login הוא public - לא צריך הגנה

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
