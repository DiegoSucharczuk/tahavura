import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/auth-helpers';
import { verifyPassword, hashPassword } from '@/lib/password';
import { adminDb } from '@/lib/firebase-admin-simple';
import { validatePassword } from '@/lib/validation';

// UPDATE user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Only allow users to change their own password or admins to change any password
    const currentUser = await getUserById(payload.userId);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isOwnPassword = payload.userId === id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwnPassword && !isAdmin) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: 'סיסמה חדשה נדרשת' },
        { status: 400 }
      );
    }

    // Server-side password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // If changing own password, verify current password
    if (isOwnPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password required' },
          { status: 400 }
        );
      }

      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        currentUser.passwordHash
      );

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    } else {
      // Admin changing another user's password - verify target user exists
      const targetUser = await getUserById(id);
      if (!targetUser) {
        return NextResponse.json(
          { error: 'Target user not found' },
          { status: 404 }
        );
      }
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in Firestore
    await adminDb.collection('users').doc(id).update({
      passwordHash: newPasswordHash,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
