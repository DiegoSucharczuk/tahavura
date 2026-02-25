import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { adminDb } from '@/lib/firebase-admin-simple';
import {
  validateCarPlate,
  validatePhoneNumber,
  validateQuoteAmount,
  validateName,
  validateQuoteNumber,
  sanitizeString,
} from '@/lib/validation';

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
        { error: 'שדות חובה חסרים' },
        { status: 400 }
      );
    }

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

    // Validate image exists
    if (!quoteImageUrl || quoteImageUrl.length === 0) {
      return NextResponse.json(
        { error: 'תמונת הצעה נדרשת' },
        { status: 400 }
      );
    }

    // Create quote ID
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create quote document with cleaned data
    await adminDb.collection('quotes').doc(quoteId).set({
      customerName: sanitizeString(customerName.trim()),
      carPlate: carPlateValidation.cleaned,
      phoneNumber: phoneValidation.cleaned,
      quoteNumber: sanitizeString(quoteNumber.trim()),
      quoteAmount: amountValidation.cleaned,
      quoteImageUrl,
      notes: sanitizeString(notes || ''),
      idNumber: sanitizeString(idNumber || ''),
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
