'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Send, ArrowRight } from 'lucide-react';
import { CameraInput } from '@/components/CameraInput';
import { Quote } from '@/lib/types';
import {
  validateCarPlate,
  validatePhoneNumber,
  validateQuoteAmount,
  validateName,
  validateQuoteNumber,
} from '@/lib/validation';
import { BackButton } from '@/components/BackButton';

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    carPlate: '',
    phoneNumber: '',
    quoteNumber: '',
    quoteAmount: '',
    notes: '',
  });
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64_2, setImageBase64_2] = useState<string>('');
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadQuote();
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load quote');
      }

      const { quote: quoteData } = await response.json();

      setQuote(quoteData);
      setFormData({
        customerName: quoteData.customerName,
        carPlate: quoteData.carPlate,
        phoneNumber: quoteData.phoneNumber,
        quoteNumber: quoteData.quoteNumber,
        quoteAmount: quoteData.quoteAmount,
        notes: quoteData.notes || '',
      });

      // Set existing images
      if (quoteData.quoteImageUrl) {
        setImageBase64(quoteData.quoteImageUrl);
        setImagePreview(quoteData.quoteImageUrl);
      }
      if (quoteData.quoteImageUrl2) {
        setImageBase64_2(quoteData.quoteImageUrl2);
        setImagePreview2(quoteData.quoteImageUrl2);
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('שגיאה בטעינת ההצעה');
      router.push('/internal-dashboard/quotes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateField = (name: string, value: string) => {
    let result;
    switch (name) {
      case 'customerName':
        result = validateName(value);
        break;
      case 'carPlate':
        result = validateCarPlate(value);
        break;
      case 'phoneNumber':
        result = validatePhoneNumber(value);
        break;
      case 'quoteNumber':
        result = validateQuoteNumber(value);
        break;
      case 'quoteAmount':
        result = validateQuoteAmount(value);
        break;
      default:
        return;
    }

    if (!result.valid && result.error) {
      setValidationErrors((prev) => ({ ...prev, [name]: result.error! }));
    } else {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageCapture = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.onerror = () => {
      alert('טעות בקריאת התמונה');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageCapture2 = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview2(dataUrl);
      setImageBase64_2(dataUrl);
    };
    reader.onerror = () => {
      alert('טעות בקריאת התמונה השנייה');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const nameValidation = validateName(formData.customerName);
    const carPlateValidation = validateCarPlate(formData.carPlate);
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    const quoteNumValidation = validateQuoteNumber(formData.quoteNumber);
    const amountValidation = validateQuoteAmount(formData.quoteAmount);

    const errors: Record<string, string> = {};

    if (!nameValidation.valid) errors.customerName = nameValidation.error!;
    if (!carPlateValidation.valid) errors.carPlate = carPlateValidation.error!;
    if (!phoneValidation.valid) errors.phoneNumber = phoneValidation.error!;
    if (!quoteNumValidation.valid) errors.quoteNumber = quoteNumValidation.error!;
    if (!amountValidation.valid) errors.quoteAmount = amountValidation.error!;

    if (!imageBase64 || imageBase64.length === 0) {
      errors.image = 'אנא העלה תמונה של ההצעה';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('אנא תקן את השגיאות בטופס');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        customerName: formData.customerName.trim(),
        carPlate: carPlateValidation.cleaned,
        phoneNumber: phoneValidation.cleaned,
        quoteNumber: formData.quoteNumber.trim(),
        quoteAmount: amountValidation.cleaned,
        notes: formData.notes.trim(),
        quoteImageUrl: imageBase64,
      };

      if (imageBase64_2 && imageBase64_2.length > 0) {
        updateData.quoteImageUrl2 = imageBase64_2;
      }

      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      alert('ההצעה עודכנה בהצלחה!');
      router.push('/internal-dashboard/quotes');
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('שגיאה בעדכון ההצעה');
    } finally {
      setIsSaving(false);
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

  if (!quote) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">ההצעה לא נמצאה</p>
          <BackButton href="/internal-dashboard/quotes" label="חזור להצעות" />
        </div>
      </main>
    );
  }

  if (quote.status === 'approved') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">לא ניתן לערוך</h1>
          <p className="text-gray-600 mb-6">
            לא ניתן לערוך הצעה שכבר אושרה ונחתמה על ידי הלקוח
          </p>
          <BackButton href="/internal-dashboard/quotes" label="חזור להצעות" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <BackButton href="/internal-dashboard/quotes" label="חזור להצעות" />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ערוך הצעה</h1>
          <p className="text-gray-600 mb-6">עדכן את פרטי ההצעה לפני שליחתה ללקוח</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                שם הלקוח <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                onBlur={(e) => validateField('customerName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.customerName ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {validationErrors.customerName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.customerName}</p>
              )}
            </div>

            {/* Car Plate */}
            <div>
              <label htmlFor="carPlate" className="block text-sm font-medium text-gray-700 mb-2">
                מספר רישוי רכב <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="carPlate"
                name="carPlate"
                value={formData.carPlate}
                onChange={handleInputChange}
                onBlur={(e) => validateField('carPlate', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.carPlate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {validationErrors.carPlate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.carPlate}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                מספר טלפון (וואטסאפ) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={(e) => validateField('phoneNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {/* Quote Number */}
            <div>
              <label htmlFor="quoteNumber" className="block text-sm font-medium text-gray-700 mb-2">
                מספר הצעה <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="quoteNumber"
                name="quoteNumber"
                value={formData.quoteNumber}
                onChange={handleInputChange}
                onBlur={(e) => validateField('quoteNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.quoteNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {validationErrors.quoteNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.quoteNumber}</p>
              )}
            </div>

            {/* Quote Amount */}
            <div>
              <label htmlFor="quoteAmount" className="block text-sm font-medium text-gray-700 mb-2">
                סכום הצעה (כולל מע״מ) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="quoteAmount"
                name="quoteAmount"
                value={formData.quoteAmount}
                onChange={handleInputChange}
                onBlur={(e) => validateField('quoteAmount', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.quoteAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSaving}
              />
              {validationErrors.quoteAmount && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.quoteAmount}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                הערות
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>

            {/* Image 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תמונת הצעה 1 <span className="text-red-500">*</span>
              </label>
              <CameraInput onCapture={handleImageCapture} carPlate={formData.carPlate} />
              {imagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview}
                    alt="Quote preview 1"
                    className="w-full h-auto rounded-lg border-2 border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    disabled={isSaving}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Image 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תמונת הצעה 2 <span className="text-gray-500 text-xs">(אופציונלי)</span>
              </label>
              <CameraInput onCapture={handleImageCapture2} carPlate={formData.carPlate} />
              {imagePreview2 && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview2}
                    alt="Quote preview 2"
                    className="w-full h-auto rounded-lg border-2 border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview2(null);
                      setImageBase64_2('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    disabled={isSaving}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Send size={20} />
                  שמור שינויים
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
