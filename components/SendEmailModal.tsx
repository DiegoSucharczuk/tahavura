'use client';

import React, { useState } from 'react';
import { X, Mail, User } from 'lucide-react';
import { Quote } from '@/lib/types';
import { generateQuotePDFBase64 } from '@/lib/pdf';
import { sendPDFByEmail } from '@/lib/emailjs';

interface SendEmailModalProps {
  quote: Quote;
  currentUserEmail: string;
  onClose: () => void;
}

export function SendEmailModal({ quote, currentUserEmail, onClose }: SendEmailModalProps) {
  const [selectedOption, setSelectedOption] = useState<'self' | 'other' | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendToSelf = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Generate PDF as base64
      console.log('📄 Generating PDF...');
      const pdfBase64 = await generateQuotePDFBase64(quote);

      // Send email
      console.log('📧 Sending email to:', currentUserEmail);
      await sendPDFByEmail(currentUserEmail, pdfBase64, {
        customerName: quote.customerName,
        carPlate: quote.carPlate,
        quoteNumber: quote.quoteNumber,
        quoteAmount: quote.quoteAmount,
      }, currentUserEmail, quote.id);

      alert(`✅ PDF נשלח בהצלחה למייל שלך: ${currentUserEmail}`);
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
      setError('שגיאה בשליחת המייל. נסה שוב.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToOther = async () => {
    if (!customEmail || !customEmail.includes('@')) {
      setError('אנא הזן כתובת מייל תקינה');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Generate PDF as base64
      console.log('📄 Generating PDF...');
      const pdfBase64 = await generateQuotePDFBase64(quote);

      // Send email
      console.log('📧 Sending email to:', customEmail);
      await sendPDFByEmail(customEmail, pdfBase64, {
        customerName: quote.customerName,
        carPlate: quote.carPlate,
        quoteNumber: quote.quoteNumber,
        quoteAmount: quote.quoteAmount,
      }, currentUserEmail, quote.id);

      alert(`✅ PDF נשלח בהצלחה למייל: ${customEmail}`);
      onClose();
    } catch (err) {
      console.error('Error sending email:', err);
      setError('שגיאה בשליחת המייל. נסה שוב.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">שלח PDF במייל</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSending}
          >
            <X size={24} />
          </button>
        </div>

        {/* Options */}
        {!selectedOption && (
          <div className="space-y-3">
            <button
              onClick={() => setSelectedOption('self')}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3"
            >
              <User size={20} />
              שלח לעצמי ({currentUserEmail})
            </button>
            <button
              onClick={() => setSelectedOption('other')}
              className="w-full py-4 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-3"
            >
              <Mail size={20} />
              שלח למייל אחר
            </button>
          </div>
        )}

        {/* Send to Self Confirmation */}
        {selectedOption === 'self' && (
          <div className="space-y-4">
            <p className="text-gray-700 text-center">
              PDF יישלח למייל: <strong>{currentUserEmail}</strong>
            </p>
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOption(null)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                disabled={isSending}
              >
                חזור
              </button>
              <button
                onClick={handleSendToSelf}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={isSending}
              >
                {isSending ? 'שולח...' : 'שלח'}
              </button>
            </div>
          </div>
        )}

        {/* Send to Other Email */}
        {selectedOption === 'other' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת מייל
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedOption(null)}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                disabled={isSending}
              >
                חזור
              </button>
              <button
                onClick={handleSendToOther}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                disabled={isSending}
              >
                {isSending ? 'שולח...' : 'שלח'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
