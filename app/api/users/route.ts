import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/auth-helpers';
import { hashPassword } from '@/lib/password';
import { adminDb } from '@/lib/firebase-admin-simple';
import { validateEmail, validatePassword, validateName, sanitizeString } from '@/lib/validation';
import { checkRateLimit, getResetTimeRemaining } from '@/lib/rate-limit';

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check admin role
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Verify user exists and is admin
    const user = await getUserById(payload.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all users
    const querySnapshot = await adminDb.collection('users').get();
    const users: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role || 'worker',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || null,
      });
    });

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// CREATE new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and check admin role
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const currentUser = await getUserById(payload.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Rate limiting: 5 new users per hour per admin
    const rateLimitKey = `user-create:${payload.userId}`;
    const rateLimitCheck = checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000); // 5 attempts per 1 hour

    if (!rateLimitCheck.allowed) {
      const remainingSeconds = getResetTimeRemaining(rateLimitKey);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      return NextResponse.json(
        {
          error: `הגעת למגבלת יצירת משתמשים (5 בשעה). נסה שוב בעוד ${remainingMinutes} דקות`,
          retryAfter: remainingSeconds
        },
        { status: 429 } // 429 = Too Many Requests
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'שדות חובה חסרים' },
        { status: 400 }
      );
    }

    // Server-side validation
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: `שם: ${nameValidation.error}` },
        { status: 400 }
      );
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: `אימייל: ${emailValidation.error}` },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: `סיסמה: ${passwordValidation.error}` },
        { status: 400 }
      );
    }

    if (!['admin', 'worker'].includes(role)) {
      return NextResponse.json(
        { error: 'תפקיד לא תקין' },
        { status: 400 }
      );
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUsers = await adminDb
      .collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();

    if (!existingUsers.empty) {
      return NextResponse.json(
        { error: 'אימייל כבר קיים במערכת' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user document with cleaned data
    const docRef = adminDb.collection('users').doc();

    await docRef.set({
      email: cleanEmail,
      name: sanitizeString(name.trim()),
      passwordHash,
      role,
      createdAt: new Date(),
      lastLogin: null,
    });

    return NextResponse.json({
      success: true,
      userId: docRef.id,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
