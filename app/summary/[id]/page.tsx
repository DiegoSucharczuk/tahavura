'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Copy, Download, Share2, Check, ArrowLeft, LogOut } from 'lucide-react';
import { getQuote } from '@/lib/firestore';
import { generateQuotePDF } from '@/lib/pdf';
import { Quote } from '@/lib/types';

export default function SummaryPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const loadQuote = async () => {
      try {
        const data = await getQuote(quoteId);
        if (!data) {
          setError('ההצעה לא נמצאה');
          return;
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

  const approvalUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${quoteId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(approvalUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleShareWhatsApp = () => {
    if (!quote) return;
    const message = `שלום ${quote.customerName},
הצעת המחיר שלך עבור רכב ${quote.carPlate} מוכנה.
לצפייה בפרטים ולחתימה דיגיטלית, אנא לחץ על הקישור
${approvalUrl}

בברכה`;
    const cleanPhone = quote.phoneNumber.replace(/\D/g, '');

    // Detect if desktop (not mobile)
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isDesktop) {
      // Desktop: Try app first, then fallback to web
      const desktopUrl = `whatsapp://send/?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

      // Create hidden iframe to test if app opens
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = desktopUrl;
      document.body.appendChild(iframe);

      // If app doesn't open in 2 seconds, use web
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank');
      }, 2000);
    } else {
      // Mobile: Use wa.me with pre-filled message
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.location.href = whatsappUrl;
    }
  };

  const handleGeneratePDF = async () => {
    if (!quote) return;

    setIsGeneratingPDF(true);
    try {
      await generateQuotePDF(quote);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('טעות בהפקת PDF. אנא נסה שוב.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleLogout = () => {
    document.cookie = '__session=; Max-Age=0; path=/;';
    router.push('/login');
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
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            חזור לדצמברית
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} />
            התנתקות
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            תקציר ההצעה
          </h1>
          <p className="text-gray-600">צפה ושתף הצעה לאישור</p>
        </div>

        {/* Status Card */}
        <div className={`mb-6 p-4 rounded-lg text-white font-medium flex items-center gap-2 ${quote.status === 'approved' ? 'bg-green-600' : 'bg-yellow-600'}`}>
          {quote.status === 'approved' ? (
            <>
              <Check size={20} />
              ההצעה אושרה וחתומה
            </>
          ) : (
            <>
              ⏳
              בהמתנה לאישור הלקוח
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Copy size={20} />
            {isCopied ? 'הועתק!' : 'העתק קישור'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Share2 size={20} />
            שתף בוואטסאפ
          </button>

          {quote.status === 'approved' && (
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2"
            >
              <Download size={20} />
              {isGeneratingPDF ? 'מייצר PDF...' : 'הורד כ-PDF'}
            </button>
          )}
        </div>

        {/* Approval Link */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">קישור האישור</h2>
          <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 overflow-x-auto">
            <code className="text-sm text-gray-800 break-all">{approvalUrl}</code>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            שתף קישור זה עם הלקוח כדי לבקש אישור וחתימה
          </p>
        </div>

        {/* Quote Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">פרטי ההצעה</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">שם הלקוח</p>
              <p className="text-lg font-medium text-gray-900">{quote.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">מספר רישוי הרכב</p>
              <p className="text-lg font-medium text-gray-900">{quote.carPlate}</p>
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
              <p className="text-lg font-medium text-gray-900">{quote.phoneNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">סטטוס</p>
              <p className="text-lg font-medium text-gray-900 capitalize">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${quote.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {quote.status === 'approved' ? 'אושר' : 'בהמתנה'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">תאריך יצירה</p>
              <p className="text-lg font-medium text-gray-900">
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
                <p className="text-lg font-medium text-gray-900">
                  {quote.approvedAt.toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {quote.notes && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">הערות</p>
              <p className="mt-2 text-gray-800 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Quote Images */}
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
                <img
                  src={quote.quoteImageUrl}
                  alt="Quote Image 1"
                  className="w-full h-auto rounded-lg border border-gray-200"
                />
              </div>
              {quote.quoteImageUrl2 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 text-center">הצעה 2</p>
                  <img
                    src={quote.quoteImageUrl2}
                    alt="Quote Image 2"
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature */}
        {quote.status === 'approved' && quote.signatureImageUrl && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-4 text-green-600 flex items-center gap-2">
              <Check size={24} />
              חתימת הלקוח
            </h2>
            <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50 inline-block">
              <img
                src={quote.signatureImageUrl}
                alt="Customer Signature"
                className="h-32 w-auto"
              />
            </div>
            <p className="text-sm text-gray-600 mt-4">
              אושר ב- {quote.approvedAt?.toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
