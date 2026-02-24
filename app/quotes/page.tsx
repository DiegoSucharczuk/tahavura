'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Share2, Download, Eye, Trash2, RefreshCw, MessageCircle } from 'lucide-react';
import { Quote } from '@/lib/types';
import { generateQuotePDF } from '@/lib/pdf';
import { getAllQuotes, deleteQuote } from '@/lib/firestore';

export default function QuotesListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

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
    const approvalUrl = `${window.location.origin}/approve/${quote.id}`;
    const message = encodeURIComponent(
      `שלום ${quote.customerName}, הנה ההצעה שלך עבור הרכב ${quote.carPlate}: ${approvalUrl}`
    );
    const whatsappUrl = `https://wa.me/${quote.phoneNumber.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = (quote: Quote) => {
    const approvalUrl = `${window.location.origin}/approve/${quote.id}`;
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
              href="/"
              className="py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + הצעה חדשה
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">סה"כ הצעות</p>
            <p className="text-3xl font-bold text-gray-900">{quotes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">אושר</p>
            <p className="text-3xl font-bold text-green-600">
              {quotes.filter((q) => q.status === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">בהמתנה</p>
            <p className="text-3xl font-bold text-yellow-600">
              {quotes.filter((q) => q.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Quotes Table */}
        {quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-600 mb-4">עדיין אין הצעות</p>
            <Link
              href="/"
              className="inline-block py-2 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              צור את ההצעה הראשונה שלך
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">לקוח</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">מספר רישוי</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">טלפון</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">סטטוס</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך חתימה</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">תאריך יצירה</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{quote.customerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{quote.carPlate}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{quote.phoneNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {quote.status === 'approved' ? '✓ אושר' : '⏳ בהמתנה'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {quote.approvedAt
                          ? quote.approvedAt.toLocaleDateString('he-IL', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {quote.createdAt.toLocaleDateString('he-IL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/quotes/${quote.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                            title="צפה בפרטים"
                          >
                            <Eye size={16} />
                          </Link>
                          <button
                            onClick={() => handleCopyLink(quote)}
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                            title={copiedLinkId === quote.id ? 'הועתק!' : 'העתק קישור'}
                          >
                            <Share2 size={16} />
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(quote)}
                            className="text-green-600 hover:text-green-800 font-medium inline-flex items-center gap-1"
                            title="שתף בוואטסאפ"
                          >
                            <MessageCircle size={16} />
                          </button>
                          {quote.status === 'approved' && (
                            <button
                              onClick={() => handleGeneratePDF(quote)}
                              disabled={isGeneratingPDF === quote.id}
                              className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                              title="הורד PDF"
                            >
                              <Download size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                            title="מחק הצעה"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
