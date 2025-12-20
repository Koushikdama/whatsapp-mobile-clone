import React from 'react';
import { MessageCircle, User } from 'lucide-react';
import useResponsive from '../../../../shared/hooks/useResponsive';

/**
 * ThreadPreview - Shows reply count on parent messages
 * Responsive badge that adapts to screen size
 */
const ThreadPreview = ({ replyCount, lastReply, onClick }) => {
  const { isMobile, isMobileSmall, isTablet } = useResponsive();
  
  if (!replyCount || replyCount === 0) return null;
  
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-2 mt-1 cursor-pointer
        ${isMobileSmall ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'}
        text-wa-teal hover:underline
        transition-all
        active:scale-95
      `}
    >
      <MessageCircle size={isMobileSmall ? 12 : isMobile ? 14 : 16} className="shrink-0" />
      <span className="font-medium">
        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
      </span>
      
      {!isMobile && lastReply && (
        <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px] flex items-center gap-1">
          <User size={12} className="shrink-0" />
          {lastReply.sender}: {lastReply.text}
        </span>
      )}
    </div>
  );
};

export default ThreadPreview;
