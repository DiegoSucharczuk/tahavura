import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';

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

    // Get request body
    const body = await request.json();
    const { toEmail, pdfDataUrl } = body;

    if (!toEmail || !pdfDataUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get quote details for email
    const docRef = adminDb.collection('quotes').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const quoteData = docSnap.data()!;

    // Return quote details to be sent via EmailJS from client
    return NextResponse.json({
      success: true,
      quoteDetails: {
        customerName: quoteData.customerName,
        carPlate: quoteData.carPlate,
        quoteNumber: quoteData.quoteNumber,
        quoteAmount: quoteData.quoteAmount,
      },
    });
  } catch (error) {
    console.error('Error preparing email:', error);
    return NextResponse.json(
      { error: 'Failed to prepare email' },
      { status: 500 }
    );
  }
}
