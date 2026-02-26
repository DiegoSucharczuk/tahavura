import { NextRequest, NextResponse } from 'next/server';
import { validateViewToken } from '@/lib/view-tokens';
import { adminDb } from '@/lib/firebase-admin-simple';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate token
    const validQuoteId = await validateViewToken(token);

    if (!validQuoteId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Verify token matches the requested quote
    if (validQuoteId !== id) {
      return NextResponse.json(
        { error: 'Token does not match quote' },
        { status: 403 }
      );
    }

    // Get quote from Firestore
    const docRef = adminDb.collection('quotes').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const quoteData = docSnap.data()!;

    return NextResponse.json({
      quote: {
        id: docSnap.id,
        ...quoteData,
      },
    });
  } catch (error) {
    console.error('Error fetching quote with token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
