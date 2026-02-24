'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send, List, Users, LogOut } from 'lucide-react';
import { CameraInput } from '@/components/CameraInput';
import { createQuote } from '@/lib/firestore';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    carPlate: '',
    phoneNumber: '',
    notes: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageCapture = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Store the base64 for later use
      setFormData(prev => ({
        ...prev,
        quoteImageBase64: dataUrl
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      console.log('✅ Image captured and saved');
    };
    reader.onerror = () => {
      console.error('❌ Error reading file');
      alert('טעות בקריאת התמונה');
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    // הסר את ה-token
    document.cookie = '__session=; Max-Age=0; path=/;';
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.carPlate || !formData.phoneNumber) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setIsLoading(true);
    try {
      // Use the base64 directly if image was captured
      const imageUrl = imagePreview || '';
      
      console.log('📤 Creating quote with image:', imageUrl ? '✅ YES' : '❌ NO');

      // Create quote document in Firestore
      const quoteId = await createQuote({
        ...formData,
        quoteImageUrl: imageUrl,
      });

      console.log('✅ Quote created:', quoteId);
      
      // Redirect to summary page
      router.push(`/summary/${quoteId}`);
    } catch (error) {
      console.error('❌ Error creating quote:', error);
      alert('הצעה לא נוצרה. אנא נסה שוב.');
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
            <Link
              href="/internal-dashboard/users"
              className="inline-flex items-center gap-2 py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Users size={20} />
              ניהול משתמשים
            </Link>
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
                placeholder="הזן שם הלקוח"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
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
                placeholder="למשל, ABC-1234"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
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
                placeholder="+972501234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
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

            {/* Camera Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                תמונת ההצעה
              </label>
              <CameraInput onCapture={handleImageCapture} carPlate={formData.carPlate} />

              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={imagePreview}
                    alt="Quote preview"
                    className="w-full h-auto rounded-lg border-2 border-green-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  יוצר הצעה...
                </>
              ) : (
                <>
                  <Send size={20} />
                  שלח הצעה
                </>
              )}
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
    </main>
  );
}
