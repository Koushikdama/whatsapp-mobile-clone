/**
 * Settings Header Component
 * Reusable header for all settings pages with back button
 * Follows Single Responsibility Principle
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsHeader = ({ title, onBack }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-wa-teal text-white p-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
      <button
        onClick={handleBack}
        className="p-1 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-xl font-medium">{title}</h1>
    </div>
  );
};

export default SettingsHeader;
