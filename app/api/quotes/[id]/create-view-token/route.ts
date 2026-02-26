import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { createViewToken } from '@/lib/view-tokens';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session
    const cookieStore = await cookies();
    const token = cookieStore.get('__session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Create view token (valid for 1 day)
    const viewToken = await createViewToken(id, payload.email);

    return NextResponse.json({ token: viewToken });
  } catch (error) {
    console.error('Error creating view token:', error);
    return NextResponse.json(
      { error: 'Failed to create view token' },
      { status: 500 }
    );
  }
}
