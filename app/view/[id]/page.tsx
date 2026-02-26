'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Check, Lock, Download } from 'lucide-react';
import { Quote } from '@/lib/types';
import { generateQuotePDF } from '@/lib/pdf';

export default function ViewQuotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const token = searchParams.get('token');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        if (!token) {
          setError('קישור לא תקין - חסר טוקן אבטחה');
          setIsLoading(false);
          return;
        }

        // Validate token and get quote
        const response = await fetch(`/api/view-quote/${quoteId}?token=${token}`);

        if (!response.ok) {
          if (response.status === 401) {
            setError('הקישור פג תוקף או אינו תקין. אנא בקש לשלוח מחדש את הקישור.');
          } else {
            setError('ההצעה לא נמצאה');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setQuote({
          ...data.quote,
          createdAt: new Date(data.quote.createdAt),
          approvedAt: data.quote.approvedAt ? new Date(data.quote.approvedAt) : null,
        });
      } catch (err) {
        console.error('Error loading quote:', err);
        setError('טעות בטעינת ההצעה. אנא נסה שוב.');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [quoteId, token]);

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Lock size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
          <p className="text-gray-600 mb-6">{error || 'ההצעה לא נמצאה'}</p>
          {error?.includes('פג תוקף') && (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
              💡 קישורים תקפים ל-24 שעות בלבד מטעמי אבטחה. אנא בקש מהעובד לשלוח את הקישור מחדש.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <p className="text-sm font-medium text-gray-700">
                הצעת מחיר - <span className="font-bold text-gray-900">{quote.customerName}</span>
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              quote.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Fade-in Animation */}
        <div className="animate-fade-in">
          {/* Security Notice */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 text-center">
              🔒 קישור מאובטח - תקף ל-24 שעות
            </p>
          </div>

          {/* Quote Images Section */}
          {quote.quoteImageUrl && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {quote.quoteImageUrl2 ? 'תמונות ההצעה' : 'תמונת ההצעה'}
              </h2>
              <div className={`grid gap-4 ${quote.quoteImageUrl2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  {quote.quoteImageUrl2 && (
                    <p className="text-sm font-medium text-gray-700 mb-2 text-center">הצעה 1</p>
                  )}
                  <div
                    className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
                    onWheel={handlePinch}
                  >
                    <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}>
                      <img
                        src={quote.quoteImageUrl}
                        alt="Quote Image 1"
                        className="max-w-full h-auto"
                      />
                    </div>
                  </div>
                </div>
                {quote.quoteImageUrl2 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 text-center">הצעה 2</p>
                    <div
                      className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden"
                      onWheel={handlePinch}
                    >
                      <div style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s' }}>
                        <img
                          src={quote.quoteImageUrl2}
                          alt="Quote Image 2"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                <p className="text-sm text-gray-600">מספר הצעה</p>
                <p className="text-lg font-medium text-blue-600">{quote.quoteNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">סכום הצעה (כולל מע״מ)</p>
                <p className="text-lg font-medium text-green-600">₪ {quote.quoteAmount}</p>
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
              {quote.idNumber && (
                <div>
                  <p className="text-sm text-gray-600">תעודת זהות</p>
                  <p className="text-lg font-medium">{quote.idNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {quote.notes && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
              <h2 className="text-lg font-bold mb-4">הערות</h2>
              <p className="text-gray-700 break-words whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Signature Section - Only show if approved */}
          {quote.status === 'approved' && quote.signatureImageUrl && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
              <h2 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
                <Check size={24} />
                ההצעה אושרה
              </h2>
              <div>
                <p className="text-gray-600 mb-3">
                  חתום ב-{quote.approvedAt?.toLocaleDateString('he-IL')}
                </p>
                <img
                  src={quote.signatureImageUrl}
                  alt="Signature"
                  className="max-w-xs h-auto border-2 border-green-300 rounded-lg p-2 bg-green-50"
                />
              </div>
            </div>
          )}

          {/* Download PDF Button - Only if approved */}
          {quote.status === 'approved' && (
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={20} />
                {isGeneratingPDF ? 'מייצר PDF...' : 'הורד PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
