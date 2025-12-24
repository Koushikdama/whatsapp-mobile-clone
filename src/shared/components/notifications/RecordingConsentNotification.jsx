/**
 * Recording Consent Notification
 * Shows when a call is being recorded
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Video, AlertTriangle, X } from 'lucide-react';

const RecordingConsentNotification = ({ isVisible, onDismiss }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return createPortal(
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[150] max-w-md w-full mx-4 transition-all duration-300 ${
        isVisible ? 'animate-in slide-in-from-top-2 fade-in' : 'animate-out slide-out-to-top-2 fade-out'
      }`}
    >
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-2xl border-2 border-red-400 p-4">
        {/* Close Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}

        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Video size={20} className="text-white" />
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-white" />
              <h3 className="font-bold text-white">Recording in Progress</h3>
            </div>
            <p className="text-sm text-white/90">
              This call is being recorded. Both parties have been notified. Your recording will be saved locally and encrypted.
            </p>
          </div>
        </div>

        {/* Recording Indicator */}
        <div className="mt-3 flex items-center gap-2 text-white">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span className="text-xs font-medium">REC</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecordingConsentNotification;
