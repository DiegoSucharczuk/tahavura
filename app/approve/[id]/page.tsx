'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check } from 'lucide-react';
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

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            אישור ההצעה
          </h1>
          <p className="text-gray-600">אנא בדוק והוציא את ההצעה</p>
        </div>

        {/* Status Badge */}
        <div className={`mb-6 p-4 rounded-lg text-white font-medium flex items-center gap-2 ${isApproved ? 'bg-green-600' : 'bg-blue-600'}`}>
          {isApproved && <Check size={20} />}
          {isApproved ? 'ההצעה אושרה' : 'בהמתנה לאישור'}
        </div>

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

        {/* Quote Image */}
        {quote.quoteImageUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold mb-4">תמונת ההצעה</h2>
            <div
              className="overflow-auto border-2 border-gray-200 rounded-lg"
              onWheel={handlePinch}
              style={{ maxHeight: '500px' }}
            >
              <div className="flex items-center justify-center p-4" style={{ zoom: zoomLevel }}>
                <img
                  src={quote.quoteImageUrl}
                  alt="Quote"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              💡 {zoomLevel > 1 ? 'הגדל והקטן (השתמש בـ Ctrl + scroll)' : 'השתמש בـ Ctrl + scroll להגדלה'}
            </p>
          </div>
        )}

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
    </main>
  );
}
