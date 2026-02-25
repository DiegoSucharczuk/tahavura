import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth-helpers';
import { verifyPassword } from '@/lib/password';
import { signToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';
import { checkRateLimit, resetRateLimit, getResetTimeRemaining } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'אימייל וסיסמה נדרשים' },
        { status: 400 }
      );
    }

    // Rate limiting: 5 attempts per 15 minutes per email
    const rateLimitCheck = checkRateLimit(email.toLowerCase(), 5, 15 * 60 * 1000);

    if (!rateLimitCheck.allowed) {
      const remainingSeconds = getResetTimeRemaining(email.toLowerCase());
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      return NextResponse.json(
        {
          error: `יותר מדי ניסיונות. נסה שוב בעוד ${remainingMinutes} דקות`,
          retryAfter: remainingSeconds
        },
        { status: 429 } // 429 = Too Many Requests
      );
    }

    // Get user from Firestore
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Failed login - keep the rate limit counter
      return NextResponse.json(
        {
          error: 'אימייל או סיסמה שגויים',
          attemptsRemaining: rateLimitCheck.remaining
        },
        { status: 401 }
      );
    }

    // Successful login - reset rate limit counter
    resetRateLimit(email.toLowerCase());

    // Update last login
    try {
      await adminDb.collection('users').doc(user.id).update({
        lastLogin: new Date(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't fail login if this fails
    }

    // Generate JWT token
    const token = signToken(user.id, user.email, user.role);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set HttpOnly cookie (much more secure - cannot be accessed by JavaScript)
    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
