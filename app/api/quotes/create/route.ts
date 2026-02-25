import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';

export async function POST(request: NextRequest) {
  try {
    // Validate session
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

    // Parse request body
    const body = await request.json();
    const {
      customerName,
      carPlate,
      phoneNumber,
      quoteNumber,
      quoteAmount,
      quoteImageUrl,
      notes,
      idNumber
    } = body;

    // Validate required fields
    if (!customerName || !carPlate || !phoneNumber || !quoteNumber || !quoteAmount || !quoteImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create quote ID
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create quote document
    await adminDb.collection('quotes').doc(quoteId).set({
      customerName,
      carPlate,
      phoneNumber,
      quoteNumber,
      quoteAmount,
      quoteImageUrl,
      notes: notes || '',
      idNumber: idNumber || '',
      status: 'pending',
      signatureImageUrl: null,
      createdAt: new Date(),
      approvedAt: null,
    });

    return NextResponse.json({ quoteId });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}
