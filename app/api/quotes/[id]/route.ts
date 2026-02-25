import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin-simple';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import {
  validateCarPlate,
  validatePhoneNumber,
  validateQuoteAmount,
  validateName,
  validateQuoteNumber,
  sanitizeString,
} from '@/lib/validation';

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
        quoteImageUrl2: data.quoteImageUrl2 || '',
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

// UPDATE quote by ID (only pending quotes)
export async function PUT(
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

    // Get existing quote
    const docRef = adminDb.collection('quotes').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const existingQuote = docSnap.data()!;

    // Only allow editing pending quotes
    if (existingQuote.status === 'approved') {
      return NextResponse.json(
        { error: 'לא ניתן לערוך הצעה שכבר אושרה' },
        { status: 400 }
      );
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
      quoteImageUrl2,
      notes,
    } = body;

    // Server-side validation
    const nameValidation = validateName(customerName);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: `שם לקוח: ${nameValidation.error}` },
        { status: 400 }
      );
    }

    const carPlateValidation = validateCarPlate(carPlate);
    if (!carPlateValidation.valid) {
      return NextResponse.json(
        { error: `מספר רישוי: ${carPlateValidation.error}` },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { error: `מספר טלפון: ${phoneValidation.error}` },
        { status: 400 }
      );
    }

    const quoteNumValidation = validateQuoteNumber(quoteNumber);
    if (!quoteNumValidation.valid) {
      return NextResponse.json(
        { error: `מספר הצעה: ${quoteNumValidation.error}` },
        { status: 400 }
      );
    }

    const amountValidation = validateQuoteAmount(quoteAmount);
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: `סכום הצעה: ${amountValidation.error}` },
        { status: 400 }
      );
    }

    // Update quote with cleaned data (compressed base64 images from client)
    const updateData: any = {
      customerName: sanitizeString(customerName.trim()),
      carPlate: carPlateValidation.cleaned,
      phoneNumber: phoneValidation.cleaned,
      quoteNumber: sanitizeString(quoteNumber.trim()),
      quoteAmount: amountValidation.cleaned,
      quoteImageUrl,
      notes: sanitizeString(notes || ''),
    };

    // Add or remove second image
    if (quoteImageUrl2) {
      updateData.quoteImageUrl2 = quoteImageUrl2;
    } else {
      // Remove field if not provided
      updateData.quoteImageUrl2 = null;
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
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
