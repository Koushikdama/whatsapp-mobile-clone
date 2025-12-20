import React, { useState } from 'react';
import { ArrowLeft, X, Send, Loader } from 'lucide-react';
import useResponsive from '../../../../shared/hooks/useResponsive';
import { useThreadMessages } from '../../hooks/useThreadMessages';
import { useApp } from '../../../../shared/context/AppContext';

/**
 * ThreadView - Full-screen or side-panel view for message threads
 * Responsive design with async data loading
 */
const ThreadView = ({ parentMessage, onClose }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { currentUserId, users } = useApp();
  const { 
    threadMessages, 
    loading, 
    sendReply,
    loadMore,
    hasMore 
  } = useThreadMessages(parentMessage.id);
  
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  
  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    
    setSending(true);
    try {
      await sendReply({
        text: replyText,
        senderId: currentUserId,
        threadId: parentMessage.id,
        replyToId: parentMessage.id,
        timestamp: Date.now()
      });
      
      setReplyText('');
    } catch (error) {
      console.error('Failed to send thread reply:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Get sender info
  const parentSender = users[parentMessage.senderId] || { name: 'User' };
  
  // Common header component
  const Header = () => (
    <div className={`bg-wa-teal dark:bg-wa-dark-header flex items-center px-4 shrink-0 shadow-sm text-white ${isMobile ? 'h-14' : 'h-16'}`}>
      <button onClick={onClose} className={`mr-3 p-1 rounded-full active:bg-white/10 ${isMobile ? '' : 'hover:bg-white/5'}`}>
        {isMobile ? <ArrowLeft size={24} /> : <X size={24} />}
      </button>
      <h2 className={`font-medium ${isMobile ? 'text-lg' : 'text-xl'}`}>Thread</h2>
    </div>
  );
  
  // Parent message display
  const ParentMessage = () => (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center gap-2 mb-2">
        <img 
          src={parentSender.avatar} 
          alt={parentSender.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {parentSender.name}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(parentMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="text-sm text-gray-800 dark:text-gray-200">{parentMessage.text}</p>
    </div>
  );
  
  // Thread messages list
  const ThreadMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {loading && threadMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <Loader className="animate-spin text-gray-400" size={32} />
        </div>
      ) : threadMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-sm">No replies yet</p>
          <p className="text-xs mt-1">Be the first to reply!</p>
        </div>
      ) : (
        <>
          {threadMessages.map((msg) => {
            const sender = users[msg.senderId] || { name: 'User' };
            const isMe = msg.senderId === currentUserId;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMe ? 'bg-wa-msgMe text-gray-900' : 'bg-white dark:bg-wa-dark-paper'} rounded-lg p-2.5 shadow-sm`}>
                  {!isMe && (
                    <p className="text-xs font-medium text-wa-teal mb-1">{sender.name}</p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sending && ' • Sending...'}
                  </p>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button 
              onClick={loadMore} 
              disabled={loading}
              className="text-sm text-wa-teal hover:underline disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
  
  // Reply input
  const ReplyInput = () => (
    <div className={`p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-wa-dark-bg ${isMobile ? '' : 'p-4'}`}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Reply to thread..."
          className={`flex-1 rounded-full bg-gray-100 dark:bg-gray-800 outline-none text-gray-900 dark:text-gray-100 ${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2.5'}`}
          disabled={sending}
        />
        <button 
          onClick={handleSend}
          disabled={!replyText.trim() || sending}
          className={`bg-wa-teal text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${isMobile ? 'p-2' : 'p-2.5'}`}
        >
          {sending ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
  
  // Mobile: Full screen
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-wa-dark-bg flex flex-col">
        <Header />
        <ParentMessage />
        <ThreadMessages />
        <ReplyInput />
      </div>
    );
  }
  
  // Desktop/Tablet: Side panel
  const panelWidth = isTablet ? '400px' : '480px';
  
  return (
    <div 
      className="fixed right-0 top-0 bottom-0 z-40 bg-white dark:bg-wa-dark-bg border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
      style={{ width: panelWidth }}
    >
      <Header />
      <ParentMessage />
      <ThreadMessages />
      <ReplyInput />
    </div>
  );
};

export default ThreadView;
