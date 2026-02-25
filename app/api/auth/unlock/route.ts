import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/auth-helpers';
import { resetRateLimit } from '@/lib/rate-limit';
import { cookies } from 'next/headers';

// Admin endpoint to unlock a rate-limited user
export async function POST(request: NextRequest) {
  try {
    // Validate admin session
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Verify user is admin
    const adminUser = await getUserById(payload.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get email to unlock
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Reset rate limit for this email
    resetRateLimit(email.toLowerCase());

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for ${email}`,
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock user' },
      { status: 500 }
    );
  }
}
