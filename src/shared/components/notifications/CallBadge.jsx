/**
 * Call Badge Component
 * Shows notification badge for missed calls
 */

import React from 'react';

const CallBadge = ({ count }) => {
  if (!count || count === 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-900 animate-in zoom-in duration-200">
      <span className="text-[10px] font-bold text-white leading-none">
        {displayCount}
      </span>
    </div>
  );
};

export default CallBadge;
