'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CameraInputProps {
  onCapture: (file: File) => void;
  label?: string;
}

export const CameraInput: React.FC<CameraInputProps> = ({
  onCapture,
  label = 'צלם תמונה של ההצעה',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup stream on unmount or when closing camera
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API לא נתמך במכשיר זה');
        setIsLoading(false);
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      
      streamRef.current = stream;
      setIsCameraOpen(true);
      setIsLoading(false);

      // Use a small timeout to ensure the element is rendered before setting srcObject
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          console.log('Setting video source...');
          videoRef.current.srcObject = streamRef.current;
          
          // Start playing the video
          videoRef.current.play().catch((e) => {
            console.error('Error playing video:', e);
          });
        }
      }, 100);
    } catch (error) {
      setIsLoading(false);
      console.error('Error accessing camera:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission')) {
        setError('📱 הoutfit הזחולה לקאמרה נדחתה. אנא התר גישה לקאמרה בהגדרות הדפדפן.');
      } else if (errorMsg.includes('NotFoundError') || errorMsg.includes('no video')) {
        setError('📱 לא נמצאה קאמרה. אנא בדוק את המכשיר שלך.');
      } else {
        setError(`📱 לא ניתן לגשת לקאמרה: ${errorMsg}`);
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);

      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('טעות בדקירור תמונה. אנא נסה שוב.');
    }
  };

  const confirmCapture = () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to blob directly
      const arr = capturedImage.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const str = atob(arr[1]);
      const n = str.length;
      const u8arr = new Uint8Array(n);
      
      for (let i = 0; i < n; i++) {
        u8arr[i] = str.charCodeAt(i);
      }
      
      const blob = new Blob([u8arr], { type: mime });
      const file = new File([blob], `quote-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      
      onCapture(file);
      closeCamera();
    } catch (error) {
      console.error('Error converting image:', error);
      setError('טעות בעיבוד התמונה. אנא נסה שוב.');
    }
  };

  const closeCamera = () => {
    // Stop all video tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log('Stopping track:', track);
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setCapturedImage(null);
    setError(null);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isCameraOpen) {
    return (
      <div className="relative w-full bg-black rounded-lg overflow-hidden">
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
              style={{ maxHeight: '500px', objectFit: 'cover' }}
            />
            {error && (
              <div className="absolute inset-0 bg-red-500/90 flex items-center justify-center p-4">
                <div className="text-white text-center">
                  <p className="font-semibold mb-2">שגיאה בקאמרה</p>
                  <p className="text-sm mb-4">{error}</p>
                  <button
                    onClick={closeCamera}
                    className="px-4 py-2 bg-white text-red-600 rounded font-medium"
                  >
                    סגור
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={capturePhoto}
              disabled={error !== null}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={32} />
            </button>
            <button
              onClick={closeCamera}
              className="absolute top-4 right-4 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
            >
              <X size={20} />
            </button>
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto"
              style={{ maxHeight: '500px', objectFit: 'cover' }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
              <button
                onClick={() => setCapturedImage(null)}
                className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>
              <button
                onClick={confirmCapture}
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700 transition-colors shadow-lg"
              >
                <Check size={20} />
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={startCamera}
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Camera size={20} />
        {isLoading ? 'פתיחת קאמרה...' : label}
      </button>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-sm text-gray-500">או</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full mt-3 py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
      >
        העלה מהגלריה
      </button>
    </div>
  );
};
