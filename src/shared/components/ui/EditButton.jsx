import React from 'react';
import { Pencil } from 'lucide-react';

/**
 * Reusable Edit Button Component with Pencil Icon
 * Used for permission-based editing in Group Info
 */
const EditButton = ({ onClick, disabled = false, size = 16, className = '' }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-1.5 rounded-full border border-gray-300 dark:border-gray-600 
                 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed
                 ${className}`}
      title="Edit"
    >
      <Pencil size={size} className="text-gray-600 dark:text-gray-300" />
    </button>
  );
};

export default EditButton;
