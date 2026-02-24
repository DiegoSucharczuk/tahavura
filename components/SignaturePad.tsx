'use client';

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => Promise<void>;
  isLoading?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  isLoading = false,
}) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Set canvas size to be responsive
    if (signatureRef.current) {
      const canvas = signatureRef.current.getCanvas();
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = 300;
      }
    }
  }, []);

  const handleClear = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsSigned(false);
    }
  };

  const handleSave = async () => {
    if (!signatureRef.current || !isSigned) return;

    setIsSubmitting(true);
    try {
      const signatureDataUrl = signatureRef.current.toDataURL('image/png');
      await onSave(signatureDataUrl);
    } catch (error) {
      console.error('Failed to save signature:', error);
      alert('טעות בשמירת החתימה. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBeginSign = () => {
    setIsSigned(true);
  };

  return (
    <div className="w-full space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
        <style>{`
          .signature-canvas {
            touch-action: none;
            display: block;
            width: 100%;
          }
        `}</style>
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{ className: 'signature-canvas' }}
          onBegin={handleBeginSign}
          backgroundColor="white"
        />
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={handleClear}
          disabled={!isSigned || isSubmitting}
          className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
        >
          נקה
        </button>
        <button
          onClick={handleSave}
          disabled={!isSigned || isSubmitting || isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {isSubmitting || isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              שמירה...
            </>
          ) : (
            <>
              ✓ אשר וחתום
            </>
          )}
        </button>
      </div>
    </div>
  );
};
