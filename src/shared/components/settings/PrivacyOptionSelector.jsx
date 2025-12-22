import React from 'react';
import { PRIVACY_LEVELS, PRIVACY_LEVEL_LABELS, PRIVACY_LEVEL_DESCRIPTIONS } from '../../constants/privacyLevels';

/**
 * PrivacyOptionSelector Component
 * Reusable component for selecting privacy levels (Everyone, My Contacts, Nobody)
 * Used by all privacy sub-pages
 */
const PrivacyOptionSelector = ({ 
  value, 
  onChange,
  loading = false 
}) => {
  const options = [
    {
      value: PRIVACY_LEVELS.EVERYONE,
      label: PRIVACY_LEVEL_LABELS[PRIVACY_LEVELS.EVERYONE],
      description: PRIVACY_LEVEL_DESCRIPTIONS[PRIVACY_LEVELS.EVERYONE]
    },
    {
      value: PRIVACY_LEVELS.MY_CONTACTS,
      label: PRIVACY_LEVEL_LABELS[PRIVACY_LEVELS.MY_CONTACTS],
      description: PRIVACY_LEVEL_DESCRIPTIONS[PRIVACY_LEVELS.MY_CONTACTS]
    },
    {
      value: PRIVACY_LEVELS.NOBODY,
      label: PRIVACY_LEVEL_LABELS[PRIVACY_LEVELS.NOBODY],
      description: PRIVACY_LEVEL_DESCRIPTIONS[PRIVACY_LEVELS.NOBODY]
    }
  ];

  return (
    <div className="bg-white dark:bg-wa-dark-paper rounded-lg shadow-sm overflow-hidden">
      {options.map((option, index) => (
        <React.Fragment key={option.value}>
          <div
            onClick={() => !loading && onChange(option.value)}
            className={`flex items-center justify-between py-4 px-6 cursor-pointer transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Radio button */}
              <div 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  value === option.value 
                    ? 'border-wa-teal' 
                    : 'border-gray-400 dark:border-gray-500'
                }`}
              >
                {value === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-wa-teal"></div>
                )}
              </div>

              {/* Label and description */}
              <div className="flex flex-col">
                <span className="text-[#111b21] dark:text-gray-100 font-normal text-base">
                  {option.label}
                </span>
                <span className="text-[#667781] dark:text-gray-500 text-sm mt-0.5">
                  {option.description}
                </span>
              </div>
            </div>
          </div>

          {/* Divider (except for last item) */}
          {index < options.length - 1 && (
            <div className="border-t border-gray-100 dark:border-gray-800"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default PrivacyOptionSelector;
