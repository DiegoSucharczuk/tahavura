import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin-simple';

// GET single quote by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // This endpoint is public for customer approval page
    // Protected by 4-digit verification on client side

    const docRef = adminDb.collection('quotes').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const data = docSnap.data()!;

    return NextResponse.json({
      quote: {
        id: docSnap.id,
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
      }
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

// DELETE quote by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate session
    const token = request.cookies.get('__session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verifyToken } = await import('@/lib/jwt');
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Delete quote
    await adminDb.collection('quotes').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
