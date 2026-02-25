'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { Quote } from '@/lib/types';
import { generateQuotePDF } from '@/lib/pdf';
import { getQuote } from '@/lib/firestore';

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const quoteData = await getQuote(quoteId);

        if (!quoteData) {
          setError('ההצעה לא נמצאה');
          return;
        }

        setQuote(quoteData);
      } catch (err) {
        console.error('Error loading quote:', err);
        setError('טעות בטעינת ההצעה');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [quoteId]);

  const handleGeneratePDF = async () => {
    if (!quote) return;
    setIsGeneratingPDF(true);
    try {
      await generateQuotePDF(quote);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('טעות בהפקת PDF');
    } finally {
      setIsGeneratingPDF(false);
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
          <p className="text-gray-600 mb-6">{error || 'ההצעה לא נמצאה'}</p>
          <Link
            href="/quotes"
            className="inline-block py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            חזור להצעות
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/quotes"
            className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} />
            חזור
          </Link>
          <div className="flex items-center gap-3">
            {quote.status === 'approved' && (
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="inline-flex items-center gap-2 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Download size={20} />
                {isGeneratingPDF ? 'מייצר...' : 'הורד PDF'}
              </button>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg text-white font-medium flex items-center gap-2 ${quote.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}`}>
          {quote.status === 'approved' ? (
            <>
              <Check size={20} />
              אושר וחתום
            </>
          ) : (
            <>
              ⏳
              בהמתנה לאישור
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Image */}
            {quote.quoteImageUrl && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">תמונת ההצעה</h2>
                <img
                  src={quote.quoteImageUrl}
                  alt="Quote"
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Notes Section (between image and signature) */}
            {quote.notes && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">הערות</h2>
                <p className="text-gray-700 break-words whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}

            {/* Signature */}
            {quote.status === 'approved' && quote.signatureImageUrl && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 text-green-600 flex items-center gap-2">
                  <Check size={20} />
                  חתימת הלקוח
                </h2>
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50 inline-block">
                  <img
                    src={quote.signatureImageUrl}
                    alt="Signature"
                    className="h-32 w-auto"
                  />
                </div>
                {quote.approvedAt && (
                  <p className="text-sm text-gray-600 mt-4">
                    חתום ב- {quote.approvedAt.toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Notes Section (between image and signature) */}
            {quote.notes && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">הערות</h2>
                <p className="text-gray-700 break-words whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">פרטי ההצעה</h2>
            <div className="space-y-4">
              {/* Quote Number and Amount - Highlighted */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="mb-3">
                  <p className="text-xs text-gray-600 uppercase">מספר הצעה</p>
                  <p className="text-2xl font-bold text-blue-600">{quote.quoteNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase">סכום הצעה (כולל מע״מ)</p>
                  <p className="text-2xl font-bold text-green-600">₪ {quote.quoteAmount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">שם הלקוח</p>
                <p className="text-base font-medium text-gray-900">{quote.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר תעודת זהות</p>
                <p className="text-base font-medium text-gray-900">{quote.idNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר רישוי הרכב</p>
                <p className="text-base font-medium text-gray-900">{quote.carPlate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">מספר טלפון</p>
                <p className="text-base font-medium text-gray-900">{quote.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">סטטוס</p>
                <p className={`text-base font-medium ${quote.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {quote.status === 'approved' ? 'אושר ✓' : 'בהמתנה ⏳'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">תאריך יצירה</p>
                <p className="text-base font-medium text-gray-900">
                  {quote.createdAt.toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {quote.approvedAt && (
                <div>
                  <p className="text-sm text-gray-600">תאריך אישור</p>
                  <p className="text-base font-medium text-gray-900">
                    {quote.approvedAt.toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
