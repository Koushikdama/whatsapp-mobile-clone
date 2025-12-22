/**
 * Setting Card Component
 * Reusable card for clickable setting options
 * Follows Single Responsibility Principle
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Card } from '../ui';

const SettingCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  value, 
  onClick,
  iconBgColor = 'bg-gray-100 dark:bg-gray-800',
  iconColor = 'text-gray-600 dark:text-gray-400',
  className = ''
}) => {
  return (
    <Card 
      onClick={onClick} 
      hover={!!onClick}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          {Icon && (
            <div className={`p-2 sm:p-3 rounded-full ${iconBgColor}`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
            {value && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 font-medium">
                {value}
              </p>
            )}
          </div>
        </div>
        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>
    </Card>
  );
};

export default SettingCard;
