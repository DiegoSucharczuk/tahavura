'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Lock } from 'lucide-react';
import { SignaturePad } from '@/components/SignaturePad';
import { getQuote, updateQuoteWithSignature, uploadImageFromDataUrl } from '@/lib/firestore';
import { Quote } from '@/lib/types';

export default function ApprovalPage() {
  const params = useParams();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [idNumber, setIdNumber] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const data = await getQuote(quoteId);
        if (!data) {
          setError('ההצעה לא נמצאה');
          return;
        }
        if (data.status === 'approved') {
          setIsApproved(true);
        }
        setQuote(data);
      } catch (err) {
        console.error('Error loading quote:', err);
        setError('טעות בטעינת ההצעה. אנא נסה שוב.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    if (!quote) return;

    // חלץ את 4 הספרות האחרונות מלוחית הרכב
    const carPlateLast4 = quote.carPlate.slice(-4);

    if (lastFourDigits === carPlateLast4) {
      setIsVerified(true);
    } else {
      setVerificationError('4 הספרות שציינת לא תואמות את לוחית הרכב');
      setLastFourDigits('');
    }
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
    if (!quote) return;

    if (!idNumber.trim()) {
      alert('אנא הזן את מספר תעודת הזהות');
      return;
    }

    setIsSubmittingSignature(true);
    try {
      // Upload signature image to Firebase Storage
      const signaturePath = `signatures/${quoteId}-${Date.now()}.png`;
      const signatureUrl = await uploadImageFromDataUrl(signatureDataUrl, signaturePath);

      // Update quote with signature and ID number
      await updateQuoteWithSignature(quoteId, signatureUrl, idNumber);

      // Update local state
      setQuote({
        ...quote,
        idNumber,
        status: 'approved',
        signatureImageUrl: signatureUrl,
        approvedAt: new Date(),
      });
      setIsApproved(true);
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('טעות בשמירת החתימה. אנא נסה שוב.');
    } finally {
      setIsSubmittingSignature(false);
    }
  };

  const handlePinch = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const newZoom = Math.max(1, Math.min(3, zoomLevel + (e.deltaY > 0 ? -0.1 : 0.1)));
      setZoomLevel(newZoom);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">טוען הצעה...</p>
        </div>
      </main>
    );
  }

  if (error || !quote) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
          <p className="text-gray-600">{error || 'ההצעה לא נמצאה'}</p>
        </div>
      </main>
    );
  }

  // ב-Verification בחסימה
  if (!isVerified) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full">
                <Lock size={32} className="text-white" />
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
              ברוכים הבאים
            </h1>
            <p className="text-center text-gray-600 mb-8 text-lg">
              ההצעה שלך מוכנה לסקירה
            </p>

            {/* Privacy Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-center text-gray-700 text-sm leading-relaxed">
                כדי להגן על הפרטיות שלך, אנא הכנס את 4 הספרות האחרונות מלוחית הרכב שלך כדי להציג את הפרטים.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerification} className="space-y-6">
              {/* Input Field */}
              <div>
                <label htmlFor="lastFour" className="block text-sm font-semibold text-gray-700 mb-3 text-right">
                  4 הספרות האחרונות של לוחית הרכב <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastFour"
                  inputMode="numeric"
                  maxLength={4}
                  value={lastFourDigits}
                  onChange={(e) => setLastFourDigits(e.target.value.replace(/\D/g, ''))}
                  placeholder="0000"
                  className="w-full px-6 py-4 text-center text-4xl tracking-[0.5em] border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono font-bold"
                  required
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {verificationError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
                  {verificationError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Check size={22} />
                צפה בהצעה שלי
              </button>
            </form>
          </div>

          {/* Footer Note */}
          <p className="text-center text-gray-600 text-sm mt-6">
            לצורך אישור שלך שאתה בעצם המקבל של ההצעה הזו
          </p>
        </div>
      </main>
    );
  }

  // פרטי ההצעה (אחרי verification)
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <p className="text-sm font-medium text-gray-700">
              אישור הצעה עבור <span className="font-bold text-gray-900">{quote.customerName}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Fade-in Animation */}
        <div className="animate-fade-in">
          {/* Status Badge */}
          <div className={`mb-6 p-4 rounded-lg text-white font-medium flex items-center gap-2 ${isApproved ? 'bg-green-600' : 'bg-blue-600'}`}>
            {isApproved && <Check size={20} />}
            {isApproved ? 'ההצעה אושרה' : 'בהמתנה לאישור'}
          </div>

          {/* Quote Image Section */}
          {quote.quoteImageUrl && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
              <h2 className="text-xl font-bold mb-4">תמונת ההצעה</h2>
              <div
                className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
                onWheel={handlePinch}
              >
                <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}>
                  <img
                    src={quote.quoteImageUrl}
                    alt="Quote"
                    className="max-w-full h-auto"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">Ctrl+Scroll לשינוי גודל</p>
            </div>
          )}

          {/* Details Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-4">פרטי ההצעה</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">שם הלקוח</p>
                <p className="text-lg font-medium">{quote.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר רישוי הרכב</p>
                <p className="text-lg font-medium">{quote.carPlate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר טלפון</p>
                <p className="text-lg font-medium">{quote.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">תאריך יצירה</p>
                <p className="text-lg font-medium">
                  {quote.createdAt.toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {quote.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-gray-600">הערות</p>
                <p className="mt-2 text-gray-800 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Signature Section */}
          {!isApproved ? (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4">אישור וחתימה</h2>
              
              {/* ID Number Input */}
              <div className="mb-6">
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  מספר תעודת זהות <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="הזן מספר תעודת זהות"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmittingSignature}
                  required
                />
              </div>

              <h3 className="text-lg font-semibold mb-2">חתימה</h3>
              <p className="text-gray-600 mb-6">אנא חתום מטה כדי לאשר הצעה זו</p>
              <SignaturePad onSave={handleSignatureSave} isLoading={isSubmittingSignature} />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
                <Check size={24} />
                ההצעה אושרה
              </h2>
              {quote.signatureImageUrl && (
                <div>
                  <p className="text-gray-600 mb-3">חתום ב-{quote.approvedAt?.toLocaleDateString('he-IL')}</p>
                  <img
                    src={quote.signatureImageUrl}
                    alt="Signature"
                    className="max-w-xs h-auto border-2 border-green-300 rounded-lg p-2 bg-green-50"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
