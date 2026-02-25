import { NextResponse } from 'next/server';

// Debug endpoint to check if environment variables are set
// DELETE THIS FILE after testing!
export async function GET() {
  return NextResponse.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
    privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) || 'NOT SET',
    // Show first 50 chars to verify format
  });
}
