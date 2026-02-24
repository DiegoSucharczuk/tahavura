'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Share2, Download, Eye, Trash2, RefreshCw, MessageCircle, LogOut } from 'lucide-react';
import { Quote } from '@/lib/types';
import { generateQuotePDF } from '@/lib/pdf';
import { getAllQuotes, deleteQuote } from '@/lib/firestore';

export default function QuotesListPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const handleLogout = () => {
    document.cookie = '__session=; Max-Age=0; path=/;';
    router.push('/login');
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      const quotesArray = await getAllQuotes();
      setQuotes(quotesArray.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (confirm('האם אתה בטוח שאתה רוצה למחוק הצעה זו?')) {
      try {
        await deleteQuote(id);
        loadQuotes();
      } catch (error) {
        console.error('Error deleting quote:', error);
        alert('שגיאה במחיקת הצעה');
      }
    }
  };

  const handleGeneratePDF = async (quote: Quote) => {
    setIsGeneratingPDF(quote.id);
    try {
      await generateQuotePDF(quote);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('טעות בהפקת PDF');
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const handleShareWhatsApp = (quote: Quote) => {
    // External אפליקציה - ללקוח, לא עובד
    const approvalUrl = `${window.location.origin}/v/${quote.id}`;
    const message = encodeURIComponent(
      `שלום ${quote.customerName}, הנה ההצעה שלך עבור הרכב ${quote.carPlate}: ${approvalUrl}`
    );
    const whatsappUrl = `https://wa.me/${quote.phoneNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = (quote: Quote) => {
    const approvalUrl = `${window.location.origin}/v/${quote.id}`;
    navigator.clipboard.writeText(approvalUrl).then(() => {
      setCopiedLinkId(quote.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">טוען הצעות...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              כל ההצעות
            </h1>
            <p className="text-gray-600">נהל ועקוב אחר כל הצעות הלקוחות</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadQuotes}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={18} />
              רענן
            </button>
            <Link
              href="/internal-dashboard"
              className="py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + הצעה חדשה
            </Link>
            <button
              onClick={handleLogout}
              className="py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <LogOut size={18} />
              התנתק
            </button>
          </div>
        </div>

        {/* Filter Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg shadow p-3 transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white scale-105'
                : 'bg-white text-gray-900 hover:shadow-lg'
            }`}
          >
            <p className={`text-xs sm:text-sm ${filter === 'all' ? 'text-blue-100' : 'text-gray-600'}`}>
              סה"כ הצעות
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${filter === 'all' ? 'text-white' : 'text-gray-900'}`}>
              {quotes.length}
            </p>
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-lg shadow p-3 transition-all ${
              filter === 'approved'
                ? 'bg-green-600 text-white scale-105'
                : 'bg-white text-gray-900 hover:shadow-lg'
            }`}
          >
            <p className={`text-xs sm:text-sm ${filter === 'approved' ? 'text-green-100' : 'text-gray-600'}`}>
              אושר
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${filter === 'approved' ? 'text-white' : 'text-green-600'}`}>
              {quotes.filter((q) => q.status === 'approved').length}
            </p>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-lg shadow p-3 transition-all ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white scale-105'
                : 'bg-white text-gray-900 hover:shadow-lg'
            }`}
          >
            <p className={`text-xs sm:text-sm ${filter === 'pending' ? 'text-yellow-100' : 'text-gray-600'}`}>
              בהמתנה
            </p>
            <p className={`text-2xl sm:text-3xl font-bold ${filter === 'pending' ? 'text-white' : 'text-yellow-600'}`}>
              {quotes.filter((q) => q.status === 'pending').length}
            </p>
          </button>
        </div>

        {/* Quotes Table */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">עדיין אין הצעות</p>
            <Link
              href="/internal-dashboard"
              className="inline-block py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              צור הצעה
            </Link>
          </div>
        ) : quotes.filter((quote) => {
            if (filter === 'all') return true;
            if (filter === 'approved') return quote.status === 'approved';
            if (filter === 'pending') return quote.status === 'pending';
            return true;
          }).length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">לא קיימות הצעות בקטגוריה זו</p>
            <button
              onClick={() => setFilter('all')}
              className="py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              הצג הכל
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quotes
              .filter((quote) => {
                if (filter === 'all') return true;
                if (filter === 'approved') return quote.status === 'approved';
                if (filter === 'pending') return quote.status === 'pending';
                return true;
              })
              .map((quote) => (
              <div
                key={quote.id}
                className="bg-white rounded-lg shadow-lg p-4 border-r-4 border-blue-500 hover:shadow-xl transition-shadow"
              >
                {/* Header with Status */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 text-right">
                      {quote.customerName}
                    </h3>
                    <p className="text-sm text-gray-600 text-right">
                      {quote.carPlate}
                    </p>
                  </div>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      quote.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">טלפון:</span>
                    <span className="text-gray-600">{quote.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">נוצר:</span>
                    <span className="text-gray-600">
                      {quote.createdAt.toLocaleDateString('he-IL', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {quote.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">חתימה תאריך :</span>
                      <span className="text-gray-600">
                        {quote.approvedAt.toLocaleDateString('he-IL', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {quote.idNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">תעודה זהות:</span>
                      <span className="text-gray-600">{quote.idNumber}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-center flex-wrap border-t pt-3">
                  <Link
                    href={`/internal-dashboard/quotes/${quote.id}`}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    title="צפה בפרטים"
                  >
                    <Eye size={18} />
                  </Link>
                  <button
                    onClick={() => handleCopyLink(quote)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                    title={copiedLinkId === quote.id ? 'הועתק!' : 'העתק קישור'}
                  >
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => handleShareWhatsApp(quote)}
                    className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                    title="שתף בוואטסאפ"
                  >
                    <MessageCircle size={18} />
                  </button>
                  {quote.status === 'approved' && (
                    <button
                      onClick={() => handleGeneratePDF(quote)}
                      disabled={isGeneratingPDF === quote.id}
                      className="text-purple-600 hover:text-purple-800 p-2 rounded hover:bg-purple-50 disabled:opacity-50"
                      title="הורד PDF"
                    >
                      <Download size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteQuote(quote.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                    title="מחק הצעה"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Copy Success Message */}
                {copiedLinkId === quote.id && (
                  <div className="mt-3 text-center text-green-600 text-sm font-medium">
                    ✓ הועתק!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
