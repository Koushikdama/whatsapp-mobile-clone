import { useState, useEffect, useMemo } from 'react';
import { dataService } from '../../../services/dataService';

/**
 * Custom hook to fetch and enrich chat data
 * Optimized: removed expensive deep clone, added memoization
 */
export const useChatData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const fetchedData = await dataService.fetchInitialData();

        if (!isMounted) return;

        setData(fetchedData);
      } catch (error) {
        console.error('[useChatData] Failed to load data:', error);
        // Set to null on error - let UI handle error state
        if (isMounted) {
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Memoize enriched data - only recalculate when data changes
  const enrichedData = useMemo(() => {
    if (!data) return null;

    // Shallow clone instead of deep clone (much faster)
    const enriched = { ...data };

    // Only deep clone messages since we're modifying it
    enriched.messages = { ...data.messages };

    // Add dummy messages for chats without any messages
    if (enriched.chats && enriched.chats.length > 0) {
      enriched.chats.forEach(chat => {
        if (!enriched.messages[chat.id] || enriched.messages[chat.id].length === 0) {
          enriched.messages[chat.id] = [];
        }
      });
    }

    return enriched;
  }, [data]);

  return {
    data: enrichedData,
    loading
  };
};
