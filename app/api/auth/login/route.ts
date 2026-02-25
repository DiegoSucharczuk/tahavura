import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth-helpers';
import { verifyPassword } from '@/lib/password';
import { signToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';

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
      return NextResponse.json(
        { error: 'אימייל או סיסמה שגויים' },
        { status: 401 }
      );
    }

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

    // Return token (client will set as cookie)
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'שגיאה בהתחברות' },
      { status: 500 }
    );
  }
}
