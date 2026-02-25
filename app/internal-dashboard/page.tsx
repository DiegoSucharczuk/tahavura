'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, List, Users, LogOut } from 'lucide-react';
import { CameraInput } from '@/components/CameraInput';
import { createQuote } from '@/lib/firestore';
import {
  validateCarPlate,
  validatePhoneNumber,
  validateQuoteAmount,
  validateName,
  validateQuoteNumber,
} from '@/lib/validation';
import { compressBase64Image } from '@/lib/image-compression';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    carPlate: '',
    phoneNumber: '',
    quoteNumber: '',
    quoteAmount: '',
    notes: '',
    idNumber: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [imageBase64_2, setImageBase64_2] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'worker'>('worker');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // בדוק אם זה מכשיר נייד
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone/.test(userAgent);
    setIsMobile(isMobileDevice);

    // Get user role from localStorage
    const role = localStorage.getItem('userRole') as 'admin' | 'worker' | null;
    if (role) {
      setUserRole(role);
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
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

  const handleImageCapture = useCallback(async (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      console.log('✅ Image loaded, compressing...');

      try {
        // Compress image to max 350KB to ensure 2 images fit in 1MB document
        const compressed = await compressBase64Image(dataUrl, 350);
        console.log('✅ Image compressed:', compressed.substring(0, 50) + '...');

        setImagePreview(compressed);
        setImageBase64(compressed);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('❌ Error compressing image:', error);
        alert('שגיאה בדחיסת התמונה');
      }
    };
    reader.onerror = () => {
      console.error('❌ Error reading file');
      alert('טעות בקריאת התמונה');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageCapture2 = useCallback(async (file: File) => {
    setSelectedImage2(file);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      console.log('✅ Image 2 loaded, compressing...');

      try {
        // Compress image to max 350KB
        const compressed = await compressBase64Image(dataUrl, 350);
        console.log('✅ Image 2 compressed:', compressed.substring(0, 50) + '...');

        setImagePreview2(compressed);
        setImageBase64_2(compressed);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (error) {
        console.error('❌ Error compressing image 2:', error);
        alert('שגיאה בדחיסת ההצעה 2');
      }
    };
    reader.onerror = () => {
      console.error('❌ Error reading file 2');
      alert('טעות בקריאת התמונה השנייה');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API to clear HttpOnly cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user role from localStorage
      localStorage.removeItem('userRole');
      router.push('/login');
    }
  };

  const handleReviewQuote = async (e: React.FormEvent) => {
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

    // Check if image was uploaded
    if (!imageBase64 || imageBase64.length === 0) {
      errors.image = 'אנא העלה תמונה של ההצעה';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('אנא תקן את השגיאות בטופס');
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    const carPlateValidation = validateCarPlate(formData.carPlate);
    const phoneValidation = validatePhoneNumber(formData.phoneNumber);
    const amountValidation = validateQuoteAmount(formData.quoteAmount);

    setIsLoading(true);
    try {
      // Use cleaned/validated data
      const cleanedData: any = {
        customerName: formData.customerName.trim(),
        carPlate: carPlateValidation.cleaned,
        phoneNumber: phoneValidation.cleaned,
        quoteNumber: formData.quoteNumber.trim(),
        quoteAmount: amountValidation.cleaned,
        notes: formData.notes.trim(),
        idNumber: formData.idNumber.trim(),
        quoteImageUrl: imageBase64,
      };

      // Add second image if provided
      if (imageBase64_2 && imageBase64_2.length > 0) {
        cleanedData.quoteImageUrl2 = imageBase64_2;
      }

      console.log('📤 Creating quote with validated data');
      console.log('📤 Cleaned car plate:', cleanedData.carPlate);
      console.log('📤 Cleaned phone:', cleanedData.phoneNumber);

      // Create quote document in Firestore
      const quoteId = await createQuote(cleanedData);

      console.log('✅ Quote created:', quoteId);

      // Close modal and redirect to summary page
      setShowConfirmModal(false);
      router.push(`/summary/${quoteId}`);
    } catch (error: any) {
      console.error('❌ Error creating quote:', error);
      const errorMessage = error?.message || 'שגיאה לא ידועה';
      alert(`הצעה לא נוצרה.\nשגיאה: ${errorMessage}\nאנא נסה שוב.`);
      setShowConfirmModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              מערכת הצעות מחיר
            </h1>
            <p className="text-gray-600">שלח הצעות מחיר לאישור הלקוח</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/internal-dashboard/quotes"
              className="inline-flex items-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <List size={20} />
              צפה בכל ההצעות
            </Link>
            {!isMobile && userRole === 'admin' && (
              <Link
                href="/internal-dashboard/users"
                className="inline-flex items-center gap-2 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <Users size={20} />
                ניהול משתמשים
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <LogOut size={20} />
              התנתק
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center font-medium">
              ✓ התמונה הועלתה בהצלחה
            </div>
          )}
          <form onSubmit={handleReviewQuote} className="space-y-6">
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
                placeholder="הזן שם הלקוח"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.customerName ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
              />
              {validationErrors.customerName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.customerName}</p>
              )}
            </div>

            {/* Car License Plate */}
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
                placeholder="למשל, 1234567 או 12-345-67"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.carPlate ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
              />
              {validationErrors.carPlate && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.carPlate}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">ניתן להזין עם או בלי מקפים</p>
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
                placeholder="0501234567 או +972501234567"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
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
                placeholder="לדוגמא, 1182"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.quoteNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
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
                placeholder="לדוגמא, 62081 או 62,081"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.quoteAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                required
              />
              {validationErrors.quoteAmount && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.quoteAmount}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                הערות נוספות
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="הוסף פרטים נוספים..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Camera Input - Image 1 (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תמונת הצעה 1 <span className="text-red-500">*</span>
              </label>
              <CameraInput onCapture={handleImageCapture} carPlate={formData.carPlate} />

              {/* Image Preview */}
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
                      setSelectedImage(null);
                      setImagePreview(null);
                      setImageBase64('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Camera Input - Image 2 (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תמונת הצעה 2 <span className="text-gray-500 text-xs">(אופציונלי)</span>
              </label>
              <CameraInput onCapture={handleImageCapture2} carPlate={formData.carPlate} />

              {/* Image Preview 2 */}
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
                      setSelectedImage2(null);
                      setImagePreview2(null);
                      setImageBase64_2('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Review Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              📋 בדוק פרטים לפני שליחה
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">איך זה עובד:</h3>
          <ol className="text-sm text-blue-800 space-y-1 mr-4 list-decimal">
            <li>מלא את פרטי הלקוח ותצלם תמונה של ההצעה</li>
            <li>שלח את הטופס ליצירת קישור אישור ייחודי</li>
            <li>שתף את הקישור דרך וואטסאפ לאישור הלקוח</li>
            <li>הלקוח מזין 4 ספרות מלוחית הרכב כאישור</li>
            <li>הלקוח חותם בעמוד האישור</li>
            <li>צפה והדפס את ההצעה חתומה כאשר מוכן</li>
          </ol>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">בדיקת פרטי ההצעה</h2>
            <p className="text-gray-600 mb-6 text-center">אנא בדוק שכל הפרטים נכונים לפני השליחה</p>

            <div className="space-y-4">
              {/* Customer Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">פרטי לקוח</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">שם לקוח:</span>
                    <span className="text-gray-900">{formData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">מספר רכב:</span>
                    <span className="text-gray-900">{formData.carPlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">מספר טלפון:</span>
                    <span className="text-gray-900">{formData.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">פרטי הצעה</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">מספר הצעה:</span>
                    <span className="text-blue-600 font-bold">{formData.quoteNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">סכום (כולל מע״מ):</span>
                    <span className="text-green-600 font-bold text-lg">₪{formData.quoteAmount}</span>
                  </div>
                  {formData.notes && (
                    <div>
                      <span className="text-gray-700 font-medium block mb-1">הערות:</span>
                      <p className="text-gray-900 bg-white p-2 rounded border">{formData.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Images Preview */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">תמונות הצעה</h3>
                <div className={`grid gap-3 ${imagePreview2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {imagePreview && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2 text-center">הצעה 1</p>
                      <img
                        src={imagePreview}
                        alt="Quote preview 1"
                        className="w-full h-auto rounded border-2 border-purple-300"
                      />
                    </div>
                  )}
                  {imagePreview2 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2 text-center">הצעה 2</p>
                      <img
                        src={imagePreview2}
                        alt="Quote preview 2"
                        className="w-full h-auto rounded border-2 border-purple-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                ← חזור לעריכה
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    שולח...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    אישור ושליחה
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
