import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/auth-helpers';
import { getLockedIdentifiers } from '@/lib/rate-limit';
import { cookies } from 'next/headers';

// Admin endpoint to view locked users
export async function GET(request: NextRequest) {
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

    // Get all locked users
    const lockedUsers = getLockedIdentifiers();

    return NextResponse.json({
      lockedUsers,
      count: lockedUsers.length,
    });
  } catch (error) {
    console.error('Get locked users error:', error);
    return NextResponse.json(
      { error: 'Failed to get locked users' },
      { status: 500 }
    );
  }
}
