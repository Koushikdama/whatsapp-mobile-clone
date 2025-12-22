/**
 * Theme Card Component
 * Preview card for theme selection
 * Shows color scheme with sample message bubbles
 */

import React from 'react';
import { Check } from 'lucide-react';

const ThemeCard = ({ theme, selected, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all
        ${selected 
          ? 'border-wa-teal shadow-lg scale-105' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
        bg-white dark:bg-gray-800
      `}
    >
      {/* Selected indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-wa-teal text-white rounded-full p-1 shadow-lg">
          <Check size={16} />
        </div>
      )}

      {/* Theme name */}
      <h4 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
        {theme.name}
      </h4>

      {/* Preview */}
      <div className="space-y-1.5 sm:space-y-2">
        {/* App color bar */}
        <div 
          className="h-1.5 sm:h-2 rounded-full"
          style={{ backgroundColor: theme.appColor }}
        />

        {/* Incoming message */}
        <div className="flex">
          <div 
            className="max-w-[70%] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs"
            style={{ backgroundColor: theme.incomingBubbleColor }}
          >
            <span className="text-gray-800">Hey there!</span>
          </div>
        </div>

        {/* Outgoing message */}
        <div className="flex justify-end">
          <div 
            className="max-w-[70%] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs"
            style={{ backgroundColor: theme.outgoingBubbleColor }}
          >
            <span className="text-gray-800">How are you?</span>
          </div>
        </div>
      </div>

      {/* Color dots */}
      <div className="flex gap-1 sm:gap-1.5 mt-2 sm:mt-3">
        <div 
          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: theme.appColor }}
        />
        <div 
          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: theme.outgoingBubbleColor }}
        />
        <div 
          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: theme.incomingBubbleColor }}
        />
      </div>
    </div>
  );
};

export default ThemeCard;
