import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';

// GET all quotes
export async function GET(request: NextRequest) {
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

    // Fetch all quotes from Firestore
    const querySnapshot = await adminDb.collection('quotes').get();
    const quotes: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      quotes.push({
        id: doc.id,
        customerName: data.customerName,
        carPlate: data.carPlate,
        phoneNumber: data.phoneNumber,
        quoteNumber: data.quoteNumber || '',
        quoteAmount: data.quoteAmount || '',
        quoteImageUrl: data.quoteImageUrl,
        notes: data.notes,
        status: data.status,
        signatureImageUrl: data.signatureImageUrl || null,
        idNumber: data.idNumber || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        approvedAt: data.approvedAt?.toDate?.()?.toISOString() || null,
      });
    });

    // Sort by creation date (newest first)
    quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
