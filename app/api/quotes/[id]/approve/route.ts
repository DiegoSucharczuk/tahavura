import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin-simple';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // This endpoint is public for customer approval
    // Protected by 4-digit verification on client side

    const body = await request.json();
    const { signatureImageUrl, idNumber } = body;

    if (!signatureImageUrl) {
      return NextResponse.json(
        { error: 'Signature required' },
        { status: 400 }
      );
    }

    // Update quote with signature
    const updateData: any = {
      status: 'approved',
      signatureImageUrl,
      approvedAt: new Date(),
    };

    if (idNumber) {
      updateData.idNumber = idNumber;
    }

    await adminDb.collection('quotes').doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving quote:', error);
    return NextResponse.json(
      { error: 'Failed to approve quote' },
      { status: 500 }
    );
  }
}
